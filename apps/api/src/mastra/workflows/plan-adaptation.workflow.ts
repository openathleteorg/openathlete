import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// TODO: Workflow for adapting an existing training plan in response to athlete events
//
// PURPOSE:
// Handle plan modifications triggered by injuries, illness, missed sessions, or schedule changes
//
// STEPS:
// 1. Analysis: Understand the adaptation request and assess severity
// 2. Fetch Context: Get current plan and affected weeks
// 3. Proposal Generation: Create adaptation options (conservative, moderate, aggressive)
// 4. User Confirmation: Present options and wait for choice (handled in conversation)
// 5. Application: Apply chosen modifications (update/skip/reschedule sessions)
// 6. Re-scheduling: Re-run scheduling on affected weeks
// 7. Re-validation: Validate modified plan sections
// 8. Persistence: Update database records
//
// NOTE: This workflow is typically invoked by the adaptation agent within a conversation
// The user confirmation step happens via the chat interface, not as a workflow step

// Temporary placeholder step until full implementation
const notImplementedAdaptationStep = createStep({
  id: 'not-implemented-adaptation',
  description: 'Placeholder step - adaptation workflow not yet implemented',
  inputSchema: z.object({
    athleteId: z.number(),
    adaptationType: z.enum([
      'INJURY',
      'ILLNESS',
      'MISSED_SESSION',
      'SCHEDULE_CHANGE',
      'FATIGUE',
      'OTHER',
    ]),
    description: z.string(),
    reportedDate: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    missedSessionId: z.number().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    adaptationSummary: z.string(),
    modifiedWeeks: z.array(z.number()),
    modifiedSessions: z.array(z.number()),
    validationReport: z.any(),
    error: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    return {
      success: false,
      adaptationSummary: `Adaptation workflow is not yet implemented. The athlete reported: "${inputData.description}" (${inputData.adaptationType}).`,
      modifiedWeeks: [],
      modifiedSessions: [],
      validationReport: {
        message: 'Workflow under construction',
        recommendation:
          'Use adaptation agent for analysis, or contact support for manual plan adjustments.',
      },
      error:
        'Plan adaptation workflow is not yet implemented. Please use the adaptation agent for guidance or contact support.',
    };
  },
});

export const planAdaptationWorkflow = createWorkflow({
  id: 'plan-adaptation',
  description:
    'CRITICAL WORKFLOW: Only use when athlete reports a real problem requiring plan modification (injury, illness, missed sessions). NOT for questions or data requests. Use qna agent for questions instead.',
  inputSchema: z.object({
    athleteId: z.number(),
    adaptationType: z.enum([
      'INJURY',
      'ILLNESS',
      'MISSED_SESSION',
      'SCHEDULE_CHANGE',
      'FATIGUE',
      'OTHER',
    ]),
    description: z.string().describe("Athlete's reported issue or request"),
    reportedDate: z.string().describe('ISO date when issue was reported'),
    severity: z
      .enum(['LOW', 'MEDIUM', 'HIGH'])
      .optional()
      .describe("Athlete's assessment of severity"),
    missedSessionId: z.number().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    adaptationSummary: z.string(),
    modifiedWeeks: z.array(z.number()),
    modifiedSessions: z.array(z.number()),
    validationReport: z.any(),
    error: z.string().optional(),
  }),
})
  .then(notImplementedAdaptationStep)
  .commit();

// IMPLEMENTATION NOTES:
// - This workflow will be called by the adaptation agent after user confirms an option
// - The analysis and proposal generation happen in the agent itself
// - This workflow focuses on the execution: apply changes + re-validate
// - May need to be split into sub-workflows for different adaptation types
