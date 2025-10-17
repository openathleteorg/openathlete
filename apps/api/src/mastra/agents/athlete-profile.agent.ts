import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

import {
  calculateTrainingLoadTool,
  fetchActivitiesTool,
  fetchAthleteAvailabilityTool,
  fetchAthleteDataTool,
} from '../tools';

/**
 * Athlete Profile Agent
 *
 * RESPONSIBILITIES:
 * - Fetch athlete's basic info and training history
 * - Retrieve weekly availability windows from athlete_availability table
 * - Calculate current training load using TrainingLoadService (Foster TRIMP)
 * - Analyze recent activity history (last 4-8 weeks) to determine baseline fitness
 * - Extract constraints and preferences from athlete profile
 * - Identify training history patterns (volume trends, intensity distribution)
 *
 * INPUT (via prompt):
 *   - athleteId: number
 *   - analysisPeriod: { startDate: string, endDate: string } (default: last 8 weeks)
 *
 * OUTPUT: AthleteFacts object matching athleteFactsSchema:
 *   {
 *     athleteId: number,
 *     name?: string,
 *     email?: string,
 *     currentFitness: {
 *       recentWeeklyVolume: number,        // avg weekly volume in seconds (last 4 weeks)
 *       recentWeeklyDistance: number,      // avg weekly distance in meters
 *       longestRecentRun: number,          // longest run in last 8 weeks (meters)
 *       currentLoad: {
 *         weeklyTrimp: number,             // current weekly TRIMP
 *         acuteChronicRatio: number        // ACR for injury risk
 *       }
 *     },
 *     availability: [{
 *       dayOfWeek: number,                 // 0=Sunday, 6=Saturday
 *       startTime: string,                 // HH:mm format
 *       endTime: string,                   // HH:mm format
 *       priority: 'LOW' | 'MEDIUM' | 'HIGH'
 *     }],
 *     constraints: {
 *       maxWeeklyVolume?: number,          // in seconds
 *       preferredRestDays?: number[],      // days 0-6
 *       avoidDays?: number[],              // days 0-6
 *       injuries?: string[]
 *     },
 *     experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE',
 *     trainingHistory?: string             // narrative summary
 *   }
 *
 * TOOLS AVAILABLE:
 * - fetchAthleteDataTool: Query Prisma for athlete + related data
 * - calculateTrainingLoadTool: Call TrainingLoadService for load calculations
 * - fetchActivitiesTool: Get recent event_activity records
 * - fetchAthleteAvailabilityTool: Get weekly availability slots
 *
 * MODEL: GPT-4o (needs reasoning for pattern analysis)
 */

export const athleteProfileAgent = new Agent({
  name: 'athlete-profile',
  description:
    "Specializes in analyzing athlete data to create comprehensive profiles. Use this agent to gather information about an athlete's fitness level, availability, current training load, and constraints before creating or modifying training plans.",
  instructions: `You are an expert at analyzing athlete data and creating comprehensive profiles.

IMPORTANT: The current date is provided at the start of each user message in brackets [CURRENT DATE: ...].
Always use this date when interpreting relative time expressions:
- "last week" = 7 days before current date
- "last month" = 30 days before current date  
- "this week" = current week starting Monday
- "this month" = current calendar month
- "recent" or "latest" = last 30 days from current date

YOUR WORKFLOW:

1. USE TOOLS to gather data:
   - Call fetchAthleteDataTool to get basic athlete information
   - Call fetchAthleteAvailabilityTool to get weekly availability slots
   - Call fetchActivitiesTool to get recent training activities
   - Call calculateTrainingLoadTool to compute TRIMP and load metrics

2. ANALYZE the data:
   - Calculate average weekly volume and distance (last 4 weeks)
   - Identify longest run in the analysis period
   - Determine volume trend (increasing/stable/decreasing)
   - Check for overtraining signals (ACR > 1.5)
   - Note any training gaps or inconsistencies
   - Identify constraints from athlete data

3. OUTPUT FORMAT:
   Return your analysis as a JSON object ONLY (no additional text before or after).
   The JSON must match this exact structure:

{
  "athleteId": <number>,
  "name": "<string or null>",
  "email": "<string or null>",
  "currentFitness": {
    "recentWeeklyVolume": <number in seconds>,
    "recentWeeklyDistance": <number in meters>,
    "longestRecentRun": <number in meters>,
    "currentLoad": {
      "weeklyTrimp": <number>,
      "acuteChronicRatio": <number>
    }
  },
  "availability": [
    {
      "dayOfWeek": <0-6>,
      "startTime": "<HH:mm>",
      "endTime": "<HH:mm>",
      "priority": "<LOW|MEDIUM|HIGH>"
    }
  ],
  "constraints": {
    "maxWeeklyVolume": <number in seconds or null>,
    "preferredRestDays": [<0-6>] or null,
    "avoidDays": [<0-6>] or null,
    "injuries": ["<string>"] or null
  },
  "experienceLevel": "<BEGINNER|INTERMEDIATE|ADVANCED|ELITE or null>",
  "trainingHistory": "<narrative summary or null>"
}

CRITICAL: Your response must be ONLY the JSON object, nothing else. Do not include explanations before or after the JSON.`,
  model: openai('gpt-4o'),
  tools: {
    fetchAthleteDataTool,
    fetchActivitiesTool,
    fetchAthleteAvailabilityTool,
    calculateTrainingLoadTool,
  },
});
