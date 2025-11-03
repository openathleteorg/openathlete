import { createTool } from '@mastra/core';
import { z } from 'zod';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

// Input type for the tool
type GetTrainingDetailsInput = {
  eventId: number;
};

// Tool context type
type ToolContext = {
  user: AuthUser | null;
};

/**
 * Factory function to create the get training details tool
 * This tool retrieves comprehensive information about a planned training session
 */
export function getTrainingDetailsToolFactory(
  prismaService: PrismaService,
  toolContext: ToolContext,
) {
  return createTool({
    id: 'get-training-details',
    description: `Retrieves complete detailed information about a specific planned training session (TRAINING type event).

Use this tool when:
- The user wants detailed information about a planned workout/training session
- After finding a training with findEvent or listEvents
- The user asks about workout structure, targets, goals for a planned session

This tool provides:
- Basic training information (name, date, sport, description)
- Training goals (distance, elevation, duration, RPE targets)
- Structured workout details (if a workout builder was used):
  * Workout steps (warmup, intervals, cooldown, rest, etc.)
  * Step targets (pace, heart rate, power, cadence, RPE)
  * Repeat blocks for interval training
  * Estimated duration and total distance
- Related activity (if this training was completed and linked to an activity)`,
    inputSchema: z.object({
      eventId: z
        .number()
        .int()
        .positive()
        .describe('The ID of the event to retrieve training details for'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      training: z
        .object({
          // Event information
          event_id: z.number(),
          name: z.string(),
          start_date: z.string(),
          end_date: z.string(),
          type: z.string(),

          // Training specific data
          training_id: z.number(),
          sport: z.string(),
          description: z.string(),

          // Goals
          goal_distance: z.number().optional().describe('In meters'),
          goal_elevation_gain: z.number().optional().describe('In meters'),
          goal_duration: z.number().optional().describe('In seconds'),
          goal_rpe: z.number().optional().describe('RPE (0-1)'),

          // Workout structure (if defined)
          workout: z
            .object({
              workout_id: z.number(),
              estimated_duration: z.number().optional().describe('In seconds'),
              total_distance: z.number().optional().describe('In meters'),
              steps: z.array(
                z.object({
                  step_id: z.number(),
                  order_index: z.number(),
                  step_type: z.string(),
                  name: z.string().optional(),
                  exercise_name: z.string().optional(),
                  notes: z.string().optional(),
                  duration_type: z.string(),
                  duration_value: z.number().optional(),
                  duration_target: z.number().optional(),
                  targets: z.array(
                    z.object({
                      target_id: z.number(),
                      target_type: z.string(),
                      target_zone: z.number().optional(),
                      target_min: z.number().optional(),
                      target_max: z.number().optional(),
                      target_value: z.number().optional(),
                    }),
                  ),
                  repeat_block: z
                    .object({
                      repeat_id: z.number(),
                      repetitions: z.number(),
                    })
                    .optional(),
                }),
              ),
            })
            .optional(),

          // Related activity
          related_activity: z
            .object({
              activity_id: z.number(),
              event_id: z.number(),
              name: z.string(),
              distance: z.number(),
              moving_time: z.number(),
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

      const params = (context as any).context as GetTrainingDetailsInput;
      const { eventId } = params;

      try {
        // Fetch the event with all training-related data
        const event = await prismaService.event.findFirst({
          where: {
            event_id: eventId,
            athlete_id: user.user_id,
            type: 'TRAINING',
          },
          include: {
            training: {
              include: {
                workout: {
                  include: {
                    steps: {
                      include: {
                        targets: true,
                        repeat_block: true,
                      },
                      orderBy: {
                        order_index: 'asc',
                      },
                    },
                  },
                },
                related_activity: {
                  include: {
                    event: true,
                  },
                },
              },
            },
          },
        });

        if (!event || !event.training) {
          return {
            success: false,
            message:
              'Training not found or you do not have permission to access it',
          };
        }

        const training = event.training;

        // Build the response object
        const response: any = {
          // Event information
          event_id: event.event_id,
          name: event.name,
          start_date: event.start_date.toISOString(),
          end_date: event.end_date.toISOString(),
          type: event.type,

          // Training specific data
          training_id: training.event_training_id,
          sport: training.sport,
          description: training.description,

          // Goals
          goal_distance: training.goal_distance || undefined,
          goal_elevation_gain: training.goal_elevation_gain || undefined,
          goal_duration: training.goal_duration || undefined,
          goal_rpe: training.goal_rpe || undefined,

          // Workout structure
          workout: training.workout
            ? {
                workout_id: training.workout.workout_id,
                estimated_duration:
                  training.workout.estimated_duration || undefined,
                total_distance: training.workout.total_distance || undefined,
                steps: training.workout.steps.map((step) => ({
                  step_id: step.workout_step_id,
                  order_index: step.order_index,
                  step_type: step.step_type,
                  name: step.name || undefined,
                  exercise_name: step.exercise_name || undefined,
                  notes: step.notes || undefined,
                  duration_type: step.duration_type,
                  duration_value: step.duration_value || undefined,
                  duration_target: step.duration_target || undefined,
                  targets: step.targets.map((target) => ({
                    target_id: target.workout_step_target_id,
                    target_type: target.target_type,
                    target_min: target.target_min || undefined,
                    target_max: target.target_max || undefined,
                    target_value: target.target_value || undefined,
                  })),
                  repeat_block: step.repeat_block
                    ? {
                        repeat_id: step.repeat_block.workout_repeat_id,
                        repetitions: step.repeat_block.repetitions,
                      }
                    : undefined,
                })),
              }
            : undefined,

          // Related activity
          related_activity: training.related_activity
            ? {
                activity_id: training.related_activity.event_activity_id,
                event_id: training.related_activity.event_id,
                name: training.related_activity.event.name,
                distance: training.related_activity.distance,
                moving_time: training.related_activity.moving_time,
              }
            : undefined,
        };

        return {
          success: true,
          training: response,
          message: `Retrieved complete details for training: ${event.name}`,
        };
      } catch (error) {
        console.error('[getTrainingDetailsTool] Error:', error);
        throw new Error(
          `Failed to retrieve training details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  });
}
