import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@openathlete/database';
import {
  CHECK_FLAT_CLIMB,
  CHECK_LONG_RUN_SECONDS,
  CHECK_LOW_SHARE,
  CHECK_MIN_LONG_RUNS,
  CHECK_MIN_WEEK_DAYS,
  CHECK_WEEK_DAYS,
  CHECK_WINDOW_DAYS,
  FTP_MODEL_SPORTS,
  TrainingCheckDto,
  TrainingCheckHistoryDto,
  cardiacScores,
  cardiacSeries,
  compareModels,
  compareWindows,
  rangeSignal,
  recoveryStatus,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { RecordService } from './record.service';
import { StatisticsService } from './statistics.service';

const DAY_MS = 86_400_000;
/** A band of output read in passing says nothing */
const MIN_BAND_SECONDS = 60;
/** Power is the basis when nearly every run has it */
const POWER_SHARE = 0.8;
/** Width of the bands of activity_profile_bin: 10 W, half a km/h */
const POWER_BAND_W = 10;
const SPEED_BAND_MS = 0.5 / 3.6;
/** The course of the figures: half a year, week by week */
const HISTORY_WEEKS = 26;

interface BandRow {
  activityId: number;
  current: boolean;
  kind: 'FLAT_POWER' | 'FLAT_SPEED';
  band: number;
  seconds: number;
  heartrate: number;
}

/**
 * The training check of a runner: whether the last six weeks went better
 * than the six before. The method and its sources are in training-check.ts
 * of the shared library.
 */
@Injectable()
export class TrainingCheckService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly records: RecordService,
    private readonly statistics: StatisticsService,
  ) {}

  async getCheck(
    user: AuthUser,
    /** Absent: the athlete asking */
    asked: number | undefined,
    now = new Date(),
  ): Promise<TrainingCheckDto> {
    const athleteId = await this.readable(user, asked);

    const split = new Date(now.getTime() - CHECK_WINDOW_DAYS * DAY_MS);
    const from = new Date(split.getTime() - CHECK_WINDOW_DAYS * DAY_MS);
    // The runs of both windows, as the end of a query joining `a` and `e`
    const runs = Prisma.sql`
      JOIN event e ON e.event_id = a.event_id
      WHERE e.athlete_id = ${athleteId}
        AND e.type = 'ACTIVITY'
        AND e.start_date >= ${from}
        AND e.start_date <= ${now}
        AND a.sport::text IN (${Prisma.join([...FTP_MODEL_SPORTS.running])})`;

    const [bands, longRuns, modelNow, modelBefore] = await Promise.all([
      this.prisma.$queryRaw<BandRow[]>`
        SELECT a.event_activity_id AS "activityId",
          e.start_date >= ${split} AS current,
          p.kind::text AS kind, p.bin AS band,
          p.seconds::float8 AS seconds, p.value::float8 AS heartrate
        FROM activity_profile_bin p
        JOIN event_activity a ON a.event_activity_id = p.event_activity_id
        ${runs}
          AND p.kind IN ('FLAT_POWER', 'FLAT_SPEED')
          AND p.seconds >= ${MIN_BAND_SECONDS}`,
      // Long, steady and flat: on a mountain run, the drift mostly shows
      // the climb coming before the descent
      this.prisma.$queryRaw<{ current: boolean; drift: number }[]>`
        SELECT e.start_date >= ${split} AS current,
          a.decoupling_percent::float8 AS drift
        FROM event_activity a
        ${runs}
          AND a.decoupling_percent IS NOT NULL
          AND a.moving_time >= ${CHECK_LONG_RUN_SECONDS}
          AND a.elevation_gain <= ${CHECK_FLAT_CLIMB} * a.distance
          AND a.intensity_seconds[1] >= ${CHECK_LOW_SHARE} * (
            a.intensity_seconds[1] + a.intensity_seconds[2] + a.intensity_seconds[3])`,
      this.records.runningCriticalAt(athleteId, now),
      this.records.runningCriticalAt(athleteId, split),
    ]);

    const [recovery, design] = await Promise.all([
      this.recoveryOf(athleteId, now),
      this.designOf(user, athleteId, split, now),
    ]);

    return {
      from,
      split,
      to: now,
      recovery,
      design,
      fitness: fitnessOf(bands),
      speed: speedOf(modelNow, modelBefore),
      durability: compareWindows(
        longRuns.filter((run) => run.current).map((run) => run.drift),
        longRuns.filter((run) => !run.current).map((run) => run.drift),
        { higherIsBetter: false, minCount: CHECK_MIN_LONG_RUNS },
      ),
    };
  }
  /** The athlete asked for, or the one asking, once the user may read them */
  private async readable(user: AuthUser, asked: number | undefined) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId: asked ?? user.athlete?.athleteId ?? 0 },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }
    return athlete.athleteId;
  }

  /**
   * The figures behind the check over the last six months, to draw their
   * course: each run's heart rate against the usual one, the critical value
   * every two weeks, the drift of each long flat run, and week by week the
   * recovery measures and the training done.
   */
  async getHistory(
    user: AuthUser,
    asked: number | undefined,
    now = new Date(),
  ): Promise<TrainingCheckHistoryDto> {
    const athleteId = await this.readable(user, asked);
    const from = new Date(now.getTime() - HISTORY_WEEKS * 7 * DAY_MS);
    const day = (date: Date) => date.toISOString().slice(0, 10);
    const runs = Prisma.sql`
      JOIN event e ON e.event_id = a.event_id
      WHERE e.athlete_id = ${athleteId}
        AND e.type = 'ACTIVITY'
        AND e.start_date > ${from}
        AND e.start_date <= ${now}`;
    const running = Prisma.sql`AND a.sport::text IN (${Prisma.join([...FTP_MODEL_SPORTS.running])})`;
    // Weeks counted back from now: 0 is the last seven days
    const weekOf = (date: Date) =>
      Math.floor((now.getTime() - date.getTime()) / (7 * DAY_MS));
    const weekEnd = (week: number) =>
      day(new Date(now.getTime() - week * 7 * DAY_MS));
    const fortnights = Array.from(
      { length: HISTORY_WEEKS / 2 + 1 },
      (_, index) => new Date(now.getTime() - index * 14 * DAY_MS),
    ).reverse();

    const [bands, long, weeks, metrics, models] = await Promise.all([
      this.prisma.$queryRaw<(BandRow & { date: Date })[]>`
        SELECT a.event_activity_id AS "activityId", e.start_date AS date,
          true AS current, p.kind::text AS kind, p.bin AS band,
          p.seconds::float8 AS seconds, p.value::float8 AS heartrate
        FROM activity_profile_bin p
        JOIN event_activity a ON a.event_activity_id = p.event_activity_id
        ${runs} ${running}
          AND p.kind IN ('FLAT_POWER', 'FLAT_SPEED')
          AND p.seconds >= ${MIN_BAND_SECONDS}`,
      this.prisma.$queryRaw<{ date: Date; value: number }[]>`
        SELECT e.start_date AS date, a.decoupling_percent::float8 AS value
        FROM event_activity a
        ${runs} ${running}
          AND a.decoupling_percent IS NOT NULL
          AND a.moving_time >= ${CHECK_LONG_RUN_SECONDS}
          AND a.elevation_gain <= ${CHECK_FLAT_CLIMB} * a.distance
          AND a.intensity_seconds[1] >= ${CHECK_LOW_SHARE} * (
            a.intensity_seconds[1] + a.intensity_seconds[2] + a.intensity_seconds[3])
        ORDER BY e.start_date`,
      this.prisma.$queryRaw<
        {
          week: number;
          seconds: number;
          low: number | null;
          all: number | null;
        }[]
      >`
        SELECT floor(extract(epoch FROM (${now}::timestamp - e.start_date)) / ${7 * 86_400})::int AS week,
          sum(a.moving_time)::float8 AS seconds,
          sum(a.intensity_seconds[1])::float8 AS low,
          sum(a.intensity_seconds[1] + a.intensity_seconds[2] + a.intensity_seconds[3])::float8 AS "all"
        FROM event_activity a
        ${runs}
        GROUP BY 1`,
      this.prisma.athleteMetric.findMany({
        where: {
          athleteId,
          type: { in: ['HRV_LAST_NIGHT_AVG', 'RMSSD', 'HR_REST'] },
          value: { gt: 0 },
          date: { gt: from, lte: now },
        },
        select: { date: true, type: true, value: true },
      }),
      Promise.all(
        fortnights.map((date) =>
          this.records.runningCriticalAt(athleteId, date),
        ),
      ),
    ]);

    const basis = basisOf(bands);
    const { scores, referenceBand } = cardiacSeries(
      bands.filter((row) => row.kind === basis),
    );
    const dates = new Map(bands.map((row) => [row.activityId, row.date]));

    const of = (type: string) => metrics.filter((row) => row.type === type);
    const variability =
      of('HRV_LAST_NIGHT_AVG').length >= of('RMSSD').length
        ? of('HRV_LAST_NIGHT_AVG')
        : of('RMSSD');
    // A week's mean, on the logarithm for variability; null on few days
    const weekly = (rows: typeof metrics, week: number, log: boolean) => {
      const values = rows
        .filter((row) => weekOf(row.date) === week)
        .map((row) => (log ? Math.log(row.value) : row.value));
      if (values.length < CHECK_MIN_WEEK_DAYS) return null;
      const mean =
        values.reduce((sum, value) => sum + value, 0) / values.length;
      return log ? Math.exp(mean) : mean;
    };
    const training = new Map(weeks.map((row) => [row.week, row]));
    const weekNumbers = Array.from(
      { length: HISTORY_WEEKS },
      (_, index) => HISTORY_WEEKS - 1 - index,
    );

    return {
      from,
      to: now,
      fitness: {
        basis: basis === 'FLAT_POWER' ? 'POWER' : 'SPEED',
        reference: referenceOf(basis, referenceBand),
        runs: [...scores]
          .map(([activityId, value]) => ({
            date: dates.get(activityId)!,
            value,
          }))
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map(({ date, value }) => ({ date: day(date), value })),
      },
      speed: fortnights.map((date, index) => ({
        date: day(date),
        ...models[index],
      })),
      durability: long.map(({ date, value }) => ({ date: day(date), value })),
      recovery: weekNumbers.map((week) => ({
        date: weekEnd(week),
        variability: weekly(variability, week, true),
        restingHeartrate: weekly(of('HR_REST'), week, false),
      })),
      design: weekNumbers.map((week) => {
        const row = training.get(week);
        return {
          date: weekEnd(week),
          hours: (row?.seconds ?? 0) / 3600,
          easyShare: row?.all ? (row.low ?? 0) / row.all : null,
        };
      }),
    };
  }

  /**
   * The last week of heart rate variability and resting heart rate against
   * the six weeks before it. Variability from one source only: a night's
   * average and a morning reading are not interchangeable.
   */
  private async recoveryOf(
    athleteId: number,
    now: Date,
  ): Promise<TrainingCheckDto['recovery']> {
    const week = new Date(now.getTime() - CHECK_WEEK_DAYS * DAY_MS);
    const rows = await this.prisma.athleteMetric.findMany({
      where: {
        athleteId,
        type: { in: ['HRV_LAST_NIGHT_AVG', 'RMSSD', 'HR_REST'] },
        value: { gt: 0 },
        date: {
          gt: new Date(week.getTime() - CHECK_WINDOW_DAYS * DAY_MS),
          lte: now,
        },
      },
      select: { date: true, type: true, value: true },
    });
    const of = (type: string) => rows.filter((row) => row.type === type);
    const variability =
      of('HRV_LAST_NIGHT_AVG').length >= of('RMSSD').length
        ? of('HRV_LAST_NIGHT_AVG')
        : of('RMSSD');
    const signal = (measures: typeof rows, log: boolean) =>
      rangeSignal(
        measures.filter((row) => row.date > week).map((row) => row.value),
        measures.filter((row) => row.date <= week).map((row) => row.value),
        { log },
      );
    const signals = {
      variability: signal(variability, true),
      restingHeartrate: signal(of('HR_REST'), false),
    };
    return {
      status: recoveryStatus(signals.variability, signals.restingHeartrate),
      ...signals,
    };
  }

  /**
   * How the last six weeks were built, in facts: the weeks with training,
   * the share of easy time, and a run far beyond the longest of the month
   * before it, the one pattern a study links to injury. No verdict: there
   * is no evidence for a right share of easy time.
   */
  private async designOf(
    user: AuthUser,
    athleteId: number,
    split: Date,
    now: Date,
  ): Promise<TrainingCheckDto['design']> {
    const [[totals], { runs }] = await Promise.all([
      this.prisma.$queryRaw<
        { weeks: number; low: number | null; all: number | null }[]
      >`
        SELECT
          count(DISTINCT floor(extract(epoch FROM (${now}::timestamp - e.start_date)) / ${7 * 86_400}))::int AS weeks,
          sum(a.intensity_seconds[1])::float8 AS low,
          sum(a.intensity_seconds[1] + a.intensity_seconds[2] + a.intensity_seconds[3])::float8 AS "all"
        FROM event_activity a
        JOIN event e ON e.event_id = a.event_id
        WHERE e.athlete_id = ${athleteId}
          AND e.type = 'ACTIVITY'
          AND e.start_date > ${split}
          AND e.start_date <= ${now}`,
      this.statistics.getLongRuns(user, { athleteId, from: split, to: now }),
    ]);
    const [longRun] = runs;
    return {
      status: totals.weeks === 0 ? 'OPEN' : longRun ? 'NOTE' : 'FINE',
      weeks: totals.weeks,
      of: CHECK_WINDOW_DAYS / 7,
      easyShare: totals.all ? (totals.low ?? 0) / totals.all : null,
      longRun: longRun
        ? {
            date: longRun.date,
            distance: longRun.distance,
            longest: longRun.longest,
          }
        : null,
    };
  }
}

/**
 * Heart rate at the same output on flat ground. On running power when
 * nearly every run has it, else on grade-adjusted speed.
 */
function fitnessOf(bands: BandRow[]): TrainingCheckDto['fitness'] {
  const basis = basisOf(bands);
  const { current, previous, referenceBand } = cardiacScores(
    bands.filter((row) => row.kind === basis),
  );
  return {
    ...compareWindows(current, previous, { higherIsBetter: false }),
    basis: basis === 'FLAT_POWER' ? 'POWER' : 'SPEED',
    reference: referenceOf(basis, referenceBand),
  };
}

/** Running power when nearly every run has it, else grade-adjusted speed */
function basisOf(bands: BandRow[]): BandRow['kind'] {
  const runsWith = (kind: BandRow['kind']) =>
    new Set(
      bands.filter((row) => row.kind === kind).map((row) => row.activityId),
    ).size;
  const powered = runsWith('FLAT_POWER');
  return powered > 0 && powered >= POWER_SHARE * runsWith('FLAT_SPEED')
    ? 'FLAT_POWER'
    : 'FLAT_SPEED';
}

/** The middle of a band, in watts or metres a second */
function referenceOf(basis: BandRow['kind'], band: number | null) {
  return band === null
    ? null
    : (band + 0.5) * (basis === 'FLAT_POWER' ? POWER_BAND_W : SPEED_BAND_MS);
}

type Critical = { speed: number | null; power: number | null };

/** The same model on both dates: speed when it holds on both, else power */
function speedOf(now: Critical, before: Critical): TrainingCheckDto['speed'] {
  const kind =
    now.speed && before.speed
      ? 'speed'
      : now.power && before.power
        ? 'power'
        : null;
  if (!kind) {
    // What there is today, to show while the comparison is open
    const known = now.speed ? 'speed' : now.power ? 'power' : null;
    return {
      status: 'OPEN',
      kind: known,
      current: known ? now[known] : null,
      previous: null,
    };
  }
  return {
    status: compareModels(now[kind], before[kind]),
    kind,
    current: now[kind],
    previous: before[kind],
  };
}
