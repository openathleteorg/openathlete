import { createTool } from '@mastra/core';
import { z } from 'zod';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  enrichActivityWithReadableSpeeds,
  getSpeedExplanation,
} from './helpers';

// Input type for the tool
type GetActivityDetailsInput = {
  eventId: number;
};

// Tool context type
type ToolContext = {
  user: AuthUser | null;
};

/**
 * Factory function to create the get activity details tool
 * This tool retrieves comprehensive information about a completed activity
 */
export function getActivityDetailsToolFactory(
  prismaService: PrismaService,
  toolContext: ToolContext,
) {
  return createTool({
    id: 'get-activity-details',
    description: `Retrieves complete detailed information about a specific completed activity (ACTIVITY type event).

Use this tool when:
- The user wants detailed information about a specific completed workout/session
- After finding an activity with findEvent or listEvents
- The user asks about metrics, performance data, weather conditions, or records from a specific activity

This tool provides:
- Basic activity information (name, date, sport, description)
- Performance metrics (distance, duration, speed, pace, elevation, heart rate, power, cadence)
- Weather conditions during the activity (if available)
- Performance normalization factors (impact of weather, terrain on performance)
- Equipment used during the activity
- Records achieved during this activity
- Related training session (if this activity was linked to a planned training)

IMPORTANT - Speed/Pace Display:
- Raw speed values are in m/s (average_speed, max_speed, etc.)
- ALWAYS use the *_display fields (average_speed_display, max_speed_display, etc.) when showing speeds to users
- These display fields provide human-readable formats:
  * For running: pace in min/km (e.g., "5:30 min/km") with km/h as secondary
  * For cycling: speed in km/h (e.g., "25.5 km/h") with min/km as secondary
  * The display_text field has the formatted string ready to show to users
- Use the speed_explanation field to understand which unit to emphasize for the sport type

Note: This does NOT include the detailed stream data (second-by-second data). Use a separate tool for that.`,
    inputSchema: z.object({
      eventId: z
        .number()
        .int()
        .positive()
        .describe('The ID of the event to retrieve activity details for'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      activity: z
        .object({
          // Event information
          event_id: z.number(),
          name: z.string(),
          start_date: z.string(),
          end_date: z.string(),
          type: z.string(),

          // Activity specific data
          activity_id: z.number(),
          provider: z.string().optional(),
          external_id: z.string(),
          sport: z.string(),
          description: z.string(),

          // Performance metrics
          distance: z.number().describe('In meters'),
          elevation_gain: z.number().describe('In meters'),
          moving_time: z.number().describe('In seconds'),
          average_speed: z
            .number()
            .describe('In m/s (use _display fields for user-friendly format)'),
          max_speed: z
            .number()
            .describe('In m/s (use _display fields for user-friendly format)'),
          average_gap_speed: z
            .number()
            .optional()
            .describe('In m/s (use _display fields for user-friendly format)'),
          average_normalized_speed: z
            .number()
            .optional()
            .describe('In m/s (use _display fields for user-friendly format)'),

          // Human-readable speed conversions
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
                .describe(
                  'Human-readable speed/pace formatted for display to user',
                ),
            })
            .optional(),
          max_speed_display: z
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
                .describe(
                  'Human-readable speed/pace formatted for display to user',
                ),
            })
            .optional(),
          average_gap_speed_display: z
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
                .describe(
                  'Human-readable GAP (Grade Adjusted Pace) formatted for display to user',
                ),
            })
            .optional(),
          average_normalized_speed_display: z
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
                .describe(
                  'Human-readable normalized speed formatted for display to user',
                ),
            })
            .optional(),
          speed_explanation: z
            .string()
            .describe(
              'Explanation of which speed unit to prefer for this sport',
            ),

          // Optional metrics
          average_cadence: z.number().optional().describe('In rpm/spm'),
          average_watts: z.number().optional().describe('In watts'),
          max_watts: z.number().optional().describe('In watts'),
          weighted_average_watts: z.number().optional().describe('In watts'),
          average_heartrate: z.number().optional().describe('In bpm'),
          max_heartrate: z.number().optional().describe('In bpm'),
          kilojoules: z.number().optional().describe('In kJ'),
          rpe: z.number().optional().describe('RPE (0-1)'),

          // Related data
          equipment: z
            .object({
              equipment_id: z.number(),
              name: z.string(),
              type: z.string(),
              total_distance: z.number(),
              is_default: z.boolean(),
            })
            .optional(),

          weather: z
            .object({
              weather_id: z.number(),
              provider: z.string().optional(),
              resolution_m: z.number(),
              samples: z.any().describe('JSON array of weather samples'),
            })
            .optional(),

          normalization: z
            .object({
              normalization_id: z.number(),
              average_normalized_speed: z.number().optional(),
              factors: z.array(
                z.object({
                  factor: z.string(),
                  time_seconds: z.number(),
                  percent: z.number(),
                }),
              ),
            })
            .optional(),

          records: z.array(
            z.object({
              record_id: z.number(),
              type: z.string(),
              distance: z.number(),
              value: z.number(),
              date: z.string(),
              start_duration: z.number().optional(),
              end_duration: z.number().optional(),
            }),
          ),

          related_training: z
            .object({
              training_id: z.number(),
              event_id: z.number(),
              name: z.string(),
            })
            .optional(),
        })
        .optional(),
      message: z.string().optional(),
    }),
    execute: async (context) => {
      const user = toolContext.user;

      if (!user) {
        throw new Error('Missing required context: user');
      }

      const params = (context as any).context as GetActivityDetailsInput;
      const { eventId } = params;

      console.log(
        '[getActivityDetailsTool] Fetching details for eventId:',
        eventId,
      );

      try {
        // Fetch the event with all activity-related data
        const event = await prismaService.event.findFirst({
          where: {
            event_id: eventId,
            athlete_id: user.user_id,
            type: 'ACTIVITY',
          },
          include: {
            activity: {
              include: {
                equipment: true,
                weather: true,
                normalization: {
                  include: {
                    factors: true,
                  },
                },
                records: {
                  orderBy: {
                    distance: 'asc',
                  },
                },
                related_training: {
                  include: {
                    event: true,
                  },
                },
              },
            },
          },
        });

        if (!event || !event.activity) {
          return {
            success: false,
            message:
              'Activity not found or you do not have permission to access it',
          };
        }

        const activity = event.activity;

        // Build the base response object
        const baseResponse = {
          // Event information
          event_id: event.event_id,
          name: event.name,
          start_date: event.start_date.toISOString(),
          end_date: event.end_date.toISOString(),
          type: event.type,

          // Activity specific data
          activity_id: activity.event_activity_id,
          provider: activity.provider || undefined,
          external_id: activity.external_id,
          sport: activity.sport,
          description: activity.description,

          // Performance metrics
          distance: activity.distance,
          elevation_gain: activity.elevation_gain,
          moving_time: activity.moving_time,
          average_speed: activity.average_speed,
          max_speed: activity.max_speed,
          average_gap_speed: activity.average_gap_speed || undefined,
          average_normalized_speed:
            activity.average_normalized_speed || undefined,

          // Optional metrics
          average_cadence: activity.average_cadence || undefined,
          average_watts: activity.average_watts || undefined,
          max_watts: activity.max_watts || undefined,
          weighted_average_watts: activity.weighted_average_watts || undefined,
          average_heartrate: activity.average_heartrate || undefined,
          max_heartrate: activity.max_heartrate || undefined,
          kilojoules: activity.kilojoules || undefined,
          rpe: activity.rpe || undefined,

          // Equipment
          equipment: activity.equipment
            ? {
                equipment_id: activity.equipment.equipment_id,
                name: activity.equipment.name,
                type: activity.equipment.type,
                total_distance: activity.equipment.total_distance,
                is_default: activity.equipment.is_default,
              }
            : undefined,

          // Weather
          weather: activity.weather
            ? {
                weather_id: activity.weather.event_activity_weather_id,
                provider: activity.weather.provider || undefined,
                resolution_m: activity.weather.resolution_m,
                samples: activity.weather.samples,
              }
            : undefined,

          // Normalization
          normalization: activity.normalization
            ? {
                normalization_id:
                  activity.normalization.event_activity_normalization_id,
                average_normalized_speed:
                  activity.normalization.average_normalized_speed || undefined,
                factors: activity.normalization.factors.map((factor) => ({
                  factor: factor.factor,
                  time_seconds: factor.time_seconds,
                  percent: factor.percent,
                })),
              }
            : undefined,

          // Records
          records: activity.records.map((record) => ({
            record_id: record.record_id,
            type: record.type,
            distance: record.distance,
            value: record.value,
            date: record.date.toISOString(),
            start_duration: record.start_duration || undefined,
            end_duration: record.end_duration || undefined,
          })),

          // Related training
          related_training: activity.related_training
            ? {
                training_id: activity.related_training.event_training_id,
                event_id: activity.related_training.event_id,
                name: activity.related_training.event.name,
              }
            : undefined,
        };

        // Enrich with human-readable speed conversions
        const enrichedResponse = enrichActivityWithReadableSpeeds(
          baseResponse,
          activity.sport,
        );

        // Add speed explanation
        const response = {
          ...enrichedResponse,
          speed_explanation: getSpeedExplanation(activity.sport),
        };

        return {
          success: true,
          activity: response,
          message: `Retrieved complete details for activity: ${event.name}`,
        };
      } catch (error) {
        console.error('[getActivityDetailsTool] Error:', error);
        throw new Error(
          `Failed to retrieve activity details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  });
}
