import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  athlete,
  metric_type,
  training_load_calculation_type,
} from '@openathlete/database';
import {
  ActivityStream,
  CompressedActivityStream,
  keysToCamel,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { uncompressActivityStream } from '../helpers/activity-stream';

/**
 * Training load calculation metadata
 */
interface TrainingLoadMetadata {
  calculationType: training_load_calculation_type;
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  /**
   * Get or create a training load calculation for an athlete
   */
  private async getOrCreateCalculation(
    athleteId: number,
    type: training_load_calculation_type,
  ) {
    let calculation = await this.prisma.training_load_calculation.findUnique({
      where: {
        athlete_id_type: {
          athlete_id: athleteId,
          type,
        },
      },
    });

    if (!calculation) {
      calculation = await this.prisma.training_load_calculation.create({
        data: {
          athlete_id: athleteId,
          type,
          is_active: true,
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
    metricType: metric_type,
  ): Promise<number | null> {
    const metric = await this.prisma.athlete_metric.findFirst({
      where: {
        athlete_id: athleteId,
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
   * Calculate TRIMP Edwards (zone-based)
   * Formula: Sum of (Duration in zone × Zone coefficient)
   * Zone coefficients: Z1=1, Z2=2, Z3=3, Z4=4, Z5=5
   */
  private calculateEdwardsTRIMP(
    stream: ActivityStream,
    hrMax: number,
    hrRest: number,
  ): { value: number; metadata: TrainingLoadMetadata } {
    if (!stream.heartrate || !stream.time) {
      throw new Error('Heart rate or time data not available');
    }

    // Define HR zones as percentages of HR max
    const zones = [
      { zone: 1, min: 0.5, max: 0.6, coefficient: 1 }, // 50-60% HR max
      { zone: 2, min: 0.6, max: 0.7, coefficient: 2 }, // 60-70%
      { zone: 3, min: 0.7, max: 0.8, coefficient: 3 }, // 70-80%
      { zone: 4, min: 0.8, max: 0.9, coefficient: 4 }, // 80-90%
      { zone: 5, min: 0.9, max: 1.0, coefficient: 5 }, // 90-100%
    ];

    // Calculate time in each zone
    const zoneDurations = zones.map((z) => ({ ...z, duration: 0 }));

    for (let i = 1; i < stream.time.length; i++) {
      const hr = stream.heartrate[i];
      const timeDelta = stream.time[i] - stream.time[i - 1];

      if (hr && timeDelta > 0) {
        const hrPercent = (hr - hrRest) / (hrMax - hrRest);

        for (const zone of zoneDurations) {
          if (hrPercent >= zone.min && hrPercent < zone.max) {
            zone.duration += timeDelta;
            break;
          }
        }
      }
    }

    // Calculate TRIMP
    const trimp = zoneDurations.reduce(
      (sum, zone) => sum + (zone.duration / 60) * zone.coefficient,
      0,
    );

    const avgHr =
      stream.heartrate.reduce((sum, hr) => sum + (hr || 0), 0) /
      stream.heartrate.length;

    return {
      value: trimp,
      metadata: {
        calculationType: 'TRIMP_EDWARDS',
        duration: stream.time[stream.time.length - 1],
        avgHr,
        hrMax,
        hrRest,
        zones: zoneDurations.map((z) => ({
          zone: z.zone,
          duration: z.duration,
          coefficient: z.coefficient,
        })),
      },
    };
  }

  /**
   * Calculate TRIMP Banister (exponential weighting)
   * Formula: Duration × HR fraction × 0.64 × e^(1.92 × HR fraction)
   * where HR fraction = (HR - HR rest) / (HR max - HR rest)
   */
  private calculateBanisterTRIMP(
    stream: ActivityStream,
    hrMax: number,
    hrRest: number,
    gender: 'male' | 'female' = 'male',
  ): { value: number; metadata: TrainingLoadMetadata } {
    if (!stream.heartrate || !stream.time) {
      throw new Error('Heart rate or time data not available');
    }

    const hrReserve = hrMax - hrRest;

    // Gender-specific coefficients (Banister et al.)
    const k = gender === 'male' ? 1.92 : 1.67;
    const y = gender === 'male' ? 0.64 : 0.86;

    let trimp = 0;
    let totalHr = 0;
    let validPoints = 0;

    for (let i = 1; i < stream.time.length; i++) {
      const hr = stream.heartrate[i];
      const timeDelta = (stream.time[i] - stream.time[i - 1]) / 60; // Convert to minutes

      if (hr && timeDelta > 0) {
        const hrFraction = (hr - hrRest) / hrReserve;

        if (hrFraction > 0) {
          // Banister TRIMP formula
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
        calculationType: 'TRIMP_BANISTER',
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
          user_id: user.user_id,
        },
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Get activity to verify ownership
    const event = await this.prisma.event.findFirst({
      where: {
        event_id: activityId,
        athlete_id: athlete.athlete_id,
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
    const entries = await this.prisma.training_load_entry.findMany({
      where: {
        activity_id: event.activity.event_activity_id,
      },
      include: {
        calculation: true,
      },
    });

    return entries.map((entry) => keysToCamel(entry));
  }

  /**
   * Calculate training load for an activity
   */
  async calculateActivityLoad(
    user: AuthUser,
    activityId: number,
    calculationType: training_load_calculation_type,
  ) {
    // Get athlete with user info
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          user_id: user.user_id,
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
        event_id: activityId,
        athlete_id: athlete.athlete_id,
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
      athlete.athlete_id,
      calculationType,
    );

    let result: { value: number; metadata: TrainingLoadMetadata };

    switch (calculationType) {
      case 'FOSTER_RPE':
        if (!activity.rpe) {
          throw new Error('RPE not available for this activity');
        }
        result = this.calculateFosterLoad(activity.rpe, activity.moving_time);
        break;

      case 'TRIMP_EDWARDS':
      case 'TRIMP_BANISTER': {
        // Get HR metrics
        const hrMax = await this.getLatestMetric(
          athlete.athlete_id,
          'HR_MAX' as metric_type,
        );
        const hrRest = await this.getLatestMetric(
          athlete.athlete_id,
          'HR_REST' as metric_type,
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

        if (calculationType === 'TRIMP_EDWARDS') {
          result = this.calculateEdwardsTRIMP(stream, hrMax, hrRest);
        } else {
          // Convert gender to 'male' | 'female' for TRIMP calculation
          // Default to 'male' if not set or 'OTHER'
          const gender = athlete.user.gender === 'FEMALE' ? 'female' : 'male';
          result = this.calculateBanisterTRIMP(stream, hrMax, hrRest, gender);
        }
        break;
      }

      default:
        throw new Error(`Unknown calculation type: ${calculationType}`);
    }

    // Save or update training load entry
    const existingEntry = await this.prisma.training_load_entry.findUnique({
      where: {
        calculation_id_activity_id: {
          calculation_id: calculation.training_load_calculation_id,
          activity_id: activity.event_activity_id,
        },
      },
    });

    const startDate = new Date(event.start_date);
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
      return keysToCamel(
        await this.prisma.training_load_entry.update({
          where: {
            training_load_entry_id: existingEntry.training_load_entry_id,
          },
          data: {
            value: result.value,
            metadata: result.metadata as object,
            date: activityDate,
          },
        }),
      );
    }

    return keysToCamel(
      await this.prisma.training_load_entry.create({
        data: {
          calculation_id: calculation.training_load_calculation_id,
          activity_id: activity.event_activity_id,
          date: activityDate,
          value: result.value,
          metadata: result.metadata as object,
        },
      }),
    );
  }

  /**
   * Get training load entries for a period
   */
  async getTrainingLoadByPeriod(
    user: AuthUser,
    calculationType: training_load_calculation_type,
    startDate: Date,
    endDate: Date,
    athleteId?: athlete['athlete_id'],
  ): Promise<DailyTrainingLoad[]> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's training load to fetch
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can access this athlete's data
      const athlete = await this.prisma.athlete.findUnique({
        where: { athlete_id: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      // Use current user's athlete ID
      const athlete = await this.prisma.athlete.findFirst({
        where: {
          user: {
            user_id: user.user_id,
          },
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      targetAthleteId = athlete.athlete_id;
    }

    const calculation = await this.prisma.training_load_calculation.findUnique({
      where: {
        athlete_id_type: {
          athlete_id: targetAthleteId,
          type: calculationType,
        },
      },
    });

    if (!calculation) {
      return [];
    }

    const entries = await this.prisma.training_load_entry.findMany({
      where: {
        calculation_id: calculation.training_load_calculation_id,
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
    calculationType: training_load_calculation_type,
    targetDate: Date = new Date(),
    athleteId?: athlete['athlete_id'],
  ): Promise<TrainingLoadMetrics> {
    const ability = await this.abilities.getFor({ user });

    // Determine which athlete's training load to fetch
    let targetAthleteId: number;

    if (athleteId) {
      // Check if user can access this athlete's data
      const athlete = await this.prisma.athlete.findUnique({
        where: { athlete_id: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      // Use current user's athlete ID
      const athlete = await this.prisma.athlete.findFirst({
        where: {
          user: {
            user_id: user.user_id,
          },
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      targetAthleteId = athlete.athlete_id;
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
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= targetDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const load = loadMap.get(dateKey) || 0; // 0 load for rest days

      allDays.push({
        date: new Date(currentDate),
        load,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate exponentially weighted moving averages using ALL days (including rest days)
    let atl = 0;
    let ctl = 0;

    const alphaATL = 2 / 8; // 7-day EWMA
    const alphaCTL = 2 / 43; // 42-day EWMA

    for (const day of allDays) {
      // Update EWMA (even for days with 0 load - this causes fitness decay)
      atl = alphaATL * day.load + (1 - alphaATL) * atl;
      ctl = alphaCTL * day.load + (1 - alphaCTL) * ctl;
    }

    const tsb = ctl - atl;

    // Calculate total load for the period
    const totalLoad = dailyLoads.reduce((sum, day) => sum + day.load, 0);
    const trainingDays = dailyLoads.length;

    // Determine training status based on TSB
    let status: 'overreaching' | 'optimal' | 'detraining';
    if (tsb < -10) {
      status = 'overreaching';
    } else if (tsb > 25) {
      status = 'detraining';
    } else {
      status = 'optimal';
    }

    // Calculate recommended load range (10% progression rule)
    const avgWeeklyLoad = totalLoad / (trainingDays / 7 || 1);
    const recommendedLoadRange = {
      min: avgWeeklyLoad * 0.95,
      max: avgWeeklyLoad * 1.1,
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
    calculationType: training_load_calculation_type,
    startDate: Date,
    endDate: Date,
    athleteId?: athlete['athlete_id'],
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
        where: { athlete_id: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      if (!ability.can('read', subject('athlete', athlete))) {
        throw new ForbiddenException('Not allowed to access this athlete');
      }

      targetAthleteId = athleteId;
    } else {
      // Use current user's athlete ID
      const athlete = await this.prisma.athlete.findFirst({
        where: {
          user: {
            user_id: user.user_id,
          },
        },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      targetAthleteId = athlete.athlete_id;
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

    const alphaATL = 2 / 8; // 7-day EWMA
    const alphaCTL = 2 / 43; // 42-day EWMA

    for (const day of allDays) {
      // Update EWMA (even for days with 0 load - this causes fitness decay)
      atl = alphaATL * day.load + (1 - alphaATL) * atl;
      ctl = alphaCTL * day.load + (1 - alphaCTL) * ctl;
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

  /**
   * Recalculate all training loads for an athlete
   * Useful when HR metrics are updated or for bulk recalculation
   */
  async recalculateAllLoads(
    user: AuthUser,
    calculationType: training_load_calculation_type,
  ): Promise<{ processed: number; errors: number }> {
    const athlete = await this.prisma.athlete.findFirst({
      where: {
        user: {
          user_id: user.user_id,
        },
      },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Get all activities
    const events = await this.prisma.event.findMany({
      where: {
        athlete_id: athlete.athlete_id,
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
        await this.calculateActivityLoad(user, event.event_id, calculationType);
        processed++;
      } catch (error) {
        console.error(
          `Failed to calculate load for activity ${event.event_id}:`,
          error,
        );
        errors++;
      }
    }

    return { processed, errors };
  }
}
