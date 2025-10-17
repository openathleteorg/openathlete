import { createTool } from '@mastra/core';
import { z } from 'zod';

import { SPORT_TYPE } from '@openathlete/shared';
import { keysToCamel } from '@openathlete/shared';

// Output type for a single activity
type ActivityDetail = {
  eventActivityId: number;
  eventId: number;
  name: string;
  sport: string;
  distance: number;
  elevationGain: number;
  movingTime: number;
  averageSpeed: number;
  maxSpeed: number;
  averageCadence?: number;
  averageWatts?: number;
  maxWatts?: number;
  averageHeartrate?: number;
  maxHeartrate?: number;
  kilojoules?: number;
  rpe?: number;
  startDate: string;
  endDate: string;
  description?: string;
  externalId: string;
  provider?: string;
};

/**
 * Fetch Activities Tool
 *
 * Purpose: Retrieve completed activities (event_activity) with detailed metrics for analysis and comparison.
 *
 * This tool queries the event_activity table with flexible filtering options to get
 * workouts that were actually completed by the athlete. It returns comprehensive
 * performance data including pace, heart rate, power, elevation, and subjective metrics.
 *
 * Used by:
 * - qna.agent: To answer questions about activity history and performance
 * - athlete-profile.agent: To analyze recent training patterns
 * - adaptation.agent: To understand current training load context
 *
 * Input:
 * - startDate: Optional start of date range (ISO format)
 * - endDate: Optional end of date range (ISO format)
 * - sports: Optional array of sport types to filter
 * - limit: Maximum results to return (default: 50, max: 999)
 * - orderBy: How to sort results (date/distance/duration)
 * - includeDescription: Whether to include activity descriptions
 *
 * Note: athleteId is automatically provided from the authenticated user context - no need to specify it!
 *
 * Output:
 * - activities: Array of activity details with all metrics
 * - totalCount: Number of activities returned
 * - hasMore: Whether there are more results beyond the limit
 * - message: Human-readable summary
 */
export const fetchActivitiesTool = createTool({
  id: 'fetch-activities',
  description: `Retrieves completed activities (workouts that were actually done) with detailed metrics.

Use this tool when the user wants to:
- See their activity history (e.g., "show me my runs from last month")
- Get specific activities for comparison (e.g., "my last 5 trail runs")
- Analyze performance data (pace, heart rate, elevation, etc.)
- Review training volume over time

This tool returns ONLY completed activities (event_activity records), NOT planned sessions.

IMPORTANT: You do NOT need to ask the user for their athlete ID - it is automatically available from the authenticated session context.

The tool will:
1. Automatically use the authenticated athlete's ID
2. Filter by date range if specified
3. Filter by sport type(s) - can search multiple sports at once
4. Return activities with complete metrics (pace, HR, elevation, power, etc.)
5. Order by date (most recent first) or by distance/duration
6. Limit results to a specified number (default: 50, max: 999)

IMPORTANT - Setting the right limit:
- User asks "show me" / "get my" without number → Use default (50)
- User asks "my last N" / "mes N dernières" → Use that specific number as limit
- User asks "how many" / "combien de" / wants to count → Use limit: 999 (maximum)
- If hasMore: true and user wanted to count all, inform them there are more than 999

Each activity includes:
- Basic info: name, sport, date
- Performance metrics: distance, duration, average/max speed
- Effort metrics: heart rate, power, cadence
- Terrain: elevation gain
- Subjective: RPE (Rate of Perceived Exertion)
- Description if requested

This is essential for understanding training history, progress tracking, and performance analysis.`,
  inputSchema: z.object({
    startDate: z
      .string()
      .optional()
      .describe(
        'Start of date range (ISO format like "2024-01-01"). Returns activities on or after this date.',
      ),
    endDate: z
      .string()
      .optional()
      .describe(
        'End of date range (ISO format). Returns activities on or before this date.',
      ),
    sports: z
      .array(z.nativeEnum(SPORT_TYPE))
      .optional()
      .describe(
        'Filter by sport types. Can specify multiple sports (e.g., ["RUNNING", "TRAIL_RUNNING"]). If not specified, returns all sports.',
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(999)
      .default(50)
      .describe(
        'Maximum number of activities to return. Default: 50, Maximum: 999. Use 999 when user asks "how many" to get complete count.',
      ),
    orderBy: z
      .enum(['date', 'distance', 'duration'])
      .default('date')
      .describe(
        'How to order results. "date" = most recent first (default), "distance" = longest first, "duration" = longest time first.',
      ),
    includeDescription: z
      .boolean()
      .default(false)
      .describe(
        'Whether to include activity descriptions. Set to true if user wants detailed notes.',
      ),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    activities: z.array(
      z.object({
        eventActivityId: z.number(),
        eventId: z.number(),
        name: z.string(),
        sport: z.string(),
        distance: z.number().describe('In meters'),
        elevationGain: z.number().describe('In meters'),
        movingTime: z.number().describe('In seconds'),
        averageSpeed: z.number().describe('In m/s'),
        maxSpeed: z.number().describe('In m/s'),
        averageCadence: z.number().optional().describe('In rpm'),
        averageWatts: z.number().optional().describe('In watts'),
        maxWatts: z.number().optional().describe('In watts'),
        averageHeartrate: z.number().optional().describe('In bpm'),
        maxHeartrate: z.number().optional().describe('In bpm'),
        kilojoules: z.number().optional().describe('In kJ'),
        rpe: z.number().optional().describe('Rate of Perceived Exertion (0-1)'),
        startDate: z.string(),
        endDate: z.string(),
        description: z.string().optional(),
        externalId: z.string(),
        provider: z.string().optional(),
      }),
    ),
    totalCount: z.number().describe('Total number of activities returned'),
    hasMore: z
      .boolean()
      .describe('Whether there are more activities matching the criteria'),
    message: z.string().optional(),
  }),
  execute: async ({ context: input, runtimeContext }) => {
    try {
      // Get athleteId and prisma from RuntimeContext
      const athleteId = runtimeContext?.get('athleteId');
      const prisma = runtimeContext?.get('prisma');

      if (!athleteId) {
        console.error('[ERROR] athleteId not found in RuntimeContext');
        throw new Error(
          'athleteId not found in context - authentication issue',
        );
      }

      if (!prisma) {
        console.error('[ERROR] prisma not found in RuntimeContext');
        throw new Error('Database service not available in context');
      }
      const {
        startDate,
        endDate,
        sports,
        limit = 50,
        orderBy = 'date',
        includeDescription = false,
      } = input;

      // Build the where clause dynamically
      const whereClause: any = {
        event: {
          athlete_id: athleteId,
          type: 'ACTIVITY', // Only fetch completed activities
        },
      };

      // Filter by sport types if specified
      if (sports && sports.length > 0) {
        whereClause.sport = {
          in: sports,
        };
      }

      // Handle date filtering on the related event
      if (startDate || endDate) {
        whereClause.event.start_date = {};
        if (startDate) {
          whereClause.event.start_date.gte = new Date(startDate);
        }
        if (endDate) {
          const endDateObj = new Date(endDate);
          // Include the entire day
          endDateObj.setHours(23, 59, 59, 999);
          whereClause.event.start_date.lte = endDateObj;
        }
      }

      // Determine order by clause
      let orderByClause: any;
      switch (orderBy) {
        case 'distance':
          orderByClause = { distance: 'desc' };
          break;
        case 'duration':
          orderByClause = { moving_time: 'desc' };
          break;
        case 'date':
        default:
          orderByClause = { event: { start_date: 'desc' } };
          break;
      }

      // Fetch activities with a limit + 1 to check if there are more
      const activities = await prisma.event_activity.findMany({
        where: whereClause,
        include: {
          event: true, // Include related event for date and name
        },
        orderBy: orderByClause,
        take: limit + 1, // Fetch one more to check if there are more results
      });

      console.log(
        '[DEBUG] Found activities:',
        activities.length,
        '(limit was',
        limit,
        ')',
      );

      // Check if there are more results
      const hasMore = activities.length > limit;
      const activitiesToReturn = hasMore
        ? activities.slice(0, limit)
        : activities;

      // Transform activities to output format with camelCase mapping
      const formattedActivities: ActivityDetail[] = activitiesToReturn.map(
        (activity) => {
          // Map the activity fields using keysToCamel
          const mappedActivity = keysToCamel(activity) as any;

          return {
            eventActivityId: mappedActivity.eventActivityId,
            eventId: mappedActivity.eventId,
            name: mappedActivity.event.name,
            sport: mappedActivity.sport,
            distance: mappedActivity.distance,
            elevationGain: mappedActivity.elevationGain,
            movingTime: mappedActivity.movingTime,
            averageSpeed: mappedActivity.averageSpeed,
            maxSpeed: mappedActivity.maxSpeed,
            averageCadence: mappedActivity.averageCadence,
            averageWatts: mappedActivity.averageWatts,
            maxWatts: mappedActivity.maxWatts,
            averageHeartrate: mappedActivity.averageHeartrate,
            maxHeartrate: mappedActivity.maxHeartrate,
            kilojoules: mappedActivity.kilojoules,
            rpe: mappedActivity.rpe,
            startDate: mappedActivity.event.startDate,
            endDate: mappedActivity.event.endDate,
            description: includeDescription
              ? mappedActivity.description
              : undefined,
            externalId: mappedActivity.externalId,
            provider: mappedActivity.provider,
          };
        },
      );

      // Build a descriptive message
      let message = `Found ${formattedActivities.length} activity(ies)`;
      if (sports && sports.length > 0) {
        message += ` for sport(s): ${sports.join(', ')}`;
      }
      if (startDate || endDate) {
        message += ` within date range`;
      }
      if (hasMore) {
        message += `. More results available (showing first ${limit}).`;
      }

      console.log('[DEBUG] Returning formatted activities:', message);

      return {
        success: true,
        activities: formattedActivities,
        totalCount: formattedActivities.length,
        hasMore,
        message,
      };
    } catch (error) {
      console.error('[fetchActivitiesTool] Error fetching activities:', error);
      throw new Error(
        `Failed to retrieve activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
