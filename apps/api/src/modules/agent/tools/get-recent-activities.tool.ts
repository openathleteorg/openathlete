import { createTool } from '@mastra/core';
import { z } from 'zod';

import { event, event_activity, event_type } from '@openathlete/database';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

// Types - staying in snake_case to match database schema
type EventWithActivity = event & {
  activity: event_activity | null;
};

// Input type for the tool
type GetRecentActivitiesInput = {
  limit: number;
  sport?: 'RUNNING' | 'CYCLING' | 'SWIMMING' | 'OTHER';
};

// Tool context type
type ToolContext = {
  user: AuthUser | null;
};

export function getRecentActivitiesToolFactory(
  prismaService: PrismaService,
  toolContext: ToolContext,
) {
  return createTool({
    id: 'get-recent-activities',
    description:
      'Retrieves the most recent activities (runs, rides, etc.) for the authenticated user. Use this when the user asks about their recent workouts, training sessions, or activities.',
    inputSchema: z.object({
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe('Maximum number of activities to retrieve (default: 10)'),
      sport: z
        .enum(['RUNNING', 'CYCLING', 'SWIMMING', 'OTHER'])
        .optional()
        .describe('Filter activities by sport type'),
    }),
    outputSchema: z.object({
      activities: z.array(
        z.object({
          eventId: z.number(),
          name: z.string(),
          type: z.string(),
          sport: z.string().optional(),
          startDate: z.string(),
          endDate: z.string(),
          distance: z.number().optional(),
          duration: z.number().optional(),
          elevationGain: z.number().optional(),
          averageHeartRate: z.number().optional(),
          averageSpeed: z.number().optional(),
        }),
      ),
      totalCount: z.number(),
    }),
    execute: async (context) => {
      const user = toolContext.user;

      if (!user) {
        throw new Error('Missing required context: user');
      }

      const params = (context as any).context as GetRecentActivitiesInput;
      const { limit, sport } = params;

      try {
        // Fetch events directly from Prisma
        const rawEvents = await prismaService.event.findMany({
          where: {
            athlete_id: user.user_id,
            type: event_type.ACTIVITY,
            ...(sport && {
              activity: {
                sport,
              },
            }),
          },
          orderBy: {
            start_date: 'desc',
          },
          include: {
            activity: true,
          },
          take: limit,
        });

        // Transform to tool output format (keeping snake_case)
        const formattedActivities = rawEvents.map(
          (event: EventWithActivity) => {
            const duration = event.activity?.moving_time
              ? Math.round(event.activity.moving_time / 60)
              : undefined; // Convert to minutes

            return {
              eventId: event.event_id,
              name: event.name,
              type: event.type,
              sport: event.activity?.sport,
              startDate: event.start_date
                ? new Date(event.start_date).toISOString()
                : new Date().toISOString(),
              endDate: event.end_date
                ? new Date(event.end_date).toISOString()
                : new Date().toISOString(),
              distance: event.activity?.distance
                ? Math.round(event.activity.distance)
                : undefined,
              duration,
              elevationGain: event.activity?.elevation_gain
                ? Math.round(event.activity.elevation_gain)
                : undefined,
              averageHeartRate: event.activity?.average_heartrate
                ? Math.round(event.activity.average_heartrate)
                : undefined,
              averageSpeed: event.activity?.average_speed,
            };
          },
        );

        return {
          activities: formattedActivities,
          totalCount: formattedActivities.length,
        };
      } catch (error) {
        console.error(
          '[getRecentActivitiesTool] Error fetching activities:',
          error,
        );
        throw new Error(
          `Failed to retrieve activities: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  });
}
