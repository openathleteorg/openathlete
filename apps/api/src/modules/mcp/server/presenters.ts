import { z } from 'zod';

import { Prisma } from '@openathlete/database';
import { SPORT_TYPE, getSportConfig } from '@openathlete/shared';

import { formatZoned, zonedClock } from 'src/common/utils/time-zone';

import { Workout, fromStoredWorkout, summarizeWorkout } from './workout-format';

/**
 * How events read for agents: local dates and times, readable units, the
 * planned session and what was done side by side. Kept compact, since an
 * agent planning a season reads hundreds of them.
 */

export const EVENT_KINDS = {
  TRAINING: 'training',
  COMPETITION: 'race',
  NOTE: 'note',
  ACTIVITY: 'activity',
} as const;
export type EventKind = (typeof EVENT_KINDS)[keyof typeof EVENT_KINDS];
export const EVENT_TYPE_OF_KIND = {
  training: 'TRAINING',
  race: 'COMPETITION',
  note: 'NOTE',
  activity: 'ACTIVITY',
} as const;

const WORKOUT_STEPS_INCLUDE = {
  steps: {
    include: {
      targets: true,
      repeatBlock: {
        include: {
          childSteps: {
            include: { targets: true },
            orderBy: { orderIndex: 'asc' as const },
          },
        },
      },
    },
    orderBy: { orderIndex: 'asc' as const },
  },
} satisfies Prisma.WorkoutInclude;

const ACTIVITY_SELECT = {
  eventActivityId: true,
  sport: true,
  distance: true,
  movingTime: true,
  elevationGain: true,
  averageSpeed: true,
  averageHeartrate: true,
  maxHeartrate: true,
  averageWatts: true,
  weightedAverageWatts: true,
  averageCadence: true,
  rpe: true,
  isRace: true,
  description: true,
  // The load the app charts: TRIMP
  trainingLoadEntries: {
    where: { calculation: { type: 'TRIMP' } },
    select: { value: true },
  },
  relatedTraining: { select: { eventId: true } },
  relatedCompetition: { select: { eventId: true } },
} satisfies Prisma.EventActivitySelect;

export const CALENDAR_INCLUDE = {
  training: {
    include: {
      workout: { include: WORKOUT_STEPS_INCLUDE },
      relatedActivity: { select: { eventId: true, movingTime: true } },
    },
  },
  competition: {
    include: {
      relatedActivity: { select: { eventId: true, movingTime: true } },
    },
  },
  note: true,
  activity: { select: ACTIVITY_SELECT },
} satisfies Prisma.EventInclude;

export type CalendarEvent = Prisma.EventGetPayload<{
  include: typeof CALENDAR_INCLUDE;
}>;

const optionalNumber = z.number().optional();

export const calendarItemSchema = z.object({
  eventId: z.number(),
  type: z.enum(['training', 'race', 'note', 'activity']),
  name: z.string(),
  date: z.string().describe('Local date'),
  start: z.string().describe('Local start time with UTC offset'),
  sport: z.string().optional(),
  description: z.string().optional(),
  plannedMinutes: optionalNumber,
  plannedKm: optionalNumber,
  plannedElevationM: optionalNumber,
  plannedRpe: optionalNumber.describe('Intended effort, 1-10'),
  estimatedLoad: optionalNumber.describe('Planned load (TRIMP)'),
  workout: z.string().optional().describe('Structured workout, in one line'),
  priority: z.enum(['A', 'B', 'C']).optional(),
  repeats: z
    .boolean()
    .optional()
    .describe('One occurrence of a repeated session (see scope on updates)'),
  status: z
    .enum(['done', 'missed', 'planned'])
    .optional()
    .describe(
      'Planned sessions: done (an activity is linked), missed or planned',
    ),
  doneActivityId: optionalNumber.describe('eventId of the activity done'),
  completion: optionalNumber.describe('Done moving time / planned time, %'),
  movingMinutes: optionalNumber,
  distanceKm: optionalNumber,
  elevationGainM: optionalNumber,
  avgHeartRate: optionalNumber,
  maxHeartRate: optionalNumber,
  avgPower: optionalNumber,
  normalizedPower: optionalNumber,
  avgCadence: optionalNumber,
  avgPace: z
    .string()
    .optional()
    .describe('e.g. 4:35/km, or 1:52/100m swimming'),
  avgSpeedKmh: optionalNumber,
  rpe: optionalNumber.describe('Perceived effort, 1-10'),
  load: optionalNumber.describe('Training load of the activity (TRIMP)'),
  isRace: z.boolean().optional(),
  plannedSessionId: optionalNumber.describe(
    'eventId of the planned session it fulfils',
  ),
});
export type CalendarItem = z.infer<typeof calendarItemSchema>;

const round = (value: number, digits = 0) =>
  Math.round(value * 10 ** digits) / 10 ** digits;

/** A pace for foot and swim sports, a speed otherwise */
export function speedFields(sport: string, metersPerSecond: number) {
  if (!metersPerSecond || metersPerSecond <= 0) return {};
  const config = getSportConfig(sport as SPORT_TYPE);
  if (config?.speedLabel === 'pace') {
    // Swimmers count per 100 m
    const per100m = sport === SPORT_TYPE.SWIMMING;
    const seconds = Math.round((per100m ? 100 : 1000) / metersPerSecond);
    return {
      avgPace: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}/${per100m ? '100m' : 'km'}`,
    };
  }
  return { avgSpeedKmh: round(metersPerSecond * 3.6, 1) };
}

/** RPE is stored 0-1, read 1-10 */
const rpeOutOfTen = (value: number | null | undefined) =>
  value === null || value === undefined ? undefined : round(value * 10, 1);

const definedOnly = <T extends Record<string, unknown>>(object: T) =>
  Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  ) as Partial<T>;

export function toCalendarItem(
  event: CalendarEvent,
  timeZone: string,
  today: string,
  zoneNames: Map<number, string>,
  { withDescription = true } = {},
): CalendarItem {
  const date = zonedClock(event.startDate, timeZone).date;
  const base = {
    eventId: event.eventId,
    type: EVENT_KINDS[event.type],
    name: event.name,
    date,
    start: formatZoned(event.startDate, timeZone),
  };

  const planned = event.training ?? event.competition;
  if (planned) {
    const workoutSteps = event.training?.workout?.steps ?? [];
    const done = planned.relatedActivity;
    return {
      ...base,
      ...definedOnly({
        sport: planned.sport,
        description: withDescription ? planned.description : undefined,
        plannedMinutes: planned.goalDuration
          ? round(planned.goalDuration / 60)
          : undefined,
        plannedKm: planned.goalDistance
          ? round(planned.goalDistance / 1000, 2)
          : undefined,
        plannedElevationM: planned.goalElevationGain ?? undefined,
        plannedRpe: rpeOutOfTen(planned.goalRpe),
        estimatedLoad:
          event.training?.estimatedLoad != null
            ? round(event.training.estimatedLoad)
            : undefined,
        workout: workoutSteps.length
          ? summarizeWorkout(fromStoredWorkout(workoutSteps, zoneNames))
          : undefined,
        priority: event.competition?.priority ?? undefined,
        repeats: event.seriesId ? true : undefined,
        status: done ? 'done' : date < today ? 'missed' : 'planned',
        doneActivityId: done?.eventId,
        completion:
          done && planned.goalDuration
            ? round((done.movingTime / planned.goalDuration) * 100)
            : undefined,
      }),
    } as CalendarItem;
  }

  if (event.note) {
    return {
      ...base,
      ...definedOnly({ description: event.note.description }),
    } as CalendarItem;
  }

  const activity = event.activity;
  if (activity) {
    const load = activity.trainingLoadEntries.reduce(
      (sum, entry) => sum + entry.value,
      0,
    );
    return {
      ...base,
      ...definedOnly({
        sport: activity.sport,
        description: withDescription ? activity.description : undefined,
        movingMinutes: round(activity.movingTime / 60),
        distanceKm: activity.distance
          ? round(activity.distance / 1000, 2)
          : undefined,
        elevationGainM: activity.elevationGain
          ? round(activity.elevationGain)
          : undefined,
        avgHeartRate: activity.averageHeartrate
          ? round(activity.averageHeartrate)
          : undefined,
        maxHeartRate: activity.maxHeartrate
          ? round(activity.maxHeartrate)
          : undefined,
        avgPower: activity.averageWatts
          ? round(activity.averageWatts)
          : undefined,
        normalizedPower: activity.weightedAverageWatts
          ? round(activity.weightedAverageWatts)
          : undefined,
        avgCadence: activity.averageCadence
          ? round(activity.averageCadence)
          : undefined,
        ...speedFields(activity.sport, activity.averageSpeed),
        rpe: rpeOutOfTen(activity.rpe),
        load: activity.trainingLoadEntries.length ? round(load) : undefined,
        isRace: activity.isRace || undefined,
        plannedSessionId:
          activity.relatedTraining?.eventId ??
          activity.relatedCompetition?.eventId,
      }),
    } as CalendarItem;
  }
  return base;
}

/** The workout of a training event, in the agent format */
export function workoutOf(
  event: CalendarEvent,
  zoneNames: Map<number, string>,
): Workout | undefined {
  const steps = event.training?.workout?.steps;
  return steps?.length ? fromStoredWorkout(steps, zoneNames) : undefined;
}
