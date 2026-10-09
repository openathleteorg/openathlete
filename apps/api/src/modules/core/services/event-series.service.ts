import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  REPEAT_MAX_DAYS,
  RepeatEventDto,
  UpdateEventDto,
} from '@openathlete/shared';

import { addZonedDays, zonedClock } from 'src/common/utils/time-zone';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { EventBulkService } from './event-bulk.service';
import { SHIFTABLE_TYPES, SOURCE_INCLUDE, copyOf } from './event-copy';
import { EventService } from './event.service';

const DAY_MS = 24 * 3600 * 1000;

/** Calendar days from `from` to `to`, in `timeZone` */
function zonedDayDifference(from: Date, to: Date, timeZone: string) {
  const day = (instant: Date) =>
    Date.parse(`${zonedClock(instant, timeZone).date}T00:00:00Z`);
  return Math.round((day(to) - day(from)) / DAY_MS);
}

/**
 * Repeated sessions: occurrences share a series id, so one and the
 * following ones can be edited or deleted together. Each occurrence stays a
 * plain event: moving or editing one alone leaves it in the series.
 */
@Injectable()
export class EventSeriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly eventService: EventService,
    private readonly eventBulkService: EventBulkService,
  ) {}

  /**
   * Copies a planned session every `everyWeeks` weeks until `until` (at most
   * 90 days on), in one transaction, and puts them all in one series.
   */
  async repeat(
    user: AuthUser,
    eventId: number,
    { everyWeeks, until }: RepeatEventDto,
  ) {
    const ability = await this.abilities.getFor({ user });
    const source = await this.prisma.event.findFirst({
      where: {
        AND: [
          { eventId },
          { type: { in: SHIFTABLE_TYPES } },
          accessibleBy(ability, 'update').Event,
        ],
      },
      include: SOURCE_INCLUDE,
    });
    if (!source) {
      throw new NotFoundException('Event not found');
    }

    const timeZone = source.athlete?.user.timeZone ?? 'UTC';
    const last = Math.min(
      until.getTime(),
      source.startDate.getTime() + REPEAT_MAX_DAYS * DAY_MS,
    );
    const offsets: number[] = [];
    for (let days = 7 * everyWeeks; ; days += 7 * everyWeeks) {
      const start = addZonedDays(source.startDate, days, timeZone);
      if (start.getTime() > last) break;
      offsets.push(days);
    }
    if (!offsets.length) {
      throw new BadRequestException('Nothing to repeat before this date');
    }

    const seriesId = source.seriesId ?? randomUUID();
    const [, ...created] = await this.prisma.$transaction([
      this.prisma.event.update({ where: { eventId }, data: { seriesId } }),
      ...offsets.map((days) =>
        this.prisma.event.create({
          data: { ...copyOf(source, days), seriesId },
          select: { eventId: true },
        }),
      ),
    ]);

    const copies = await this.eventBulkService.reload(
      created.map((event) => event.eventId),
    );
    this.eventBulkService.afterChange(copies);
    return copies.map((event) => this.eventService.prismaEventToEvent(event));
  }

  /**
   * Applies an edit to an occurrence and the following ones. A new date
   * moves them all by the same number of days, to the same new time.
   */
  async updateFollowing(user: AuthUser, eventId: number, dto: UpdateEventDto) {
    const { event, following } = await this.loadFollowing(
      user,
      eventId,
      'update',
    );
    const timeZone = event.athlete?.user.timeZone ?? 'UTC';
    const dayShift = dto.startDate
      ? zonedDayDifference(event.startDate, dto.startDate, timeZone)
      : 0;
    // What the edited occurrence's new start adds once its days are moved
    const timeShift = dto.startDate
      ? dto.startDate.getTime() -
        addZonedDays(event.startDate, dayShift, timeZone).getTime()
      : 0;
    const duration =
      dto.startDate && dto.endDate
        ? dto.endDate.getTime() - dto.startDate.getTime()
        : null;

    const updated = [];
    // One at a time: each update may replace a workout and its watch export
    for (const occurrence of following) {
      const startDate = new Date(
        addZonedDays(occurrence.startDate, dayShift, timeZone).getTime() +
          timeShift,
      );
      const endDate = new Date(
        startDate.getTime() +
          (duration ??
            occurrence.endDate.getTime() - occurrence.startDate.getTime()),
      );
      updated.push(
        await this.eventService.updateEvent(user, occurrence.eventId, {
          ...dto,
          ...(dto.startDate && { startDate, endDate }),
        } as UpdateEventDto),
      );
    }
    return updated;
  }

  /** Deletes an occurrence and the following ones still to do */
  async deleteFollowing(user: AuthUser, eventId: number) {
    const { following } = await this.loadFollowing(user, eventId, 'delete');
    for (const occurrence of following) {
      await this.eventService.deleteEvent(user, occurrence.eventId);
    }
    return { deleted: following.length };
  }

  /**
   * The occurrence and the following ones of its series the user may change,
   * by date. Done sessions stay: their activity is linked to them.
   */
  private async loadFollowing(
    user: AuthUser,
    eventId: number,
    action: 'update' | 'delete',
  ) {
    const ability = await this.abilities.getFor({ user });
    const event = await this.prisma.event.findFirst({
      where: {
        AND: [{ eventId }, accessibleBy(ability, action).Event],
      },
      include: SOURCE_INCLUDE,
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (!event.seriesId) {
      return { event, following: [event] };
    }

    const series = await this.prisma.event.findMany({
      where: {
        AND: [
          { seriesId: event.seriesId },
          { startDate: { gte: event.startDate } },
          accessibleBy(ability, action).Event,
        ],
      },
      include: {
        training: { select: { relatedActivityId: true } },
        competition: { select: { relatedActivityId: true } },
      },
      orderBy: { startDate: 'asc' },
    });
    // The occurrence asked for always changes; later done ones stay
    const following = series.filter(
      (occurrence) =>
        occurrence.eventId === eventId ||
        (!occurrence.training?.relatedActivityId &&
          !occurrence.competition?.relatedActivityId),
    );
    return { event, following };
  }
}
