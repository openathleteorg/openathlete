import { createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import { athleteProfileAgent } from '../../agents/athlete-profile.agent';
import { athleteFactsSchema } from '../../types';

/**
 * Goal Schema
 * Represents the race goal for training plan generation
 */
export const goalSchema = z.object({
  raceName: z.string(),
  raceDate: z.string(),
  distance: z.number(),
  elevationGain: z.number(),
  terrain: z.enum(['ROAD', 'TRAIL', 'MIXED']).optional(),
});

export type Goal = z.infer<typeof goalSchema>;

/**
 * Preferences Schema
 * Optional athlete training preferences
 */
export const preferencesSchema = z.object({
  preferredTrainingDays: z.array(z.number()).optional(),
  avoidDays: z.array(z.number()).optional(),
  maxWeeklyVolume: z.number().optional(),
});

export type Preferences = z.infer<typeof preferencesSchema>;

/**
 * Profile Analysis Step Input Schema
 */
export const profileStepInputSchema = z.object({
  athleteId: z.number(),
  goal: goalSchema,
  preferences: preferencesSchema.optional(),
});

/**
 * Profile Analysis Step Output Schema
 */
export const profileStepOutputSchema = z.object({
  athleteFacts: athleteFactsSchema,
  goal: goalSchema,
});

export type ProfileStepInput = z.infer<typeof profileStepInputSchema>;
export type ProfileStepOutput = z.infer<typeof profileStepOutputSchema>;

/**
 * Step 1: Profile Analysis
 *
 * PURPOSE:
 * Analyze athlete profile and gather baseline data for training plan generation.
 *
 * PROCESS:
 * 1. Fetch athlete's basic data (age, weight, experience, goals)
 * 2. Retrieve weekly availability windows
 * 3. Calculate current training load metrics (TRIMP, ACR)
 * 4. Analyze recent training history (8 weeks)
 * 5. Identify constraints and limitations
 *
 * OUTPUT:
 * Comprehensive AthleteFacts object containing all necessary data for subsequent steps.
 */
export const profileStep = createStep({
  id: 'profile-analysis',
  description: 'Analyze athlete profile and gather baseline data',
  inputSchema: profileStepInputSchema,
  outputSchema: profileStepOutputSchema,
  execute: async ({ inputData, runtimeContext }) => {
    try {
      const currentDate = new Date().toISOString();
      const { athleteId } = inputData;

      // Default analysis period: last 8 weeks
      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 56); // 8 weeks

      const startDate = defaultStartDate.toISOString();
      const endDate = defaultEndDate.toISOString();

      const prompt = `[CURRENT DATE: ${new Date(currentDate).toLocaleDateString(
        'en-US',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      )}]

Create a comprehensive athlete profile by analyzing all available data for athlete ID ${athleteId}.

ANALYSIS PERIOD:
- Start Date: ${new Date(startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
- End Date: ${new Date(endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}

YOUR TASKS:

1. Fetch athlete basic data (age, weight, experience level, goals)
2. Retrieve weekly availability windows 
3. Calculate current training load metrics (acute load, chronic load, ACR)
4. Analyze recent training history to determine:
   - Average weekly volume and trend (increasing/stable/decreasing)
   - Longest run in the analysis period
   - Average pace across all runs
   - Intensity distribution patterns
5. Identify any constraints or limitations

Use the available tools to gather this information, then synthesize it into a structured AthleteFacts object.

Pay special attention to:
- Signs of overtraining (high acute:chronic ratio > 1.5)
- Significant volume changes (>15% week-to-week)
- Training consistency (gaps in training)
- Available training time vs. current volume

OUTPUT FORMAT:
Provide your analysis as a JSON object matching the AthleteFacts schema with these fields:
{
  "athleteId": number,
  "name": string (optional),
  "email": string (optional),
  "currentFitness": {
    "recentWeeklyVolume": number (average weekly volume in seconds over last 4 weeks),
    "recentWeeklyDistance": number (average weekly distance in meters),
    "longestRecentRun": number (longest run in last 8 weeks in meters),
    "currentLoad": {
      "weeklyTrimp": number,
      "acuteChronicRatio": number
    }
  },
  "availability": [{
    "dayOfWeek": number (0=Sunday, 1=Monday, ..., 6=Saturday),
    "startTime": "HH:mm",
    "endTime": "HH:mm",
    "priority": "LOW" | "MEDIUM" | "HIGH"
  }],
  "constraints": {
    "maxWeeklyVolume": number (optional, in seconds),
    "preferredRestDays": number[] (optional, days 0-6),
    "avoidDays": number[] (optional, days 0-6),
    "injuries": string[] (optional)
  },
  "experienceLevel": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ELITE" (optional),
  "trainingHistory": string (optional, narrative summary of training background)
}

Be thorough in your analysis and provide context for your findings.`;

      const response = await athleteProfileAgent.generate(prompt, {
        runtimeContext,
        structuredOutput: {
          schema: athleteFactsSchema,
        },
      });

      const athleteFacts = response.object;

      return { athleteFacts, goal: inputData.goal };
    } catch (error) {
      console.error('[profileStep] Error:', error);
      throw new Error(
        `Failed to analyze athlete profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});
