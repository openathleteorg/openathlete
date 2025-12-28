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
  ActivityStream,
  CalendarWeekLoadSummary,
  CompressedActivityStream,
} from '@openathlete/shared';

import {
  ACWR_HIGH_RISK_THRESHOLD,
  ACWR_MODERATE_RISK_THRESHOLD,
  ACWR_OPTIMAL_MAX,
  ACWR_RECOMMENDATION_ADJUSTMENTS,
  ACWR_SAFE_THRESHOLD,
  CURRENT_LOAD_ANCHORING,
  EWMA_ALPHA_ATL,
  EWMA_ALPHA_CTL,
  LOAD_SLOPE_CLAMP,
  RECOMMENDATION_ADJUSTMENTS,
  RECOMMENDATION_BASE_RATIOS,
  TRIMP_COEFFICIENT_K_FEMALE,
  TRIMP_COEFFICIENT_K_MALE,
  TRIMP_COEFFICIENT_Y_FEMALE,
  TRIMP_COEFFICIENT_Y_MALE,
  TSB_DETRAINING_THRESHOLD,
  TSB_OVERREACHING_THRESHOLD,
} from 'src/common/constants/training-formulas.constants';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { uncompressActivityStream } from '../helpers/activity-stream';

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
      const key = cursor.toISOString().split('T')[0];
      sum += dailyLoadLookup.get(key) ?? 0;
      cursor.setDate(cursor.getDate() + 1);
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
      const weekEnd = new Date(referenceDate);
      weekEnd.setDate(weekEnd.getDate() - weekOffset * 7);
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
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
  private calculateACWRFromWeeklyLoads(
    weeklyLoads: number[],
  ): { acwr: number; atl: number; ctl: number } | null {
    if (weeklyLoads.length === 0) {
      return null;
    }

    // We need at least 6 weeks of data for proper CTL calculation
    // For ATL, we use the most recent week
    const acuteWeek = weeklyLoads[0] ?? 0;

    // Calculate CTL as exponentially weighted average of last 6 weeks
    // Using the same alpha as in getTrainingLoadMetrics (2/43 for 42-day)
    // But adapted for weekly data: alpha = 2 / (weeks + 1)
    const weeksForCTL = Math.min(weeklyLoads.length - 1, 6);
    if (weeksForCTL < 1) {
      return null;
    }

    const alphaCTL = 2 / (weeksForCTL + 1);
    let ctl = 0;

    // Calculate CTL from historical weeks (skip the acute week)
    for (let i = 1; i <= weeksForCTL; i++) {
      const weekLoad = weeklyLoads[i] ?? 0;
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
    if (!isFinite(trendRatio) || trendRatio <= 0) {
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
   * Calculate TRIMP (exponential weighting)
   * Formula: Duration × HR fraction × 0.64 × e^(1.92 × HR fraction)
   * where HR fraction = (HR - HR rest) / (HR max - HR rest)
   */
  private calculateTRIMP(
    stream: ActivityStream,
    hrMax: number,
    hrRest: number,
    gender: 'male' | 'female' = 'male',
  ): { value: number; metadata: TrainingLoadMetadata } {
    if (!stream.heartrate || !stream.time) {
      throw new Error('Heart rate or time data not available');
    }

    const hrReserve = hrMax - hrRest;

    // Gender-specific coefficients
    const k =
      gender === 'male' ? TRIMP_COEFFICIENT_K_MALE : TRIMP_COEFFICIENT_K_FEMALE;
    const y =
      gender === 'male' ? TRIMP_COEFFICIENT_Y_MALE : TRIMP_COEFFICIENT_Y_FEMALE;

    let trimp = 0;
    let totalHr = 0;
    let validPoints = 0;

    for (let i = 1; i < stream.time.length; i++) {
      const hr = stream.heartrate[i];
      const timeDelta = (stream.time[i] - stream.time[i - 1]) / 60; // Convert to minutes

      if (hr && timeDelta > 0) {
        const hrFraction = (hr - hrRest) / hrReserve;

        if (hrFraction > 0) {
          // TRIMP formula
          trimp += timeDelta * hrFraction * y * Math.exp(k * hrFraction);
          totalHr += hr;
          validPoints++;
        }
      }
    }

    const avgHr = validPoints > 0 ? totalHr / validPoints : 0;

    return {
      value: trimp,
      metadata: {
        calculationType: 'TRIMP',
        duration: stream.time[stream.time.length - 1],
        avgHr,
        hrMax,
        hrRest,
        hrReserve,
      },
    };
  }

  /**
   * Get all training load entries for a specific activity
   */
  async getActivityTrainingLoads(user: AuthUser, activityId: number) {
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

    // Get activity to verify ownership
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

        // Uncompress stream
        if (!activity.stream) {
          throw new Error('Activity stream not available');
        }

        const stream = uncompressActivityStream(
          activity.stream as CompressedActivityStream,
        );

        // Convert gender to 'male' | 'female' for TRIMP calculation
        // Default to 'male' if not set or 'OTHER'
        const gender = athlete.user.gender === 'FEMALE' ? 'female' : 'male';
        result = this.calculateTRIMP(stream, hrMax, hrRest, gender);
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
      const dateKey = entry.date.toISOString().split('T')[0];
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
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 42);

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
      const dateKey = day.date.toISOString().split('T')[0];
      loadMap.set(dateKey, day.load);
    });

    // Generate ALL days from startDate to targetDate (including days without activity)
    const allDays: Array<{ date: Date; load: number }> = [];
    const dailyLoadLookup = new Map<string, number>();
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= targetDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const load = loadMap.get(dateKey) || 0; // 0 load for rest days

      const dayEntry = {
        date: new Date(currentDate),
        load,
      };

      allDays.push(dayEntry);
      dailyLoadLookup.set(dateKey, load);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate exponentially weighted moving averages using ALL days (including rest days)
    let atl = 0;
    let ctl = 0;

    for (const day of allDays) {
      // Update EWMA (even for days with 0 load - this causes fitness decay)
      atl = EWMA_ALPHA_ATL * day.load + (1 - EWMA_ALPHA_ATL) * atl;
      ctl = EWMA_ALPHA_CTL * day.load + (1 - EWMA_ALPHA_CTL) * ctl;
    }

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
    const normalizedTargetDate = new Date(targetDate);
    normalizedTargetDate.setHours(0, 0, 0, 0);

    const weeklyLoads = this.getRecentWeeklyLoads(
      dailyLoadLookup,
      normalizedTargetDate,
    );

    // Calculate ACWR for recommendation adjustment
    const acwrResult = this.calculateACWRFromWeeklyLoads(weeklyLoads);
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
    const extendedStartDate = new Date(startDate);
    extendedStartDate.setDate(extendedStartDate.getDate() - 42);

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
      const dateKey = day.date.toISOString().split('T')[0];
      loadMap.set(dateKey, day.load);
    });

    // Generate ALL days from extendedStartDate to endDate (including days without activity)
    const allDays: Array<{ date: Date; load: number }> = [];
    const currentDate = new Date(extendedStartDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const load = loadMap.get(dateKey) || 0; // 0 load for rest days

      allDays.push({
        date: new Date(currentDate),
        load,
      });

      currentDate.setDate(currentDate.getDate() + 1);
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

    let atl = 0;
    let ctl = 0;

    for (const day of allDays) {
      // Update EWMA (even for days with 0 load - this causes fitness decay)
      atl = EWMA_ALPHA_ATL * day.load + (1 - EWMA_ALPHA_ATL) * atl;
      ctl = EWMA_ALPHA_CTL * day.load + (1 - EWMA_ALPHA_CTL) * ctl;
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

    const normalizedStart = this.getWeekStart(startDate);
    const normalizedEnd = this.addDays(this.getWeekStart(endDate), 6);
    normalizedStart.setUTCHours(0, 0, 0, 0);
    normalizedEnd.setUTCHours(23, 59, 59, 999);

    const extendedStart = this.addDays(normalizedStart, -42);
    extendedStart.setUTCHours(0, 0, 0, 0);

    const weekSummaries = new Map<
      string,
      {
        weekStart: Date;
        weekEnd: Date;
        actual: number;
        estimated: number;
      }
    >();

    for (
      let cursor = new Date(extendedStart);
      cursor <= normalizedEnd;
      cursor = this.addDays(cursor, 7)
    ) {
      const weekStart = new Date(cursor);
      const weekEnd = this.addDays(weekStart, 6);
      weekSummaries.set(weekStart.toISOString(), {
        weekStart,
        weekEnd,
        actual: 0,
        estimated: 0,
      });
    }

    const trimpCalculation =
      await this.prisma.trainingLoadCalculation.findUnique({
        where: {
          athleteId_type: {
            athleteId: targetAthleteId,
            type: 'TRIMP',
          },
        },
        select: {
          trainingLoadCalculationId: true,
        },
      });

    if (trimpCalculation) {
      const entries = await this.prisma.trainingLoadEntry.findMany({
        where: {
          calculationId: trimpCalculation.trainingLoadCalculationId,
          date: {
            gte: extendedStart,
            lte: normalizedEnd,
          },
        },
        select: {
          date: true,
          value: true,
        },
      });

      for (const entry of entries) {
        const weekStart = this.getWeekStart(entry.date);
        const weekKey = weekStart.toISOString();
        const summary =
          weekSummaries.get(weekKey) ||
          (() => {
            const weekEnd = this.addDays(weekStart, 6);
            const placeholder = { weekStart, weekEnd, actual: 0, estimated: 0 };
            weekSummaries.set(weekKey, placeholder);
            return placeholder;
          })();

        summary.actual += entry.value;
      }
    }

    const plannedTrainings = await this.prisma.eventTraining.findMany({
      where: {
        estimatedLoad: {
          not: null,
        },
        relatedActivityId: null,
        event: {
          athleteId: targetAthleteId,
          startDate: {
            gte: extendedStart,
            lte: normalizedEnd,
          },
          type: 'TRAINING',
        },
      },
      select: {
        estimatedLoad: true,
        event: {
          select: {
            startDate: true,
          },
        },
      },
    });

    for (const training of plannedTrainings) {
      if (training.estimatedLoad === null) {
        continue;
      }

      const eventDate = new Date(training.event.startDate);
      const weekStart = this.getWeekStart(eventDate);
      const weekKey = weekStart.toISOString();
      const summary =
        weekSummaries.get(weekKey) ||
        (() => {
          const weekEnd = this.addDays(weekStart, 6);
          const placeholder = { weekStart, weekEnd, actual: 0, estimated: 0 };
          weekSummaries.set(weekKey, placeholder);
          return placeholder;
        })();

      summary.estimated += training.estimatedLoad;
    }

    const sortedSummaries = Array.from(weekSummaries.values()).sort(
      (a, b) => a.weekStart.getTime() - b.weekStart.getTime(),
    );

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
      const acwrResult = this.calculateACWRFromWeeklyLoads(weeklyLoadsForACWR);
      let acwr: number | undefined;
      let acwrStatus:
        | 'safe'
        | 'optimal'
        | 'moderate_risk'
        | 'high_risk'
        | undefined;

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
        const nextWeekStart = this.addDays(sortedSummaries[index].weekStart, 7);
        const nextWeekEnd = this.addDays(sortedSummaries[index].weekEnd, 7);
        projectedFutureWeek = {
          weekStart: nextWeekStart,
          weekEnd: nextWeekEnd,
          actualLoad: 0,
          estimatedLoad: 0,
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
          totalLoad: Number((summary.actual + summary.estimated).toFixed(2)),
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

  private getWeekStart(date: Date): Date {
    const source = new Date(date);
    const utcDate = new Date(
      Date.UTC(source.getFullYear(), source.getMonth(), source.getDate()),
    );
    const day = (utcDate.getUTCDay() + 6) % 7;
    utcDate.setUTCDate(utcDate.getUTCDate() - day);
    return utcDate;
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }
}
