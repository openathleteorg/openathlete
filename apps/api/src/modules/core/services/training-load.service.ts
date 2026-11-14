import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  Athlete,
  MetricType,
  TrainingLoadCalculationType,
} from '@openathlete/database';
import {
  CALENDAR_WELLNESS_METRICS,
  CalendarDayForm,
  CalendarWeekLoadSummary,
  CalendarWellnessMetric,
  CompressedActivityStream,
} from '@openathlete/shared';

import {
  CURRENT_LOAD_ANCHORING,
  LOAD_SLOPE_CLAMP,
  RECOMMENDATION_ADJUSTMENTS,
  RECOMMENDATION_BASE_RATIOS,
  TSB_DETRAINING_THRESHOLD,
  TSB_OVERREACHING_THRESHOLD,
} from 'src/common/constants/training-formulas.constants';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { uncompressActivityStream } from '../helpers/activity-stream';
import {
  HeartRateProfile,
  addUtcDays,
  advanceFitness,
  calculateTrimpFromAverage,
  calculateTrimpFromStream,
  estimatePlannedSessionTrimp,
  getHeartRateProfile,
  getUtcWeekStart,
  startOfUtcDay,
  toUtcDateKey,
} from '../helpers/training-load';
import {
  LoadEntry,
  PlannedSessionLoad,
  buildDailyLoads,
  buildWeeklyLoads,
} from '../helpers/weekly-load';

/**
 * Training load calculation metadata
 */
interface TrainingLoadMetadata {
  calculationType: TrainingLoadCalculationType;
  rpe?: number;
  duration?: number; // seconds
  avgHr?: number;
  hrMax?: number;
  hrRest?: number;
  hrReserve?: number;
  zones?: {
    zone: number;
    duration: number; // seconds
    coefficient: number;
  }[];
}

/**
 * Training load metrics for a time period
 */
export interface TrainingLoadMetrics {
  // Acute Training Load (7-day exponentially weighted average)
  atl: number;
  // Chronic Training Load (42-day exponentially weighted average)
  ctl: number;
  // Training Stress Balance (CTL - ATL)
  tsb: number;
  // Total load for the period
  totalLoad: number;
  // Number of training days
  trainingDays: number;
  // Usual load range for next week, from the last weeks
  recommendedLoadRange: {
    min: number;
    max: number;
  };
  // Training status based on TSB
  status: 'overreaching' | 'optimal' | 'detraining';
}

/**
 * Daily training load entry
 */
export interface DailyTrainingLoad {
  date: Date;
  load: number;
  activityCount: number;
}

@Injectable()
export class TrainingLoadService {
  private readonly logger = new Logger(TrainingLoadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  private clamp(value: number, min: number, max: number) {
    if (value < min) {
      return min;
    }
    if (value > max) {
      return max;
    }
    return value;
  }

  private lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  private getWeekLoadSum(
    dailyLoadLookup: Map<string, number>,
    weekStart: Date,
    weekEnd: Date,
  ) {
    const cursor = new Date(weekStart);
    let sum = 0;

    while (cursor <= weekEnd) {
      sum += dailyLoadLookup.get(toUtcDateKey(cursor)) ?? 0;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return sum;
  }

  private getRecentWeeklyLoads(
    dailyLoadLookup: Map<string, number>,
    referenceDate: Date,
    weeks = 4,
  ): number[] {
    const loads: number[] = [];

    for (let weekOffset = 0; weekOffset < weeks; weekOffset++) {
      const weekEnd = addUtcDays(referenceDate, -weekOffset * 7);
      const weekStart = addUtcDays(weekEnd, -6);
      loads.push(this.getWeekLoadSum(dailyLoadLookup, weekStart, weekEnd));
    }

    return loads;
  }

  /** Monday (UTC) of the week of the athlete's first activity, if any */
  private async firstActivityWeek(athleteId: number): Promise<Date | null> {
    const first = await this.prisma.event.findFirst({
      where: { athleteId, type: 'ACTIVITY' },
      orderBy: { startDate: 'asc' },
      select: { startDate: true },
    });
    return first ? getUtcWeekStart(first.startDate) : null;
  }

  /**
   * Where a fitness series reading from `date` has to start. The model keeps
   * the memory of every load, so it always runs from the athlete's first
   * activity: a date then has one value, whatever the period asked for.
   */
  private async fitnessStart(athleteId: number, date: Date): Promise<Date> {
    const firstWeek = await this.firstActivityWeek(athleteId);
    return firstWeek && firstWeek < date ? firstWeek : date;
  }

  private calculateRecommendedRangeFromWeeklyLoads(
    weeklyLoads: number[],
    previousRecommendation?: { min: number; max: number },
  ) {
    if (weeklyLoads.length === 0) {
      return { min: 0, max: 0 };
    }

    const acuteLoad = weeklyLoads[0] ?? 0;
    const chronicLoads = weeklyLoads.slice(1).filter((load) => load > 0);
    const chronicBaseline =
      chronicLoads.length > 0
        ? chronicLoads.reduce((sum, load) => sum + load, 0) /
          chronicLoads.length
        : acuteLoad;

    const previousWeek = weeklyLoads[1] ?? acuteLoad;
    const loadSlope =
      chronicBaseline > 0 ? (acuteLoad - previousWeek) / chronicBaseline : 0;
    const clampedSlope = this.clamp(
      loadSlope,
      LOAD_SLOPE_CLAMP.MIN,
      LOAD_SLOPE_CLAMP.MAX,
    );

    const adjustedMinRatio = this.clamp(
      RECOMMENDATION_BASE_RATIOS.MIN +
        clampedSlope * RECOMMENDATION_ADJUSTMENTS.SLOPE_MULTIPLIER,
      RECOMMENDATION_BASE_RATIOS.ABS_MIN,
      1,
    );
    const adjustedMaxRatio = this.clamp(
      RECOMMENDATION_BASE_RATIOS.MAX + clampedSlope,
      1,
      RECOMMENDATION_BASE_RATIOS.ABS_MAX,
    );

    const safeMinRatio = Math.min(
      adjustedMinRatio,
      adjustedMaxRatio - RECOMMENDATION_ADJUSTMENTS.SAFE_MIN_OFFSET,
    );

    const previousWeekLoad = weeklyLoads[1] ?? chronicBaseline;
    const baselineReference =
      previousWeekLoad > 0
        ? previousWeekLoad
        : chronicLoads.length > 0
          ? chronicBaseline
          : acuteLoad;

    let baseMin = Math.max(0, baselineReference * safeMinRatio);
    let baseMax = Math.max(baselineReference * adjustedMaxRatio, 0);

    if (baseMax <= baseMin) {
      baseMax = baseMin + 1;
    }

    if (acuteLoad > 0) {
      baseMin = Math.max(
        0,
        this.lerp(
          baseMin,
          acuteLoad * CURRENT_LOAD_ANCHORING.MIN_FACTOR,
          RECOMMENDATION_ADJUSTMENTS.ANCHOR_BLEND,
        ),
      );
      baseMax = Math.max(
        baseMin + 1,
        this.lerp(
          baseMax,
          acuteLoad * CURRENT_LOAD_ANCHORING.MAX_FACTOR,
          RECOMMENDATION_ADJUSTMENTS.ANCHOR_BLEND,
        ),
      );
    } else {
      baseMin *= RECOMMENDATION_ADJUSTMENTS.ZERO_WEEK_DECAY;
      baseMax = Math.max(
        baseMin + 1,
        baseMax * RECOMMENDATION_ADJUSTMENTS.ZERO_WEEK_DECAY,
      );
    }

    const normalizedPrevious = Math.max(1, baselineReference);

    let trendRatio = acuteLoad / normalizedPrevious;
    if (!Number.isFinite(trendRatio) || trendRatio <= 0) {
      trendRatio =
        acuteLoad > 0 ? 1 : RECOMMENDATION_ADJUSTMENTS.ZERO_WEEK_DECAY;
    }

    let weightedTrend: number;

    const previousRecommendationCenter = previousRecommendation
      ? (previousRecommendation.min + previousRecommendation.max) / 2
      : undefined;

    if (
      previousRecommendationCenter &&
      previousRecommendationCenter > 0 &&
      (acuteLoad < previousRecommendationCenter || acuteLoad === 0)
    ) {
      const deficit =
        acuteLoad === 0
          ? 1
          : (previousRecommendationCenter - acuteLoad) /
            previousRecommendationCenter;
      const decayFactor =
        acuteLoad === 0
          ? RECOMMENDATION_ADJUSTMENTS.ZERO_WEEK_SHORTFALL_DECAY
          : RECOMMENDATION_ADJUSTMENTS.SHORTFALL_DECAY;
      weightedTrend = Math.max(0.4, 1 - deficit * decayFactor);
    } else {
      weightedTrend =
        1 +
        (this.clamp(
          trendRatio,
          RECOMMENDATION_ADJUSTMENTS.TREND_CLAMP_MIN,
          RECOMMENDATION_ADJUSTMENTS.TREND_CLAMP_MAX,
        ) -
          1) *
          RECOMMENDATION_ADJUSTMENTS.TREND_WEIGHT;
    }

    const min = Math.max(0, baseMin * weightedTrend);
    const max = Math.max(min + 1, baseMax * weightedTrend);

    return { min, max };
  }

  /**
   * Get or create a training load calculation for an athlete
   */
  private async getOrCreateCalculation(
    athleteId: number,
    type: TrainingLoadCalculationType,
  ) {
    let calculation = await this.prisma.trainingLoadCalculation.findUnique({
      where: {
        athleteId_type: {
          athleteId: athleteId,
          type,
        },
      },
    });

    if (!calculation) {
      calculation = await this.prisma.trainingLoadCalculation.create({
        data: {
          athleteId: athleteId,
          type,
          isActive: true,
        },
      });
    }

    return calculation;
  }

  /**
   * Calculate Foster training load (RPE-based)
   * Formula: Training Load = RPE (0-10) × Duration (minutes)
   */
  private calculateFosterLoad(
    rpe: number,
    durationSeconds: number,
  ): { value: number; metadata: TrainingLoadMetadata } {
    // Convert RPE from 0-1 scale to 0-10 scale
    const rpeScale = rpe * 10;
    const durationMinutes = durationSeconds / 60;
    const value = rpeScale * durationMinutes;

    return {
      value,
      metadata: {
        calculationType: 'FOSTER_RPE',
        rpe: rpeScale,
        duration: durationSeconds,
      },
    };
  }

  /**
   * Get all training load entries for a specific activity
   */
  async getActivityTrainingLoads(user: AuthUser, activityId: number) {
    const ability = await this.abilities.getFor({ user });

    // The athlete and their linked coaches can read the activity.
    const event = await this.prisma.event.findFirst({
      where: {
        AND: [
          { eventId: activityId, type: 'ACTIVITY' },
          accessibleBy(ability, 'read').Event,
        ],
      },
      include: {
        activity: true,
      },
    });

    if (!event || !event.activity) {
      throw new NotFoundException('Activity not found');
    }

    // Get all training load entries for this activity
    const entries = await this.prisma.trainingLoadEntry.findMany({
      where: {
        activityId: event.activity.eventActivityId,
      },
      include: {
        calculation: true,
      },
    });

    return entries;
  }

  /**
   * Calculate training load for an activity
   */
  async calculateActivityLoad(
    user: AuthUser,
    activityId: number,
    calculationType: TrainingLoadCalculationType,
  ) {
    // Get athlete with user info
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          userId: user.userId,
        },
      },
      include: {
        user: {
          select: {
            gender: true,
          },
        },
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Get activity with stream
    const event = await this.prisma.event.findFirst({
      where: {
        eventId: activityId,
        athleteId: athlete.athleteId,
        type: 'ACTIVITY',
      },
      include: {
        activity: true,
      },
    });

    if (!event || !event.activity) {
      throw new NotFoundException('Activity not found');
    }

    const activity = event.activity;

    // Get or create calculation
    const calculation = await this.getOrCreateCalculation(
      athlete.athleteId,
      calculationType,
    );

    let result: { value: number; metadata: TrainingLoadMetadata };

    switch (calculationType) {
      case 'FOSTER_RPE':
        if (!activity.rpe) {
          throw new Error('RPE not available for this activity');
        }
        result = this.calculateFosterLoad(activity.rpe, activity.movingTime);
        break;

      case 'TRIMP': {
        const profile = await this.getHeartRateProfile(athlete.athleteId);
        if (!profile) {
          throw new Error(
            'HR_MAX and HR_REST metrics are required for TRIMP calculation',
          );
        }
        const { hrMax, hrRest, gender } = profile;

        const stream = activity.stream
          ? uncompressActivityStream(
              activity.stream as CompressedActivityStream,
            )
          : null;

        let trimp;
        if (stream?.heartrate?.length && stream.time?.length) {
          trimp = calculateTrimpFromStream(stream, hrMax, hrRest, gender);
        } else if (activity.averageHeartrate && activity.movingTime) {
          // No HR stream (manual entry, import without streams)
          trimp = calculateTrimpFromAverage(
            activity.averageHeartrate,
            activity.movingTime,
            hrMax,
            hrRest,
            gender,
          );
        } else {
          throw new Error('Heart rate data not available for this activity');
        }

        result = {
          value: trimp.value,
          metadata: {
            calculationType: 'TRIMP',
            duration: trimp.duration,
            avgHr: trimp.avgHr,
            hrMax,
            hrRest,
            hrReserve: hrMax - hrRest,
          },
        };
        break;
      }

      default:
        throw new Error(`Unknown calculation type: ${calculationType}`);
    }

    // Save or update training load entry
    const existingEntry = await this.prisma.trainingLoadEntry.findUnique({
      where: {
        calculationId_activityId: {
          calculationId: calculation.trainingLoadCalculationId,
          activityId: activity.eventActivityId,
        },
      },
    });

    const startDate = new Date(event.startDate);
    const activityDate = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );

    if (existingEntry) {
      return await this.prisma.trainingLoadEntry.update({
        where: {
          trainingLoadEntryId: existingEntry.trainingLoadEntryId,
        },
        data: {
          value: result.value,
          metadata: result.metadata as object,
          date: activityDate,
        },
      });
    }

    return await this.prisma.trainingLoadEntry.create({
      data: {
        calculationId: calculation.trainingLoadCalculationId,
        activityId: activity.eventActivityId,
        date: activityDate,
        value: result.value,
        metadata: result.metadata as object,
      },
    });
  }

  /**
   * Get training load entries for a period
   */
  async getTrainingLoadByPeriod(
    user: AuthUser,
    calculationType: TrainingLoadCalculationType,
    startDate: Date,
    endDate: Date,
    athleteId?: Athlete['athleteId'],
  ): Promise<DailyTrainingLoad[]> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's training load to fetch
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can access this athlete's data
      const athlete = await this.prisma.athlete.findUnique({
        where: { athleteId: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('Athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      // Use current user's athlete ID
      const athlete = await this.prisma.athlete.findFirst({
        where: {
          user: {
            userId: user.userId,
          },
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      targetAthleteId = athlete.athleteId;
    }

    const calculation = await this.prisma.trainingLoadCalculation.findUnique({
      where: {
        athleteId_type: {
          athleteId: targetAthleteId,
          type: calculationType,
        },
      },
    });

    if (!calculation) {
      return [];
    }

    const entries = await this.prisma.trainingLoadEntry.findMany({
      where: {
        calculationId: calculation.trainingLoadCalculationId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { date: true, value: true },
      orderBy: {
        date: 'asc',
      },
    });

    // Group by date
    const dailyLoads = new Map<string, { load: number; count: number }>();

    for (const entry of entries) {
      const dateKey = toUtcDateKey(entry.date);
      const existing = dailyLoads.get(dateKey) || { load: 0, count: 0 };
      dailyLoads.set(dateKey, {
        load: existing.load + entry.value,
        count: existing.count + 1,
      });
    }

    return Array.from(dailyLoads.entries()).map(([dateStr, data]) => ({
      date: new Date(dateStr),
      load: data.load,
      activityCount: data.count,
    }));
  }

  /**
   * Calculate ATL, CTL, and TSB for a given period
   * ATL (Acute Training Load): 7-day exponentially weighted moving average
   * CTL (Chronic Training Load): 42-day exponentially weighted moving average
   * TSB (Training Stress Balance): CTL - ATL
   */
  async getTrainingLoadMetrics(
    user: AuthUser,
    calculationType: TrainingLoadCalculationType,
    targetDate: Date = new Date(),
    athleteId?: Athlete['athleteId'],
  ): Promise<TrainingLoadMetrics> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's training load to fetch
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can access this athlete's data
      const athlete = await this.prisma.athlete.findUnique({
        where: { athleteId: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('Athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      // Use current user's athlete ID
      const athlete = await this.prisma.athlete.findFirst({
        where: {
          user: {
            userId: user.userId,
          },
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      targetAthleteId = athlete.athleteId;
    }

    const periodStart = addUtcDays(targetDate, -42);
    const startDate = await this.fitnessStart(targetAthleteId, periodStart);

    const dailyLoads = await this.getTrainingLoadByPeriod(
      user,
      calculationType,
      startDate,
      targetDate,
      targetAthleteId,
    );

    // Create a map of dates with loads for quick lookup
    const loadMap = new Map<string, number>();
    dailyLoads.forEach((day) => {
      const dateKey = toUtcDateKey(day.date);
      loadMap.set(dateKey, day.load);
    });

    // Generate ALL days from startDate to targetDate (including days without activity)
    const allDays: Array<{ date: Date; load: number }> = [];
    const dailyLoadLookup = new Map<string, number>();
    const currentDate = startOfUtcDay(startDate);

    while (currentDate <= targetDate) {
      const dateKey = toUtcDateKey(currentDate);
      const load = loadMap.get(dateKey) || 0; // 0 load for rest days

      const dayEntry = {
        date: new Date(currentDate),
        load,
      };

      allDays.push(dayEntry);
      dailyLoadLookup.set(dateKey, load);

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Every day counts, rest days included: they make fitness decay
    const { ctl, atl } = allDays.reduce(
      (state, day) => advanceFitness(state, day.load),
      { ctl: 0, atl: 0 },
    );

    const tsb = ctl - atl;

    // Calculate total load for the period
    const periodLoads = dailyLoads.filter((day) => day.date >= periodStart);
    const totalLoad = periodLoads.reduce((sum, day) => sum + day.load, 0);
    const trainingDays = periodLoads.length;

    // Determine training status based on TSB
    let status: 'overreaching' | 'optimal' | 'detraining';
    if (tsb < TSB_OVERREACHING_THRESHOLD) {
      status = 'overreaching';
    } else if (tsb > TSB_DETRAINING_THRESHOLD) {
      status = 'detraining';
    } else {
      status = 'optimal';
    }

    const weeklyLoads = this.getRecentWeeklyLoads(
      dailyLoadLookup,
      startOfUtcDay(targetDate),
    );

    const recommendedLoadRange =
      this.calculateRecommendedRangeFromWeeklyLoads(weeklyLoads);

    return {
      atl,
      ctl,
      tsb,
      totalLoad,
      trainingDays,
      recommendedLoadRange,
      status,
    };
  }

  /**
   * Get historical training load metrics with ATL/CTL/TSB over time
   */
  async getTrainingLoadHistory(
    user: AuthUser,
    calculationType: TrainingLoadCalculationType,
    startDate: Date,
    endDate: Date,
    athleteId?: Athlete['athleteId'],
  ): Promise<
    Array<{
      date: Date;
      load: number;
      atl: number;
      ctl: number;
      tsb: number;
    }>
  > {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's training load to fetch
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can access this athlete's data
      const athlete = await this.prisma.athlete.findUnique({
        where: { athleteId: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('Athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      // Use current user's athlete ID
      const athlete = await this.prisma.athlete.findFirst({
        where: {
          user: {
            userId: user.userId,
          },
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      targetAthleteId = athlete.athleteId;
    }

    const extendedStartDate = await this.fitnessStart(
      targetAthleteId,
      startDate,
    );

    const dailyLoads = await this.getTrainingLoadByPeriod(
      user,
      calculationType,
      extendedStartDate,
      endDate,
      targetAthleteId,
    );

    // Create a map of dates with loads for quick lookup
    const loadMap = new Map<string, number>();
    dailyLoads.forEach((day) => {
      const dateKey = toUtcDateKey(day.date);
      loadMap.set(dateKey, day.load);
    });

    // Generate ALL days from extendedStartDate to endDate (including days without activity)
    const allDays: Array<{ date: Date; load: number }> = [];
    const currentDate = startOfUtcDay(extendedStartDate);

    while (currentDate <= endDate) {
      const dateKey = toUtcDateKey(currentDate);
      const load = loadMap.get(dateKey) || 0; // 0 load for rest days

      allDays.push({
        date: new Date(currentDate),
        load,
      });

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    if (allDays.length === 0) {
      return [];
    }

    // Calculate rolling ATL, CTL, TSB for each day
    const history: Array<{
      date: Date;
      load: number;
      atl: number;
      ctl: number;
      tsb: number;
    }> = [];

    let fitness = { ctl: 0, atl: 0 };

    for (const day of allDays) {
      // Every day counts, rest days included: they make fitness decay
      fitness = advanceFitness(fitness, day.load);
      const { ctl, atl } = fitness;
      const tsb = ctl - atl;

      // Only include dates within the requested range
      if (day.date >= startDate && day.date <= endDate) {
        history.push({
          date: day.date,
          load: day.load,
          atl,
          ctl,
          tsb,
        });
      }
    }

    return history;
  }

  /** TRIMP of the athlete's activities, one entry per activity */
  private async getTrimpEntries(
    athleteId: number,
    from: Date,
    to: Date,
  ): Promise<LoadEntry[]> {
    return this.prisma.trainingLoadEntry.findMany({
      where: {
        calculation: { athleteId, type: 'TRIMP' },
        date: { gte: from, lte: to },
      },
      select: { date: true, value: true },
    });
  }

  /**
   * Heart rate profile used to estimate planned sessions, the same one the
   * TRIMP of activities uses. Null when the athlete has not set it.
   */
  async getHeartRateProfile(
    athleteId: number,
  ): Promise<HeartRateProfile | null> {
    const [hrMax, hrRest, athlete] = await Promise.all([
      this.prisma.athleteMetric.findFirst({
        where: { athleteId, type: MetricType.HR_MAX },
        orderBy: { date: 'desc' },
      }),
      this.prisma.athleteMetric.findFirst({
        where: { athleteId, type: MetricType.HR_REST },
        orderBy: { date: 'desc' },
      }),
      this.prisma.athlete.findUnique({
        where: { athleteId },
        select: { user: { select: { gender: true } } },
      }),
    ]);
    return getHeartRateProfile(
      [
        ...(hrMax ? [{ type: MetricType.HR_MAX, value: hrMax.value }] : []),
        ...(hrRest ? [{ type: MetricType.HR_REST, value: hrRest.value }] : []),
      ],
      athlete?.user?.gender,
    );
  }

  /**
   * Estimated load of every planned training and competition in the range.
   * The AI estimate wins when there is one; otherwise the load comes from
   * the planned duration and RPE, so it works without any AI key.
   */
  private async getPlannedSessionLoads(
    athleteId: number,
    from: Date,
    to: Date,
  ): Promise<PlannedSessionLoad[]> {
    const goals = {
      select: { goalDuration: true, goalRpe: true, relatedActivityId: true },
    };
    const [events, profile] = await Promise.all([
      this.prisma.event.findMany({
        where: {
          athleteId,
          type: { in: ['TRAINING', 'COMPETITION'] },
          startDate: { gte: from, lte: to },
        },
        select: {
          startDate: true,
          training: { select: { ...goals.select, estimatedLoad: true } },
          competition: goals,
        },
      }),
      this.getHeartRateProfile(athleteId),
    ]);

    return events.flatMap(({ startDate, training, competition }) => {
      const session = training ?? competition;
      if (!session) return [];
      // On-read fallback for sessions saved before deterministic estimation was stored.
      const fallback =
        estimatePlannedSessionTrimp({
          goalDuration: session.goalDuration,
          goalRpe: session.goalRpe,
          profile,
        })?.value ?? null;
      return [
        {
          startDate,
          load: training?.estimatedLoad ?? fallback,
          done: session.relatedActivityId !== null,
        },
      ];
    });
  }

  /**
   * Day by day load and form between two dates, projected over the planned
   * sessions like the weekly summary, with the day's wellness measurements
   * when asked for. Callers skip `wellness` when the athlete records none.
   */
  async getDailyForm(
    user: AuthUser,
    startDate: Date,
    endDate: Date,
    athleteId: Athlete['athleteId'] | undefined,
    wellness: boolean,
  ): Promise<CalendarDayForm[]> {
    const ability = await this.abilities.getFor({ user });
    const athlete = await this.prisma.athlete.findFirst({
      where: athleteId ? { athleteId } : { user: { userId: user.userId } },
    });
    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }
    if (!ability.can('read', subject('Athlete', athlete))) {
      throw new ForbiddenException('Not allowed to access this athlete');
    }

    const firstDay = addUtcDays(getUtcWeekStart(startDate), -42);
    const warmupFrom = await this.fitnessStart(athlete.athleteId, firstDay);
    const to = startOfUtcDay(endDate);
    to.setUTCHours(23, 59, 59, 999);
    const [entries, sessions, metrics] = await Promise.all([
      this.getTrimpEntries(athlete.athleteId, warmupFrom, to),
      // Only sessions still to do count: none lies before the period
      this.getPlannedSessionLoads(athlete.athleteId, firstDay, to),
      wellness
        ? this.prisma.athleteMetric.findMany({
            where: {
              athleteId: athlete.athleteId,
              type: { in: [...CALENDAR_WELLNESS_METRICS] as MetricType[] },
              date: { gte: startOfUtcDay(startDate), lte: to },
            },
            select: { type: true, value: true, date: true },
            orderBy: { date: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    // Metrics are stored by date (no time): their UTC date is their day
    const byDay = new Map<
      string,
      Partial<Record<CalendarWellnessMetric, number>>
    >();
    for (const metric of metrics) {
      const day = toUtcDateKey(metric.date);
      byDay.set(day, {
        ...byDay.get(day),
        [metric.type as CalendarWellnessMetric]: metric.value,
      });
    }

    const round = (value: number) => Math.round(value * 10) / 10;
    return buildDailyLoads({
      warmupFrom,
      from: startDate,
      to,
      entries,
      sessions,
      today: new Date(),
    }).map(({ date, load, fitness, projected }) => {
      const key = toUtcDateKey(date);
      return {
        date: key,
        load: Math.round(load),
        ctl: round(fitness.ctl),
        atl: round(fitness.atl),
        tsb: round(fitness.ctl - fitness.atl),
        projected,
        ...(wellness && byDay.has(key) && { wellness: byDay.get(key) }),
      };
    });
  }

  async getWeeklyTrimpSummary(
    user: AuthUser,
    startDate: Date,
    endDate: Date,
    athleteId?: Athlete['athleteId'],
  ): Promise<CalendarWeekLoadSummary[]> {
    const ability = await this.abilities.getFor({ user });

    let targetAthleteId: number;

    if (athleteId) {
      const athlete = await this.prisma.athlete.findUnique({
        where: { athleteId: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('Athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      const athlete = await this.prisma.athlete.findFirst({
        where: {
          user: {
            userId: user.userId,
          },
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      targetAthleteId = athlete.athleteId;
    }

    const normalizedStart = getUtcWeekStart(startDate);
    const normalizedEnd = addUtcDays(getUtcWeekStart(endDate), 6);
    normalizedEnd.setUTCHours(23, 59, 59, 999);

    // Six weeks of history warm up the recommendations
    const extendedStart = addUtcDays(normalizedStart, -42);
    const historyStart = await this.fitnessStart(
      targetAthleteId,
      extendedStart,
    );

    const [entries, sessions] = await Promise.all([
      this.getTrimpEntries(targetAthleteId, historyStart, normalizedEnd),
      this.getPlannedSessionLoads(
        targetAthleteId,
        extendedStart,
        normalizedEnd,
      ),
    ]);

    const sortedSummaries = buildWeeklyLoads({
      from: historyStart,
      to: normalizedEnd,
      entries,
      sessions,
      today: new Date(),
    });

    const recommendations: Array<{ min: number; max: number } | null> =
      new Array(sortedSummaries.length).fill(null);

    let projectedFutureWeek: CalendarWeekLoadSummary | null = null;

    let recommendationForCurrentWeek: { min: number; max: number } | undefined;

    for (let index = 0; index < sortedSummaries.length; index++) {
      // Get weekly loads for recommendation calculation (4 weeks)
      const weeklyLoads: number[] = [];
      for (let offset = 0; offset < 4; offset++) {
        const sourceIndex = index - offset;
        if (sourceIndex >= 0) {
          const summary = sortedSummaries[sourceIndex];
          // Include both actual and estimated loads
          weeklyLoads.push(summary.actual + summary.estimated);
        } else {
          weeklyLoads.push(0);
        }
      }

      const recommendedRange = this.calculateRecommendedRangeFromWeeklyLoads(
        weeklyLoads,
        recommendationForCurrentWeek,
      );
      recommendationForCurrentWeek = recommendedRange;
      const targetIndex = index + 1;

      if (targetIndex < sortedSummaries.length) {
        recommendations[targetIndex] = recommendedRange;
      } else {
        const nextWeekStart = addUtcDays(sortedSummaries[index].weekStart, 7);
        const nextWeekEnd = addUtcDays(sortedSummaries[index].weekEnd, 7);
        projectedFutureWeek = {
          weekStart: nextWeekStart,
          weekEnd: nextWeekEnd,
          actualLoad: 0,
          estimatedLoad: 0,
          plannedLoad: 0,
          totalLoad: 0,
          recommendedMin: Number(recommendedRange.min.toFixed(2)),
          recommendedMax: Number(recommendedRange.max.toFixed(2)),
        } as CalendarWeekLoadSummary;
      }
    }

    if (!recommendations[0] && sortedSummaries.length > 0) {
      const firstSummary = sortedSummaries[0];
      // Include both actual and estimated loads
      const initialRange = this.calculateRecommendedRangeFromWeeklyLoads([
        firstSummary.actual + firstSummary.estimated,
      ]);
      recommendations[0] = initialRange;
    }

    const response: CalendarWeekLoadSummary[] = sortedSummaries.map(
      (summary, index) => {
        const range = recommendations[index];

        return {
          weekStart: summary.weekStart,
          weekEnd: summary.weekEnd,
          actualLoad: Number(summary.actual.toFixed(2)),
          estimatedLoad: Number(summary.estimated.toFixed(2)),
          plannedLoad: Number(summary.planned.toFixed(2)),
          totalLoad: Number((summary.actual + summary.estimated).toFixed(2)),
          ctl: Number(summary.fitness.ctl.toFixed(1)),
          atl: Number(summary.fitness.atl.toFixed(1)),
          tsb: Number((summary.fitness.ctl - summary.fitness.atl).toFixed(1)),
          formProjected: summary.projected,
          recommendedMin: Number((range?.min ?? summary.actual).toFixed(2)),
          recommendedMax: Number((range?.max ?? summary.actual).toFixed(2)),
        };
      },
    );

    let filteredResponse = response.filter(
      (week) =>
        week.weekStart >= normalizedStart && week.weekStart <= normalizedEnd,
    );

    if (projectedFutureWeek) {
      filteredResponse = [...filteredResponse, projectedFutureWeek];
    }

    return filteredResponse;
  }

  /**
   * Recalculate all training loads for an athlete
   * Useful when HR metrics are updated or for bulk recalculation
   */
  async recalculateAllLoads(
    user: AuthUser,
    calculationType: TrainingLoadCalculationType,
  ): Promise<{ processed: number; errors: number }> {
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          userId: user.userId,
        },
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Get all activities
    const events = await this.prisma.event.findMany({
      where: {
        athleteId: athlete.athleteId,
        type: 'ACTIVITY',
      },
      include: {
        activity: true,
      },
    });

    let processed = 0;
    let errors = 0;

    for (const event of events) {
      if (!event.activity) continue;

      try {
        await this.calculateActivityLoad(user, event.eventId, calculationType);
        processed++;
      } catch (error) {
        this.logger.error(
          `Failed to calculate load for activity ${event.eventId}: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
        errors++;
      }
    }

    return { processed, errors };
  }

  /**
   * The TRIMP of every activity of an athlete, computed again with their
   * current HR max and resting HR. Without both, nothing changes: the loads
   * already there stay. For the recalculation job, without access check.
   */
  async recalculateAthleteTrimp(
    athleteId: number,
  ): Promise<{ processed: number; errors: number; skipped?: string }> {
    const athlete = await this.prisma.athlete.findUnique({
      where: { athleteId },
      select: { userId: true },
    });
    if (!athlete) return { processed: 0, errors: 0, skipped: 'no athlete' };
    if (!(await this.getHeartRateProfile(athleteId))) {
      return { processed: 0, errors: 0, skipped: 'no HR max or resting HR' };
    }

    const events = await this.prisma.event.findMany({
      where: {
        athleteId,
        type: 'ACTIVITY',
        // Some watches report 0 for a session recorded without a strap
        activity: { averageHeartrate: { gt: 0 } },
      },
      select: { eventId: true },
      orderBy: { startDate: 'asc' },
    });
    const user = { userId: athlete.userId } as AuthUser;

    let processed = 0;
    let errors = 0;
    for (const { eventId } of events) {
      try {
        await this.calculateActivityLoad(user, eventId, 'TRIMP');
        processed++;
      } catch (error) {
        this.logger.warn(
          `TRIMP not recalculated for activity ${eventId}: ${error instanceof Error ? error.message : String(error)}`,
        );
        errors++;
      }
    }
    this.logger.log(
      `TRIMP recalculated for athlete ${athleteId}: ${processed} activities, ${errors} errors`,
    );
    return { processed, errors };
  }
}
