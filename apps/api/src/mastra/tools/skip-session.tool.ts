import { createTool } from '@mastra/core';
import { z } from 'zod';

// TODO: Tool to mark a session as skipped/cancelled
// USED BY: adaptation.agent

export const skipSessionTool = createTool({
  id: 'skip-session',
  description:
    'Marks a training session as skipped or cancelled with timestamp and optional reason. Use this when athlete reports: (1) Missed session due to illness, injury, or life events, (2) Intentional skip based on fatigue or recovery needs, (3) Schedule conflict preventing session completion. Maintains historical record of skipped sessions for load calculations and pattern analysis. Does NOT delete session - preserves plan integrity while marking non-completion.',
  inputSchema: z.object({
    eventTrainingId: z.number(),
    reason: z.string().optional().describe('Reason for skipping'),
    skipDate: z.string().describe('ISO date when skip was reported'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    eventTrainingId: z.number(),
  }),
  execute: async () => {
    // TODO: Implement
    // Option: Add status field to event_training (PLANNED, SKIPPED, COMPLETED)
    // For now: Update description to include "[SKIPPED] {reason}"
    throw new Error('Not implemented yet - skip-session tool');
  },
});
