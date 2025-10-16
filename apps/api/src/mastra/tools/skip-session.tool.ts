import { createTool } from '@mastra/core';
import { z } from 'zod';

// TODO: Tool to mark a session as skipped/cancelled
// USED BY: adaptation.agent

export const skipSessionTool = createTool({
  id: 'skip-session',
  description:
    'Marks a training session as skipped or cancelled with optional reason.',
  inputSchema: z.object({
    eventTrainingId: z.number(),
    reason: z.string().optional().describe('Reason for skipping'),
    skipDate: z.string().describe('ISO date when skip was reported'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    eventTrainingId: z.number(),
  }),
  execute: async (context) => {
    // TODO: Implement
    // Option: Add status field to event_training (PLANNED, SKIPPED, COMPLETED)
    // For now: Update description to include "[SKIPPED] {reason}"
    throw new Error('Not implemented yet - skip-session tool');
  },
});
