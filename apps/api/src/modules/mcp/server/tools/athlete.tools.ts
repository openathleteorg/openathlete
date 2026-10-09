import { z } from 'zod';

import { SportType, TrainingLoadCalculationType } from '@openathlete/database';
import { metricUnitMap } from '@openathlete/shared';

import {
  addDaysToDateKey,
  startOfZonedDay,
  zonedClock,
} from 'src/common/utils/time-zone';

import { athleteIdInput, run } from '../context';
import { daysBetween } from '../dates';
import { READ_ONLY, ToolRegistrar, registerTool } from './deps';

const round = (value: number, digits = 0) =>
  Math.round(value * 10 ** digits) / 10 ** digits;

/** Pace zones are stored in decimal minutes per km: 4.5 is 4:30 */
const decimalPace = (minutes: number) => {
  const seconds = Math.round(minutes * 60);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

const ALL_SPORTS = Object.values(SportType);
/** Sports only matter when they narrow a zone: most zones cover them all */
const narrowedSports = (sports: SportType[]) =>
  ALL_SPORTS.every((sport) => sports.includes(sport)) ? [] : sports;

const ZONE_UNITS = { HEARTRATE: 'bpm', POWER: 'W', PACE: 'min/km' } as const;

const contextOutput = z.object({
  athlete: z.object({
    athleteId: z.number(),
    name: z.string(),
    gender: z.string().optional(),
    timeZone: z.string(),
    today: z.string().describe("Today's date in the athlete's time zone"),
    weekday: z.string(),
    isYou: z.boolean(),
  }),
  access: z.object({
    scopes: z.array(z.string()),
    canWrite: z.boolean(),
  }),
  metrics: z
    .array(
      z.object({
        type: z.string(),
        value: z.number(),
        unit: z.string(),
        date: z.string(),
      }),
    )
    .describe('Latest value of each metric'),
  zones: z.array(
    z.object({
      zoneId: z.number().describe('Use as zoneId in workout targets'),
      type: z.enum(['HEARTRATE', 'POWER', 'PACE']),
      index: z.number(),
      name: z.string(),
      description: z.string().optional(),
      unit: z.string(),
      ranges: z.array(
        z.object({
          min: z.union([z.number(), z.string()]),
          max: z.union([z.number(), z.string()]),
          sports: z
            .array(z.string())
            .optional()
            .describe('Omitted: every sport'),
        }),
      ),
    }),
  ),
  form: z
    .object({
      fitness: z.number().describe('CTL, 42-day load average'),
      fatigue: z.number().describe('ATL, 7-day load average'),
      form: z.number().describe('TSB = fitness - fatigue'),
      status: z.string(),
      acuteChronicRatio: z.number().optional(),
      recommendedWeeklyLoad: z.object({ min: z.number(), max: z.number() }),
    })
    .optional(),
  last28Days: z.object({
    activities: z.number(),
    hours: z.number(),
    bySport: z.array(
      z.object({
        sport: z.string(),
        activities: z.number(),
        hours: z.number(),
        km: z.number(),
      }),
    ),
  }),
  upcomingRaces: z.array(
    z.object({
      eventId: z.number(),
      name: z.string(),
      date: z.string(),
      daysToGo: z.number(),
      sport: z.string(),
      priority: z.enum(['A', 'B', 'C']).optional(),
      distanceKm: z.number().optional(),
      goalMinutes: z.number().optional(),
    }),
  ),
  periods: z
    .array(
      z.object({
        periodId: z.number(),
        name: z.string(),
        kind: z.enum(['training', 'travel', 'illness', 'injury']),
        startDate: z.string(),
        endDate: z.string(),
        description: z.string().optional(),
      }),
    )
    .describe('Current and coming periods: blocks, and times without training'),
  injuries: z.array(
    z.object({
      location: z.string(),
      painScore: z.number().describe('0-10'),
      status: z.string(),
      reportedOn: z.string(),
      context: z.string(),
    }),
  ),
  devices: z.array(z.string()).describe('Connected device platforms'),
});

const listAthletesOutput = z.object({
  athletes: z.array(
    z.object({
      athleteId: z.number(),
      name: z.string(),
      isYou: z.boolean(),
    }),
  ),
});

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const registerAthleteTools: ToolRegistrar = (server, ctx, deps) => {
  registerTool(
    server,
    'get_athlete_context',
    {
      title: 'Athlete context',
      description:
        "Start here. Everything needed to plan for the athlete in one call: today's date and time zone, latest metrics (HR max and rest, VMA, FTP, weight...), training zones with their ids, current fitness, fatigue and form, the last 4 weeks of training, coming races, periods without training (travel, illness, injury) and reported injuries.",
      inputSchema: { athleteId: athleteIdInput },
      outputSchema: contextOutput,
      annotations: READ_ONLY,
    },
    ({ athleteId }) =>
      run(contextOutput, async () => {
        const scope = await ctx.athlete(athleteId);
        const id = scope.athleteId;
        const now = new Date();
        const todayStart = startOfZonedDay(scope.today, scope.timeZone);
        const since = startOfZonedDay(
          addDaysToDateKey(scope.today, -27),
          scope.timeZone,
        );

        const [
          profile,
          zones,
          latest,
          form,
          recent,
          races,
          periods,
          injuries,
          devices,
        ] = await Promise.all([
          deps.prisma.athlete.findUniqueOrThrow({
            where: { athleteId: id },
            select: { user: { select: { gender: true } } },
          }),
          deps.prisma.trainingZone.findMany({
            where: { athleteId: id },
            include: { values: true },
            orderBy: [{ type: 'asc' }, { index: 'asc' }],
          }),
          deps.metrics.getLatestMetrics(ctx.user, id),
          deps.load
            .getTrainingLoadMetrics(
              ctx.user,
              TrainingLoadCalculationType.TRIMP,
              now,
              id,
            )
            .catch(() => null),
          deps.prisma.eventActivity.findMany({
            where: { event: { athleteId: id, startDate: { gte: since } } },
            select: { sport: true, movingTime: true, distance: true },
          }),
          deps.prisma.event.findMany({
            where: {
              athleteId: id,
              type: 'COMPETITION',
              startDate: { gte: todayStart },
            },
            include: { competition: true },
            orderBy: { startDate: 'asc' },
            take: 10,
          }),
          deps.prisma.cycle.findMany({
            where: { athleteId: id, endDate: { gte: now } },
            orderBy: { startDate: 'asc' },
            take: 12,
          }),
          deps.prisma.athleteInjury.findMany({
            where: { athleteId: id, status: { not: 'RESOLVED' } },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }),
          deps.prisma.providerAccount.findMany({
            where: { athleteId: id, status: 'active' },
            select: { provider: true },
          }),
        ]);

        const bySport = new Map<
          string,
          { activities: number; seconds: number; meters: number }
        >();
        for (const activity of recent) {
          const entry = bySport.get(activity.sport) ?? {
            activities: 0,
            seconds: 0,
            meters: 0,
          };
          entry.activities += 1;
          entry.seconds += activity.movingTime;
          entry.meters += activity.distance;
          bySport.set(activity.sport, entry);
        }
        const localDay = (instant: Date) =>
          zonedClock(instant, scope.timeZone).date;

        return {
          athlete: {
            athleteId: id,
            name: scope.name,
            ...(profile.user.gender && { gender: profile.user.gender }),
            timeZone: scope.timeZone,
            today: scope.today,
            weekday: WEEKDAYS[new Date(`${scope.today}T12:00:00Z`).getUTCDay()],
            isYou: scope.isSelf,
          },
          access: { scopes: ctx.principal.scopes, canWrite: ctx.can('write') },
          metrics: Object.values(latest)
            .sort((a, b) => a.type.localeCompare(b.type))
            .map((metric) => ({
              type: metric.type,
              value: round(metric.value, 2),
              unit: metricUnitMap[metric.type] ?? '',
              date: localDay(metric.date),
            })),
          zones: zones.map((zone) => ({
            zoneId: zone.trainingZoneId,
            type: zone.type,
            index: zone.index,
            name: zone.name,
            ...(zone.description && { description: zone.description }),
            unit: ZONE_UNITS[zone.type],
            ranges: zone.values.map((value) => ({
              min: zone.type === 'PACE' ? decimalPace(value.min) : value.min,
              max: zone.type === 'PACE' ? decimalPace(value.max) : value.max,
              ...(narrowedSports(value.sports).length && {
                sports: value.sports,
              }),
            })),
          })),
          ...(form &&
            form.trainingDays > 0 && {
              form: {
                fitness: round(form.ctl, 1),
                fatigue: round(form.atl, 1),
                form: round(form.tsb, 1),
                status: form.status,
                ...(form.acwr !== null && {
                  acuteChronicRatio: round(form.acwr, 2),
                }),
                recommendedWeeklyLoad: {
                  min: round(form.recommendedLoadRange.min),
                  max: round(form.recommendedLoadRange.max),
                },
              },
            }),
          last28Days: {
            activities: recent.length,
            hours: round(
              recent.reduce((sum, activity) => sum + activity.movingTime, 0) /
                3600,
              1,
            ),
            bySport: [...bySport.entries()]
              .sort((a, b) => b[1].seconds - a[1].seconds)
              .map(([sport, entry]) => ({
                sport,
                activities: entry.activities,
                hours: round(entry.seconds / 3600, 1),
                km: round(entry.meters / 1000, 1),
              })),
          },
          upcomingRaces: races.map((race) => {
            const date = localDay(race.startDate);
            return {
              eventId: race.eventId,
              name: race.name,
              date,
              daysToGo: daysBetween(scope.today, date),
              sport: race.competition?.sport ?? 'OTHER',
              ...(race.competition?.priority && {
                priority: race.competition.priority,
              }),
              ...(race.competition?.goalDistance && {
                distanceKm: round(race.competition.goalDistance / 1000, 2),
              }),
              ...(race.competition?.goalDuration && {
                goalMinutes: round(race.competition.goalDuration / 60),
              }),
            };
          }),
          periods: periods.map((period) => ({
            periodId: period.cycleId,
            name: period.name,
            kind: period.kind.toLowerCase() as
              'training' | 'travel' | 'illness' | 'injury',
            startDate: localDay(period.startDate),
            endDate: localDay(period.endDate),
            ...(period.description && { description: period.description }),
          })),
          injuries: injuries.map((injury) => ({
            location: injury.location,
            painScore: injury.painScore,
            status: injury.status,
            reportedOn: localDay(injury.createdAt),
            context: injury.context,
          })),
          devices: [...new Set(devices.map((device) => device.provider))],
        };
      }),
  );

  registerTool(
    server,
    'list_athletes',
    {
      title: 'Athletes',
      description:
        'Athletes you can work on: yourself and, for coaches, the athletes you coach. Pass their athleteId to the other tools.',
      inputSchema: {},
      outputSchema: listAthletesOutput,
      annotations: READ_ONLY,
    },
    () =>
      run(listAthletesOutput, async () => {
        const athletes = await deps.prisma.athlete.findMany({
          where: { athleteId: { in: ctx.athleteIds } },
          select: {
            athleteId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        });
        const own = ctx.user.athlete?.athleteId;
        return {
          athletes: athletes
            .map((athlete) => ({
              athleteId: athlete.athleteId,
              name: `${athlete.user.firstName} ${athlete.user.lastName}`.trim(),
              isYou: athlete.athleteId === own,
            }))
            .sort(
              (a, b) =>
                Number(b.isYou) - Number(a.isYou) ||
                a.name.localeCompare(b.name),
            ),
        };
      }),
  );
};
