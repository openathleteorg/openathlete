import { z } from 'zod';

import {
  MetricType,
  SportType,
  TrainingLoadCalculationType,
} from '@openathlete/database';
import { metricUnitMap } from '@openathlete/shared';

import { addDaysToDateKey, zonedClock } from 'src/common/utils/time-zone';

import { ToolError, athleteIdInput, run } from '../context';
import { daysBetween, localDate, localRange } from '../dates';
import { READ_ONLY, ToolRegistrar, registerTool } from './deps';

const round = (value: number, digits = 0) =>
  Math.round(value * 10 ** digits) / 10 ** digits;

/** UTC midnight of a local date: training load is bucketed in UTC days */
const utcDay = (date: string) => new Date(`${date}T00:00:00Z`);
const dateKey = (instant: Date) => instant.toISOString().slice(0, 10);

const weekSchema = z.object({
  weekStart: z.string().describe('Monday'),
  doneLoad: z.number().describe('Load of the activities done'),
  plannedLoad: z.number().describe('Load of every session planned that week'),
  remainingLoad: z.number().describe('Planned load still to do, from today'),
  fitness: z.number().optional().describe('CTL at the end of the week'),
  fatigue: z.number().optional().describe('ATL at the end of the week'),
  form: z.number().optional().describe('TSB at the end of the week'),
  projected: z
    .boolean()
    .optional()
    .describe('Not over yet: its form assumes the remaining sessions are done'),
  recommendedLoad: z.object({ min: z.number(), max: z.number() }),
  acuteChronicRatio: z.number().optional(),
  injuryRisk: z.string().optional(),
});

const trainingLoadOutput = z.object({
  athleteId: z.number(),
  today: z.string(),
  explanation: z.string(),
  weeks: z.array(weekSchema),
  days: z
    .array(
      z.object({
        date: z.string(),
        load: z.number(),
        fitness: z.number(),
        fatigue: z.number(),
        form: z.number(),
      }),
    )
    .optional(),
});

const metricsOutput = z.object({
  athleteId: z.number(),
  series: z.array(
    z.object({
      type: z.string(),
      unit: z.string(),
      values: z.array(
        z.object({
          date: z.string(),
          value: z.number(),
          notes: z.string().optional(),
        }),
      ),
    }),
  ),
});

const recordsOutput = z.object({
  athleteId: z.number(),
  sportsWithRecords: z.array(z.string()),
  records: z.array(
    z.object({
      type: z.string(),
      distanceKm: z.number().optional(),
      durationSeconds: z.number().optional(),
      value: z.number(),
      unit: z.string(),
      display: z.string().optional(),
      date: z.string(),
      activityEventId: z.number().optional(),
      activityName: z.string().optional(),
    }),
  ),
});

const volumeOutput = z.object({
  athleteId: z.number(),
  weeks: z.array(
    z.object({
      weekStart: z.string(),
      hours: z.number(),
      activities: z.number(),
      bySport: z.array(
        z.object({
          sport: z.string(),
          activities: z.number(),
          hours: z.number(),
          km: z.number(),
          elevationGainM: z.number(),
        }),
      ),
    }),
  ),
});

function formatSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = Math.round(seconds % 60);
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${minutes}:${pad(rest)}`;
}

/** Monday of the week of a date, both YYYY-MM-DD */
function mondayOf(date: string) {
  const weekday = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
  return addDaysToDateKey(date, -weekday);
}

export const registerLoadTools: ToolRegistrar = (server, ctx, deps) => {
  registerTool(
    server,
    'get_training_load',
    {
      title: 'Training load and form',
      description:
        'Weekly training load (TRIMP), done and planned, with fitness (CTL), fatigue (ATL) and form (TSB) at the end of each week, projected forward over the planned sessions, and the recommended weekly load. Optionally day by day. Use it to set progressive weekly loads and to check the form on race day.',
      inputSchema: {
        athleteId: athleteIdInput,
        from: localDate.optional().describe('First day; default 12 weeks ago'),
        to: localDate.optional().describe('Last day; default 4 weeks ahead'),
        daily: z
          .boolean()
          .default(false)
          .describe('Also the day-by-day values (at most 120 days)'),
      },
      outputSchema: trainingLoadOutput,
      annotations: READ_ONLY,
    },
    ({ athleteId, from, to, daily }) =>
      run(trainingLoadOutput, async () => {
        const scope = await ctx.athlete(athleteId);
        const first = from ?? addDaysToDateKey(scope.today, -84);
        const last = to ?? addDaysToDateKey(scope.today, 28);
        const span = daysBetween(first, last) + 1;
        if (span < 1)
          throw new ToolError('The end date is before the start date.');
        if (span > 400) throw new ToolError('At most 400 days at a time.');
        if (daily && span > 120) {
          throw new ToolError(
            'Day by day, at most 120 days: narrow the range.',
          );
        }

        const [weeks, days] = await Promise.all([
          deps.load.getWeeklyTrimpSummary(
            ctx.user,
            utcDay(first),
            utcDay(last),
            scope.athleteId,
          ),
          daily
            ? deps.load.getTrainingLoadHistory(
                ctx.user,
                TrainingLoadCalculationType.TRIMP,
                utcDay(first),
                utcDay(last < scope.today ? last : scope.today),
                scope.athleteId,
              )
            : Promise.resolve(null),
        ]);

        return {
          athleteId: scope.athleteId,
          today: scope.today,
          explanation:
            'Load is TRIMP: heart rate based for activities, estimated from duration and effort for planned sessions. Form (TSB): below -10 heavy fatigue (overreaching), -10 to +25 balanced, above +25 losing fitness; aim for +5 to +15 on race day, after a taper. Raise the weekly load by 5-10% at most, with a lighter week every 3 or 4 weeks.',
          weeks: weeks.map((week) => ({
            weekStart: dateKey(week.weekStart),
            doneLoad: round(week.actualLoad),
            plannedLoad: round(week.plannedLoad),
            remainingLoad: round(week.estimatedLoad),
            ...(week.ctl !== undefined && { fitness: round(week.ctl, 1) }),
            ...(week.atl !== undefined && { fatigue: round(week.atl, 1) }),
            ...(week.tsb !== undefined && { form: round(week.tsb, 1) }),
            ...(week.formProjected && { projected: true }),
            recommendedLoad: {
              min: round(week.recommendedMin),
              max: round(week.recommendedMax),
            },
            ...(week.acwr !== undefined && {
              acuteChronicRatio: round(week.acwr, 2),
            }),
            ...(week.acwrStatus && { injuryRisk: week.acwrStatus }),
          })),
          ...(days && {
            days: days.map((day) => ({
              date: dateKey(day.date),
              load: round(day.load),
              fitness: round(day.ctl, 1),
              fatigue: round(day.atl, 1),
              form: round(day.tsb, 1),
            })),
          }),
        };
      }),
  );

  registerTool(
    server,
    'get_training_volume',
    {
      title: 'Training volume',
      description:
        'Hours, distance, elevation and number of activities per week and sport between two dates (at most a year). Use it to see how much the athlete really trains before planning more.',
      inputSchema: {
        athleteId: athleteIdInput,
        from: localDate,
        to: localDate,
      },
      outputSchema: volumeOutput,
      annotations: READ_ONLY,
    },
    ({ athleteId, from, to }) =>
      run(volumeOutput, async () => {
        const scope = await ctx.athlete(athleteId);
        const { start, end } = localRange(from, to, scope.timeZone, 366);
        const activities = await deps.prisma.eventActivity.findMany({
          where: {
            event: {
              athleteId: scope.athleteId,
              startDate: { gte: start, lte: end },
            },
          },
          select: {
            sport: true,
            movingTime: true,
            distance: true,
            elevationGain: true,
            event: { select: { startDate: true } },
          },
        });

        type Totals = {
          activities: number;
          seconds: number;
          meters: number;
          elevation: number;
        };
        const empty = (): Totals => ({
          activities: 0,
          seconds: 0,
          meters: 0,
          elevation: 0,
        });
        const weeks = new Map<string, Map<string, Totals>>();
        // Every week of the range, also those without activities
        for (
          let monday = mondayOf(from);
          monday <= to;
          monday = addDaysToDateKey(monday, 7)
        ) {
          weeks.set(monday, new Map());
        }
        for (const activity of activities) {
          const monday = mondayOf(
            zonedClock(activity.event.startDate, scope.timeZone).date,
          );
          const sports = weeks.get(monday) ?? new Map<string, Totals>();
          weeks.set(monday, sports);
          const totals = sports.get(activity.sport) ?? empty();
          totals.activities += 1;
          totals.seconds += activity.movingTime;
          totals.meters += activity.distance;
          totals.elevation += activity.elevationGain;
          sports.set(activity.sport, totals);
        }

        return {
          athleteId: scope.athleteId,
          weeks: [...weeks.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([weekStart, sports]) => {
              const all = [...sports.values()];
              return {
                weekStart,
                hours: round(
                  all.reduce((sum, t) => sum + t.seconds, 0) / 3600,
                  1,
                ),
                activities: all.reduce((sum, t) => sum + t.activities, 0),
                bySport: [...sports.entries()]
                  .sort((a, b) => b[1].seconds - a[1].seconds)
                  .map(([sport, totals]) => ({
                    sport,
                    activities: totals.activities,
                    hours: round(totals.seconds / 3600, 1),
                    km: round(totals.meters / 1000, 1),
                    elevationGainM: round(totals.elevation),
                  })),
              };
            }),
        };
      }),
  );

  registerTool(
    server,
    'get_metrics',
    {
      title: 'Metric history',
      description:
        'History of health and performance metrics: weight, resting HR, HRV, sleep, VMA, FTP, VO2max... Use it to spot trends such as a rising resting heart rate or falling HRV (fatigue, illness).',
      inputSchema: {
        athleteId: athleteIdInput,
        types: z
          .array(z.nativeEnum(MetricType))
          .min(1)
          .max(10)
          .describe(
            'Metrics to read; get_athlete_context lists those recorded',
          ),
        from: localDate.optional().describe('Default: 90 days ago'),
        to: localDate.optional().describe('Default: today'),
      },
      outputSchema: metricsOutput,
      annotations: READ_ONLY,
    },
    ({ athleteId, types, from, to }) =>
      run(metricsOutput, async () => {
        const scope = await ctx.athlete(athleteId);
        const { start, end } = localRange(
          from ?? addDaysToDateKey(scope.today, -90),
          to ?? scope.today,
          scope.timeZone,
          3 * 366,
        );
        const values = await deps.prisma.athleteMetric.findMany({
          where: {
            athleteId: scope.athleteId,
            type: { in: types },
            date: { gte: start, lte: end },
          },
          orderBy: { date: 'asc' },
          take: 3000,
        });
        return {
          athleteId: scope.athleteId,
          series: types.map((type) => ({
            type,
            unit: metricUnitMap[type] ?? '',
            values: values
              .filter((value) => value.type === type)
              .map((value) => ({
                // Stored by date, without a time
                date: value.date.toISOString().slice(0, 10),
                value: round(value.value, 2),
                ...(value.notes && { notes: value.notes }),
              })),
          })),
        };
      }),
  );

  registerTool(
    server,
    'get_records',
    {
      title: 'Personal records',
      description:
        'Best efforts of one sport: best times over distances (5 km, 10 km, half marathon...) and best heart rate or power over durations. Use them to set realistic paces and race goals.',
      inputSchema: {
        athleteId: athleteIdInput,
        sport: z
          .nativeEnum(SportType)
          .optional()
          .describe('Default: the sport with the most records'),
        since: localDate
          .optional()
          .describe('Only records set since this date'),
      },
      outputSchema: recordsOutput,
      annotations: READ_ONLY,
    },
    ({ athleteId, sport, since }) =>
      run(recordsOutput, async () => {
        const scope = await ctx.athlete(athleteId);
        const sports = await deps.records.getRecordSports(
          ctx.user,
          scope.athleteId,
        );
        const chosen = sport ?? sports[0];
        const records = chosen
          ? await deps.records.getRecords(ctx.user, {
              sport: chosen,
              athleteId: scope.athleteId,
              ...(since && { from: utcDay(since) }),
            })
          : [];
        const UNITS: Record<string, string> = {
          SPEED: 's',
          HEARTRATE: 'bpm',
          POWER: 'W',
          CADENCE: 'rpm',
          ELEVATION_GAIN: 'm',
          ELEVATION_LOSS: 'm',
        };
        return {
          athleteId: scope.athleteId,
          sportsWithRecords: sports,
          records: records
            .sort(
              (a, b) =>
                a.type.localeCompare(b.type) ||
                (a.distance ?? 0) - (b.distance ?? 0) ||
                (a.duration ?? 0) - (b.duration ?? 0),
            )
            .map((record) => ({
              type:
                record.type === 'SPEED'
                  ? 'best_time'
                  : `best_${record.type.toLowerCase()}`,
              ...(record.distance && {
                distanceKm: round(record.distance / 1000, 3),
              }),
              ...(record.duration && { durationSeconds: record.duration }),
              value: round(record.value, 1),
              unit: UNITS[record.type] ?? '',
              ...(record.type === 'SPEED' && {
                display: formatSeconds(record.value),
              }),
              date: zonedClock(new Date(record.date), scope.timeZone).date,
              ...(record.eventId && { activityEventId: record.eventId }),
              ...(record.activityName && { activityName: record.activityName }),
            })),
        };
      }),
  );
};
