import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityProfileKind, Athlete, Prisma } from '@openathlete/database';
import {
  GetStatisticsOverviewQueryDto,
  GetStatisticsSectionQueryDto,
  GetStatisticsTrendsQueryDto,
  SPORT_GROUPS,
  SPORT_TYPE,
  SportGroup,
  StatisticsCardiacCostDto,
  StatisticsDaysDto,
  StatisticsDurabilityDto,
  StatisticsFiltersDto,
  StatisticsIntensityDto,
  StatisticsLoadDto,
  StatisticsLongRunsDto,
  StatisticsOverviewDto,
  StatisticsTerrainDto,
  StatisticsTotalsDto,
  StatisticsTrendsDto,
  StatisticsVolumeDto,
  statisticsGranularity,
} from '@openathlete/shared';

import { validTimeZone, zonedClock } from 'src/common/utils/time-zone';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { durabilityClasses } from '../helpers/durability';
import { statisticsBuckets } from '../helpers/statistics-buckets';
import {
  addUtcDays,
  advanceFitness,
  getUtcWeekStart,
  toUtcDateKey,
} from '../helpers/training-load';
import { TrainingLoadService } from './training-load.service';

/** Above this, the load chart shows weeks: days are too many to draw */
const LOAD_DAILY_MAX_DAYS = 400;

/** A steady outing lasts, and stays mostly below the first threshold */
const STEADY_MIN_SECONDS = 40 * 60;
const STEADY_LOW_SHARE = 0.8;

/** The lowest increase over the month's longest run the study links to injury */
const LONG_RUN_RATIO = 1.1;
const LONG_RUNS_SHOWN = 5;

/** Lower bounds of the zones an account starts with */
const DEFAULT_HR_ZONE_MINS = [0, 132, 143, 153, 164];

/** A band read in passing says nothing: it needs some time, on several days */
const MIN_BIN_SECONDS = 60;
const MIN_BIN_ACTIVITIES = 3;

/** How far planned sessions carry the form curve */
const PROJECTION_DAYS = 42;

const EMPTY_TOTALS: StatisticsTotalsDto = {
  movingTime: 0,
  distance: 0,
  elevationGain: 0,
  count: 0,
  load: 0,
};

/**
 * The statistics page reads each of its sections on its own. Every query
 * names its columns: an activity row also holds its recording, megabytes that
 * a sum has no use for.
 */
@Injectable()
export class StatisticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly trainingLoad: TrainingLoadService,
  ) {}

  /**
   * Checks the user may read this athlete. Asking CASL about 'Athlete' in
   * general would let anyone read any athlete's statistics by id.
   */
  private async assertCanRead(user: AuthUser, athleteId: number) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }
  }

  /** The athlete's time zone, once the user is allowed to read them. */
  private async readableTimeZone(user: AuthUser, athleteId: number) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId },
      include: { user: { select: { timeZone: true } } },
    });
    if (!athlete) throw new NotFoundException('Athlete not found');
    const ability = await this.abilities.getFor({ user });
    if (!ability.can('read', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }
    return validTimeZone(athlete.user.timeZone);
  }

  /** Restricts a query joined on `event_activity a` */
  private sportFilter(sport?: SPORT_TYPE, group?: SportGroup) {
    const sports = sport ? [sport] : group ? SPORT_GROUPS[group] : [];
    return sports.length
      ? Prisma.sql`AND a.sport::text IN (${Prisma.join([...sports])})`
      : Prisma.empty;
  }

  /** The activities of a period, as the end of a query on `event e` */
  private activitiesOf(
    athleteId: number,
    from: Date,
    to: Date,
    sport?: SPORT_TYPE,
    group?: SportGroup,
  ) {
    return Prisma.sql`
      FROM event e
      JOIN event_activity a ON a.event_id = e.event_id
      WHERE e.athlete_id = ${athleteId}
        AND e.type = 'ACTIVITY'
        AND e.start_date >= ${from}
        AND e.start_date <= ${to}
        ${this.sportFilter(sport, group)}`;
  }

  /** First day of an activity's bucket, on the athlete's calendar */
  private bucketOf(granularity: string, timeZone: string) {
    return Prisma.sql`date_trunc(${granularity}, e.start_date AT TIME ZONE 'UTC' AT TIME ZONE ${timeZone})::date::text`;
  }

  /** Sports and first activity of the athlete, to offer as filters. */
  async getFilters(
    user: AuthUser,
    athleteId: Athlete['athleteId'],
  ): Promise<StatisticsFiltersDto> {
    await this.assertCanRead(user, athleteId);
    const rows = await this.prisma.$queryRaw<
      { sport: SPORT_TYPE; first_activity: Date }[]
    >`
      SELECT a.sport, min(e.start_date) AS first_activity
      FROM event e
      JOIN event_activity a ON a.event_id = e.event_id
      WHERE e.athlete_id = ${athleteId} AND e.type = 'ACTIVITY'
      GROUP BY a.sport
      ORDER BY sum(a.moving_time) DESC`;
    return {
      firstActivityDate: rows.length
        ? new Date(Math.min(...rows.map((row) => row.first_activity.getTime())))
        : null,
      sports: rows.map((row) => row.sport),
    };
  }

  private async totalsBySport(
    athleteId: number,
    from: Date,
    to: Date,
    sport?: SPORT_TYPE,
    group?: SportGroup,
  ) {
    return this.prisma.$queryRaw<
      (StatisticsTotalsDto & { sport: SPORT_TYPE })[]
    >`
      SELECT a.sport,
        coalesce(sum(a.moving_time), 0)::float8 AS "movingTime",
        coalesce(sum(a.distance), 0)::float8 AS distance,
        coalesce(sum(a.elevation_gain), 0)::float8 AS "elevationGain",
        count(*)::int AS count,
        coalesce(sum((
          SELECT t.value
          FROM training_load_entry t
          JOIN training_load_calculation c
            ON c.training_load_calculation_id = t.calculation_id
          WHERE t.activity_id = a.event_activity_id AND c.type = 'TRIMP'
        )), 0)::float8 AS load
      ${this.activitiesOf(athleteId, from, to, sport, group)}
      GROUP BY a.sport
      ORDER BY "movingTime" DESC`;
  }

  private sumTotals(rows: StatisticsTotalsDto[]): StatisticsTotalsDto {
    return rows.reduce(
      (sum, row) => ({
        movingTime: sum.movingTime + row.movingTime,
        distance: sum.distance + row.distance,
        elevationGain: sum.elevationGain + row.elevationGain,
        count: sum.count + row.count,
        load: sum.load + row.load,
      }),
      EMPTY_TOTALS,
    );
  }

  async getOverview(
    user: AuthUser,
    query: GetStatisticsOverviewQueryDto,
  ): Promise<StatisticsOverviewDto> {
    const { athleteId, from, to, sport, group, compareFrom, compareTo } = query;
    await this.assertCanRead(user, athleteId);
    const [sports, compared] = await Promise.all([
      this.totalsBySport(athleteId, from, to, sport, group),
      compareFrom && compareTo
        ? this.totalsBySport(athleteId, compareFrom, compareTo, sport, group)
        : null,
    ]);
    return {
      totals: this.sumTotals(sports),
      compared: compared && this.sumTotals(compared),
      sports,
    };
  }

  /** Volume by sport, for every bucket of the period. */
  async getVolume(
    user: AuthUser,
    { athleteId, from, to, sport, group }: GetStatisticsSectionQueryDto,
    now = new Date(),
  ): Promise<StatisticsVolumeDto> {
    const timeZone = await this.readableTimeZone(user, athleteId);
    const granularity = statisticsGranularity(from, to);
    const rows = await this.prisma.$queryRaw<
      (StatisticsVolumeDto['buckets'][number]['sports'][number] & {
        period: string;
      })[]
    >`
      SELECT ${this.bucketOf(granularity, timeZone)} AS period, a.sport,
        sum(a.moving_time)::float8 AS "movingTime",
        sum(a.distance)::float8 AS distance,
        sum(a.elevation_gain)::float8 AS "elevationGain",
        count(*)::int AS count
      ${this.activitiesOf(athleteId, from, to, sport, group)}
      GROUP BY 1, 2
      ORDER BY 1, 3 DESC`;

    return {
      granularity,
      buckets: statisticsBuckets(
        zonedClock(from, timeZone).date,
        zonedClock(to, timeZone).date,
        granularity,
        zonedClock(now, timeZone).date,
      ).map((bucket) => ({
        ...bucket,
        sports: rows
          .filter((row) => row.period === bucket.period)
          .map(({ period: _period, ...sportVolume }) => sportVolume),
      })),
    };
  }

  /** Every active day of a period, for the calendar and the yearly totals. */
  async getDays(
    user: AuthUser,
    { athleteId, from, to, sport, group }: GetStatisticsSectionQueryDto,
  ): Promise<StatisticsDaysDto> {
    const timeZone = await this.readableTimeZone(user, athleteId);
    const days = await this.prisma.$queryRaw<StatisticsDaysDto['days']>`
      SELECT ${this.bucketOf('day', timeZone)} AS date,
        sum(a.moving_time)::float8 AS "movingTime",
        sum(a.distance)::float8 AS distance,
        sum(a.elevation_gain)::float8 AS "elevationGain",
        count(*)::int AS count
      ${this.activitiesOf(athleteId, from, to, sport, group)}
      GROUP BY 1
      ORDER BY 1`;
    return { days };
  }

  /**
   * Time in the three intensity domains, and how efficiency evolves on steady
   * outings: an interval session says nothing of aerobic drift.
   */
  async getIntensity(
    user: AuthUser,
    { athleteId, from, to, sport, group }: GetStatisticsSectionQueryDto,
    now = new Date(),
  ): Promise<StatisticsIntensityDto> {
    const timeZone = await this.readableTimeZone(user, athleteId);
    const granularity = statisticsGranularity(from, to);
    const steady = Prisma.sql`a.moving_time >= ${STEADY_MIN_SECONDS}
      AND a.intensity_seconds[1] >= ${STEADY_LOW_SHARE} * (
        a.intensity_seconds[1] + a.intensity_seconds[2] + a.intensity_seconds[3])`;
    const rows = await this.prisma.$queryRaw<
      (Omit<StatisticsIntensityDto['buckets'][number], 'partial'> & {
        period: string;
      })[]
    >`
      SELECT ${this.bucketOf(granularity, timeZone)} AS period,
        coalesce(sum(a.intensity_seconds[1]), 0)::float8 AS low,
        coalesce(sum(a.intensity_seconds[2]), 0)::float8 AS middle,
        coalesce(sum(a.intensity_seconds[3]), 0)::float8 AS high,
        count(*) FILTER (WHERE ${steady} AND a.efficiency_factor IS NOT NULL)::int AS "steadyCount",
        (avg(a.efficiency_factor) FILTER (WHERE ${steady}))::float8 AS efficiency,
        (avg(a.decoupling_percent) FILTER (WHERE ${steady}))::float8 AS decoupling
      ${this.activitiesOf(athleteId, from, to, sport, group)}
      GROUP BY 1`;

    const zones = await this.prisma.trainingZoneValue.findMany({
      where: { trainingZone: { athleteId, type: 'HEARTRATE' } },
      select: { min: true },
      orderBy: { min: 'asc' },
    });

    const byPeriod = new Map(rows.map((row) => [row.period, row]));
    return {
      granularity,
      defaultZones:
        zones.map(({ min }) => min).join() === DEFAULT_HR_ZONE_MINS.join(),
      buckets: statisticsBuckets(
        zonedClock(from, timeZone).date,
        zonedClock(to, timeZone).date,
        granularity,
        zonedClock(now, timeZone).date,
      ).map((bucket) => ({
        low: 0,
        middle: 0,
        high: 0,
        steadyCount: 0,
        efficiency: null,
        decoupling: null,
        ...byPeriod.get(bucket.period),
        ...bucket,
      })),
    };
  }

  /**
   * Runs much longer than the longest of the month before. The association
   * with injury was seen on single runs, in running only (Frandsen 2025).
   */
  async getLongRuns(
    user: AuthUser,
    { athleteId, from, to }: GetStatisticsSectionQueryDto,
  ): Promise<StatisticsLongRunsDto> {
    const timeZone = await this.readableTimeZone(user, athleteId);
    const runs = await this.prisma.$queryRaw<StatisticsLongRunsDto['runs']>`
      SELECT * FROM (
        SELECT e.event_id AS "eventId", e.name, e.start_date,
          ${this.bucketOf('day', timeZone)} AS date,
          a.distance,
          max(a.distance) OVER (
            ORDER BY e.start_date
            RANGE BETWEEN INTERVAL '30 days' PRECEDING
              AND INTERVAL '1 millisecond' PRECEDING
          ) AS longest
        FROM event e
        JOIN event_activity a ON a.event_id = e.event_id
        WHERE e.athlete_id = ${athleteId}
          AND e.type = 'ACTIVITY'
          AND a.sport IN ('RUNNING', 'TRAIL_RUNNING')
          AND e.start_date <= ${to}
      ) run
      WHERE run.start_date >= ${from}
        AND run.distance > run.longest * ${LONG_RUN_RATIO}
      ORDER BY run.start_date DESC
      LIMIT ${LONG_RUNS_SHOWN}`;
    return {
      runs: runs.map(({ eventId, name, date, distance, longest }) => ({
        eventId,
        name,
        date,
        distance,
        longest,
      })),
    };
  }

  /** Medians across activities of one kind of profile bin */
  private profileQuantiles(
    kind: ActivityProfileKind,
    { athleteId, from, to, sport }: GetStatisticsTrendsQueryDto,
    scale = 1,
  ) {
    return this.prisma.$queryRaw<
      {
        bin: number;
        low: number;
        median: number;
        high: number;
        count: number;
      }[]
    >`
      SELECT p.bin * ${scale}::float8 AS bin,
        percentile_cont(0.25) WITHIN GROUP (ORDER BY p.value)::float8 AS low,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY p.value)::float8 AS median,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY p.value)::float8 AS high,
        count(*)::int AS count
      FROM activity_profile_bin p
      JOIN event_activity a ON a.event_activity_id = p.event_activity_id
      JOIN event e ON e.event_id = a.event_id
      WHERE p.kind = ${kind}::activity_profile_kind
        AND p.seconds >= ${MIN_BIN_SECONDS}
        AND e.athlete_id = ${athleteId}
        AND e.type = 'ACTIVITY'
        AND e.start_date >= ${from}
        AND e.start_date <= ${to}
        AND a.sport = ${sport}::sport_type
      GROUP BY p.bin
      HAVING count(*) >= ${MIN_BIN_ACTIVITIES}
      ORDER BY p.bin`;
  }

  /** Vertical speed by slope, and where the metres were climbed. */
  async getTerrain(
    user: AuthUser,
    query: GetStatisticsTrendsQueryDto,
  ): Promise<StatisticsTerrainDto> {
    const { athleteId, from, to, sport } = query;
    await this.assertCanRead(user, athleteId);
    const [bins, classes] = await Promise.all([
      this.profileQuantiles('GRADE', query),
      this.prisma.$queryRaw<StatisticsTerrainDto['classes']>`
        SELECT least(abs(p.bin) / 5, 4)::int * 5 AS "from",
          coalesce(sum(p.value * p.seconds / 3600) FILTER (WHERE p.bin > 0), 0)::float8 AS climbed,
          coalesce(sum(p.value * p.seconds / 3600) FILTER (WHERE p.bin < 0), 0)::float8 AS descended
        FROM activity_profile_bin p
        JOIN event_activity a ON a.event_activity_id = p.event_activity_id
        JOIN event e ON e.event_id = a.event_id
        WHERE p.kind = 'GRADE'
          AND e.athlete_id = ${athleteId}
          AND e.type = 'ACTIVITY'
          AND e.start_date >= ${from}
          AND e.start_date <= ${to}
          AND a.sport = ${sport}::sport_type
        GROUP BY 1
        ORDER BY 1`,
    ]);
    return { bins, classes };
  }

  /** Heart rate at each speed or power: lower at the same output is fitter. */
  async getCardiacCost(
    user: AuthUser,
    query: GetStatisticsTrendsQueryDto,
  ): Promise<StatisticsCardiacCostDto> {
    await this.assertCanRead(user, query.athleteId);
    const [speed, power] = await Promise.all([
      this.profileQuantiles('SPEED', query, 0.5),
      this.profileQuantiles('POWER', query, 10),
    ]);
    return power.length >= speed.length
      ? { unit: 'power', bins: power }
      : { unit: 'speed', bins: speed };
  }

  /** How efforts hold over time, by the length of the outing. */
  async getDurability(
    user: AuthUser,
    { athleteId, from, to, sport }: GetStatisticsTrendsQueryDto,
  ): Promise<StatisticsDurabilityDto> {
    await this.assertCanRead(user, athleteId);
    const rows = await this.prisma.$queryRaw<
      {
        kind: StatisticsDurabilityDto['outings'][number]['kind'];
        hours: number;
        percent: number;
      }[]
    >`
      SELECT p.kind::text AS kind, (p.seconds / 3600)::float8 AS hours,
        p.value::float8 AS percent
      FROM activity_profile_bin p
      JOIN event_activity a ON a.event_activity_id = p.event_activity_id
      JOIN event e ON e.event_id = a.event_id
      WHERE p.kind IN ('DRIFT_PACE', 'DRIFT_POWER', 'DRIFT_HEARTRATE')
        AND e.athlete_id = ${athleteId}
        AND e.type = 'ACTIVITY'
        AND e.start_date >= ${from}
        AND e.start_date <= ${to}
        AND a.sport = ${sport}::sport_type`;
    return durabilityClasses(rows);
  }

  /** How the averages of a sport evolve, bucket by bucket. */
  async getTrends(
    user: AuthUser,
    { athleteId, from, to, sport }: GetStatisticsTrendsQueryDto,
    now = new Date(),
  ): Promise<StatisticsTrendsDto> {
    const timeZone = await this.readableTimeZone(user, athleteId);
    const granularity = statisticsGranularity(from, to);
    // Each figure over the time of the activities that have it
    const timeWeighted = (column: Prisma.Sql) => Prisma.sql`
      sum(${column} * a.moving_time) / nullif(
        sum(a.moving_time) FILTER (WHERE ${column} IS NOT NULL), 0)`;
    const rows = await this.prisma.$queryRaw<
      (Omit<StatisticsTrendsDto['buckets'][number], 'partial'> & {
        period: string;
      })[]
    >`
      SELECT ${this.bucketOf(granularity, timeZone)} AS period,
        count(*)::int AS count,
        (sum(a.distance) / count(*))::float8 AS "distancePerActivity",
        (sum(a.elevation_gain) / count(*))::float8 AS "elevationPerActivity",
        (sum(a.distance) / nullif(sum(a.moving_time), 0))::float8 AS "averageSpeed",
        (${timeWeighted(Prisma.sql`a.average_gap_speed`)})::float8 AS "averageGapSpeed",
        (${timeWeighted(Prisma.sql`a.average_heartrate`)})::float8 AS "averageHeartrate",
        (${timeWeighted(Prisma.sql`a.average_cadence`)})::float8 AS "averageCadence",
        (${timeWeighted(Prisma.sql`a.average_watts`)})::float8 AS "averageWatts",
        (${timeWeighted(Prisma.sql`a.weighted_average_watts`)})::float8 AS "weightedWatts",
        (sum(a.elevation_gain) * 3600 / nullif(sum(a.moving_time), 0))::float8 AS "verticalSpeed"
      ${this.activitiesOf(athleteId, from, to, sport)}
      GROUP BY 1`;

    const byPeriod = new Map(rows.map((row) => [row.period, row]));
    return {
      granularity,
      buckets: statisticsBuckets(
        zonedClock(from, timeZone).date,
        zonedClock(to, timeZone).date,
        granularity,
        zonedClock(now, timeZone).date,
      ).map((bucket) => ({
        count: 0,
        distancePerActivity: null,
        elevationPerActivity: null,
        averageSpeed: null,
        averageGapSpeed: null,
        averageHeartrate: null,
        averageCadence: null,
        averageWatts: null,
        weightedWatts: null,
        verticalSpeed: null,
        ...byPeriod.get(bucket.period),
        ...bucket,
      })),
    };
  }

  /**
   * Load and form, by day or by week on long periods. Fitness runs from the
   * first activity, of the sport when one is asked for. Without a sport, the
   * planned sessions carry the curve on past today.
   */
  async getLoad(
    user: AuthUser,
    { athleteId, from, to, sport, group }: GetStatisticsSectionQueryDto,
    now = new Date(),
  ): Promise<StatisticsLoadDto> {
    await this.assertCanRead(user, athleteId);
    const sportFilter = this.sportFilter(sport, group);
    // Planned sessions have no load by sport: the curve then stops today
    const allSports = !sport && !group;
    const [loads, races, first] = await Promise.all([
      this.prisma.$queryRaw<{ date: string; type: string; value: number }[]>`
        SELECT t.date::text AS date, c.type::text AS type,
          sum(t.value)::float8 AS value
        FROM training_load_entry t
        JOIN training_load_calculation c
          ON c.training_load_calculation_id = t.calculation_id
        JOIN event_activity a ON a.event_activity_id = t.activity_id
        WHERE c.athlete_id = ${athleteId} AND t.date <= ${to} ${sportFilter}
        GROUP BY 1, 2`,
      this.prisma.$queryRaw<{ date: string }[]>`
        SELECT DISTINCT (e.start_date::date)::text AS date
        ${this.activitiesOf(athleteId, from, to, sport, group)}
          AND a.is_race`,
      this.prisma.$queryRaw<{ first: string | null }[]>`
        SELECT min(t.date)::text AS first
        FROM training_load_entry t
        JOIN training_load_calculation c
          ON c.training_load_calculation_id = t.calculation_id
        JOIN event_activity a ON a.event_activity_id = t.activity_id
        WHERE c.athlete_id = ${athleteId} AND c.type = 'TRIMP' ${sportFilter}`,
    ]);

    const trimp = new Map<string, number>();
    const sessionRpe = new Map<string, number>();
    for (const { date, type, value } of loads) {
      (type === 'TRIMP' ? trimp : sessionRpe).set(date, value);
    }
    const firstDay = first[0]?.first ?? null;
    const lastDay = toUtcDateKey(to);
    const fromDay = toUtcDateKey(from);
    const today = toUtcDateKey(now);
    const projection =
      !allSports || lastDay < today
        ? []
        : await this.trainingLoad.getDailyForm(
            user,
            new Date(`${today}T00:00:00Z`),
            addUtcDays(new Date(`${today}T00:00:00Z`), PROJECTION_DAYS),
            athleteId,
            false,
          );

    const round = (value: number) => Math.round(value * 10) / 10;
    const days: StatisticsLoadDto['points'] = [];
    if (firstDay || projection.length) {
      let fitness = { ctl: 0, atl: 0 };
      const start = new Date(
        `${[firstDay, fromDay].filter(Boolean).sort()[0]}T00:00:00Z`,
      );
      for (
        let date = start;
        toUtcDateKey(date) <= lastDay && toUtcDateKey(date) < today;
        date = addUtcDays(date, 1)
      ) {
        const key = toUtcDateKey(date);
        const load = trimp.get(key) ?? 0;
        fitness = advanceFitness(fitness, load);
        if (key >= fromDay) {
          days.push({
            date: key,
            load: round(load),
            sessionRpe: Math.round(sessionRpe.get(key) ?? 0),
            ctl: round(fitness.ctl),
            atl: round(fitness.atl),
            tsb: round(fitness.ctl - fitness.atl),
            projected: false,
          });
        }
      }
      if (lastDay >= today && allSports) {
        for (const day of projection) {
          days.push({
            date: day.date,
            load: day.load,
            sessionRpe: Math.round(sessionRpe.get(day.date) ?? 0),
            ctl: day.ctl,
            atl: day.atl,
            tsb: day.tsb,
            projected: day.projected,
          });
        }
      } else if (lastDay >= today) {
        const load = trimp.get(today) ?? 0;
        fitness = advanceFitness(fitness, load);
        days.push({
          date: today,
          load: round(load),
          sessionRpe: Math.round(sessionRpe.get(today) ?? 0),
          ctl: round(fitness.ctl),
          atl: round(fitness.atl),
          tsb: round(fitness.ctl - fitness.atl),
          projected: false,
        });
      }
    }

    const span = (to.getTime() - from.getTime()) / (24 * 3600 * 1000);
    const granularity = span <= LOAD_DAILY_MAX_DAYS ? 'day' : 'week';
    const points = granularity === 'day' ? days : this.loadWeeks(days);
    const last = days.at(-1)?.date ?? lastDay;
    return {
      granularity,
      points,
      monotony: this.monotony(days.filter(({ projected }) => !projected)),
      races: races.map(({ date }) => date),
      historyDays: firstDay
        ? Math.round(
            (Date.parse(`${last}T00:00:00Z`) -
              Date.parse(`${firstDay}T00:00:00Z`)) /
              (24 * 3600 * 1000),
          )
        : 0,
    };
  }

  /** Mean daily load of the last week over its spread (Foster 1998) */
  private monotony(days: StatisticsLoadDto['points']): number | null {
    const loads = days.slice(-7).map(({ load }) => load);
    if (loads.length < 7) return null;
    const mean = loads.reduce((sum, load) => sum + load, 0) / 7;
    const variance =
      loads.reduce((sum, load) => sum + (load - mean) ** 2, 0) / 7;
    return variance > 0
      ? Math.round((mean / Math.sqrt(variance)) * 100) / 100
      : null;
  }

  /** Weeks of load: their total, and their form on their last day */
  private loadWeeks(days: StatisticsLoadDto['points']) {
    const weeks = new Map<string, StatisticsLoadDto['points'][number]>();
    for (const day of days) {
      const date = toUtcDateKey(
        getUtcWeekStart(new Date(`${day.date}T00:00:00Z`)),
      );
      const week = weeks.get(date);
      weeks.set(date, {
        ...day,
        date,
        load: Math.round(((week?.load ?? 0) + day.load) * 10) / 10,
        sessionRpe: (week?.sessionRpe ?? 0) + day.sessionRpe,
      });
    }
    return [...weeks.values()];
  }
}
