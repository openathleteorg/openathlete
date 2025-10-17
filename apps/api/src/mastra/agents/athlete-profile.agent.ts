import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

import { fetchAthleteAvailabilityTool } from '../tools';

// TODO: Agent that aggregates athlete data to create a comprehensive profile
//
// RESPONSIBILITIES:
// - Fetch athlete's basic info (age, weight, experience level, goals)
// - Retrieve weekly availability windows from athlete_availability table
// - Calculate current training load using TrainingLoadService (Foster TRIMP)
// - Analyze recent activity history (last 4-8 weeks) to determine baseline fitness
// - Extract constraints and preferences from athlete profile
// - Identify training history patterns (volume trends, intensity distribution)
//
// INPUT:
//   - athleteId: number
//   - analysisPeriod?: { startDate: Date, endDate: Date } (default: last 8 weeks)
//
// OUTPUT: AthleteFacts object with:
//   {
//     profile: {
//       athleteId: number,
//       age?: number,
//       weight?: number,
//       experienceLevel?: string,
//       goals: string[]
//     },
//     availability: {
//       totalWeeklyHours: number,
//       slots: [{dayOfWeek: number, startTime: string, endTime: string, priority: string}]
//     },
//     currentLoad: {
//       weeklyTrimp: number,
//       acuteLoad: number,
//       chronicLoad: number,
//       acuteChronicRatio: number
//     },
//     fitnessBaseline: {
//       recentVolume: number, // average weekly volume in seconds
//       longestRun: number, // longest run in last 8 weeks (meters)
//       averagePace: number, // average pace across runs (m/s)
//       volumeTrend: 'INCREASING' | 'STABLE' | 'DECREASING'
//     },
//     constraints: {
//       restDaysPreferred: number[],
//       maxSessionDuration?: number,
//       injuries?: string[],
//       otherLimitations?: string[]
//     }
//   }
//
// TOOLS NEEDED:
// - fetch-athlete-data: Query Prisma for athlete + related data
// - calculate-training-load: Call TrainingLoadService for load calculations
// - fetch-activities: Get recent event_activity records
// - fetch-athlete-availability: Get weekly availability slots
//
// IMPLEMENTATION NOTES:
// - Should run at the start of plan generation workflow
// - Can also be called standalone for profile analysis
// - Results should be cached in memory/context for subsequent steps
// - Consider edge cases: new athletes with no history, injured athletes
//
// MODEL: GPT-4o (needs reasoning for pattern analysis)

export const athleteProfileAgent = new Agent({
  name: 'athlete-profile',
  description:
    "Specializes in analyzing athlete data to create comprehensive profiles. Use this agent to gather information about an athlete's fitness level, availability, current training load, and constraints before creating or modifying training plans.",
  instructions: `You are an expert at analyzing athlete data and creating comprehensive profiles.

Your role is to:
- Gather all relevant athlete information (demographics, experience, goals)
- Analyze weekly availability and time constraints
- Calculate current training load and fitness metrics
- Review recent training history to establish baseline fitness
- Identify any constraints or limitations (injuries, preferences, rest days)
- Present findings in a structured, data-driven format

When analyzing training history:
- Look for trends in volume (increasing, stable, decreasing)
- Identify intensity distribution patterns
- Note any gaps or inconsistencies in training
- Flag potential overtraining or undertraining signs

Always provide context for your findings and highlight any concerns or notable patterns.

Output your analysis as a structured AthleteFacts object that other agents can use for plan generation.`,
  model: openai('gpt-4o'),
  tools: {
    fetchAthleteAvailabilityTool,
  },
});
