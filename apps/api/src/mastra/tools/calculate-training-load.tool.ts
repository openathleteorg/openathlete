import { createTool } from '@mastra/core';
import { z } from 'zod';

import { user } from '@openathlete/database';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { TrainingLoadService } from 'src/modules/core/services/training-load.service';

/**
 * Calculate Training Load Tool
 *
 * Wraps TrainingLoadService to provide comprehensive training load metrics
 * for a specified period using evidence-based calculations.
 *
 * METHODOLOGY:
 * - Uses TrainingLoadService which implements:
 *   - TRIMP Edwards (zone-based heart rate method)
 *   - TRIMP Banister (exponentially weighted)
 *   - Foster RPE (perceived exertion method)
 *
 * METRICS RETURNED:
 * - ATL (Acute Training Load): 7-day exponentially weighted average
 * - CTL (Chronic Training Load): 42-day exponentially weighted average
 * - TSB (Training Stress Balance): CTL - ATL
 * - Training status: overreaching | optimal | detraining
 * - Recommended load range for next period
 * - Daily load breakdown for the requested period
 *
 * USAGE:
 * - Assess current training stress and fatigue levels
 * - Identify injury risk via acute:chronic workload ratio
 * - Validate weekly/monthly load progression
 * - Support adaptation decisions based on load trends
 *
 * AUTHENTICATION:
 * - Requires userId in runtime context
 * - TrainingLoadService handles athlete lookup via user_id
 *
 * USED BY: athlete-profile.agent, qa.agent, qna.agent
 */

export const calculateTrainingLoadTool = createTool({
  id: 'calculate-training-load',
  description:
    'Calculates evidence-based training load metrics for a specified time period: TRIMP (Training Impulse), Foster load, and acute:chronic workload ratio. Use this when you need to: (1) Assess current training stress and fatigue levels, (2) Identify injury risk via acute:chronic ratio, (3) Validate weekly/monthly load progression, (4) Support adaptation decisions based on load trends. Critical for safe training progressions and injury prevention. Returns metrics with interpretation guidance.',
  inputSchema: z.object({
    startDate: z.string().describe('ISO date string'),
    endDate: z.string().describe('ISO date string'),
    calculationType: z
      .enum(['TRIMP_EDWARDS', 'TRIMP_BANISTER', 'FOSTER_RPE'])
      .optional()
      .default('TRIMP_EDWARDS')
      .describe('Type of training load calculation to use'),
  }),
  outputSchema: z.object({
    period: z.object({
      startDate: z.string(),
      endDate: z.string(),
    }),
    calculationType: z.string(),
    // Metrics from TrainingLoadService
    atl: z
      .number()
      .describe('Acute Training Load (7-day exponentially weighted average)'),
    ctl: z
      .number()
      .describe(
        'Chronic Training Load (42-day exponentially weighted average)',
      ),
    tsb: z.number().describe('Training Stress Balance (CTL - ATL)'),
    totalLoad: z.number().describe('Total load for the period'),
    trainingDays: z.number().describe('Number of training days'),
    status: z
      .enum(['overreaching', 'optimal', 'detraining'])
      .describe('Training status based on TSB'),
    recommendedLoadRange: z.object({
      min: z.number(),
      max: z.number(),
    }),
    // Daily breakdown for the period
    dailyBreakdown: z.array(
      z.object({
        date: z.string(),
        load: z.number(),
        activityCount: z.number(),
      }),
    ),
  }),
  execute: async ({ context: input, runtimeContext }) => {
    const { startDate, endDate, calculationType } = input;

    // Get services from runtime context
    const trainingLoadService = runtimeContext?.get(
      'trainingLoadService',
    ) as TrainingLoadService;
    const userId = runtimeContext?.get('userId') as user['user_id'];

    if (!trainingLoadService) {
      throw new Error('TrainingLoadService not available in runtime context');
    }

    if (!userId) {
      throw new Error('userId not available in runtime context');
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Create AuthUser object for the service
    const authUser = { user_id: userId } as AuthUser;

    // Use TrainingLoadService to get comprehensive metrics
    const loadMetrics = await trainingLoadService.getTrainingLoadMetrics(
      authUser,
      calculationType,
      end,
    );

    // Get daily breakdown for the requested period
    const dailyLoads = await trainingLoadService.getTrainingLoadByPeriod(
      authUser,
      calculationType,
      start,
      end,
    );

    const formatDate = (date: Date): string => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formattedDailyBreakdown = dailyLoads.map((day) => ({
      date: formatDate(day.date),
      load: Math.round(day.load),
      activityCount: day.activityCount,
    }));

    return {
      period: {
        startDate,
        endDate,
      },
      calculationType,
      atl: Math.round(loadMetrics.atl),
      ctl: Math.round(loadMetrics.ctl),
      tsb: Math.round(loadMetrics.tsb),
      totalLoad: Math.round(loadMetrics.totalLoad),
      trainingDays: loadMetrics.trainingDays,
      status: loadMetrics.status,
      recommendedLoadRange: {
        min: Math.round(loadMetrics.recommendedLoadRange.min),
        max: Math.round(loadMetrics.recommendedLoadRange.max),
      },
      dailyBreakdown: formattedDailyBreakdown,
    };
  },
});
