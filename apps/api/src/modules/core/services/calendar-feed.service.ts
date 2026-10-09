import ical, { ICalCalendarMethod } from 'ical-generator';
import { randomBytes } from 'node:crypto';

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { EventType } from '@openathlete/database';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

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
      select: { athleteId: true },
    });
    if (!athlete) {
      throw new UnauthorizedException();
    }

    const now = new Date();
    const events = await this.prisma.event.findMany({
      where: {
        athleteId: athlete.athleteId,
        type: { not: EventType.ACTIVITY },
        startDate: {
          gte: addUtcDays(now, -FEED_DAYS_BEFORE),
          lte: addUtcDays(now, FEED_DAYS_AFTER),
        },
      },
      select: {
        eventId: true,
        name: true,
        type: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: 'asc' },
    });

    const calendar = ical({
      name: 'OpenAthlete',
      timezone: 'UTC',
      method: ICalCalendarMethod.PUBLISH,
    });
    for (const event of events) {
      calendar.createEvent({
        // Stable across polls, so calendar apps update events in place
        id: `openathlete-event-${event.eventId}`,
        start: event.startDate,
        end: event.endDate,
        allDay: true,
        summary: event.name,
        description: `Type: ${event.type.toLowerCase()}`,
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
