import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import { macroPlanAgent } from '../../agents/macro-plan.agent';
import { athleteFactsSchema, macroPlanSchema } from '../../types';
import { goalSchema } from './profile-analysis.step';

/**
 * Macro Planning Step Input Schema
 */
export const macroStepInputSchema = z.object({
  athleteFacts: athleteFactsSchema,
  goal: goalSchema,
});

/**
 * Macro Planning Step Output Schema
 */
export const macroStepOutputSchema = z.object({
  macroPlan: macroPlanSchema,
  athleteFacts: athleteFactsSchema,
});

export type MacroStepInput = z.infer<typeof macroStepInputSchema>;
export type MacroStepOutput = z.infer<typeof macroStepOutputSchema>;

/**
 * Step 2: Macro Planning
 *
 * PURPOSE:
 * Design high-level training phase structure (BASE → SPECIFIC → TAPER).
 *
 * PROCESS:
 * 1. Analyze time available until race date
 * 2. Design periodization phases with appropriate durations
 * 3. Set volume progression across phases
 * 4. Define key milestones (tests, prep races)
 * 5. Establish overall training strategy
 *
 * OUTPUT:
 * MacroPlan with phases, milestones, and progression rationale.
 */
export const macroStep = createStep({
  id: 'macro-planning',
  description: 'Design high-level training phase structure',
  inputSchema: macroStepInputSchema,
  outputSchema: macroStepOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    try {
      const currentDate = new Date().toISOString();

      const prompt = `[CURRENT DATE: ${new Date(currentDate).toLocaleDateString(
        'en-US',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      )}]

Design a comprehensive macro training plan for the following:

ATHLETE PROFILE:
${JSON.stringify(inputData.athleteFacts, null, 2)}

GOAL RACE:
- Race: ${inputData.goal.raceName}
- Date: ${new Date(inputData.goal.raceDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
- Distance: ${(inputData.goal.distance / 1000).toFixed(1)}km
- Elevation Gain: ${inputData.goal.elevationGain}m
- Terrain: ${inputData.goal.terrain || 'MIXED'}

Please create a periodized macro plan with:
1. Appropriate phase structure (BASE → SPECIFIC → TAPER)
2. Realistic volume progression based on current fitness
3. Key milestones and checkpoints
4. Clear strategy and rationale

Consider:
- Time available until race (weeks from today to race day)
- Current fitness level and weekly volume
- Race distance and demands
- Need for adequate base, specific work, and taper`;

      console.log('[macroStep] Calling macro-plan agent');

      const response = await macroPlanAgent.generate(prompt, {
        runtimeContext,
        structuredOutput: {
          schema: macroPlanSchema,
        },
      });

      const macroPlan = response.object;

      console.log('[macroStep] Macro plan generated successfully');
      console.log('[macroStep] Total phases:', macroPlan.phases.length);
      console.log(
        '[macroStep] Total duration:',
        macroPlan.totalDurationWeeks,
        'weeks',
      );

      return {
        macroPlan,
        athleteFacts: inputData.athleteFacts,
      };
    } catch (error) {
      console.error('[macroStep] Failed to generate macro plan:', error);
      throw new Error(
        `Macro planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
