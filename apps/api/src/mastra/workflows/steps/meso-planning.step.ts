import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import {
  mesoBlocksOutputSchema,
  mesoPlanAgent,
} from '../../agents/meso-plan.agent';
import {
  athleteFactsSchema,
  macroPlanSchema,
  mesoBlockSchema,
} from '../../types';

/**
 * Meso Planning Step Input Schema
 */
export const mesoStepInputSchema = z.object({
  macroPlan: macroPlanSchema,
  athleteFacts: athleteFactsSchema,
});

/**
 * Meso Planning Step Output Schema
 */
export const mesoStepOutputSchema = z.object({
  mesoBlocks: z.array(mesoBlockSchema),
  athleteFacts: athleteFactsSchema,
});

export type MesoStepInput = z.infer<typeof mesoStepInputSchema>;
export type MesoStepOutput = z.infer<typeof mesoStepOutputSchema>;

/**
 * Step 3: Meso Planning
 *
 * PURPOSE:
 * Break macro phases into weekly training blocks (meso-cycles).
 *
 * PROCESS:
 * 1. Divide each phase into 3-4 week blocks
 * 2. Apply progression patterns (3:1 load/recovery)
 * 3. Set weekly volume targets with 10% rule
 * 4. Assign themes to each block (VO2, threshold, etc.)
 * 5. Balance intensity distribution
 *
 * OUTPUT:
 * Array of MesoBlocks with week-by-week volume and intensity targets.
 */
export const mesoStep = createStep({
  id: 'meso-planning',
  description: 'Break phases into weekly training blocks',
  inputSchema: mesoStepInputSchema,
  outputSchema: mesoStepOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    try {
      const prompt = `Break down the following macro plan into detailed meso-cycles (3-4 week training blocks).

MACRO PLAN:
${JSON.stringify(inputData.macroPlan, null, 2)}

ATHLETE PROFILE:
Current Weekly Volume: ${(inputData.athleteFacts.currentFitness.recentWeeklyVolume / 3600).toFixed(1)}h
Experience Level: ${inputData.athleteFacts.experienceLevel || 'INTERMEDIATE'}
Constraints: ${JSON.stringify(inputData.athleteFacts.constraints, null, 2)}

For each phase in the macro plan, create meso-cycles with:

1. WEEK-BY-WEEK BREAKDOWN:
   - Assign each week a specific date range
   - Set realistic volume targets in seconds (use macro phase targets as guide)
   - Apply 10% rule: no more than 10% volume increase per week
   - Include recovery weeks every 3-4 weeks (20-40% volume reduction)

2. PROGRESSION PATTERNS:
   - Use 3:1 pattern (3 weeks build + 1 recovery) for most blocks
   - Consider 2:1 pattern if athlete is less experienced
   - Ensure smooth progression between blocks

3. BLOCK THEMES:
   BASE phase blocks should focus on: aerobic foundation, volume building, endurance
   SPECIFIC phase blocks should focus on: VO2max, threshold, race-specific work
   TAPER phase blocks should focus on: volume reduction, maintaining intensity, freshness

4. INTENSITY FOCUS:
   - Assign each week an intensity focus: EASY, MODERATE, HARD, or MIXED
   - Most weeks should be EASY (80/20 principle)
   - Hard weeks should be separated by easy/recovery weeks

5. STARTING POINT:
   - Start first week at or slightly above athlete's current weekly volume: ${(inputData.athleteFacts.currentFitness.recentWeeklyVolume / 3600).toFixed(1)}h (${inputData.athleteFacts.currentFitness.recentWeeklyVolume}s)
   - Build gradually from there

Please create detailed meso-blocks for the entire plan duration.`;

      const response = await mesoPlanAgent.generate(prompt, {
        runtimeContext,
        structuredOutput: {
          schema: mesoBlocksOutputSchema,
        },
      });

      const mesoBlocks = response.object.mesoBlocks;

      const totalWeeks = mesoBlocks.reduce(
        (sum, block) => sum + block.weeks.length,
        0,
      );
      return {
        mesoBlocks,
        athleteFacts: inputData.athleteFacts,
      };
    } catch (error) {
      console.error('[mesoStep] Failed to generate meso plan:', error);
      throw new Error(
        `Meso planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
