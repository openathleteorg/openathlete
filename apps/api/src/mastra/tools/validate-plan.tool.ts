import { Tool } from '@mastra/core';
import { createTool } from '@mastra/core';
import { z } from 'zod';

// TODO: Tool to validate a training plan against constraints
// Pure TypeScript logic implementing validation rules
// USED BY: qa.agent

export const validatePlanTool = createTool({
  id: 'validate-plan',
  description:
    'Validates a complete training plan structure against evidence-based training principles, safety constraints, and athlete-specific limitations. Use this when you need to: (1) Perform final QA check before plan approval, (2) Identify potential risks or violations, (3) Get actionable suggestions for improvements, (4) Ensure plan follows periodization best practices. Returns detailed validation report with categorized findings (errors, warnings, suggestions) and severity levels. Critical for plan safety and effectiveness.',
  inputSchema: z.object({
    plan: z.any().describe('Full plan structure to validate'),
    athleteId: z.number(),
    constraints: z
      .object({
        maxWeeklyVolumeIncrease: z.number().optional().default(10),
        minRestDaysPerWeek: z.number().optional().default(1),
        maxConsecutiveHardDays: z.number().optional().default(1),
        targetEasyHardRatio: z.number().optional().default(80),
      })
      .optional(),
  }),
  outputSchema: z.object({
    valid: z.boolean(),
    errors: z.array(
      z.object({
        type: z.string(),
        severity: z.enum(['CRITICAL', 'WARNING', 'INFO']),
        description: z.string(),
        affectedWeeks: z.array(z.number()).optional(),
        suggestion: z.string(),
      }),
    ),
    score: z.number().min(0).max(100),
  }),
  execute: async (context) => {
    // TODO: Implement validation logic
    // 1. Load progression check (max +10-15% per week)
    // 2. Recovery adequacy (rest days, recovery weeks)
    // 3. Hard session spacing (<24h check)
    // 4. Intensity distribution (80/20 rule)
    // 5. Session durations fit availability
    // 6. Calculate score based on violations
    throw new Error('Not implemented yet - validate-plan tool');
  },
});
