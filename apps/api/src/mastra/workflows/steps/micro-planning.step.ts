import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import {
  microPlanAgent,
  weekIntentionsOutputSchema,
} from '../../agents/micro-plan.agent';
import {
  athleteFactsSchema,
  mesoBlockSchema,
  weekIntentionsSchema,
} from '../../types';

/**
 * Micro Planning Step Input Schema
 */
export const microStepInputSchema = z.object({
  mesoBlocks: z.array(mesoBlockSchema),
  athleteFacts: athleteFactsSchema,
});

/**
 * Micro Planning Step Output Schema
 */
export const microStepOutputSchema = z.object({
  weekIntentions: z.array(weekIntentionsSchema),
  mesoBlocks: z.array(mesoBlockSchema),
  athleteFacts: athleteFactsSchema,
});

export type MicroStepInput = z.infer<typeof microStepInputSchema>;
export type MicroStepOutput = z.infer<typeof microStepOutputSchema>;

/**
 * Step 4: Micro Planning
 *
 * PURPOSE:
 * Generate specific training session plans for each week.
 *
 * PROCESS:
 * 1. For each week in meso-blocks:
 *    - Propose session types (intervals, long run, tempo, easy, strength)
 *    - Define session parameters (duration, intensity, structure)
 *    - Balance hard/easy sessions
 *    - Match sessions to week theme
 * 2. Respect athlete's weekly volume target
 * 3. Apply training methodology (80/20, polarized, etc.)
 *
 * OUTPUT:
 * Array of WeekIntentions with specific session plans (not yet scheduled).
 */
export const microStep = createStep({
  id: 'micro-planning',
  description: 'Generate specific training sessions for each week',
  inputSchema: microStepInputSchema,
  outputSchema: microStepOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    try {
      const allWeekIntentions: Array<z.infer<typeof weekIntentionsSchema>> = [];

      // Extract all weeks from all meso blocks
      const allWeeks = inputData.mesoBlocks.flatMap((block) =>
        block.weeks.map((week) => ({
          ...week,
          blockTheme: block.blockTheme,
          phaseName: block.phaseName,
        })),
      );

      console.log(
        `[microStep] Generating sessions for ${allWeeks.length} weeks...`,
      );

      // Process each week sequentially
      for (const week of allWeeks) {
        const prompt = `Generate specific training sessions for the following week:

WEEK CONTEXT:
Week Number: ${week.weekNumber}
Start Date: ${week.startDate}
End Date: ${week.endDate}
Theme: ${week.theme}
Block Theme: ${week.blockTheme}
Phase: ${week.phaseName}
Target Volume: ${(week.targetVolume / 3600).toFixed(1)}h (${week.targetVolume}s)
Intensity Focus: ${week.intensityFocus}
Recovery Week: ${week.isRecoveryWeek ? 'YES' : 'NO'}

ATHLETE PROFILE:
Experience Level: ${inputData.athleteFacts.experienceLevel || 'INTERMEDIATE'}
Available Training Days: ${inputData.athleteFacts.availability.length} slots
Constraints: ${JSON.stringify(inputData.athleteFacts.constraints, null, 2)}

YOUR TASK:
Generate ${inputData.athleteFacts.availability.length} training sessions for this week that:
1. Match the week's theme and intensity focus
2. Total approximately ${(week.targetVolume / 3600).toFixed(1)} hours of training
3. Follow 80/20 principle (80% easy, 20% hard) unless it's a recovery week
4. Include variety: long run, intervals/tempo (if appropriate), easy runs
5. Balance hard and easy days (no consecutive hard sessions)

Session Types Available:
- INTERVAL: VO2max or speed work
- LONG_RUN: Extended aerobic run (typically 90+ minutes)
- TEMPO: Threshold or steady-state work
- EASY: Recovery or base building
- RECOVERY: Very easy, short duration
- STRENGTH: Cross-training or gym work
- REST: Complete rest day

For each session provide:
- type: Session type from above
- sport: Usually RUNNING
- targetDuration: Duration in seconds
- targetDistance: Estimated distance in meters (optional)
- targetIntensity: {zone: "Z1-Z5", rpe: 0-1 scale}
- description: Clear, actionable description
- priority: HIGH (key workout), MEDIUM (important), LOW (optional)

CRITICAL:
- If recovery week: all sessions should be EASY/RECOVERY, lower volume
- If hard week: 1-2 hard sessions (INTERVAL/TEMPO) maximum
- Long run typically 25-35% of weekly volume
- Total session durations should sum to approximately target volume

Generate sessions now.`;

        console.log(`[microStep] Processing week ${week.weekNumber}...`);

        const response = await microPlanAgent.generate(prompt, {
          runtimeContext,
          structuredOutput: {
            schema: weekIntentionsOutputSchema,
          },
        });

        const weekIntentions = response.object;

        // Ensure week metadata matches
        weekIntentions.weekNumber = week.weekNumber;
        weekIntentions.startDate = week.startDate;
        weekIntentions.endDate = week.endDate;
        weekIntentions.theme = week.theme;
        weekIntentions.targetVolume = week.targetVolume;

        allWeekIntentions.push(weekIntentions);

        console.log(
          `[microStep] Week ${week.weekNumber}: Generated ${weekIntentions.sessions.length} sessions`,
        );
      }

      console.log(
        `[microStep] Successfully generated sessions for all ${allWeeks.length} weeks`,
      );

      return {
        weekIntentions: allWeekIntentions,
        mesoBlocks: inputData.mesoBlocks,
        athleteFacts: inputData.athleteFacts,
      };
    } catch (error) {
      console.error('[microStep] Failed to generate micro plan:', error);
      throw new Error(
        `Micro planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
