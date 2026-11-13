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
  return copyTo(event, {
    athleteId: event.athleteId,
    ...shiftedDates(event, offsetDays),
    keepLoad: true,
  });
}

export type WorkoutSteps = ReturnType<typeof mapPrismaWorkoutToDto>['steps'];

/** The workout's steps, in the shape the API writes them back */
export const stepsOf = (event: SourceEvent): WorkoutSteps | null =>
  event.training?.workout
    ? mapPrismaWorkoutToDto(event.training.workout).steps
    : null;

export type CopyTarget = {
  athleteId: number | null;
  startDate: Date;
  endDate: Date;
  /** Steps adapted to the target athlete (their zones); the source's else */
  steps?: WorkoutSteps | null;
  /** The load estimate holds for the same athlete only */
  keepLoad: boolean;
  /** Shared by the copies of one operation, to undo them together */
  batchId?: string;
};

/** A copy of the plan into any calendar, at the given dates. */
export function copyTo(
  event: SourceEvent,
  target: CopyTarget,
): Prisma.EventCreateInput {
  const base = {
    name: event.name,
    type: event.type,
    startDate: target.startDate,
    endDate: target.endDate,
    ...(target.batchId && { batchId: target.batchId }),
    ...(target.athleteId && {
      athlete: { connect: { athleteId: target.athleteId } },
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
      estimatedLoad,
      ...training
    } = event.training;
    const steps = target.steps ?? stepsOf(event);
    return {
      ...base,
      training: {
        create: {
          ...training,
          ...(target.keepLoad && { estimatedLoad }),
          ...(workout &&
            steps && {
              workout: { create: mapWorkoutDtoToPrisma({ steps }) },
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
