import { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';

import { Injectable } from '@nestjs/common';

import {
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
} from '@openathlete/shared';

import { eventGenerationAgent } from 'src/mastra/agents';
import { TrainingLoadService } from 'src/modules/core/services/training-load.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const trainingEventSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  sport: z.nativeEnum(SPORT_TYPE),
  startDate: z.string().describe('ISO date string'),
  endDate: z.string().describe('ISO date string'),
  goalDuration: z.number().optional(),
  workout: z.object({
    steps: z
      .array(
        z.union([
          z.object({
            stepType: z.nativeEnum(WORKOUT_STEP_TYPE),
            name: z.string().optional(),
            durationType: z.nativeEnum(WORKOUT_DURATION_TYPE).optional(),
            durationValue: z.number().optional(),
            notes: z.string().optional(),
            // Empty array - OpenAI requires items schema for arrays
            // Using simple object schema for items
            targets: z
              .array(z.record(z.string(), z.unknown()))
              .optional()
              .default([]),
            // For REPEAT steps: nested structure with max 1 depth
            repeatBlock: z
              .object({
                repetitions: z.number().min(1).max(99),
                childSteps: z.array(
                  z.object({
                    stepType: z.nativeEnum(WORKOUT_STEP_TYPE),
                    name: z.string().optional(),
                    durationType: z
                      .nativeEnum(WORKOUT_DURATION_TYPE)
                      .optional(),
                    durationValue: z.number().optional(),
                    notes: z.string().optional(),
                    // Empty array - OpenAI requires items schema for arrays
                    // Using simple object schema for items
                    targets: z
                      .array(z.record(z.string(), z.unknown()))
                      .optional()
                      .default([]),
                  }),
                ),
              })
              .optional(),
          }),
          z.string(), // Allow strings temporarily, will be filtered out
        ]),
      )
      .transform((steps) =>
        steps.filter(
          (step): step is Exclude<typeof step, string> =>
            typeof step === 'object' && step !== null && 'stepType' in step,
        ),
      ),
  }),
});

type TrainingEventSchema = z.infer<typeof trainingEventSchema>;

@Injectable()
export class EventGenerationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly trainingLoadService: TrainingLoadService,
  ) {}

  async generateTrainingEvent(
    prompt: string,
    date: Date,
    athleteId: number,
  ): Promise<TrainingEventSchema> {
    const fullPrompt = `

Generate a training event based on this request: ${prompt}

CRITICAL REQUIREMENTS:
- Return a complete training event with workout structure
- For intervals (e.g., "10x 30s/30s"), create ONE REPEAT step with repeatBlock
- Use proper step types: WARMUP, STEADY, INTERVAL_ACTIVE, INTERVAL_REST, COOLDOWN, REPEAT
- Set appropriate startDate and endDate based on the event date`;

    const runtimeContext = new RuntimeContext();
    runtimeContext.set('prisma', this.prismaService);
    runtimeContext.set('athleteId', athleteId);
    runtimeContext.set('trainingLoadService', this.trainingLoadService);
    runtimeContext.set('currentDate', new Date().toISOString());

    const response = await eventGenerationAgent.generate(fullPrompt, {
      runtimeContext,
      structuredOutput: {
        schema: trainingEventSchema as any, // Type assertion needed for complex nested schemas
      },
    });

    if (!response.object) {
      throw new Error(
        'Failed to generate event: no structured output received',
      );
    }

    // Steps are already filtered by the schema transform
    return response.object;
  }
}
