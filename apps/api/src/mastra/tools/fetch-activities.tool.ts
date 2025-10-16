import { createTool } from '@mastra/core';
import { z } from 'zod';

// TODO: Tool to retrieve athlete's activity history with flexible filtering
//
// PURPOSE: Get event_activity records for analysis, comparisons, or display
//
// IMPLEMENTATION:
// - Query event_activity with WHERE filters (date range, sport type, etc.)
// - Apply ordering and pagination
// - Map snake_case to camelCase
// - Join with related event data if needed
//
// USED BY: athlete-profile.agent, qna.agent

export const fetchActivitiesTool = createTool({
  id: 'fetch-activities',
  description:
    'Retrieves athlete activity history with flexible filtering by date range, sport type, and other criteria. Returns paginated results with activity details.',
  inputSchema: z.object({
    athleteId: z.number(),
    startDate: z
      .string()
      .optional()
      .describe('ISO date string for range start'),
    endDate: z.string().optional().describe('ISO date string for range end'),
    sport: z.string().optional().describe('Filter by sport type'),
    limit: z.number().optional().default(50).describe('Max results to return'),
    orderBy: z
      .enum(['date', 'distance', 'duration'])
      .optional()
      .default('date'),
  }),
  outputSchema: z.object({
    activities: z.array(
      z.object({
        eventActivityId: z.number(),
        sport: z.string(),
        distance: z.number(),
        elevationGain: z.number(),
        movingTime: z.number(),
        averageSpeed: z.number(),
        averageHeartrate: z.number().nullable(),
        rpe: z.number().nullable(),
        startDate: z.string(),
        description: z.string(),
      }),
    ),
    totalCount: z.number(),
  }),
  execute: async (context) => {
    // TODO: Implement
    throw new Error('Not implemented yet - fetch-activities tool');
  },
});
