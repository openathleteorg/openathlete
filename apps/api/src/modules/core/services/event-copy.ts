import { EventType, Prisma } from '@openathlete/database';
import {
  mapPrismaWorkoutToDto,
  mapWorkoutDtoToPrisma,
} from '@openathlete/shared';

import { addZonedDays } from 'src/common/utils/time-zone';

/** What can be copied or moved: plans, never activities */
export const SHIFTABLE_TYPES = [
  EventType.TRAINING,
  EventType.COMPETITION,
  EventType.NOTE,
];

const WORKOUT_INCLUDE = {
  steps: {
    include: {
      targets: true,
      repeatBlock: { include: { childSteps: { include: { targets: true } } } },
    },
    orderBy: { orderIndex: 'asc' },
  },
} satisfies Prisma.WorkoutInclude;

export const SOURCE_INCLUDE = {
  training: { include: { workout: { include: WORKOUT_INCLUDE } } },
  competition: true,
  note: true,
  athlete: { select: { user: { select: { timeZone: true } } } },
} satisfies Prisma.EventInclude;

export type SourceEvent = Prisma.EventGetPayload<{
  include: typeof SOURCE_INCLUDE;
}>;

/** Same wall clock time, `offsetDays` later, in the athlete's time zone */
export function shiftedDates(event: SourceEvent, offsetDays: number) {
  const timeZone = event.athlete?.user.timeZone ?? 'UTC';
  return {
    startDate: addZonedDays(event.startDate, offsetDays, timeZone),
    endDate: addZonedDays(event.endDate, offsetDays, timeZone),
  };
}

/**
 * A copy of the plan, with its workout. Not the link to an activity: the
 * copy is still to do. The load estimate does not depend on the date, so it
 * carries over instead of asking the AI again.
 */
export function copyOf(
  event: SourceEvent,
  offsetDays: number,
): Prisma.EventCreateInput {
  const base = {
    name: event.name,
    type: event.type,
    ...shiftedDates(event, offsetDays),
    ...(event.athleteId && {
      athlete: { connect: { athleteId: event.athleteId } },
    }),
  };

  if (event.training) {
    const {
      eventTrainingId: _id,
      eventId: _eventId,
      relatedActivityId: _activity,
      // The comment thread stays with the original session (it is unique)
      messageThreadId: _thread,
      workout,
      ...training
    } = event.training;
    return {
      ...base,
      training: {
        create: {
          ...training,
          ...(workout && {
            workout: {
              create: mapWorkoutDtoToPrisma({
                steps: mapPrismaWorkoutToDto(workout).steps,
              }),
            },
          }),
        },
      },
    };
  }
  if (event.competition) {
    const {
      eventCompetitionId: _id,
      eventId: _eventId,
      relatedActivityId: _activity,
      ...competition
    } = event.competition;
    return { ...base, competition: { create: competition } };
  }
  if (event.note) {
    const { eventNoteId: _id, eventId: _eventId, ...note } = event.note;
    return { ...base, note: { create: note } };
  }
  return base;
}
