import { z } from 'zod';

import { MetricType } from '@openathlete/database';
import {
  CYCLE_KIND,
  METRIC_TYPE,
  SPORT_TYPE,
  metricUnitMap,
} from '@openathlete/shared';

import {
  addDaysToDateKey,
  startOfZonedDay,
  zonedClock,
  zonedInstant,
} from 'src/common/utils/time-zone';

import { AthleteScope, ToolError, athleteIdInput, run } from '../context';
import { daysBetween, localDate } from '../dates';
import { ToolRegistrar, registerTool } from './deps';

const KINDS = ['training', 'travel', 'illness', 'injury'] as const;
type Kind = (typeof KINDS)[number];
const DEFAULT_NAMES: Record<Kind, string> = {
  training: 'Training block',
  travel: 'Travel',
  illness: 'Illness',
  injury: 'Injury',
};

const periodOutput = z.object({
  periodId: z.number(),
  name: z.string(),
  kind: z.enum(KINDS),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string().optional(),
  sessionsInside: z
    .array(
      z.object({ eventId: z.number(), name: z.string(), date: z.string() }),
    )
    .describe(
      'Sessions still planned during the period: move, lighten or delete them',
    ),
});

const metricsOutput = z.object({
  saved: z.array(
    z.object({
      type: z.string(),
      value: z.number(),
      unit: z.string(),
      date: z.string(),
    }),
  ),
});

const zoneOutput = z.object({
  zoneId: z.number(),
  type: z.string(),
  name: z.string(),
  min: z.union([z.number(), z.string()]),
  max: z.union([z.number(), z.string()]),
});

const PACE_PATTERN = /^(\d{1,2}):([0-5]\d)$/;
/** Pace zones are stored in decimal minutes per km */
const paceToDecimal = (value: string) => {
  const [, minutes, seconds] = PACE_PATTERN.exec(value)!;
  return Number(minutes) + Number(seconds) / 60;
};
const decimalToPace = (minutes: number) => {
  const seconds = Math.round(minutes * 60);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

const WRITE = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

export const registerAthleteWriteTools: ToolRegistrar = (server, ctx, deps) => {
  const prisma = deps.prisma;

  /** First instant of `start` to the last of `end`, local days included */
  const span = (scope: AthleteScope, start: string, end: string) => {
    if (daysBetween(start, end) < 0) {
      throw new ToolError('endDate is before startDate.');
    }
    if (daysBetween(start, end) > 366) {
      throw new ToolError('A period lasts at most a year.');
    }
    return {
      startDate: startOfZonedDay(start, scope.timeZone),
      endDate: new Date(
        startOfZonedDay(addDaysToDateKey(end, 1), scope.timeZone).getTime() - 1,
      ),
    };
  };

  const present = async (cycleId: number, scope: AthleteScope) => {
    const period = await prisma.cycle.findUniqueOrThrow({
      where: { cycleId },
    });
    const sessions = await prisma.event.findMany({
      where: {
        athleteId: scope.athleteId,
        type: { in: ['TRAINING', 'COMPETITION'] },
        startDate: { gte: period.startDate, lte: period.endDate },
        // Done sessions are history, not something to rearrange
        NOT: [
          { training: { relatedActivityId: { not: null } } },
          { competition: { relatedActivityId: { not: null } } },
        ],
      },
      select: { eventId: true, name: true, startDate: true },
      orderBy: { startDate: 'asc' },
    });
    const day = (instant: Date) => zonedClock(instant, scope.timeZone).date;
    return {
      periodId: period.cycleId,
      name: period.name,
      kind: period.kind.toLowerCase() as Kind,
      startDate: day(period.startDate),
      endDate: day(period.endDate),
      ...(period.description && { description: period.description }),
      sessionsInside: sessions.map((session) => ({
        eventId: session.eventId,
        name: session.name,
        date: day(session.startDate),
      })),
    };
  };

  /** A period the user may change, with its athlete */
  const periodOf = async (periodId: number) => {
    const period = await prisma.cycle.findUnique({
      where: { cycleId: periodId },
    });
    if (!period?.athleteId || !ctx.athleteIds.includes(period.athleteId)) {
      throw new ToolError(
        `Period ${periodId} not found: get_athlete_context and get_calendar list the periods.`,
      );
    }
    return { period, scope: await ctx.athlete(period.athleteId) };
  };

  registerTool(
    server,
    'create_period',
    {
      title: 'Add a period',
      description:
        'Marks days on the calendar: a training block (base, build, peak, taper...) or a time without training (travel, illness, injury). Returns the sessions still planned inside it: adapt them next (move_sessions, update_session to lighten, delete_sessions). Record an illness or injury as soon as the athlete reports it.',
      inputSchema: {
        athleteId: athleteIdInput,
        kind: z.enum(KINDS),
        startDate: localDate,
        endDate: localDate.describe(
          'Last day, included; a guess is fine, it can be changed',
        ),
        name: z
          .string()
          .min(1)
          .max(100)
          .optional()
          .describe('Default: the kind'),
        description: z
          .string()
          .max(2000)
          .optional()
          .describe('E.g. symptoms, or the goal of the block'),
      },
      outputSchema: periodOutput,
      annotations: WRITE,
    },
    ({ athleteId, kind, startDate, endDate, name, description }) =>
      run(periodOutput, async () => {
        const scope = await ctx.athlete(athleteId);
        const cycle = await deps.cycles.createCycle(ctx.user, {
          athleteId: scope.athleteId,
          name: name ?? DEFAULT_NAMES[kind],
          description: description ?? '',
          kind: kind.toUpperCase() as CYCLE_KIND,
          ...span(scope, startDate, endDate),
        });
        return present(cycle.cycleId, scope);
      }),
  );

  registerTool(
    server,
    'update_period',
    {
      title: 'Change a period',
      description:
        'Changes the dates, name, kind or description of a period, e.g. to end an illness earlier or later than first thought.',
      inputSchema: {
        periodId: z.number().int(),
        startDate: localDate.optional(),
        endDate: localDate.optional(),
        kind: z.enum(KINDS).optional(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(2000).optional(),
      },
      outputSchema: periodOutput,
      annotations: { ...WRITE, destructiveHint: true, idempotentHint: true },
    },
    ({ periodId, startDate, endDate, kind, name, description }) =>
      run(periodOutput, async () => {
        const { period, scope } = await periodOf(periodId);
        const day = (instant: Date) => zonedClock(instant, scope.timeZone).date;
        await deps.cycles.updateCycle(ctx.user, periodId, {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(kind && { kind: kind.toUpperCase() as CYCLE_KIND }),
          ...((startDate || endDate) &&
            span(
              scope,
              startDate ?? day(period.startDate),
              endDate ?? day(period.endDate),
            )),
        });
        return present(periodId, scope);
      }),
  );

  registerTool(
    server,
    'delete_period',
    {
      title: 'Delete a period',
      description: 'Removes a period from the calendar. Its sessions stay.',
      inputSchema: { periodId: z.number().int() },
      outputSchema: z.object({ deleted: z.number() }),
      annotations: { ...WRITE, destructiveHint: true, idempotentHint: true },
    },
    ({ periodId }) =>
      run(z.object({ deleted: z.number() }), async () => {
        await periodOf(periodId);
        await deps.cycles.deleteCycle(ctx.user, periodId);
        return { deleted: 1 };
      }),
  );

  registerTool(
    server,
    'log_metrics',
    {
      title: 'Record metrics',
      description: `Records measurements: weight, resting heart rate, HRV, sleep, a new VMA or FTP after a test... Units: ${[
        'WEIGHT',
        'HR_REST',
        'HR_MAX',
        'HRV_LAST_NIGHT_AVG',
        'SLEEP_DURATION',
        'VMA',
        'FTP_CYCLING',
        'FTP_RUNNING',
        'VO2MAX',
      ]
        .map((type) => `${type} ${metricUnitMap[type as MetricType]}`)
        .join(
          ', ',
        )}. New HR max, VMA or FTP values change how workout percentages and load are computed.`,
      inputSchema: {
        athleteId: athleteIdInput,
        entries: z
          .array(
            z.object({
              type: z.nativeEnum(MetricType),
              value: z.number().positive(),
              date: localDate.optional().describe('Default: today'),
              notes: z.string().max(500).optional(),
            }),
          )
          .min(1)
          .max(30),
      },
      outputSchema: metricsOutput,
      annotations: WRITE,
    },
    ({ athleteId, entries }) =>
      run(metricsOutput, async () => {
        const scope = await ctx.athlete(athleteId);
        const saved = [];
        for (const entry of entries) {
          const date = entry.date ?? scope.today;
          if (date > scope.today) {
            throw new ToolError(`${entry.type}: ${date} is in the future.`);
          }
          const metric = await deps.metrics.createMetric(
            ctx.user,
            {
              type: entry.type as METRIC_TYPE,
              value: entry.value,
              // Midday: the measurement stays on its day in any time zone
              date: zonedInstant(date, '12:00', scope.timeZone),
              ...(entry.notes && { notes: entry.notes }),
            },
            scope.athleteId,
          );
          saved.push({
            type: metric.type,
            value: metric.value,
            unit: metricUnitMap[metric.type] ?? '',
            date,
          });
        }
        return { saved };
      }),
  );

  registerTool(
    server,
    'update_training_zone',
    {
      title: 'Change a training zone',
      description:
        'Changes the bounds (and optionally the name) of one of the athlete training zones, e.g. after a threshold test. Heart rate in bpm, power in W, pace as m:ss per km. Workouts targeting the zone follow it.',
      inputSchema: {
        zoneId: z.number().int().describe('zoneId from get_athlete_context'),
        min: z
          .union([z.number().nonnegative(), z.string().regex(PACE_PATTERN)])
          .describe(
            'Lower bound, as get_athlete_context shows it (m:ss for pace)',
          ),
        max: z
          .union([z.number().positive(), z.string().regex(PACE_PATTERN)])
          .describe(
            'Upper bound, as get_athlete_context shows it (m:ss for pace)',
          ),
        name: z.string().min(1).max(60).optional(),
      },
      outputSchema: zoneOutput,
      annotations: { ...WRITE, destructiveHint: true, idempotentHint: true },
    },
    ({ zoneId, min, max, name }) =>
      run(zoneOutput, async () => {
        const zone = await prisma.trainingZone.findUnique({
          where: { trainingZoneId: zoneId },
          include: { values: true },
        });
        if (!zone || !ctx.athleteIds.includes(zone.athleteId)) {
          throw new ToolError(
            `Zone ${zoneId} not found: get_athlete_context lists the zones.`,
          );
        }
        if (!zone.values.length) {
          throw new ToolError(`Zone ${zoneId} has no range to change.`);
        }
        const isPace = zone.type === 'PACE';
        const read = (value: number | string) => {
          if (isPace !== (typeof value === 'string')) {
            throw new ToolError(
              isPace
                ? 'Pace zones take paces as m:ss per km, e.g. "4:30".'
                : `${zone.type} zones take numbers.`,
            );
          }
          return typeof value === 'string' ? paceToDecimal(value) : value;
        };
        const [low, high] = [read(min), read(max)];
        const updated = await deps.zones.update(ctx.user, zoneId, {
          name: name ?? zone.name,
          description: zone.description,
          color: zone.color,
          min: low,
          max: high,
          sports: zone.values[0].sports as SPORT_TYPE[],
        });
        const value = updated.values[0];
        return {
          zoneId,
          type: updated.type,
          name: updated.name,
          min: isPace ? decimalToPace(value.min) : value.min,
          max: isPace ? decimalToPace(value.max) : value.max,
        };
      }),
  );
};
