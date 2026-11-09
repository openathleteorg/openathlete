import ical, { ICalCalendarMethod } from 'ical-generator';
import { randomBytes } from 'node:crypto';

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EventType } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';
import { formatZoned, validTimeZone } from 'src/common/utils/time-zone';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  FEED_EVENT_SELECT,
  describeFeedEvent,
} from '../helpers/calendar-feed-event';
import { addUtcDays } from '../helpers/training-load';

/** 256 random bits, URL-safe: 43 base64url characters */
const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * What the feed holds around today. Calendar apps poll it every few hours:
 * a bounded window keeps each poll cheap, however long the history.
 */
const FEED_DAYS_BEFORE = 90;
const FEED_DAYS_AFTER = 365;

/**
 * The athlete's planned sessions, races and notes as an iCal feed, for
 * Google or Apple Calendar. The feed URL carries a random token: it finds
 * its athlete in one indexed read, and replacing it revokes the old URL.
 */
@Injectable()
export class CalendarFeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<ApiEnvSchemaType, true>,
  ) {}

  /** The token of the user's feed, created on the first request */
  async getOrCreateToken(user: AuthUser): Promise<string> {
    const athleteId = this.athleteIdOf(user);
    const athlete = await this.prisma.athlete.findUniqueOrThrow({
      where: { athleteId },
      select: { calendarFeedToken: true },
    });
    if (athlete.calendarFeedToken) return athlete.calendarFeedToken;

    // Only sets a token if there is none yet, so two first requests at once
    // agree on the same one instead of the second revoking the first
    await this.prisma.athlete.updateMany({
      where: { athleteId, calendarFeedToken: null },
      data: { calendarFeedToken: newToken() },
    });
    const created = await this.prisma.athlete.findUniqueOrThrow({
      where: { athleteId },
      select: { calendarFeedToken: true },
    });
    return created.calendarFeedToken!;
  }

  /** A new token: the previous feed URL stops working at once */
  async regenerateToken(user: AuthUser): Promise<string> {
    const token = newToken();
    await this.prisma.athlete.update({
      where: { athleteId: this.athleteIdOf(user) },
      data: { calendarFeedToken: token },
    });
    return token;
  }

  async renderFeed(token: string | undefined): Promise<string> {
    // Malformed tokens, including the former Argon2 secrets, never reach
    // the database
    if (!token || !TOKEN_PATTERN.test(token)) {
      throw new UnauthorizedException();
    }
    const athlete = await this.prisma.athlete.findUnique({
      where: { calendarFeedToken: token },
      select: {
        athleteId: true,
        user: { select: { language: true, timeZone: true } },
      },
    });
    if (!athlete) {
      throw new UnauthorizedException();
    }
    const { athleteId } = athlete;

    const now = new Date();
    const [events, metrics, zones] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          athleteId,
          type: { not: EventType.ACTIVITY },
          startDate: {
            gte: addUtcDays(now, -FEED_DAYS_BEFORE),
            lte: addUtcDays(now, FEED_DAYS_AFTER),
          },
        },
        select: FEED_EVENT_SELECT,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.athleteMetric.findMany({
        where: { athleteId },
        distinct: ['type'],
        select: { type: true, value: true },
        orderBy: [{ type: 'asc' }, { date: 'desc' }],
      }),
      this.prisma.trainingZone.findMany({
        where: { athleteId },
        select: { trainingZoneId: true, name: true },
      }),
    ]);

    const language = athlete.user.language as Language;
    const timeZone = validTimeZone(athlete.user.timeZone);
    const metricValues = Object.fromEntries(
      metrics.map(({ type, value }) => [type, value]),
    );
    const zoneNames = new Map(
      zones.map((zone) => [zone.trainingZoneId, zone.name]),
    );
    const appUrl = this.config.get('APP_URL', { infer: true });

    const calendar = ical({
      name: 'OpenAthlete',
      timezone: 'UTC',
      method: ICalCalendarMethod.PUBLISH,
    });
    for (const event of events) {
      const url = appUrl
        ? `${appUrl}/dashboard/calendar?event=${event.eventId}`
        : null;
      const { description, categories } = describeFeedEvent(event, {
        language,
        metrics: metricValues,
        zoneNames,
        url,
      });
      calendar.createEvent({
        // Stable across polls, so calendar apps update events in place
        id: `openathlete-event-${event.eventId}`,
        ...feedDates(event, timeZone),
        summary: event.name,
        description,
        categories: categories.map((name) => ({ name })),
        url,
      });
    }
    return calendar.toString();
  }

  private athleteIdOf(user: AuthUser): number {
    const athleteId = user.athlete?.athleteId;
    if (!athleteId) {
      throw new NotFoundException('Athlete not found');
    }
    return athleteId;
  }
}

function newToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/**
 * Events fill their days, which are the athlete's and not UTC's, or one near
 * midnight would move to the neighbouring day. An all-day end is exclusive,
 * hence the extra day.
 */
function feedDates(
  event: { startDate: Date; endDate: Date },
  timeZone: string,
): { start: Date; end: Date; allDay: true } {
  const { startDate, endDate } = event;
  const lastInstant = new Date(
    Math.max(startDate.getTime(), endDate.getTime() - 1),
  );
  return {
    start: zonedDay(startDate, timeZone),
    end: addUtcDays(zonedDay(lastInstant, timeZone), 1),
    allDay: true,
  };
}

/** The athlete's calendar day of `instant`, as midnight UTC */
function zonedDay(instant: Date, timeZone: string): Date {
  return new Date(`${formatZoned(instant, timeZone).slice(0, 10)}T00:00:00Z`);
}
