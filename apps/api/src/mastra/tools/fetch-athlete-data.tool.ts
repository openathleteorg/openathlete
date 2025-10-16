import { createTool } from '@mastra/core';
import { z } from 'zod';

// TODO: Tool to fetch comprehensive athlete data from database
//
// PURPOSE:
// Retrieve athlete profile, preferences, constraints, and metadata to build
// a complete picture of the athlete for training plan generation or analysis.
//
// IMPLEMENTATION:
// - Inject PrismaService via dependency injection
// - Query athlete table with optional relations (availability, stats)
// - Calculate summary statistics if requested
// - Map snake_case database fields to camelCase using keysToCamel from @openathlete/shared
//
// USAGE:
// Used by: athlete-profile.agent, adaptation.agent, qna.agent
//
// EXAMPLE:
// const result = await fetchAthleteDataTool.execute({
//   athleteId: 123,
//   includeAvailability: true,
//   includeStats: true
// });
//
// NOTES:
// - Should handle case where athlete doesn't exist (throw NotFoundException)
// - Authorization check: ensure user has access to this athlete's data (CASL)
// - Consider caching frequently accessed athlete data

export const fetchAthleteDataTool = createTool({
  id: 'fetch-athlete-data',
  description:
    'Fetches comprehensive athlete data including profile, availability windows, and training statistics. Use this to get all relevant athlete information for plan generation or analysis.',
  inputSchema: z.object({
    athleteId: z.number().describe('The ID of the athlete to fetch data for'),
    includeAvailability: z
      .boolean()
      .optional()
      .default(true)
      .describe('Whether to include weekly availability slots'),
    includeStats: z
      .boolean()
      .optional()
      .default(true)
      .describe('Whether to calculate summary statistics'),
  }),
  outputSchema: z.object({
    athlete: z.object({
      athleteId: z.number(),
      userId: z.number(),
      // Add more athlete fields as needed from your schema
    }),
    availability: z
      .array(
        z.object({
          dayOfWeek: z.number(),
          startTime: z.string(),
          endTime: z.string(),
          priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        }),
      )
      .optional(),
    stats: z
      .object({
        totalActivities: z.number(),
        totalDistance: z.number(),
        totalDuration: z.number(),
        // Add more stats as needed
      })
      .optional(),
  }),
  execute: async (context) => {
    // TODO: Implement with PrismaService
    // const prisma = context.runContext?.prismaService; // Inject via runContext
    // const { athleteId, includeAvailability, includeStats } = context.inputData;
    //
    // const athlete = await prisma.athlete.findUnique({
    //   where: { athlete_id: athleteId },
    //   include: {
    //     availability: includeAvailability,
    //     // ... other relations
    //   }
    // });
    //
    // if (!athlete) {
    //   throw new NotFoundException(`Athlete ${athleteId} not found`);
    // }
    //
    // const mapped = keysToCamel(athlete);
    // return { athlete: mapped, availability: ..., stats: ... };

    throw new Error('Not implemented yet - fetch-athlete-data tool');
  },
});
