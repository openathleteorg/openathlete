import { createTool } from '@mastra/core';
import { z } from 'zod';

// TODO: Tool to retrieve athlete's active training plan with full hierarchy
// USED BY: adaptation.agent, qna.agent, qa.agent

export const fetchCurrentPlanTool = createTool({
  id: 'fetch-current-plan',
  description:
    "Retrieves the athlete's currently active training plan with complete hierarchical structure (plan → cycles → weeks → sessions). Use this when you need to: (1) Review the full plan structure for modifications or adaptations, (2) Answer questions about what's planned in upcoming weeks, (3) Check session details before making changes, (4) Validate plan completeness. Returns null if no active plan exists. Includes optional filters to control detail level (weeks/sessions inclusion).",
  inputSchema: z.object({
    athleteId: z.number(),
    includeWeeks: z.boolean().optional().default(true),
    includeSessions: z.boolean().optional().default(true),
  }),
  outputSchema: z.object({
    plan: z
      .object({
        trainingPlanId: z.number(),
        name: z.string(),
        goal: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        status: z.string(),
        cycles: z.array(z.any()),
      })
      .nullable(),
  }),
  execute: async (context) => {
    // TODO: Implement - query training_plan with status=ACTIVE
    throw new Error('Not implemented yet - fetch-current-plan tool');
  },
});
