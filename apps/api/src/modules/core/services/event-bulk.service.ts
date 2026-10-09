import { Injectable, NotFoundException, Optional } from '@nestjs/common';

import { ShiftEventsDto } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { CalendarWebSocketService } from 'src/modules/calendar/services/calendar-websocket.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  SHIFTABLE_TYPES,
  SOURCE_INCLUDE,
  copyOf,
  shiftedDates,
} from './event-copy';
import { EVENT_INCLUDES } from './event-includes';
import { EventService } from './event.service';

/**
 * Copies or moves many planned events by whole days at once, for the week
 * actions of the calendar. All or nothing: one transaction, and the request
 * fails if any event is missing, an activity, or not editable by the user.
 */
@Injectable()
export class EventBulkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly eventService: EventService,
    @Optional()
    private readonly calendarWebSocketService?: CalendarWebSocketService,
  ) {}

  async move(user: AuthUser, { eventIds, offsetDays }: ShiftEventsDto) {
    const sources = await this.loadEditable(user, eventIds);

    await this.prisma.$transaction(
      sources.map((event) =>
        this.prisma.event.update({
          where: { eventId: event.eventId },
          data: shiftedDates(event, offsetDays),
        }),
      ),
    );

    const moved = await this.reload(eventIds);
    this.afterChange(moved);
    return moved.map((event) => this.eventService.prismaEventToEvent(event));
  }

  async duplicate(user: AuthUser, { eventIds, offsetDays }: ShiftEventsDto) {
    const sources = await this.loadEditable(user, eventIds);

    const created = await this.prisma.$transaction(
      sources.map((event) =>
        this.prisma.event.create({
          data: copyOf(event, offsetDays),
          select: { eventId: true },
        }),
      ),
    );

    const copies = await this.reload(created.map(({ eventId }) => eventId));
    this.afterChange(copies);
    return copies.map((event) => this.eventService.prismaEventToEvent(event));
  }

  private async loadEditable(user: AuthUser, eventIds: number[]) {
    const ability = await this.abilities.getFor({ user });
    const events = await this.prisma.event.findMany({
      where: {
        AND: [
          { eventId: { in: eventIds } },
          { type: { in: SHIFTABLE_TYPES } },
          accessibleBy(ability, 'update').Event,
        ],
      },
      include: SOURCE_INCLUDE,
    });
    // Never a partial copy: the user asked for all of them
    if (events.length !== eventIds.length) {
      throw new NotFoundException('Some events cannot be changed');
    }
    return events;
  }

  reload(eventIds: number[]) {
    return this.prisma.event.findMany({
      where: { eventId: { in: eventIds } },
      include: EVENT_INCLUDES,
      orderBy: { startDate: 'asc' },
    });
  }

  /**
   * Side effects stay out of the transaction: watch exports go through the
   * workout listener's jobs, and calendars refresh their weekly load.
   */
  afterChange(events: Awaited<ReturnType<typeof this.reload>>) {
    const athletes = new Set<number>();
    for (const event of events) {
      if (!event.athleteId) continue;
      athletes.add(event.athleteId);
      if (event.training?.workout) {
        this.eventService.emitWorkoutPlannedChanged(
          event.eventId,
          event.athleteId,
          event.training.workout.workoutId,
          event.startDate,
          event.training.sport,
        );
      }
    }
    for (const athleteId of athletes) {
      this.calendarWebSocketService?.notifyWeeklyLoadUpdated(athleteId, {
        eventId: events[0].eventId,
        reason: 'event_updated',
      });
    }
  }
}
