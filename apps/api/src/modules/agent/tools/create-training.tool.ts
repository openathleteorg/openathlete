import { createTool } from '@mastra/core';
import { z } from 'zod';

import { event_type } from '@openathlete/database';
import { SPORT_TYPE } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

// Input type for the tool
type CreateTrainingInput = {
  date: string;
  sport?: 'RUNNING' | 'CYCLING' | 'SWIMMING' | 'OTHER';
  notes?: string;
  distance?: number; // in km (will be converted to meters)
  elevationGain?: number; // in meters
  duration?: number; // in minutes (will be converted to seconds)
  rpe?: number; // 0-10 scale (will be converted to 0-1)
};

// Tool context type
type ToolContext = {
  user: AuthUser | null;
};

/**
 * Factory function to create the create training tool
 * This captures prismaService and toolContext in a closure to avoid circular reference issues
 */
export function createTrainingToolFactory(
  prismaService: PrismaService,
  toolContext: ToolContext,
) {
  return createTool({
    id: 'create-training',
    description:
      'Creates a new training session for the authenticated user. Use this when the user wants to plan a workout. You can specify the date, sport type, target distance, elevation gain, duration, effort level (RPE), and additional notes.',
    inputSchema: z.object({
      date: z
        .string()
        .describe(
          'Date of the training session. Can be a simple date like "2023-10-15", "today", "tomorrow", or with time "2023-10-15T09:00:00Z"',
        ),
      sport: z
        .nativeEnum(SPORT_TYPE)
        .default(SPORT_TYPE.RUNNING)
        .describe('Type of sport for this training session'),
      distance: z
        .number()
        .positive()
        .optional()
        .describe(
          'Target distance in kilometers (e.g., 10 for 10km). Will be stored in meters.',
        ),
      elevationGain: z
        .number()
        .nonnegative()
        .optional()
        .describe('Target elevation gain in meters (e.g., 500)'),
      duration: z
        .number()
        .positive()
        .optional()
        .describe(
          'Target duration in minutes (e.g., 60 for 1 hour). Will be stored in seconds.',
        ),
      rpe: z
        .number()
        .min(0)
        .max(10)
        .optional()
        .describe(
          'Target effort level (RPE - Rate of Perceived Exertion) from 0 to 10. 0 = rest, 10 = maximum effort',
        ),
      notes: z
        .string()
        .optional()
        .describe(
          'Optional notes about the training session (objectives, specific workout details, etc.)',
        ),
    }),
    outputSchema: z.object({
      eventId: z.number(),
      name: z.string(),
      type: z.string(),
      sport: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      description: z.string().optional(),
      goalDistance: z.number().optional(),
      goalElevationGain: z.number().optional(),
      goalDuration: z.number().optional(),
      goalRpe: z.number().optional(),
      success: z.boolean(),
      message: z.string(),
    }),
    execute: async (context) => {
      // Get user from shared toolContext
      const user = toolContext.user;

      if (!user) {
        throw new Error('Missing required context: user');
      }

      const params = (context as any).context as CreateTrainingInput;
      const { date, sport, notes, distance, elevationGain, duration, rpe } =
        params;

      if (!date) {
        throw new Error(`Missing required parameter: date=${date}`);
      }

      // Convert units for storage
      // Distance: km -> meters
      const goalDistanceMeters = distance ? distance * 1000 : undefined;
      // Duration: minutes -> seconds
      const goalDurationSeconds = duration ? duration * 60 : undefined;
      // RPE: 0-10 scale -> 0-1 scale
      const goalRpeNormalized = rpe !== undefined ? rpe / 10 : undefined;

      try {
        // Parse the date - handle various formats
        let trainingDate: Date;
        const lowerDate = date.toLowerCase().trim();

        if (lowerDate === 'today' || lowerDate === "aujourd'hui") {
          trainingDate = new Date();
          trainingDate.setHours(9, 0, 0, 0); // Default to 9 AM
        } else if (lowerDate === 'tomorrow' || lowerDate === 'demain') {
          trainingDate = new Date();
          trainingDate.setDate(trainingDate.getDate() + 1);
          trainingDate.setHours(9, 0, 0, 0); // Default to 9 AM
        } else {
          trainingDate = new Date(date);
          if (date.length === 10 && date.includes('-')) {
            trainingDate.setHours(9, 0, 0, 0);
          }
        }

        const endDate = new Date(trainingDate.getTime() + 60 * 60 * 1000);

        // Create the training event
        const rawEvent = await prismaService.event.create({
          data: {
            athlete_id: user.user_id,
            name: `Training - ${sport}`,
            type: event_type.TRAINING,
            start_date: trainingDate,
            end_date: endDate,
            training: {
              create: {
                sport: sport || 'RUNNING',
                description: notes || '',
                goal_distance: goalDistanceMeters,
                goal_elevation_gain: elevationGain,
                goal_duration: goalDurationSeconds,
                goal_rpe: goalRpeNormalized,
              },
            },
          },
          include: {
            training: true,
          },
        });

        // Build a descriptive message
        const details: string[] = [];
        if (goalDistanceMeters) {
          details.push(`${distance}km`);
        }
        if (elevationGain) {
          details.push(`D+ ${elevationGain}m`);
        }
        if (goalDurationSeconds) {
          const hours = Math.floor(duration! / 60);
          const minutes = duration! % 60;
          const durationStr =
            hours > 0
              ? `${hours}h${minutes > 0 ? minutes : ''}`
              : `${minutes}min`;
          details.push(durationStr);
        }
        if (rpe !== undefined) {
          details.push(`RPE ${rpe}/10`);
        }

        const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : '';

        // Transform response (Prisma returns snake_case)
        return {
          eventId: rawEvent.event_id,
          name: rawEvent.name,
          type: rawEvent.type,
          sport: rawEvent.training?.sport || sport || 'RUNNING',
          startDate: new Date(rawEvent.start_date).toISOString(),
          endDate: new Date(rawEvent.end_date).toISOString(),
          description: rawEvent.training?.description || undefined,
          goalDistance: rawEvent.training?.goal_distance ?? undefined,
          goalElevationGain:
            rawEvent.training?.goal_elevation_gain ?? undefined,
          goalDuration: rawEvent.training?.goal_duration ?? undefined,
          goalRpe: rawEvent.training?.goal_rpe ?? undefined,
          success: true,
          message: `Entraînement "${sport}" créé pour le ${trainingDate.toLocaleDateString('fr-FR')}${detailsStr}`,
        };
      } catch (error) {
        console.error('[createTrainingTool] Error creating training:', error);
        throw new Error(
          `Failed to create training: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  });
}
