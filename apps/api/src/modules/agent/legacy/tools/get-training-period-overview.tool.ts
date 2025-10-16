import { createTool } from '@mastra/core';
import { z } from 'zod';

import { training_load_calculation_type } from '@openathlete/database';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { TrainingLoadService } from 'src/modules/core/services/training-load.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { convertSpeedForDisplay } from './helpers';

// Input type for the tool
type GetTrainingPeriodOverviewInput = {
  period:
    | 'this_week'
    | 'last_week'
    | 'this_month'
    | 'last_month'
    | 'last_7_days'
    | 'last_14_days'
    | 'last_30_days'
    | 'last_90_days';
};

// Tool context type
type ToolContext = {
  user: AuthUser | null;
};

/**
 * Calculate date range based on period
 */
function calculateDateRange(period: GetTrainingPeriodOverviewInput['period']): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  switch (period) {
    case 'this_week':
      // Start from Monday of current week
      const dayOfWeek = startDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(startDate.getDate() - daysToMonday);
      break;

    case 'last_week':
      // Previous Monday to Sunday
      const currentDay = startDate.getDay();
      const daysToLastMonday = currentDay === 0 ? 13 : currentDay + 6;
      startDate.setDate(startDate.getDate() - daysToLastMonday);
      endDate.setDate(startDate.getDate() + 6);
      break;

    case 'this_month':
      startDate.setDate(1);
      break;

    case 'last_month':
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setDate(1);
      endDate.setDate(0); // Last day of previous month
      break;

    case 'last_7_days':
      startDate.setDate(startDate.getDate() - 6);
      break;

    case 'last_14_days':
      startDate.setDate(startDate.getDate() - 13);
      break;

    case 'last_30_days':
      startDate.setDate(startDate.getDate() - 29);
      break;

    case 'last_90_days':
      startDate.setDate(startDate.getDate() - 89);
      break;
  }

  return { startDate, endDate };
}

/**
 * Factory function to create the get training period overview tool
 */
export function getTrainingPeriodOverviewToolFactory(
  prismaService: PrismaService,
  trainingLoadService: TrainingLoadService,
  toolContext: ToolContext,
) {
  return createTool({
    id: 'get-training-period-overview',
    description: `Retrieves a comprehensive overview of training data for a specified time period.

This tool provides critical information to assess:
- Training volume and workload
- Risk of overtraining or undertraining
- Whether it's safe to add more training sessions
- Overall training program quality and balance

Use this tool when:
- The user asks about their training load over a period (this week, this month, last 30 days, etc.)
- You need to evaluate if the athlete is overtraining or undertraining
- The user wants to know if they can add more training sessions
- You need comprehensive context to provide training recommendations
- The user asks about their current training cycle or program

This tool provides:
- Training Load Metrics (ATL, CTL, TSB) for all 3 calculation types:
  * Foster RPE (if available): RPE-based training load
  * TRIMP Edwards (if available): Heart rate zone-based
  * TRIMP Banister (if available): Exponential HR-based
- Volume Statistics: Total distance, duration, elevation gain, number of activities
- Activity Breakdown: Summary of all activities in the period with key metrics
- Active Training Cycles: Current cycles overlapping with the period
- Training Status: Interpretation of metrics (overreaching, optimal, detraining)

Important Notes:
- ATL (Acute Training Load): 7-day rolling average - represents recent fatigue
- CTL (Chronic Training Load): 42-day rolling average - represents fitness
- TSB (Training Stress Balance): CTL - ATL - indicates freshness vs fatigue
  * TSB < -10: High fatigue, risk of overtraining
  * TSB -10 to +25: Optimal training zone
  * TSB > +25: Risk of detraining, can add volume
- Training status helps determine if athlete can handle more load

Date Period Mapping:
- "this_week": Current week (Monday to today)
- "last_week": Previous complete week (Monday to Sunday)
- "this_month": Current month (1st to today)
- "last_month": Previous complete month
- "last_7_days": Rolling 7 days (today minus 6 days)
- "last_14_days": Rolling 14 days
- "last_30_days": Rolling 30 days
- "last_90_days": Rolling 90 days`,
    inputSchema: z.object({
      period: z
        .enum([
          'this_week',
          'last_week',
          'this_month',
          'last_month',
          'last_7_days',
          'last_14_days',
          'last_30_days',
          'last_90_days',
        ])
        .describe(
          'The time period to analyze. Use calendar periods (this_week, this_month) for program evaluation, or rolling periods (last_7_days, last_30_days) for recent trends.',
        ),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      period: z.object({
        type: z.string().describe('The period type requested'),
        start_date: z
          .string()
          .describe('Start date of the period (ISO format)'),
        end_date: z.string().describe('End date of the period (ISO format)'),
        days_count: z.number().describe('Total number of days in the period'),
      }),
      training_load_metrics: z.object({
        foster_rpe: z
          .object({
            available: z.boolean(),
            atl: z
              .number()
              .optional()
              .describe('Acute Training Load (7-day average)'),
            ctl: z
              .number()
              .optional()
              .describe('Chronic Training Load (42-day average)'),
            tsb: z
              .number()
              .optional()
              .describe('Training Stress Balance (CTL - ATL)'),
            total_load: z
              .number()
              .optional()
              .describe('Total load for the period'),
            training_days: z
              .number()
              .optional()
              .describe('Number of training days'),
            status: z
              .enum(['overreaching', 'optimal', 'detraining'])
              .optional()
              .describe('Training status based on TSB'),
            recommended_load_range: z
              .object({
                min: z.number(),
                max: z.number(),
              })
              .optional()
              .describe('Recommended weekly load range'),
          })
          .describe('RPE-based training load (if RPE data available)'),
        trimp_edwards: z
          .object({
            available: z.boolean(),
            atl: z
              .number()
              .optional()
              .describe('Acute Training Load (7-day average)'),
            ctl: z
              .number()
              .optional()
              .describe('Chronic Training Load (42-day average)'),
            tsb: z
              .number()
              .optional()
              .describe('Training Stress Balance (CTL - ATL)'),
            total_load: z
              .number()
              .optional()
              .describe('Total load for the period'),
            training_days: z
              .number()
              .optional()
              .describe('Number of training days'),
            status: z
              .enum(['overreaching', 'optimal', 'detraining'])
              .optional()
              .describe('Training status based on TSB'),
            recommended_load_range: z
              .object({
                min: z.number(),
                max: z.number(),
              })
              .optional()
              .describe('Recommended weekly load range'),
          })
          .describe('HR zone-based TRIMP (if HR data available)'),
        trimp_banister: z
          .object({
            available: z.boolean(),
            atl: z
              .number()
              .optional()
              .describe('Acute Training Load (7-day average)'),
            ctl: z
              .number()
              .optional()
              .describe('Chronic Training Load (42-day average)'),
            tsb: z
              .number()
              .optional()
              .describe('Training Stress Balance (CTL - ATL)'),
            total_load: z
              .number()
              .optional()
              .describe('Total load for the period'),
            training_days: z
              .number()
              .optional()
              .describe('Number of training days'),
            status: z
              .enum(['overreaching', 'optimal', 'detraining'])
              .optional()
              .describe('Training status based on TSB'),
            recommended_load_range: z
              .object({
                min: z.number(),
                max: z.number(),
              })
              .optional()
              .describe('Recommended weekly load range'),
          })
          .describe('Exponential HR-based TRIMP (if HR data available)'),
      }),
      volume_statistics: z.object({
        total_distance: z.number().describe('Total distance in meters'),
        total_duration: z.number().describe('Total moving time in seconds'),
        total_elevation_gain: z
          .number()
          .describe('Total elevation gain in meters'),
        activity_count: z.number().describe('Total number of activities'),
        activities_by_sport: z
          .array(
            z.object({
              sport: z.string(),
              count: z.number(),
              total_distance: z.number().describe('In meters'),
              total_duration: z.number().describe('In seconds'),
            }),
          )
          .describe('Breakdown by sport type'),
      }),
      activities: z
        .array(
          z.object({
            event_id: z.number(),
            name: z.string(),
            sport: z.string(),
            start_date: z.string(),
            distance: z.number().describe('In meters'),
            moving_time: z.number().describe('In seconds'),
            elevation_gain: z.number().describe('In meters'),
            average_heartrate: z.number().optional().describe('In bpm'),
            average_speed: z.number().describe('In m/s (raw value)'),
            average_speed_display: z
              .object({
                original_ms: z.number(),
                kmh: z.number().optional(),
                pace: z
                  .object({
                    minutes: z.number(),
                    seconds: z.number(),
                    formatted: z.string(),
                  })
                  .nullable()
                  .optional(),
                display_text: z
                  .string()
                  .describe('Use this for displaying speed to users'),
              })
              .optional(),
            rpe: z.number().optional().describe('RPE (0-1 scale)'),
          }),
        )
        .describe('List of all activities in the period'),
      active_cycles: z
        .array(
          z.object({
            cycle_id: z.number(),
            name: z.string(),
            start_date: z.string(),
            end_date: z.string(),
            description: z.string().optional(),
            is_current: z
              .boolean()
              .describe('True if the cycle overlaps with the period'),
          }),
        )
        .describe('Training cycles active during this period'),
      summary: z
        .string()
        .describe(
          'Human-readable interpretation of the data for decision-making',
        ),
    }),
    execute: async (context) => {
      const user = toolContext.user;

      if (!user) {
        throw new Error('Missing required context: user');
      }

      const params = (context as any).context as GetTrainingPeriodOverviewInput;
      const { period } = params;

      try {
        const { startDate, endDate } = calculateDateRange(period);
        const daysCount = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // 1. Fetch training load metrics for all 3 types
        const trainingLoadTypes: training_load_calculation_type[] = [
          'FOSTER_RPE',
          'TRIMP_EDWARDS',
          'TRIMP_BANISTER',
        ];

        const trainingLoadMetrics: {
          foster_rpe: any;
          trimp_edwards: any;
          trimp_banister: any;
        } = {
          foster_rpe: { available: false },
          trimp_edwards: { available: false },
          trimp_banister: { available: false },
        };

        for (const type of trainingLoadTypes) {
          try {
            const metrics = await trainingLoadService.getTrainingLoadMetrics(
              user,
              type,
              endDate,
            );

            const key =
              type === 'FOSTER_RPE'
                ? 'foster_rpe'
                : type === 'TRIMP_EDWARDS'
                  ? 'trimp_edwards'
                  : 'trimp_banister';

            trainingLoadMetrics[key] = {
              available: true,
              atl: Math.round(metrics.atl * 100) / 100,
              ctl: Math.round(metrics.ctl * 100) / 100,
              tsb: Math.round(metrics.tsb * 100) / 100,
              total_load: Math.round(metrics.totalLoad * 100) / 100,
              training_days: metrics.trainingDays,
              status: metrics.status,
              recommended_load_range: {
                min: Math.round(metrics.recommendedLoadRange.min * 100) / 100,
                max: Math.round(metrics.recommendedLoadRange.max * 100) / 100,
              },
            };
          } catch (error) {
            // If calculation type not available or no data, keep available: false
            console.log(
              `[getTrainingPeriodOverview] ${type} not available:`,
              error instanceof Error ? error.message : 'Unknown error',
            );
          }
        }

        // 2. Fetch activities for the period
        const activities = await prismaService.event.findMany({
          where: {
            athlete_id: user.user_id,
            type: 'ACTIVITY',
            start_date: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            activity: true,
          },
          orderBy: {
            start_date: 'desc',
          },
        });

        // 3. Calculate volume statistics
        let totalDistance = 0;
        let totalDuration = 0;
        let totalElevationGain = 0;
        const sportBreakdown = new Map<
          string,
          { count: number; distance: number; duration: number }
        >();

        const formattedActivities = activities
          .filter((e) => e.activity)
          .map((e) => {
            const activity = e.activity!;

            totalDistance += activity.distance || 0;
            totalDuration += activity.moving_time || 0;
            totalElevationGain += activity.elevation_gain || 0;

            // Sport breakdown
            const sport = activity.sport || 'UNKNOWN';
            const existing = sportBreakdown.get(sport) || {
              count: 0,
              distance: 0,
              duration: 0,
            };
            sportBreakdown.set(sport, {
              count: existing.count + 1,
              distance: existing.distance + (activity.distance || 0),
              duration: existing.duration + (activity.moving_time || 0),
            });

            const speedDisplay = activity.average_speed
              ? convertSpeedForDisplay(
                  activity.average_speed,
                  activity.sport || 'UNKNOWN',
                )
              : undefined;

            return {
              event_id: e.event_id,
              name: e.name,
              sport: activity.sport || 'UNKNOWN',
              start_date: e.start_date.toISOString(),
              distance: activity.distance || 0,
              moving_time: activity.moving_time || 0,
              elevation_gain: activity.elevation_gain || 0,
              average_heartrate: activity.average_heartrate || undefined,
              average_speed: activity.average_speed || 0,
              average_speed_display: speedDisplay,
              rpe: activity.rpe || undefined,
            };
          });

        const activitiesBySport = Array.from(sportBreakdown.entries()).map(
          ([sport, data]) => ({
            sport,
            count: data.count,
            total_distance: data.distance,
            total_duration: data.duration,
          }),
        );

        // 4. Fetch active cycles - directly from Prisma to avoid CASL issues
        const allCycles = await prismaService.cycle.findMany({
          where: {
            athlete_id: user.user_id,
            // Cycle overlaps with period if it starts before period ends and ends after period starts
            start_date: {
              lte: endDate,
            },
            end_date: {
              gte: startDate,
            },
          },
          orderBy: {
            start_date: 'asc',
          },
        });

        const activeCycles = allCycles.map((cycle) => ({
          cycle_id: cycle.cycle_id,
          name: cycle.name,
          start_date: cycle.start_date.toISOString(),
          end_date: cycle.end_date.toISOString(),
          description: cycle.description || undefined,
          is_current: true,
        }));

        // 5. Generate summary interpretation
        const primaryMetrics = trainingLoadMetrics.trimp_edwards.available
          ? trainingLoadMetrics.trimp_edwards
          : trainingLoadMetrics.foster_rpe.available
            ? trainingLoadMetrics.foster_rpe
            : trainingLoadMetrics.trimp_banister;

        let summary = '';

        if (primaryMetrics.available) {
          const status = primaryMetrics.status;
          const tsb = primaryMetrics.tsb!;

          summary = `Training Period Analysis (${period.replace('_', ' ')}): `;

          if (status === 'overreaching') {
            summary += `⚠️ HIGH FATIGUE DETECTED (TSB: ${tsb.toFixed(1)}). The athlete is in an overreaching state with accumulated fatigue. `;
            summary += `ATL (${primaryMetrics.atl!.toFixed(1)}) is significantly higher than CTL (${primaryMetrics.ctl!.toFixed(1)}). `;
            summary += `RECOMMENDATION: DO NOT add more training load. Consider reducing volume or adding rest days. Risk of overtraining is elevated.`;
          } else if (status === 'detraining') {
            summary += `✅ LOW FATIGUE (TSB: ${tsb.toFixed(1)}). The athlete is fresh with minimal accumulated fatigue. `;
            summary += `CTL (${primaryMetrics.ctl!.toFixed(1)}) is well above ATL (${primaryMetrics.atl!.toFixed(1)}). `;
            summary += `RECOMMENDATION: Safe to add training sessions or increase volume. Consider progressive load increase to maintain fitness.`;
          } else {
            summary += `✅ OPTIMAL TRAINING ZONE (TSB: ${tsb.toFixed(1)}). The athlete is in a balanced state between fitness and fatigue. `;
            summary += `ATL: ${primaryMetrics.atl!.toFixed(1)}, CTL: ${primaryMetrics.ctl!.toFixed(1)}. `;
            summary += `RECOMMENDATION: Current training load is well-balanced. Can maintain or slightly increase volume following the 10% rule.`;
          }

          summary += ` | Volume: ${formattedActivities.length} activities, ${(totalDistance / 1000).toFixed(1)}km, ${(totalDuration / 3600).toFixed(1)}h total.`;
        } else {
          summary = `Training Period Analysis (${period.replace('_', ' ')}): `;
          summary += `Volume: ${formattedActivities.length} activities, ${(totalDistance / 1000).toFixed(1)}km, ${(totalDuration / 3600).toFixed(1)}h. `;
          summary += `NOTE: Training load metrics (ATL/CTL/TSB) not available. Need HR data or RPE ratings for load calculation.`;
        }

        if (activeCycles.length > 0) {
          summary += ` | Active cycles: ${activeCycles.map((c) => c.name).join(', ')}.`;
        }

        console.log({
          success: true,
          period: {
            type: period,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            days_count: daysCount,
          },
          training_load_metrics: trainingLoadMetrics,
          volume_statistics: {
            total_distance: totalDistance,
            total_duration: totalDuration,
            total_elevation_gain: totalElevationGain,
            activity_count: formattedActivities.length,
            activities_by_sport: activitiesBySport,
          },
          activities: formattedActivities,
          active_cycles: activeCycles,
          summary,
        });

        return {
          success: true,
          period: {
            type: period,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            days_count: daysCount,
          },
          training_load_metrics: trainingLoadMetrics,
          volume_statistics: {
            total_distance: totalDistance,
            total_duration: totalDuration,
            total_elevation_gain: totalElevationGain,
            activity_count: formattedActivities.length,
            activities_by_sport: activitiesBySport,
          },
          activities: formattedActivities,
          active_cycles: activeCycles,
          summary,
        };
      } catch (error) {
        console.error('[getTrainingPeriodOverview] Error:', error);
        throw new Error(
          `Failed to get training period overview: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  });
}
