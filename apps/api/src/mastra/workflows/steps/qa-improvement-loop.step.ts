import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import { qaImprovementAgent } from '../../agents/qa-improvement.agent';
import {
  athleteFactsSchema,
  improvementProposalSchema,
  macroPlanSchema,
  mesoBlockSchema,
  scheduledWeekSchema,
  sessionCorrectionSchema,
  validationReportSchema,
  weekCorrectionSchema,
  weekIntentionsSchema,
} from '../../types';

/**
 * QA Improvement Loop Step Input Schema
 */
export const qaImprovementLoopStepInputSchema = z.object({
  validationReport: validationReportSchema,
  scheduledWeeks: z.array(scheduledWeekSchema),
  weekIntentions: z.array(weekIntentionsSchema),
  mesoBlocks: z.array(mesoBlockSchema),
  athleteFacts: athleteFactsSchema,
  macroPlan: macroPlanSchema,
  schedulingMetadata: z.object({
    totalScheduled: z.number(),
    totalUnscheduled: z.number(),
    overallWarnings: z.array(z.string()),
    conflictResolutions: z.array(z.string()),
  }),
});

/**
 * QA Improvement Loop Step Output Schema
 */
export const qaImprovementLoopStepOutputSchema = z.object({
  validationReport: validationReportSchema,
  scheduledWeeks: z.array(scheduledWeekSchema),
  weekIntentions: z.array(weekIntentionsSchema),
  mesoBlocks: z.array(mesoBlockSchema),
  athleteFacts: athleteFactsSchema,
  macroPlan: macroPlanSchema,
  schedulingMetadata: z.object({
    totalScheduled: z.number(),
    totalUnscheduled: z.number(),
    overallWarnings: z.array(z.string()),
    conflictResolutions: z.array(z.string()),
  }),
  improvementApplied: z.boolean(),
  improvementSummary: z.string(),
});

export type QAImprovementLoopStepInput = z.infer<
  typeof qaImprovementLoopStepInputSchema
>;
export type QAImprovementLoopStepOutput = z.infer<
  typeof qaImprovementLoopStepOutputSchema
>;

const MAX_IMPROVEMENT_ITERATIONS = 3;

/**
 * Step 7: QA Improvement Loop
 *
 * PURPOSE:
 * Apply corrections to improve plan quality based on QA validation results.
 *
 * PROCESS:
 * 1. Check if improvement is needed (critical errors OR score < 75)
 * 2. If needed:
 *    - Use qaImprovementAgent to generate correction proposals
 *    - Apply corrections to scheduled weeks
 *    - Re-validate with validatePlanTool
 * 3. If not needed: return plan as-is
 *
 * ITERATION CONTROL:
 * - Stops when score ≥ 75 AND no critical errors
 * - OR when max iterations reached (configured in workflow)
 *
 * OUTPUT:
 * Updated ValidationReport and ScheduledWeeks, plus improvement metadata.
 */
export const qaImprovementLoopStep = createStep({
  id: 'qa-improvement-loop',
  description:
    'Apply QA corrections and re-validate improved plan (one iteration)',
  inputSchema: qaImprovementLoopStepInputSchema,
  outputSchema: qaImprovementLoopStepOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    const {
      validationReport,
      scheduledWeeks,
      weekIntentions,
      mesoBlocks,
      athleteFacts,
      macroPlan,
      schedulingMetadata,
    } = inputData;

    const criticalErrors =
      validationReport.errors?.filter((e) => e.severity === 'CRITICAL') || [];
    const currentScore = validationReport.overallScore || 0;

    // Check if improvement is needed
    if (criticalErrors.length === 0 && currentScore >= 75) {
      console.log(
        `[qaImprovementLoopStep] Plan quality is acceptable (score: ${currentScore}/100, no critical errors). No improvement needed.`,
      );
      return {
        ...inputData,
        improvementApplied: false,
        improvementSummary: `Plan validated successfully with score ${currentScore}/100.`,
      };
    }

    try {
      console.log(
        `[qaImprovementLoopStep] Improvement needed - Score: ${currentScore}/100, Critical errors: ${criticalErrors.length}`,
      );

      // Build prompt for improvement agent
      const prompt = `Analyze the following training plan validation report and propose specific corrections to improve the plan quality.

=== CURRENT VALIDATION REPORT ===
${JSON.stringify(validationReport, null, 2)}

=== PLAN STRUCTURE ===
Total Weeks: ${scheduledWeeks.length}
Total Sessions: ${schedulingMetadata.totalScheduled}

=== ATHLETE CONTEXT ===
${JSON.stringify(athleteFacts, null, 2)}

=== YOUR TASK ===
Propose targeted corrections to address the validation errors. Focus on:
1. CRITICAL errors first (must fix)
2. WARNING errors that significantly impact score
3. Simple, actionable changes that preserve overall plan integrity

For each affected week, specify:
- Which sessions to modify (by index)
- What action to take (REDUCE_SESSION_DURATION, REMOVE_SESSION, etc.)
- Expected impact on validation

Provide a clear strategy and realistic improvement estimate.`;

      console.log('[qaImprovementLoopStep] Calling QA improvement agent');

      const response = await qaImprovementAgent.generate(prompt, {
        runtimeContext,
        structuredOutput: {
          schema: improvementProposalSchema,
        },
      });

      const improvementProposal = response.object;

      console.log(
        `[qaImprovementLoopStep] Received ${improvementProposal.weekCorrections.length} week corrections`,
      );
      console.log(
        `[qaImprovementLoopStep] Strategy: ${improvementProposal.strategy}`,
      );

      // Apply corrections to scheduled weeks
      const improvedScheduledWeeks = applyCorrections(
        scheduledWeeks,
        improvementProposal.weekCorrections,
      );

      console.log('[qaImprovementLoopStep] Corrections applied successfully');

      // For simplicity, we don't re-validate here - the workflow will loop and re-run qaStep
      // Return the improved plan with validation report indicating improvements applied
      return {
        validationReport: {
          ...validationReport,
          summary: `${validationReport.summary}\n\nIMPROVEMENT APPLIED: ${improvementProposal.strategy}`,
        },
        scheduledWeeks: improvedScheduledWeeks,
        weekIntentions,
        mesoBlocks,
        athleteFacts,
        macroPlan,
        schedulingMetadata,
        improvementApplied: true,
        improvementSummary: improvementProposal.strategy,
      };
    } catch (error) {
      console.error('[qaImprovementLoopStep] Improvement failed:', error);

      // If improvement fails, return original plan
      return {
        ...inputData,
        improvementApplied: false,
        improvementSummary: `Improvement attempt failed: ${error instanceof Error ? error.message : 'Unknown error'}. Returning original plan.`,
      };
    }
  },
});

/**
 * Apply corrections to scheduled weeks
 */
export function applyCorrections(
  scheduledWeeks: Array<z.infer<typeof scheduledWeekSchema>>,
  weekCorrections: Array<z.infer<typeof weekCorrectionSchema>>,
): Array<z.infer<typeof scheduledWeekSchema>> {
  const improved = [...scheduledWeeks];

  for (const weekCorrection of weekCorrections) {
    const weekIndex = improved.findIndex(
      (w) => w.weekNumber === weekCorrection.weekNumber,
    );

    if (weekIndex === -1) {
      console.warn(
        `[applyCorrections] Week ${weekCorrection.weekNumber} not found, skipping`,
      );
      continue;
    }

    const week = improved[weekIndex];

    console.log(
      `[applyCorrections] Applying ${weekCorrection.corrections.length} corrections to week ${weekCorrection.weekNumber}`,
    );

    for (const correction of weekCorrection.corrections) {
      applySessionCorrection(week, correction);
    }

    improved[weekIndex] = week;
  }

  return improved;
}

/**
 * Apply a single session correction to a week
 */
function applySessionCorrection(
  week: z.infer<typeof scheduledWeekSchema>,
  correction: z.infer<typeof sessionCorrectionSchema>,
): void {
  const { action, sessionIndex } = correction;

  if (sessionIndex < 0 || sessionIndex >= week.sessions.length) {
    console.warn(
      `[applySessionCorrection] Invalid session index ${sessionIndex} in week ${week.weekNumber}`,
    );
    return;
  }

  const session = week.sessions[sessionIndex];

  switch (action) {
    case 'REDUCE_SESSION_DURATION':
      // Parse newValue (e.g., "20 minutes" → 1200 seconds)
      const newDurationMatch = correction.newValue.match(
        /(\d+\.?\d*)\s*(h|hour|min|minute)/i,
      );
      if (newDurationMatch) {
        const value = parseFloat(newDurationMatch[1]);
        const unit = newDurationMatch[2].toLowerCase();
        session.targetDuration = unit.startsWith('h')
          ? value * 3600
          : value * 60;
        console.log(
          `[applySessionCorrection] Reduced session ${sessionIndex} duration to ${session.targetDuration}s`,
        );
      }
      break;

    case 'REMOVE_SESSION':
      week.sessions.splice(sessionIndex, 1);
      break;

    case 'REDUCE_SESSION_INTENSITY':
      // Reduce RPE by 0.1-0.2
      session.targetIntensity.rpe = Math.max(
        0.1,
        session.targetIntensity.rpe - 0.15,
      );
      break;

    case 'ADD_REST_DAY':
      // This is more complex - would need to add a new REST session
      // For now, log a warning
      console.warn(
        `[applySessionCorrection] ADD_REST_DAY not fully implemented yet`,
      );
      break;

    case 'MOVE_SESSION':
      // This would require re-scheduling logic
      // For now, log a warning
      console.warn(
        `[applySessionCorrection] MOVE_SESSION not fully implemented yet`,
      );
      break;

    default:
      console.warn(`[applySessionCorrection] Unknown action: ${action}`);
  }
}
