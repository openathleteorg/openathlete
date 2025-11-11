import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import {
  athleteFactsSchema,
  macroPlanSchema,
  mesoBlockSchema,
  scheduledWeekSchema,
  validationReportSchema,
  weekIntentionsSchema,
} from '../../types';

/**
 * Finalize Step Input Schema
 */
export const finalizeStepInputSchema = z.object({
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

/**
 * Finalize Step Output Schema
 */
export const finalizeStepOutputSchema = z.object({
  success: z.boolean(),
  trainingPlanId: z.number().optional(),
  validationReport: z.object({
    valid: z.boolean(),
    overallScore: z.number(),
    message: z.string(),
    totalWeeks: z.number(),
    totalSessionsScheduled: z.number(),
    totalSessionsUnscheduled: z.number(),
    criticalErrorsCount: z.number(),
    warningsCount: z.number(),
    errors: z.array(z.any()),
    metrics: z.any(),
    recommendation: z.string(),
  }),
  error: z.string().optional(),
});

export type FinalizeStepInput = z.infer<typeof finalizeStepInputSchema>;
export type FinalizeStepOutput = z.infer<typeof finalizeStepOutputSchema>;

/**
 * Step 8: Finalize
 *
 * PURPOSE:
 * Convert generated plan to final output format with validation results.
 *
 * PROCESS:
 * 1. Assess overall plan quality
 * 2. Build comprehensive report message
 * 3. Determine success status
 * 4. Provide recommendation for next steps
 *
 * OUTPUT:
 * Final workflow output with success status and detailed validation report.
 */
export const finalizeStep = createStep({
  id: 'finalize',
  description:
    'Convert generated plan to final output format with validation results',
  inputSchema: finalizeStepInputSchema,
  outputSchema: finalizeStepOutputSchema,
  execute: async ({ inputData }) => {
    const hasUnscheduledSessions =
      inputData.schedulingMetadata.totalUnscheduled > 0;
    const hasCriticalErrors = inputData.validationReport.errors
      ? inputData.validationReport.errors.some((e) => e.severity === 'CRITICAL')
      : false;

    const criticalErrorsCount = inputData.validationReport.errors
      ? inputData.validationReport.errors.filter(
          (e) => e.severity === 'CRITICAL',
        ).length
      : 0;

    const warningsCount = inputData.validationReport.errors
      ? inputData.validationReport.errors.filter(
          (e) => e.severity === 'WARNING',
        ).length
      : 0;

    // Determine overall success: plan is valid AND all sessions scheduled
    const overallSuccess =
      inputData.validationReport.valid && !hasUnscheduledSessions;

    // Build recommendation message (including improvement summary if applicable)
    let recommendation = '';
    if (inputData.improvementApplied) {
      recommendation += `Improvements applied: ${inputData.improvementSummary}\n\n`;
    }

    if (!overallSuccess) {
      if (hasCriticalErrors) {
        recommendation +=
          'CRITICAL: Plan has validation errors that must be addressed before use. Review errors and consider regenerating with adjusted parameters.';
      } else if (hasUnscheduledSessions) {
        recommendation += `${inputData.schedulingMetadata.totalUnscheduled} sessions could not be scheduled due to availability constraints. Consider adjusting availability windows or removing optional sessions.`;
      }
    } else {
      recommendation += 'Plan is ready for athlete review and approval.';
    }

    // Build comprehensive message
    let message = '';
    if (overallSuccess) {
      message = `Training plan successfully generated with ${inputData.scheduledWeeks.length} weeks and ${inputData.schedulingMetadata.totalScheduled} scheduled sessions. Quality score: ${inputData.validationReport.overallScore}/100.`;
    } else {
      message = `Training plan generated but requires attention: ${criticalErrorsCount} critical errors, ${warningsCount} warnings, ${inputData.schedulingMetadata.totalUnscheduled} unscheduled sessions.`;
    }

    return {
      success: overallSuccess,
      validationReport: {
        valid: inputData.validationReport.valid,
        overallScore: inputData.validationReport.overallScore,
        message,
        totalWeeks: inputData.scheduledWeeks.length,
        totalSessionsScheduled: inputData.schedulingMetadata.totalScheduled,
        totalSessionsUnscheduled: inputData.schedulingMetadata.totalUnscheduled,
        criticalErrorsCount,
        warningsCount,
        errors: inputData.validationReport.errors || [],
        metrics: inputData.validationReport.metrics,
        recommendation,
      },
    };
  },
});
