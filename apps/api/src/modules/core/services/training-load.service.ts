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
  ACWR_HIGH_RISK_THRESHOLD,
  ACWR_MIN_CHRONIC_WEEKS,
  ACWR_MODERATE_RISK_THRESHOLD,
  ACWR_OPTIMAL_MAX,
  ACWR_RECOMMENDATION_ADJUSTMENTS,
  ACWR_SAFE_THRESHOLD,
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
  estimatePlannedTrimp,
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
  // Recommended load range for next week (based on 10% progression rule)
  recommendedLoadRange: {
    min: number;
    max: number;
  };
  // Training status based on TSB
  status: 'overreaching' | 'optimal' | 'detraining';
  // Acute:chronic workload ratio of the last weeks, null without enough history
  acwr: number | null;
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

  /**
   * Calculate ACWR (Acute:Chronic Workload Ratio) from weekly loads
   * ACWR = ATL / CTL
   * ATL = 7-day exponentially weighted average (acute)
   * CTL = 42-day exponentially weighted average (chronic)
   */
  /** Monday (UTC) of the week of the athlete's first activity, if any */
  private async firstActivityWeek(athleteId: number): Promise<Date | null> {
    const first = await this.prisma.event.findFirst({
      where: { athleteId, type: 'ACTIVITY' },
      orderBy: { startDate: 'asc' },
      select: { startDate: true },
    });
    return first ? getUtcWeekStart(first.startDate) : null;
  }

  private calculateACWRFromWeeklyLoads(
    weeklyLoads: number[],
    weeksOfData: number,
  ): { acwr: number; atl: number; ctl: number } | null {
    if (weeklyLoads.length === 0) {
      return null;
    }

    // For ATL, we use the most recent week
    const acuteWeek = weeklyLoads[0] ?? 0;

    // The chronic weeks (up to 6 before the acute one), oldest first, since
    // the athlete's first activity. Weeks before it are missing data: as
    // zeros they would shrink the CTL of every new athlete. Empty weeks
    // after it are rest, and count as zero.
    const history = weeklyLoads.slice(1, Math.min(7, weeksOfData)).reverse();
    if (history.length < ACWR_MIN_CHRONIC_WEEKS) {
      return null;
    }

    // Exponentially weighted average, adapted for weekly data:
    // alpha = 2 / (weeks + 1). It runs from the oldest week so the most
    // recent ones weigh most, and starts from the oldest week rather than
    // zero, so steady training gives an ACWR of 1.
    const alphaCTL = 2 / (history.length + 1);
    let ctl = history[0];
    for (const weekLoad of history.slice(1)) {
      ctl = alphaCTL * weekLoad + (1 - alphaCTL) * ctl;
    }

    // If CTL is 0, we can't calculate ACWR
    if (ctl === 0) {
      return null;
    }

    // ATL is the acute week load (7-day period)
    // For weekly data, ATL ≈ acute week load
    const atl = acuteWeek;

    const acwr = atl / ctl;

    return { acwr, atl, ctl };
  }

  /**
   * Determine ACWR status based on ratio
   */
  private getACWRStatus(
    acwr: number,
  ): 'safe' | 'optimal' | 'moderate_risk' | 'high_risk' {
    if (acwr < ACWR_SAFE_THRESHOLD) {
      return 'safe'; // Déconditionnement
    }
    if (acwr >= ACWR_SAFE_THRESHOLD && acwr <= ACWR_OPTIMAL_MAX) {
      return 'optimal'; // Zone optimale
    }
    if (acwr > ACWR_OPTIMAL_MAX && acwr <= ACWR_MODERATE_RISK_THRESHOLD) {
      return 'moderate_risk'; // Risque modéré
    }
    return 'high_risk'; // Risque élevé (> 1.5)
  }

  private calculateRecommendedRangeFromWeeklyLoads(
    weeklyLoads: number[],
    previousRecommendation?: { min: number; max: number },
    acwr?: number,
  ) {
    if (weeklyLoads.length === 0) {
      return { min: 0, max: 0, acwrAdjusted: false };
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

    let progressiveMin = Math.max(0, baseMin * weightedTrend);
    let progressiveMax = Math.max(progressiveMin + 1, baseMax * weightedTrend);

    // Adjust recommendations based on ACWR if provided
    let acwrAdjusted = false;
    if (acwr !== undefined && acwr > 0) {
      if (acwr > ACWR_HIGH_RISK_THRESHOLD) {
        // High risk: reduce recommendations by 20% to prevent injury
        progressiveMin =
          progressiveMin * ACWR_RECOMMENDATION_ADJUSTMENTS.HIGH_RISK_MULTIPLIER;
        progressiveMax =
          progressiveMax * ACWR_RECOMMENDATION_ADJUSTMENTS.HIGH_RISK_MULTIPLIER;
        acwrAdjusted = true;
      } else if (acwr > ACWR_OPTIMAL_MAX) {
        // Moderate risk: reduce recommendations by 10%
        progressiveMin =
          progressiveMin *
          ACWR_RECOMMENDATION_ADJUSTMENTS.MODERATE_RISK_MULTIPLIER;
        progressiveMax =
          progressiveMax *
          ACWR_RECOMMENDATION_ADJUSTMENTS.MODERATE_RISK_MULTIPLIER;
        acwrAdjusted = true;
      } else if (acwr < ACWR_SAFE_THRESHOLD) {
        // Safe/underconditioned: allow slightly more progression (5%)
        progressiveMax =
          progressiveMax *
          ACWR_RECOMMENDATION_ADJUSTMENTS.SAFE_PROGRESSION_MULTIPLIER;
        // Don't mark as adjusted for underconditioned state
      }

      // Ensure min < max after adjustments
      if (progressiveMax <= progressiveMin) {
        progressiveMax = progressiveMin + 1;
      }
    }

    return {
      min: progressiveMin,
      max: progressiveMax,
      acwrAdjusted,
    };
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
   * Get the latest metric value for an athlete
   */
  private async getLatestMetric(
    athleteId: number,
    metricType: MetricType,
  ): Promise<number | null> {
    const metric = await this.prisma.athleteMetric.findFirst({
      where: {
        athleteId: athleteId,
        type: metricType,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return metric?.value ?? null;
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
        // Get HR metrics
        const hrMax = await this.getLatestMetric(
          athlete.athleteId,
          'HR_MAX' as MetricType,
        );
        const hrRest = await this.getLatestMetric(
          athlete.athleteId,
          'HR_REST' as MetricType,
        );

        if (!hrMax || !hrRest) {
          throw new Error(
            'HR_MAX and HR_REST metrics are required for TRIMP calculation',
          );
        }

        // Default to 'male' coefficients if gender is not set or 'OTHER'
        const gender = athlete.user.gender === 'FEMALE' ? 'female' : 'male';

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

    // Get last 42 days of data for CTL calculation
    const startDate = addUtcDays(targetDate, -42);

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
    const totalLoad = dailyLoads.reduce((sum, day) => sum + day.load, 0);
    const trainingDays = dailyLoads.length;

    // Determine training status based on TSB
    let status: 'overreaching' | 'optimal' | 'detraining';
    if (tsb < TSB_OVERREACHING_THRESHOLD) {
      status = 'overreaching';
    } else if (tsb > TSB_DETRAINING_THRESHOLD) {
      status = 'detraining';
    } else {
      status = 'optimal';
    }

    // Calculate recommended load range using ACWR-informed ramp logic
    const normalizedTargetDate = startOfUtcDay(targetDate);

    const weeklyLoads = this.getRecentWeeklyLoads(
      dailyLoadLookup,
      normalizedTargetDate,
    );

    // Calculate ACWR for recommendation adjustment, over the weeks since
    // the athlete's first activity
    const firstWeek = await this.firstActivityWeek(targetAthleteId);
    const weeksOfData = firstWeek
      ? Math.floor(
          (normalizedTargetDate.getTime() - firstWeek.getTime()) /
            (7 * 24 * 3600 * 1000),
        ) + 1
      : 0;
    const acwrResult = this.calculateACWRFromWeeklyLoads(
      weeklyLoads,
      weeksOfData,
    );
    const acwr = acwrResult?.acwr;

    const recommendedLoadRangeResult =
      this.calculateRecommendedRangeFromWeeklyLoads(
        weeklyLoads,
        undefined,
        acwr,
      );
    const recommendedLoadRange = {
      min: recommendedLoadRangeResult.min,
      max: recommendedLoadRangeResult.max,
    };

    return {
      atl,
      ctl,
      tsb,
      totalLoad,
      trainingDays,
      recommendedLoadRange,
      status,
      acwr: acwr ?? null,
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

    // Get data starting 42 days before startDate for proper CTL calculation
    const extendedStartDate = addUtcDays(startDate, -42);

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
  private async getHeartRateProfile(
    athleteId: number,
  ): Promise<HeartRateProfile | null> {
    const [hrMax, hrRest, athlete] = await Promise.all([
      this.getLatestMetric(athleteId, 'HR_MAX' as MetricType),
      this.getLatestMetric(athleteId, 'HR_REST' as MetricType),
      this.prisma.athlete.findUnique({
        where: { athleteId },
        select: { user: { select: { gender: true } } },
      }),
    ]);
    if (!hrMax || !hrRest) return null;
    return {
      hrMax,
      hrRest,
      gender: athlete?.user?.gender === 'FEMALE' ? 'female' : 'male',
    };
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
      const fallback = profile
        ? estimatePlannedTrimp(session.goalDuration, session.goalRpe, profile)
        : null;
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

    // The same warm-up as the weekly summary, so both agree
    const warmupFrom = addUtcDays(getUtcWeekStart(startDate), -42);
    const to = startOfUtcDay(endDate);
    to.setUTCHours(23, 59, 59, 999);
    const [entries, sessions, metrics] = await Promise.all([
      this.getTrimpEntries(athlete.athleteId, warmupFrom, to),
      this.getPlannedSessionLoads(athlete.athleteId, warmupFrom, to),
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

    // Six weeks of history warm up the recommendations and the fitness model
    const extendedStart = addUtcDays(normalizedStart, -42);

    const [entries, sessions] = await Promise.all([
      this.getTrimpEntries(targetAthleteId, extendedStart, normalizedEnd),
      this.getPlannedSessionLoads(
        targetAthleteId,
        extendedStart,
        normalizedEnd,
      ),
    ]);

    const sortedSummaries = buildWeeklyLoads({
      from: extendedStart,
      to: normalizedEnd,
      entries,
      sessions,
      today: new Date(),
    });

    const recommendations: Array<{
      min: number;
      max: number;
      acwrAdjusted: boolean;
    } | null> = new Array(sortedSummaries.length).fill(null);

    const acwrData: Array<{
      acwr: number;
      acwrStatus: 'safe' | 'optimal' | 'moderate_risk' | 'high_risk';
    } | null> = new Array(sortedSummaries.length).fill(null);

    let projectedFutureWeek: CalendarWeekLoadSummary | null = null;

    let recommendationForCurrentWeek:
      | {
          min: number;
          max: number;
          acwrAdjusted: boolean;
        }
      | undefined;

    const firstWeek = await this.firstActivityWeek(targetAthleteId);
    for (let index = 0; index < sortedSummaries.length; index++) {
      // Get weekly loads for ACWR calculation (need at least 7 weeks for proper CTL)
      const weeklyLoadsForACWR: number[] = [];
      for (let offset = 0; offset < 7; offset++) {
        const sourceIndex = index - offset;
        if (sourceIndex >= 0) {
          const summary = sortedSummaries[sourceIndex];
          weeklyLoadsForACWR.push(summary.actual + summary.estimated);
        } else {
          weeklyLoadsForACWR.push(0);
        }
      }

      // Calculate ACWR for this week
      const weeksOfData = firstWeek
        ? Math.round(
            (sortedSummaries[index].weekStart.getTime() - firstWeek.getTime()) /
              (7 * 24 * 3600 * 1000),
          ) + 1
        : 0;
      const acwrResult = this.calculateACWRFromWeeklyLoads(
        weeklyLoadsForACWR,
        weeksOfData,
      );
      let acwr: number | undefined;
      let acwrStatus:
        'safe' | 'optimal' | 'moderate_risk' | 'high_risk' | undefined;

      if (acwrResult) {
        acwr = acwrResult.acwr;
        acwrStatus = this.getACWRStatus(acwr);
        acwrData[index] = { acwr, acwrStatus };
      }

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
        acwr,
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
          acwr: acwr ? Number(acwr.toFixed(2)) : undefined,
          acwrStatus: acwrStatus,
          acwrAdjusted: recommendedRange.acwrAdjusted,
        } as CalendarWeekLoadSummary;
      }
    }

    if (!recommendations[0] && sortedSummaries.length > 0) {
      const firstSummary = sortedSummaries[0];
      // Include both actual and estimated loads
      const initialRange = this.calculateRecommendedRangeFromWeeklyLoads(
        [firstSummary.actual + firstSummary.estimated],
        undefined,
        undefined,
      );
      recommendations[0] = initialRange;
    }

    const response: CalendarWeekLoadSummary[] = sortedSummaries.map(
      (summary, index) => {
        const range = recommendations[index];
        const acwr = acwrData[index];

        const result: CalendarWeekLoadSummary = {
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
          acwrAdjusted: range?.acwrAdjusted ?? false,
        };

        if (acwr) {
          result.acwr = Number(acwr.acwr.toFixed(2));
          result.acwrStatus = acwr.acwrStatus;
        }

        return result;
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
}
