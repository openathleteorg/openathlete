import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import { qaAgent } from '../../agents/qa.agent';
import {
  athleteFactsSchema,
  mesoBlockSchema,
  scheduledWeekSchema,
  validationReportSchema,
} from '../../types';

/**
 * QA Step Input Schema
 */
export const qaStepInputSchema = z.object({
  scheduledWeeks: z.array(scheduledWeekSchema),
  schedulingMetadata: z.object({
    totalScheduled: z.number(),
    totalUnscheduled: z.number(),
    overallWarnings: z.array(z.string()),
    conflictResolutions: z.array(z.string()),
  }),
  mesoBlocks: z.array(mesoBlockSchema),
  athleteFacts: athleteFactsSchema,
});

/**
 * QA Step Output Schema
 */
export const qaStepOutputSchema = z.object({
  validationReport: validationReportSchema,
  scheduledWeeks: z.array(scheduledWeekSchema),
  mesoBlocks: z.array(mesoBlockSchema),
  athleteFacts: athleteFactsSchema,
  schedulingMetadata: z.object({
    totalScheduled: z.number(),
    totalUnscheduled: z.number(),
    overallWarnings: z.array(z.string()),
    conflictResolutions: z.array(z.string()),
  }),
});

export type QAStepInput = z.infer<typeof qaStepInputSchema>;
export type QAStepOutput = z.infer<typeof qaStepOutputSchema>;

/**
 * Training Plan Cycle for validation
 */
export interface TrainingPlanCycle {
  name: string;
  phase: 'BASE' | 'SPECIFIC' | 'TAPER' | 'RECOVERY' | 'COMPETITION';
  startDate: string;
  endDate: string;
  weeks: Array<{
    weekNumber: number;
    startDate: string;
    endDate: string;
    sessions: Array<{
      startDate: string;
      endDate: string;
      goalDuration: number;
      goalRpe: number;
      goalDistance?: number;
      sport: string;
    }>;
  }>;
}

/**
 * Training Plan for validation
 */
export interface TrainingPlan {
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  cycles: TrainingPlanCycle[];
}

/**
 * Step 6: Quality Assurance
 *
 * PURPOSE:
 * Validate complete training plan against evidence-based constraints.
 *
 * PROCESS:
 * 1. Transform scheduled weeks into validation format
 * 2. Use validatePlanTool to check:
 *    - Load progression (max 10-15% increase)
 *    - Recovery adequacy (rest days, recovery weeks)
 *    - Hard session spacing (24h minimum)
 *    - Intensity distribution (80/20)
 *    - Session duration constraints
 *    - Race-specific preparation
 *    - Taper validation
 * 3. Generate validation report with score and errors
 *
 * OUTPUT:
 * ValidationReport with overall score, errors, metrics, and recommendations.
 */
export const qaStep = createStep({
  id: 'quality-assurance',
  description:
    'Validate complete training plan against evidence-based constraints and best practices',
  inputSchema: qaStepInputSchema,
  outputSchema: qaStepOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    console.log(
      `[qaStep] Starting validation for ${inputData.scheduledWeeks.length} weeks`,
    );

    try {
      // Transform scheduledWeeks into the format expected by validatePlanTool
      const cycles = inputData.mesoBlocks.map((block, idx) => {
        const blockWeeks = inputData.scheduledWeeks.filter(
          (w) =>
            block.weeks.find((bw) => bw.weekNumber === w.weekNumber) !==
            undefined,
        );

        return {
          name: block.blockTheme,
          phase: block.phaseName.toUpperCase().includes('BASE')
            ? ('BASE' as const)
            : block.phaseName.toUpperCase().includes('SPECIFIC')
              ? ('SPECIFIC' as const)
              : block.phaseName.toUpperCase().includes('TAPER')
                ? ('TAPER' as const)
                : ('BASE' as const),
          startDate: blockWeeks[0]?.startDate || new Date().toISOString(),
          endDate:
            blockWeeks[blockWeeks.length - 1]?.endDate ||
            new Date().toISOString(),
          weeks: blockWeeks.map((week) => ({
            weekNumber: week.weekNumber,
            startDate: week.startDate,
            endDate: week.endDate,
            sessions: week.sessions.map((session) => ({
              startDate: session.scheduledDate,
              endDate: session.scheduledDate, // Same as start for now
              goalDuration: session.targetDuration,
              goalRpe: session.targetIntensity.rpe,
              goalDistance: session.targetDistance ?? undefined,
              sport: session.sport,
            })),
          })),
        };
      });

      // Build the plan object with all required fields
      const trainingPlan: TrainingPlan = {
        name: `Training Plan for ${inputData.athleteFacts.name || 'Athlete'}`,
        goal: 'Complete training plan',
        startDate:
          inputData.scheduledWeeks[0]?.startDate || new Date().toISOString(),
        endDate:
          inputData.scheduledWeeks[inputData.scheduledWeeks.length - 1]
            ?.endDate || new Date().toISOString(),
        cycles,
      };

      // Build the prompt for QA agent
      const prompt = buildQAPrompt(trainingPlan, inputData.athleteFacts);

      console.log('[qaStep] Calling QA agent with validation tool');

      const response = await qaAgent.generate(prompt, {
        runtimeContext,
        structuredOutput: {
          schema: validationReportSchema,
        },
      });

      const validationReport = response.object;

      console.log('[qaStep] Validation complete');
      console.log('[qaStep] Valid:', validationReport.valid);
      console.log('[qaStep] Score:', validationReport.overallScore);
      console.log('[qaStep] Errors:', validationReport.errors.length);

      return {
        validationReport,
        scheduledWeeks: inputData.scheduledWeeks,
        mesoBlocks: inputData.mesoBlocks,
        athleteFacts: inputData.athleteFacts,
        schedulingMetadata: inputData.schedulingMetadata,
      };
    } catch (error) {
      console.error('[qaStep] Validation failed:', error);
      throw new Error(
        `QA validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

/**
 * Build QA validation prompt
 */
function buildQAPrompt(
  trainingPlan: TrainingPlan,
  athleteFacts: z.infer<typeof athleteFactsSchema>,
): string {
  return `You are validating a complete training plan for an athlete.

=== ATHLETE PROFILE ===
${JSON.stringify(athleteFacts, null, 2)}

=== PLAN STRUCTURE ===
Total Cycles: ${trainingPlan.cycles.length}
Total Weeks: ${trainingPlan.cycles.reduce((sum, c) => sum + c.weeks.length, 0)}

=== COMPLETE PLAN DATA ===
${JSON.stringify(trainingPlan, null, 2)}

=== YOUR TASK ===
Using the validatePlanTool, perform a comprehensive validation of this training plan. The tool will check:

1. **LOAD_PROGRESSION**: Weekly volume increases should not exceed 15%
2. **RECOVERY_ADEQUACY**: At least 1 rest day per week, recovery weeks every 3-4 weeks
3. **HARD_SESSION_SPACING**: Minimum 24h between hard sessions (RPE ≥ 0.7)
4. **INTENSITY_DISTRIBUTION**: 80% of volume should be easy/aerobic
5. **SESSION_DURATION**: Weekly totals should respect target volume ±10%
6. **RACE_SPECIFIC_PREPARATION**: Adequate preparation for race distance and terrain
7. **TAPER_VALIDATION**: Proper taper in final 2-3 weeks before race

Call the tool with the cycles data structure provided above.`;
}
