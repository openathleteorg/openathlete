import { z } from 'zod';

import {
  COMPETITION_PRIORITY,
  CreateEventDto,
  EVENT_TYPE,
  SPORT_TYPE,
  UpdateEventDto,
} from '@openathlete/shared';

import {
  addDaysToDateKey,
  formatZoned,
  startOfZonedDay,
  zonedInstant,
} from 'src/common/utils/time-zone';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';

import { AthleteScope, ToolError, athleteIdInput, run } from '../context';
import { localDate, localTime } from '../dates';
import {
  CALENDAR_INCLUDE,
  calendarItemSchema,
  toCalendarItem,
} from '../presenters';
import {
  Workout,
  toStoredWorkout,
  workoutSchema,
  workoutSeconds,
  zoneIdsOf,
} from '../workout-format';
import { ToolDeps, ToolRegistrar, registerTool, zoneNamesOf } from './deps';

/** Planned sessions without a time sit at midday: no time zone moves them a day */
const DEFAULT_TIME = '12:00';
const HOUR_MS = 3600 * 1000;

const sessionFields = {
  name: z.string().min(1).max(100),
  sport: z
    .nativeEnum(SPORT_TYPE)
    .optional()
    .describe('Required for a training or a race'),
  description: z
    .string()
    .max(5000)
    .optional()
    .describe(
      'What the athlete reads: purpose of the session, cues, fueling. For a note, its text',
    ),
  durationMinutes: z
    .number()
    .min(1)
    .max(48 * 60)
    .optional()
    .describe('Planned duration; default: the timed steps of the workout'),
  distanceKm: z.number().min(0.01).max(2000).optional(),
  elevationGainM: z.number().min(0).max(30000).optional(),
  rpe: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe(
      'Intended effort, 1 (very easy) to 10 (maximal): sets the planned load',
    ),
  priority: z
    .nativeEnum(COMPETITION_PRIORITY)
    .optional()
    .describe('Races only: A the goal race, B important, C a training race'),
  workoutSteps: workoutSchema
    .optional()
    .describe('Trainings only: the structured workout, sent to watches'),
};

const sessionInput = z.object({
  type: z.enum(['training', 'race', 'note']).default('training'),
  date: localDate,
  time: localTime
    .optional()
    .describe('Start time; omit when the athlete chooses (shown on the day)'),
  ...sessionFields,
});
type SessionInput = z.infer<typeof sessionInput>;

const itemsOutput = z.object({
  count: z.number(),
  items: z.array(calendarItemSchema),
});

const deletedOutput = z.object({
  deleted: z.number(),
});

/** A readable error for one of several sessions */
const at = (index: number, message: string) =>
  new ToolError(`sessions[${index}]: ${message}`);

async function checkZones(
  deps: ToolDeps,
  athleteId: number,
  workout: Workout | undefined,
  where: (message: string) => ToolError,
) {
  const used = workout ? zoneIdsOf(workout) : [];
  if (!used.length) return;
  const zones = await zoneNamesOf(deps, athleteId);
  const unknown = used.filter((id) => !zones.has(id));
  if (unknown.length) {
    throw where(
      `zone ${unknown.join(', ')} is not one of the athlete's zones (see get_athlete_context)`,
    );
  }
}

function plannedFields(
  input: Partial<z.infer<z.ZodObject<typeof sessionFields>>>,
  seconds: number | null | undefined,
) {
  return {
    ...(input.description !== undefined && { description: input.description }),
    ...(seconds !== undefined && { goalDuration: seconds }),
    ...(input.distanceKm !== undefined && {
      goalDistance: Math.round(input.distanceKm * 1000),
    }),
    ...(input.elevationGainM !== undefined && {
      goalElevationGain: Math.round(input.elevationGainM),
    }),
    ...(input.rpe !== undefined && { goalRpe: input.rpe / 10 }),
  };
}

function toCreateDto(
  input: SessionInput,
  scope: AthleteScope,
  index: number,
): CreateEventDto {
  const startDate = zonedInstant(
    input.date,
    input.time ?? DEFAULT_TIME,
    scope.timeZone,
  );
  const seconds = input.durationMinutes
    ? Math.round(input.durationMinutes * 60)
    : input.workoutSteps
      ? workoutSeconds(input.workoutSteps) || null
      : null;
  const endDate = new Date(
    startDate.getTime() + (seconds ? seconds * 1000 : HOUR_MS),
  );
  const base = {
    name: input.name,
    startDate,
    endDate,
    athleteId: scope.athleteId,
  };

  if (input.type === 'note') {
    return {
      ...base,
      type: 'NOTE',
      description: input.description?.trim() || input.name,
    } as CreateEventDto;
  }
  if (!input.sport) {
    throw at(index, `sport is required for a ${input.type}`);
  }
  if (input.type === 'race') {
    if (input.workoutSteps) {
      throw at(
        index,
        'a race has no workout: describe the plan in its description',
      );
    }
    return {
      ...base,
      type: 'COMPETITION',
      sport: input.sport,
      description: '',
      ...plannedFields(input, seconds),
      priority: input.priority ?? null,
    } as CreateEventDto;
  }
  if (input.priority) {
    throw at(index, 'priority is for races only');
  }
  return {
    ...base,
    type: 'TRAINING',
    sport: input.sport,
    description: '',
    ...plannedFields(input, seconds),
    workout: input.workoutSteps
      ? { steps: toStoredWorkout(input.workoutSteps) }
      : null,
  } as CreateEventDto;
}

export const registerCalendarWriteTools: ToolRegistrar = (
  server,
  ctx,
  deps,
) => {
  const prisma = deps.prisma;

  /** The created or changed events, as get_calendar shows them */
  const present = async (eventIds: number[], scope: AthleteScope) => {
    const [events, zoneNames] = await Promise.all([
      prisma.event.findMany({
        where: { eventId: { in: eventIds } },
        include: CALENDAR_INCLUDE,
        orderBy: { startDate: 'asc' },
      }),
      zoneNamesOf(deps, scope.athleteId),
    ]);
    return {
      count: events.length,
      items: events.map((event) =>
        toCalendarItem(event, scope.timeZone, scope.today, zoneNames),
      ),
    };
  };

  /** Planned events the user may change, all of one athlete, or a ToolError */
  const editable = async (eventIds: number[], action: 'update' | 'delete') => {
    const ability = await deps.abilities.getFor({ user: ctx.user });
    const events = await prisma.event.findMany({
      where: {
        AND: [
          // Not templates: their events have no athlete
          { eventId: { in: eventIds }, athleteId: { not: null } },
          accessibleBy(ability, action).Event,
        ],
      },
      include: {
        training: { select: { relatedActivityId: true } },
        competition: { select: { relatedActivityId: true } },
      },
    });
    const missing = eventIds.filter(
      (id) => !events.some((event) => event.eventId === id),
    );
    if (missing.length) {
      throw new ToolError(
        `Events not found: ${missing.join(', ')}. get_calendar lists the events and their ids.`,
      );
    }
    const activities = events.filter((event) => event.type === 'ACTIVITY');
    if (activities.length) {
      throw new ToolError(
        `${activities.map((event) => event.eventId).join(', ')}: recorded activities cannot be changed here, only planned sessions, races and notes.`,
      );
    }
    const athletes = new Set(events.map((event) => event.athleteId));
    if (athletes.size > 1) {
      throw new ToolError(
        'These events belong to several athletes: one athlete per call.',
      );
    }
    return {
      events,
      scope: await ctx.athlete(events[0].athleteId!),
    };
  };

  registerTool(
    server,
    'plan_sessions',
    {
      title: 'Plan sessions',
      description:
        "Adds trainings (with structured workouts), races and notes to the athlete's calendar, up to 60 at once: a whole training block in one call. All are saved or none. Watches synced with OpenAthlete get the workouts of the coming days.",
      inputSchema: {
        athleteId: athleteIdInput,
        sessions: z.array(sessionInput).min(1).max(60),
      },
      outputSchema: itemsOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ athleteId, sessions }) =>
      run(itemsOutput, async () => {
        const scope = await ctx.athlete(athleteId);
        // Check them all before saving any, and report every problem at once
        const problems: string[] = [];
        const dtos: CreateEventDto[] = [];
        for (const [index, session] of sessions.entries()) {
          try {
            dtos.push(toCreateDto(session, scope, index));
            await checkZones(
              deps,
              scope.athleteId,
              session.workoutSteps,
              (message) => at(index, message),
            );
          } catch (error) {
            if (!(error instanceof ToolError)) throw error;
            problems.push(error.message);
          }
        }
        if (problems.length) {
          throw new ToolError(`${problems.join('\n')}\nNothing was saved.`);
        }

        const created: number[] = [];
        try {
          for (const dto of dtos) {
            const event = await deps.events.createEvent(ctx.user, dto);
            created.push(event.eventId);
          }
        } catch (error) {
          // All or nothing: remove what this call already saved
          for (const eventId of created) {
            await deps.events
              .deleteEvent(ctx.user, eventId)
              .catch(() => undefined);
          }
          throw error;
        }
        return present(created, scope);
      }),
  );

  registerTool(
    server,
    'update_session',
    {
      title: 'Change a session',
      description:
        'Changes a planned training, race or note: date or time, name, sport, description, targets, or its whole workout (workoutSteps replaces it; an empty list removes it). Only the fields given change. For a repeated session, scope "following" applies the change to this occurrence and the next ones still to do.',
      inputSchema: {
        eventId: z.number().int(),
        scope: z
          .enum(['this', 'following'])
          .default('this')
          .describe(
            'Repeated sessions: this one only, or this one and the following',
          ),
        date: localDate.optional().describe('New date'),
        time: localTime.optional().describe('New start time'),
        ...sessionFields,
        name: sessionFields.name.optional(),
      },
      outputSchema: itemsOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    ({ eventId, scope: applyTo, date, time, ...fields }) =>
      run(itemsOutput, async () => {
        const {
          events: [event],
          scope,
        } = await editable([eventId], 'update');
        await checkZones(
          deps,
          scope.athleteId,
          fields.workoutSteps,
          (message) => new ToolError(message),
        );

        const local = formatZoned(event.startDate, scope.timeZone);
        const startDate =
          date || time
            ? zonedInstant(
                date ?? local.slice(0, 10),
                time ?? local.slice(11, 16),
                scope.timeZone,
              )
            : event.startDate;
        const seconds = fields.durationMinutes
          ? Math.round(fields.durationMinutes * 60)
          : undefined;
        const lengthMs = seconds
          ? seconds * 1000
          : event.endDate.getTime() - event.startDate.getTime();
        const moved = Boolean(date || time || seconds);
        const dates = moved
          ? { startDate, endDate: new Date(startDate.getTime() + lengthMs) }
          : {};

        let dto: UpdateEventDto;
        if (event.type === 'NOTE') {
          if (fields.sport || fields.workoutSteps || fields.priority) {
            throw new ToolError(
              'A note only has a name, a date and a description.',
            );
          }
          dto = {
            type: EVENT_TYPE.NOTE,
            ...(fields.name && { name: fields.name }),
            ...(fields.description !== undefined && {
              description: fields.description.trim() || event.name,
            }),
            ...dates,
          };
        } else if (event.type === 'COMPETITION') {
          if (fields.workoutSteps) {
            throw new ToolError(
              'A race has no workout: describe the plan in its description.',
            );
          }
          dto = {
            type: EVENT_TYPE.COMPETITION,
            ...(fields.name && { name: fields.name }),
            ...(fields.sport && { sport: fields.sport }),
            ...plannedFields(fields, seconds),
            ...(fields.priority && { priority: fields.priority }),
            ...dates,
          };
        } else {
          if (fields.priority) {
            throw new ToolError('priority is for races only.');
          }
          const workoutTime =
            fields.workoutSteps && !seconds
              ? workoutSeconds(fields.workoutSteps)
              : 0;
          dto = {
            type: EVENT_TYPE.TRAINING,
            ...(fields.name && { name: fields.name }),
            ...(fields.sport && { sport: fields.sport }),
            ...plannedFields(fields, seconds ?? (workoutTime || undefined)),
            ...(fields.workoutSteps && {
              workout: { steps: toStoredWorkout(fields.workoutSteps) },
            }),
            ...dates,
          };
        }

        const changed =
          applyTo === 'following'
            ? await deps.series.updateFollowing(ctx.user, eventId, dto)
            : [await deps.events.updateEvent(ctx.user, eventId, dto)];
        return present(
          changed.map((item) => item.eventId),
          scope,
        );
      }),
  );

  const shiftInput = {
    eventIds: z
      .array(z.number().int())
      .min(1)
      .max(200)
      .refine((ids) => new Set(ids).size === ids.length, 'Each id once')
      .describe('Planned sessions, races or notes of one athlete'),
    days: z
      .number()
      .int()
      .min(-366)
      .max(366)
      .refine((days) => days !== 0, 'Not 0')
      .describe('Calendar days: 1 the next day, -7 a week earlier'),
  };

  registerTool(
    server,
    'move_sessions',
    {
      title: 'Move sessions',
      description:
        'Moves planned sessions, races or notes by a number of days, keeping their local time, all or none. Use it to push a block back after an illness, or to swap days.',
      inputSchema: shiftInput,
      outputSchema: itemsOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ eventIds, days }) =>
      run(itemsOutput, async () => {
        const { scope } = await editable(eventIds, 'update');
        const moved = await deps.bulk.move(ctx.user, {
          eventIds,
          offsetDays: days,
        });
        return present(
          moved.map((event) => event.eventId),
          scope,
        );
      }),
  );

  registerTool(
    server,
    'copy_sessions',
    {
      title: 'Copy sessions',
      description:
        'Copies planned sessions, races or notes a number of days later or earlier, with their workouts, e.g. a whole week 7 days on. Copies are not marked done.',
      inputSchema: shiftInput,
      outputSchema: itemsOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ eventIds, days }) =>
      run(itemsOutput, async () => {
        const { scope } = await editable(eventIds, 'update');
        const copies = await deps.bulk.duplicate(ctx.user, {
          eventIds,
          offsetDays: days,
        });
        return present(
          copies.map((event) => event.eventId),
          scope,
        );
      }),
  );

  registerTool(
    server,
    'repeat_session',
    {
      title: 'Repeat a session',
      description:
        'Repeats a planned session every 1 to 4 weeks, same weekday and local time, until a date (at most 90 days on). The occurrences form a series: update_session and delete_sessions can then change this one and the following.',
      inputSchema: {
        eventId: z.number().int(),
        everyWeeks: z.number().int().min(1).max(4).default(1),
        until: localDate.describe('Last day an occurrence may fall on'),
      },
      outputSchema: itemsOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    ({ eventId, everyWeeks, until }) =>
      run(itemsOutput, async () => {
        const { scope } = await editable([eventId], 'update');
        const end = new Date(
          startOfZonedDay(
            addDaysToDateKey(until, 1),
            scope.timeZone,
          ).getTime() - 1,
        );
        const copies = await deps.series.repeat(ctx.user, eventId, {
          everyWeeks,
          until: end,
        });
        return present(
          copies.map((event) => event.eventId),
          scope,
        );
      }),
  );

  registerTool(
    server,
    'delete_sessions',
    {
      title: 'Delete sessions',
      description:
        'Deletes planned sessions, races or notes. Sessions already done (linked to an activity) and recorded activities are kept: they are the athlete\'s history. For one repeated session, scope "following" also deletes the next occurrences still to do.',
      inputSchema: {
        eventIds: shiftInput.eventIds.describe(
          'Planned sessions, races or notes',
        ),
        scope: z
          .enum(['this', 'following'])
          .default('this')
          .describe('With a single repeated session: also the following ones'),
      },
      outputSchema: deletedOutput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    ({ eventIds, scope: applyTo }) =>
      run(deletedOutput, async () => {
        if (applyTo === 'following' && eventIds.length > 1) {
          throw new ToolError('scope "following" takes a single eventId.');
        }
        const { events } = await editable(eventIds, 'delete');
        const done = events.filter(
          (event) =>
            event.training?.relatedActivityId ||
            event.competition?.relatedActivityId,
        );
        if (done.length) {
          throw new ToolError(
            `${done.map((event) => event.eventId).join(', ')}: done sessions are kept. Leave them out.`,
          );
        }
        if (applyTo === 'following') {
          return deps.series.deleteFollowing(ctx.user, eventIds[0]);
        }
        for (const eventId of eventIds) {
          await deps.events.deleteEvent(ctx.user, eventId);
        }
        return { deleted: eventIds.length };
      }),
  );
};
