import { createTool } from '@mastra/core';
import { z } from 'zod';

import { keysToCamel } from '@openathlete/shared';

/**
 * Fetch Athlete Data Tool
 *
 * Purpose: Retrieve comprehensive athlete profile data for training plan generation and analysis.
 *
 * This tool fetches the athlete's complete profile including:
 * - Basic athlete data (athleteId, userId, timestamps)
 * - Related user information (name, email, etc.)
 * - Weekly availability windows (if requested)
 * - Training statistics (activity counts, totals) (if requested)
 *
 * The tool is designed to provide all necessary context for the athlete-profile.agent
 * to build a comprehensive AthleteFacts object for plan generation.
 *
 * Used by:
 * - athlete-profile.agent: Primary use for profile analysis
 * - adaptation.agent: To understand athlete constraints when adapting plans
 * - qna.agent: To answer questions about athlete data
 *
 * Note: athleteId is automatically provided from the authenticated user context - no need to specify it!
 *
 * Authorization:
 * - The athleteId from runtimeContext is automatically scoped to the authenticated user
 * - CASL checks are handled at the API layer before tools are invoked
 */
export const fetchAthleteDataTool = createTool({
  id: 'fetch-athlete-data',
  description:
    'Fetches comprehensive athlete profile data including demographics, training experience, goals, weekly availability windows, and training statistics. Use this when you need to: (1) Build athlete profile before plan generation, (2) Understand athlete constraints and preferences, (3) Get availability for scheduling decisions, (4) Access athlete metadata for personalized coaching. Returns complete athlete object with optional related data (availability, stats). Essential for plan creation and personalization.',
  inputSchema: z.object({
    includeAvailability: z
      .boolean()
      .optional()
      .default(true)
      .describe('Whether to include weekly availability slots'),
    includeStats: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        'Whether to calculate summary statistics (total activities, distance, duration)',
      ),
  }),
  outputSchema: z.object({
    athlete: z.object({
      athleteId: z.number(),
      userId: z.number(),
      createdAt: z.string(),
      updatedAt: z.string(),
      user: z
        .object({
          userId: z.number(),
          email: z.string(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
        })
        .optional(),
    }),
    availability: z
      .array(
        z.object({
          athleteAvailabilityId: z.number(),
          dayOfWeek: z.number(),
          startTime: z.string(),
          endTime: z.string(),
          priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        }),
      )
      .optional(),
    stats: z
      .object({
        totalActivities: z.number().describe('Total number of activities'),
        totalDistance: z.number().describe('Total distance covered in meters'),
        totalDuration: z.number().describe('Total moving time in seconds'),
        totalElevationGain: z
          .number()
          .describe('Total elevation gain in meters'),
      })
      .optional(),
  }),
  execute: async ({ context: input, runtimeContext }) => {
    try {
      // Get athleteId and prisma from RuntimeContext
      const athleteId = runtimeContext?.get('athleteId');
      const prisma = runtimeContext?.get('prisma');

      if (!athleteId) {
        console.error('[ERROR] athleteId not found in RuntimeContext');
        throw new Error(
          'athleteId not found in context - authentication issue',
        );
      }

      if (!prisma) {
        console.error('[ERROR] prisma not found in RuntimeContext');
        throw new Error('Database service not available in context');
      }

      const { includeAvailability = true, includeStats = true } = input;

      console.log(
        `[DEBUG] Fetching athlete data for athleteId: ${athleteId}, includeAvailability: ${includeAvailability}, includeStats: ${includeStats}`,
      );

      // Build include object dynamically
      const includeClause: any = {
        user: {
          select: {
            user_id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      };

      if (includeAvailability) {
        includeClause.availability = {
          orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
        };
      }

      // Fetch athlete with specified relations
      const athlete = await prisma.athlete.findUnique({
        where: { athlete_id: athleteId },
        include: includeClause,
      });

      if (!athlete) {
        throw new Error(`Athlete with ID ${athleteId} not found`);
      }

      console.log(`[DEBUG] Found athlete: ${athleteId}`);

      // Map athlete data to camelCase
      const mappedAthlete = keysToCamel(athlete) as any;

      // Build result object
      const result: any = {
        athlete: {
          athleteId: mappedAthlete.athleteId,
          userId: mappedAthlete.userId,
          createdAt: mappedAthlete.createdAt,
          updatedAt: mappedAthlete.updatedAt,
          user: mappedAthlete.user
            ? {
                userId: mappedAthlete.user.userId,
                email: mappedAthlete.user.email,
                firstName: mappedAthlete.user.firstName,
                lastName: mappedAthlete.user.lastName,
              }
            : undefined,
        },
      };

      // Add availability if requested and present
      if (includeAvailability && mappedAthlete.availability) {
        result.availability = mappedAthlete.availability.map((slot: any) => ({
          athleteAvailabilityId: slot.athleteAvailabilityId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          priority: slot.priority,
        }));
        console.log(
          `[DEBUG] Included ${result.availability.length} availability slots`,
        );
      }

      // Calculate stats if requested
      if (includeStats) {
        console.log('[DEBUG] Calculating athlete statistics...');

        // Query all activity events for this athlete
        const activityStats = await prisma.event_activity.aggregate({
          where: {
            event: {
              athlete_id: athleteId,
              type: 'ACTIVITY', // Only count completed activities
            },
          },
          _count: {
            event_activity_id: true,
          },
          _sum: {
            distance: true,
            moving_time: true,
            elevation_gain: true,
          },
        });

        result.stats = {
          totalActivities: activityStats._count.event_activity_id || 0,
          totalDistance: activityStats._sum.distance || 0,
          totalDuration: activityStats._sum.moving_time || 0,
          totalElevationGain: activityStats._sum.elevation_gain || 0,
        };

        console.log(
          `[DEBUG] Stats calculated: ${result.stats.totalActivities} activities, ${Math.round(result.stats.totalDistance / 1000)}km total`,
        );
      }

      console.log('[DEBUG] Successfully fetched athlete data');
      return result;
    } catch (error) {
      console.error('[fetchAthleteDataTool] Error:', error);
      throw new Error(
        `Failed to fetch athlete data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
