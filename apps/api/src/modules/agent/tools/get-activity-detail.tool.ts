import { createTool } from '@mastra/core';
import { z } from 'zod';

import { event_activity, sport_type } from '@openathlete/database';
import { CompressedActivityStream } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import {
  StreamSegmentQuery,
  analyzeStreamSegment,
  getStreamTypes,
  hasStreamData,
} from 'src/modules/core/helpers/activity-stream-analysis';
import {
  ActivityDetailService,
  FullActivity,
} from 'src/modules/core/services/activity-detail.service';

// Input type for the tool
type GetActivityDetailInput = {
  // Search criteria - at least one should be provided
  activityId?: number;
  date?: string; // ISO date or relative like "last wednesday", "2 days ago"
  name?: string; // Search by activity name (partial match)
  position?: 'last' | 'first'; // Get the most recent or oldest activity
  sport?: sport_type;

  // Stream query options (all optional, for advanced analysis)
  streamQuery?: StreamSegmentQuery;
};

// Tool context type (shared context that gets updated)
type ToolContext = {
  user: AuthUser | null;
};

/**
 * Parse relative date strings like "last wednesday", "2 days ago", "yesterday"
 */
function parseRelativeDate(dateStr: string): Date | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lowerStr = dateStr.toLowerCase().trim();

  // Today, yesterday, tomorrow
  if (lowerStr === 'today' || lowerStr === "aujourd'hui") return today;
  if (lowerStr === 'yesterday' || lowerStr === 'hier') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }
  if (lowerStr === 'tomorrow' || lowerStr === 'demain') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // "X days ago" or "il y a X jours"
  const daysAgoMatch = lowerStr.match(
    /(?:(\d+)\s+days?\s+ago)|(?:il\s+y\s+a\s+(\d+)\s+jours?)/,
  );
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1] || daysAgoMatch[2]);
    const date = new Date(today);
    date.setDate(date.getDate() - days);
    return date;
  }

  // "last [day of week]" or "[day] dernier"
  const dayNames = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
    lundi: 1,
    mardi: 2,
    mercredi: 3,
    jeudi: 4,
    vendredi: 5,
    samedi: 6,
    dimanche: 0,
  };

  for (const [dayName, dayIndex] of Object.entries(dayNames)) {
    const regex = new RegExp(
      `(?:last\\s+${dayName})|(?:${dayName}\\s+dernier)`,
      'i',
    );
    if (regex.test(lowerStr)) {
      const currentDay = today.getDay();
      let daysBack = currentDay - dayIndex;
      if (daysBack <= 0) daysBack += 7; // Go to last week
      const date = new Date(today);
      date.setDate(date.getDate() - daysBack);
      return date;
    }
  }

  // Try to parse as ISO date
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (error) {
    // Ignore parsing errors
  }

  return null;
}

/**
 * Format activity response with all details
 */
function formatActivityResponse(
  event: FullActivity,
  activity: event_activity,
  streamQuery?: StreamSegmentQuery,
): any {
  // Format moving time
  const hours = Math.floor(activity.moving_time / 3600);
  const minutes = Math.floor((activity.moving_time % 3600) / 60);
  const seconds = activity.moving_time % 60;
  const movingTimeFormatted =
    hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;

  // Calculate pace (for running)
  const averagePaceMinKm =
    activity.sport === 'RUNNING' && activity.average_speed > 0
      ? 1000 / (activity.average_speed * 60)
      : undefined;

  const averageGapPaceMinKm =
    activity.sport === 'RUNNING' && activity.average_gap_speed
      ? 1000 / (activity.average_gap_speed * 60)
      : undefined;

  // Stream availability
  const hasStream = hasStreamData(activity.stream as any);
  const streamTypes = getStreamTypes(activity.stream as any);

  const response: any = {
    activity: {
      event_id: event.event_id,
      event_activity_id: activity.event_activity_id,
      name: event.name,
      sport: activity.sport,
      start_date: event.start_date.toISOString(),
      end_date: event.end_date.toISOString(),
      description: activity.description || undefined,

      // Distance
      distance_m: activity.distance,
      distance_km: activity.distance / 1000,
      elevation_gain_m: activity.elevation_gain,

      // Time
      moving_time_seconds: activity.moving_time,
      moving_time_formatted: movingTimeFormatted,

      // Speed
      average_speed_ms: activity.average_speed,
      average_speed_kmh: activity.average_speed * 3.6,
      average_pace_min_km: averagePaceMinKm,
      max_speed_ms: activity.max_speed,
      max_speed_kmh: activity.max_speed * 3.6,

      // Optional metrics
      average_cadence_rpm: activity.average_cadence || undefined,
      average_watts: activity.average_watts || undefined,
      max_watts: activity.max_watts || undefined,
      weighted_average_watts: activity.weighted_average_watts || undefined,
      average_heartrate_bpm: activity.average_heartrate || undefined,
      max_heartrate_bpm: activity.max_heartrate || undefined,
      kilojoules: activity.kilojoules || undefined,
      rpe: activity.rpe || undefined,

      // GAP & Normalized
      average_gap_speed_ms: activity.average_gap_speed || undefined,
      average_gap_pace_min_km: averageGapPaceMinKm,
      average_normalized_speed_ms:
        activity.average_normalized_speed || undefined,

      // Provider
      provider: activity.provider || undefined,
      external_id: activity.external_id,

      // Equipment
      equipment_id: activity.equipment_id || undefined,

      // Stream info
      has_stream: hasStream,
      stream_types: streamTypes.length > 0 ? streamTypes : undefined,
    },
  };

  // If stream query is requested, analyze it
  if (streamQuery && hasStream && activity.stream) {
    try {
      const analysis = analyzeStreamSegment(
        activity.stream as CompressedActivityStream,
        streamQuery,
      );
      if (analysis) {
        response.stream_analysis = analysis;
      }
    } catch (error) {
      console.error('[getActivityDetailTool] Stream analysis error:', error);
      // Don't fail the entire request if stream analysis fails
      response.stream_analysis_error =
        'Failed to analyze stream segment. The stream data may be incomplete.';
    }
  }

  return response;
}

export function getActivityDetailToolFactory(
  activityDetailService: ActivityDetailService,
  toolContext: ToolContext, // Shared context that gets updated dynamically
) {
  return createTool({
    id: 'get-activity-detail',
    description: `Retrieves detailed information about a specific activity with advanced stream analysis capabilities. 
    
Use this when the user wants:
- Details about a specific activity (by ID, date, name, or position like "last" or "first")
- In-depth analysis of an activity
- Segment analysis (e.g., "what was my pace between km 3 and 4?", "my heart rate during the first 30 minutes")

The tool can query stream data to calculate metrics for specific segments based on:
- Distance ranges (e.g., from 3000m to 4000m)
- Time ranges (e.g., from 600s to 1800s)
- Altitude ranges (e.g., from 500m to 800m)

Available metrics for segment analysis:
- Average and max speed (with pace conversion for running)
- Average and max heart rate
- Average cadence
- Average power (watts)
- Grade-adjusted pace (GAP)
- Elevation gain/loss within segment`,

    inputSchema: z.object({
      activityId: z
        .number()
        .int()
        .positive()
        .optional()
        .describe('The specific activity ID to retrieve'),
      date: z
        .string()
        .optional()
        .describe(
          'Date of the activity. Can be: ISO date (2023-10-15), relative ("yesterday", "last wednesday", "2 days ago")',
        ),
      name: z
        .string()
        .optional()
        .describe(
          'Search for activity by name (partial match, case-insensitive)',
        ),
      position: z
        .enum(['last', 'first'])
        .optional()
        .describe('Get the most recent (last) or oldest (first) activity'),
      sport: z
        .enum(['RUNNING', 'CYCLING', 'SWIMMING', 'OTHER'])
        .optional()
        .describe('Filter by sport type'),

      // Advanced stream query
      streamQuery: z
        .object({
          type: z
            .enum(['distance', 'time', 'altitude'])
            .describe('Query segment based on distance, time, or altitude'),
          from: z
            .number()
            .describe(
              'Start value: meters for distance, seconds for time, meters for altitude',
            ),
          to: z
            .number()
            .describe(
              'End value: meters for distance, seconds for time, meters for altitude',
            ),
          metrics: z
            .array(
              z.enum([
                'avg_speed',
                'max_speed',
                'avg_heartrate',
                'max_heartrate',
                'avg_cadence',
                'avg_watts',
                'avg_gap',
                'elevation_gain',
                'elevation_loss',
              ]),
            )
            .optional()
            .describe('Metrics to calculate for this segment'),
        })
        .optional()
        .describe('Advanced stream query for segment analysis'),
    }),

    outputSchema: z.object({
      activity: z
        .object({
          event_id: z.number(),
          event_activity_id: z.number(),
          name: z.string(),
          sport: z.string(),
          start_date: z.string(),
          end_date: z.string(),
          description: z.string().optional(),

          // Activity metrics
          distance_m: z.number(),
          distance_km: z.number(),
          elevation_gain_m: z.number(),
          moving_time_seconds: z.number(),
          moving_time_formatted: z.string(),
          average_speed_ms: z.number(),
          average_speed_kmh: z.number(),
          average_pace_min_km: z.number().optional(),
          max_speed_ms: z.number(),
          max_speed_kmh: z.number(),

          // Optional metrics
          average_cadence_rpm: z.number().optional(),
          average_watts: z.number().optional(),
          max_watts: z.number().optional(),
          weighted_average_watts: z.number().optional(),
          average_heartrate_bpm: z.number().optional(),
          max_heartrate_bpm: z.number().optional(),
          kilojoules: z.number().optional(),
          rpe: z.number().optional(),
          average_gap_speed_ms: z.number().optional(),
          average_gap_pace_min_km: z.number().optional(),
          average_normalized_speed_ms: z.number().optional(),

          // Provider info
          provider: z.string().optional(),
          external_id: z.string(),

          // Equipment
          equipment_id: z.number().optional(),

          // Stream availability
          has_stream: z.boolean(),
          stream_types: z.array(z.string()).optional(),
        })
        .optional(),

      // Stream query result (if requested)
      stream_analysis: z.record(z.unknown()).optional(),
      stream_analysis_error: z.string().optional(),

      // If not found
      not_found: z.boolean().optional(),
      message: z.string().optional(),
    }),

    execute: async (context) => {
      const user = toolContext.user;

      if (!user) {
        throw new Error('Missing required context: user');
      }

      const params = (context as any).context as GetActivityDetailInput;
      const { activityId, date, name, position, sport, streamQuery } = params;

      try {
        // Parse date if provided
        let parsedDate: Date | undefined;
        if (date) {
          const parsed = parseRelativeDate(date);
          if (parsed) {
            parsedDate = parsed;
          }
        }

        // Find activity using the service
        const activity = await activityDetailService.findActivity({
          athleteId: user.user_id,
          activityId,
          date: parsedDate,
          name,
          position,
          sport,
        });

        if (!activity || !activity.activity) {
          let message = 'No matching activity found';
          if (activityId) {
            message = `Activity with ID ${activityId} not found`;
          } else if (name) {
            message = `No activity found matching "${name}"`;
          } else if (date) {
            message = `No activity found for ${date}`;
          }

          return {
            not_found: true,
            message,
          };
        }

        return formatActivityResponse(activity, activity.activity, streamQuery);
      } catch (error) {
        console.error('[getActivityDetailTool] Error:', error);
        throw new Error(
          `Failed to retrieve activity details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  });
}
