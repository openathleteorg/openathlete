import { createTool } from '@mastra/core';
import { z } from 'zod';

import { keysToCamel } from '@openathlete/shared';

/**
 * Fetch Athlete Availability Tool
 *
 * Purpose: Retrieve athlete's weekly availability windows for training session scheduling.
 *
 * This tool queries the athlete_availability table to get all time slots when
 * the athlete is available for training. It also calculates the total number of
 * slots and total weekly hours available.
 *
 * Used by:
 * - scheduling.agent: To place sessions in appropriate time slots
 * - athlete-profile.agent: To understand athlete constraints
 *
 * Note: athleteId is automatically provided from the authenticated user context - no need to specify it!
 *
 * Output:
 * - availability: Array of availability slots with day, time, and priority
 * - totalSlots: Count of all availability windows
 * - totalWeeklyHours: Sum of all available hours per week
 *
 * Example availability slot:
 * {
 *   day_of_week: 1, // Monday
 *   start_time: "08:00",
 *   end_time: "12:00",
 *   priority: "HIGH"
 * }
 */
export const fetchAthleteAvailabilityTool = createTool({
  id: 'fetch-athlete-availability',
  description:
    "Retrieves athlete's weekly availability slots for training session scheduling. Returns time windows when athlete can train, including day of week, start/end times, and priority levels. Also calculates total available hours per week. Use this when: (1) Creating or updating training plans (2) Scheduling sessions (3) Checking if athlete has time for additional workouts (4) Answering questions about training schedule flexibility.",
  inputSchema: z.object({
    // No athleteId needed - comes from authenticated context
  }),
  outputSchema: z.object({
    availability: z
      .array(
        z.object({
          athleteAvailabilityId: z.number(),
          dayOfWeek: z
            .number()
            .min(0)
            .max(6)
            .describe('Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday'),
          startTime: z.string().describe('Start time in HH:mm format (24h)'),
          endTime: z.string().describe('End time in HH:mm format (24h)'),
          priority: z
            .enum(['LOW', 'MEDIUM', 'HIGH'])
            .describe('Priority level of this availability slot'),
        }),
      )
      .describe('Array of availability time slots'),
    totalSlots: z.number().describe('Total number of availability slots'),
    totalWeeklyHours: z
      .number()
      .describe('Total hours available per week across all slots'),
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

      // Query all availability slots for the athlete
      const availabilityRecords = await prisma.athlete_availability.findMany({
        where: {
          athlete_id: athleteId,
        },
        orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
      });

      // Calculate total weekly hours
      let totalWeeklyHours = 0;
      for (const slot of availabilityRecords) {
        const duration = calculateSlotDuration(slot.start_time, slot.end_time);
        totalWeeklyHours += duration;
      }

      // Convert snake_case to camelCase and map to output schema
      const availability = availabilityRecords.map((record) => ({
        athleteAvailabilityId: record.athlete_availability_id,
        dayOfWeek: record.day_of_week,
        startTime: record.start_time,
        endTime: record.end_time,
        priority: record.priority as 'LOW' | 'MEDIUM' | 'HIGH',
      }));

      const result = {
        availability,
        totalSlots: availabilityRecords.length,
        totalWeeklyHours: Math.round(totalWeeklyHours * 100) / 100, // Round to 2 decimals
      };

      return result;
    } catch (error) {
      throw error;
    }
  },
});

/**
 * Calculate duration in hours between two time strings in HH:mm format
 *
 * @param startTime - Start time in "HH:mm" format (e.g., "08:00")
 * @param endTime - End time in "HH:mm" format (e.g., "12:00")
 * @returns Duration in hours (e.g., 4.0)
 */
function calculateSlotDuration(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return (endMinutes - startMinutes) / 60;
}
