import { createTool } from '@mastra/core';
import { z } from 'zod';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { convertSpeedForDisplay } from './helpers';

// Input type for the tool
type GetCompetitionDetailsInput = {
  eventId: number;
};

// Tool context type
type ToolContext = {
  user: AuthUser | null;
};

/**
 * Factory function to create the get competition details tool
 * This tool retrieves comprehensive information about a competition/race event
 */
export function getCompetitionDetailsToolFactory(
  prismaService: PrismaService,
  toolContext: ToolContext,
) {
  return createTool({
    id: 'get-competition-details',
    description: `Retrieves complete detailed information about a specific competition or race event (COMPETITION type event).

Use this tool when:
- The user wants detailed information about a race or competition
- After finding a competition with findEvent or listEvents
- The user asks about race goals, targets, or results

This tool provides:
- Basic competition information (name, date, sport, description)
- Competition goals (target distance, elevation, time, effort level)
- Related activity (if the race was completed and data was recorded)`,
    inputSchema: z.object({
      eventId: z
        .number()
        .int()
        .positive()
        .describe('The ID of the event to retrieve competition details for'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      competition: z
        .object({
          // Event information
          event_id: z.number(),
          name: z.string(),
          start_date: z.string(),
          end_date: z.string(),
          type: z.string(),

          // Competition specific data
          competition_id: z.number(),
          sport: z.string(),
          description: z.string(),

          // Goals/Targets
          goal_distance: z.number().optional().describe('In meters'),
          goal_elevation_gain: z.number().optional().describe('In meters'),
          goal_duration: z.number().optional().describe('In seconds'),
          goal_rpe: z.number().optional().describe('RPE (0-1)'),

          // Related activity (race results)
          related_activity: z
            .object({
              activity_id: z.number(),
              event_id: z.number(),
              name: z.string(),
              distance: z.number(),
              moving_time: z.number(),
              elevation_gain: z.number(),
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
              average_heartrate: z.number().optional(),
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

      const params = (context as any).context as GetCompetitionDetailsInput;
      const { eventId } = params;

      try {
        // Fetch the event with all competition-related data
        const event = await prismaService.event.findFirst({
          where: {
            event_id: eventId,
            athlete_id: user.user_id,
            type: 'COMPETITION',
          },
          include: {
            competition: {
              include: {
                related_activity: {
                  include: {
                    event: true,
                  },
                },
              },
            },
          },
        });

        if (!event || !event.competition) {
          return {
            success: false,
            message:
              'Competition not found or you do not have permission to access it',
          };
        }

        const competition = event.competition;

        // Build the response object
        const response = {
          // Event information
          event_id: event.event_id,
          name: event.name,
          start_date: event.start_date.toISOString(),
          end_date: event.end_date.toISOString(),
          type: event.type,

          // Competition specific data
          competition_id: competition.event_competition_id,
          sport: competition.sport,
          description: competition.description,

          // Goals
          goal_distance: competition.goal_distance || undefined,
          goal_elevation_gain: competition.goal_elevation_gain || undefined,
          goal_duration: competition.goal_duration || undefined,
          goal_rpe: competition.goal_rpe || undefined,

          // Related activity (race results)
          related_activity: competition.related_activity
            ? {
                activity_id: competition.related_activity.event_activity_id,
                event_id: competition.related_activity.event_id,
                name: competition.related_activity.event.name,
                distance: competition.related_activity.distance,
                moving_time: competition.related_activity.moving_time,
                elevation_gain: competition.related_activity.elevation_gain,
                average_speed: competition.related_activity.average_speed,
                average_speed_display: convertSpeedForDisplay(
                  competition.related_activity.average_speed,
                  competition.sport,
                ),
                average_heartrate:
                  competition.related_activity.average_heartrate || undefined,
              }
            : undefined,
        };

        return {
          success: true,
          competition: response,
          message: `Retrieved complete details for competition: ${event.name}`,
        };
      } catch (error) {
        console.error('[getCompetitionDetailsTool] Error:', error);
        throw new Error(
          `Failed to retrieve competition details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  });
}
