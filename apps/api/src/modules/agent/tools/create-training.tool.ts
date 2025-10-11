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
      'Creates a new training session for the authenticated user. Use this when the user wants to plan a workout. Keep it simple - just ask for the date and sport type.',
    inputSchema: z.object({
      date: z
        .string()
        .describe(
          'Date of the training session. Can be a simple date like "2023-10-15", "today", "tomorrow", or with time "2023-10-15T09:00:00Z"',
        ),
      sport: z
        .enum(['RUNNING', 'CYCLING', 'SWIMMING', 'OTHER'])
        .default('RUNNING')
        .describe('Type of sport for this training session'),
      notes: z
        .string()
        .optional()
        .describe(
          'Optional notes about the training (distance, duration, intensity, etc.)',
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
      rpe: z.number().optional(),
      success: z.boolean(),
      message: z.string(),
    }),
    execute: async (context) => {
      // Get user from shared toolContext
      const user = toolContext.user;

      if (!user) {
        throw new Error('Missing required context: user');
      }

      // In Mastra, input parameters are nested in context.context
      const params = (context as any).context as CreateTrainingInput;
      const { date, sport, notes } = params;

      console.log('[createTrainingTool] Extracted params:', {
        date,
        sport,
        notes,
      });

      if (!date) {
        throw new Error(`Missing required parameter: date=${date}`);
      }

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
          // If only date provided (no time), set to 9 AM
          if (date.length === 10 && date.includes('-')) {
            trainingDate.setHours(9, 0, 0, 0);
          }
        }

        // Training session defaults to 1 hour
        const endDate = new Date(trainingDate.getTime() + 60 * 60 * 1000);

        // Generate a simple name based on sport
        const sportNames = {
          RUNNING: 'Course à pied',
          CYCLING: 'Cyclisme',
          SWIMMING: 'Natation',
          OTHER: 'Entraînement',
        };
        const trainingName =
          sportNames[sport || 'RUNNING'] || 'Entraînement';

        // Create the training event
        const rawEvent = await prismaService.event.create({
          data: {
            athlete_id: user.user_id,
            name: trainingName,
            type: event_type.TRAINING,
            start_date: trainingDate,
            end_date: endDate,
            training: {
              create: {
                sport: sport || 'RUNNING',
                description: notes || '',
              },
            },
          },
          include: {
            training: true,
          },
        });

        // Transform response (Prisma returns snake_case)
        return {
          eventId: rawEvent.event_id,
          name: rawEvent.name,
          type: rawEvent.type,
          sport: rawEvent.training?.sport || sport || 'RUNNING',
          startDate: new Date(rawEvent.start_date).toISOString(),
          endDate: new Date(rawEvent.end_date).toISOString(),
          description: rawEvent.training?.description || undefined,
          rpe: rawEvent.training?.goal_rpe ?? undefined,
          success: true,
          message: `Entraînement "${trainingName}" créé pour le ${trainingDate.toLocaleDateString('fr-FR')}`,
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
