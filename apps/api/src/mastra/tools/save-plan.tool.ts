import { createTool } from '@mastra/core';
import { z } from 'zod';

// TODO: Tool to persist a complete training plan to database
// Creates plan + cycles + weeks + sessions in a single transaction
// USED BY: plan-generation.workflow (final persistence step)

export const savePlanTool = createTool({
  id: 'save-plan',
  description:
    'Persists a complete training plan with all cycles, weeks, and sessions to the database in a single transaction.',
  inputSchema: z.object({
    athleteId: z.number(),
    plan: z.object({
      name: z.string(),
      description: z.string().optional(),
      goal: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      cycles: z.array(
        z.object({
          name: z.string(),
          phase: z.enum([
            'BASE',
            'SPECIFIC',
            'TAPER',
            'RECOVERY',
            'COMPETITION',
          ]),
          startDate: z.string(),
          endDate: z.string(),
          weeks: z.array(
            z.object({
              weekNumber: z.number(),
              startDate: z.string(),
              endDate: z.string(),
              theme: z.string().optional(),
              targetVolume: z.number().optional(),
              sessions: z.array(
                z.object({
                  startDate: z.string(),
                  endDate: z.string(),
                  sport: z.string(),
                  goalDistance: z.number().optional(),
                  goalElevationGain: z.number().optional(),
                  goalDuration: z.number().optional(),
                  goalRpe: z.number().optional(),
                  description: z.string(),
                }),
              ),
            }),
          ),
        }),
      ),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    trainingPlanId: z.number(),
    createdCycles: z.number(),
    createdWeeks: z.number(),
    createdSessions: z.number(),
  }),
  execute: async (context) => {
    // TODO: Implement with Prisma transaction
    // - Create training_plan
    // - Create cycles with training_plan_id FK
    // - Create weeks with cycle_id FK
    // - Create event + event_training for each session with week FK
    // - Convert camelCase to snake_case using keysToSnake
    throw new Error('Not implemented yet - save-plan tool');
  },
});
