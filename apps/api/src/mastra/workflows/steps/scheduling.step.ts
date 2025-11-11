import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import { schedulingAgent } from '../../agents/scheduling.agent';
import {
  athleteFactsSchema,
  mesoBlockSchema,
  scheduledWeekSchema,
  weekIntentionsSchema,
} from '../../types';

/**
 * Scheduling Step Input Schema
 */
export const schedulingStepInputSchema = z.object({
  weekIntentions: z.array(weekIntentionsSchema),
  mesoBlocks: z.array(mesoBlockSchema),
  athleteFacts: athleteFactsSchema,
});

/**
 * Scheduling Step Output Schema
 */
export const schedulingStepOutputSchema = z.object({
  scheduledWeeks: z.array(scheduledWeekSchema),
  schedulingMetadata: z.object({
    totalScheduled: z.number().describe('Total sessions successfully placed'),
    totalUnscheduled: z
      .number()
      .describe('Total sessions that could not be placed'),
    overallWarnings: z
      .array(z.string())
      .describe('Global warnings across all weeks'),
    conflictResolutions: z
      .array(z.string())
      .describe('How conflicts were resolved'),
  }),
  mesoBlocks: z.array(mesoBlockSchema),
  athleteFacts: athleteFactsSchema,
});

/**
 * PURPOSE:
 * Assign training sessions to specific calendar days and times.
 *
 * PROCESS:
 * 1. For each week:
 *    - Fetch athlete availability
 *    - Place sessions respecting constraints:
 *      * No hard sessions within 24h
 *      * Fit within availability windows
 *      * Respect rest day preferences
 *    - Handle conflicts gracefully
 * 2. Track scheduling success/failures
 * 3. Generate warnings for compromises
 *
 * OUTPUT:
 * Array of ScheduledWeeks with sessions assigned to dates/times.
 */
export const schedulingStep = createStep({
  id: 'scheduling',
  description: 'Assign sessions to specific days and times',
  inputSchema: schedulingStepInputSchema,
  outputSchema: schedulingStepOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    try {
      const scheduledWeeks: Array<z.infer<typeof scheduledWeekSchema>> = [];
      const overallWarnings: string[] = [];
      let totalScheduled = 0;
      let totalUnscheduled = 0;

      for (const weekIntentions of inputData.weekIntentions) {
        const prompt = buildSchedulingPrompt(
          weekIntentions,
          inputData.athleteFacts,
        );

        const response = await schedulingAgent.generate(prompt, {
          runtimeContext,
          structuredOutput: {
            schema: scheduledWeekSchema,
          },
        });

        const scheduledWeek = response.object;

        scheduledWeek.weekNumber = weekIntentions.weekNumber;
        scheduledWeek.startDate = weekIntentions.startDate;
        scheduledWeek.endDate = weekIntentions.endDate;
        scheduledWeek.theme = weekIntentions.theme;
        scheduledWeek.targetVolume = weekIntentions.targetVolume;

        scheduledWeeks.push(scheduledWeek);

        const scheduled = scheduledWeek.sessions.length;
        const unscheduled = scheduledWeek.unscheduledSessions?.length || 0;
        totalScheduled += scheduled;
        totalUnscheduled += unscheduled;

        if (scheduledWeek.schedulingWarnings?.length) {
          overallWarnings.push(
            ...scheduledWeek.schedulingWarnings.map(
              (w) => `Week ${weekIntentions.weekNumber}: ${w}`,
            ),
          );
        }
      }

      return {
        scheduledWeeks,
        schedulingMetadata: {
          totalScheduled,
          totalUnscheduled,
          overallWarnings,
          conflictResolutions:
            totalUnscheduled > 0
              ? [
                  `${totalUnscheduled} sessions could not be placed due to availability or constraint conflicts. Review unscheduledSessions in affected weeks for details.`,
                ]
              : ['All sessions successfully scheduled with no conflicts.'],
        },
        mesoBlocks: inputData.mesoBlocks,
        athleteFacts: inputData.athleteFacts,
      };
    } catch (error) {
      console.error('[schedulingStep] Failed to schedule sessions:', error);
      throw new Error(
        `Scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

/**
 * Build scheduling prompt
 */
function buildSchedulingPrompt(
  weekIntentions: z.infer<typeof weekIntentionsSchema>,
  athleteFacts: z.infer<typeof athleteFactsSchema>,
): string {
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const sessionsText = weekIntentions.sessions
    .map((s, i) => {
      const duration = (s.targetDuration / 3600).toFixed(1);
      const rpe = (s.targetIntensity.rpe * 10).toFixed(0);
      return `${i + 1}. ${s.type} - ${s.sport}
   Duration: ${duration}h (${s.targetDuration}s)
   Intensity: ${s.targetIntensity.zone || 'N/A'} (RPE ${rpe}/10)
   Priority: ${s.priority}
   Description: ${s.description}`;
    })
    .join('\n\n');

  return `You are scheduling training sessions for WEEK ${weekIntentions.weekNumber} of a training plan.

=== WEEK CONTEXT ===
Week Number: ${weekIntentions.weekNumber}
Week Start: ${weekIntentions.startDate}
Week End: ${weekIntentions.endDate}
Focus: ${weekIntentions.theme}
Target Volume: ${(weekIntentions.targetVolume / 3600).toFixed(1)}h

=== SESSIONS TO SCHEDULE ===
${sessionsText}

=== ATHLETE CONTEXT ===
Experience Level: ${athleteFacts.experienceLevel || 'INTERMEDIATE'}
Constraints: ${JSON.stringify(athleteFacts.constraints, null, 2)}

=== YOUR TASK ===
1. Use the fetchAthleteAvailabilityTool to get the athlete's weekly availability
2. Analyze the availability pattern (longest windows, high-priority slots)
3. Place each session strategically:
   - Respect CRITICAL rules (24h hard session spacing, availability fit)
   - Follow HIGH PRIORITY rules when possible (rest days, smart long run placement)
   - Adapt to athlete's unique schedule (not rigid weekly patterns)
4. For each scheduled session, provide:
   - scheduledDate: ISO date string
   - scheduledTime: HH:mm format
   - availabilitySlotId: ID of the slot used
   - schedulingNotes: Brief explanation of placement rationale
5. If unable to place a session:
   - Add to unscheduledSessions array
   - Explain WHY in schedulingWarnings
   - Suggest solutions

=== CRITICAL REMINDERS ===
- Check cross-week boundaries for hard session spacing
- Long runs are NOT required to be on weekends - adapt to availability
- Be flexible and athlete-centered in your placement strategy

Output a ScheduledWeek object with all fields populated according to the schema.`;
}
