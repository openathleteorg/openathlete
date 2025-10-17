import { createTool } from '@mastra/core';
import { z } from 'zod';

// TODO: Tool to modify an existing training session
// USED BY: adaptation.agent

export const updateSessionTool = createTool({
  id: 'update-session',
  description:
    "Modifies an existing training session's parameters while preserving session identity and plan structure. Use this when you need to: (1) Adjust session distance, duration, or intensity due to athlete feedback, (2) Reschedule a session to different date/time, (3) Update session description or notes, (4) Fine-tune workout details as part of plan adaptation. Accepts partial updates (only changed fields). Essential for responsive plan adjustments without full regeneration.",
  inputSchema: z.object({
    eventTrainingId: z.number(),
    updates: z.object({
      goalDistance: z.number().optional(),
      goalElevationGain: z.number().optional(),
      goalDuration: z.number().optional(),
      goalRpe: z.number().optional(),
      description: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    updatedSession: z.any(),
  }),
  execute: async (context) => {
    // TODO: Implement
    // - Update event_training by ID
    // - Also update parent event if dates changed
    // - Convert camelCase to snake_case
    throw new Error('Not implemented yet - update-session tool');
  },
});
