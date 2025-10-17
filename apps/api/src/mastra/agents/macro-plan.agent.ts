import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

import { macroPlanSchema } from '../types';

// TODO: Agent that designs the macro-structure of a training plan
//
// RESPONSIBILITIES:
// - Define training phases (BASE, SPECIFIC, TAPER) with durations
// - Set volume progression across phases (build, peak, taper)
// - Identify key milestones (VMA tests, preparatory races, goal race)
// - Determine overall plan duration based on goal race date
// - Balance volume and intensity across the macro cycle
// - Account for athlete's current fitness level and goal difficulty
//
// INPUT:
//   - athleteFacts: AthleteFacts (from athlete-profile agent)
//   - goal: {
//       raceName: string,
//       raceDate: Date,
//       distance: number, // meters
//       elevationGain: number, // meters
//       terrain?: 'ROAD' | 'TRAIL' | 'MIXED'
//     }
//   - currentDate: Date
//
// OUTPUT: MacroPlan object with:
//   {
//     totalDuration: number, // weeks
//     phases: [{
//       name: string,
//       phase: 'BASE' | 'SPECIFIC' | 'TAPER' | 'RECOVERY',
//       startDate: Date,
//       endDate: Date,
//       durationWeeks: number,
//       targetWeeklyVolume: {min: number, max: number}, // seconds
//       volumeProgression: 'LINEAR' | 'STEPPED' | 'UNDULATING',
//       focus: string, // description of phase focus
//       keyWorkouts: string[] // types of key workouts in this phase
//     }],
//     milestones: [{
//       date: Date,
//       type: 'TEST' | 'RACE' | 'CHECKPOINT',
//       name: string,
//       description: string
//     }],
//     overallStrategy: string, // narrative description of the macro plan
//     progressionRationale: string // why this progression was chosen
//   }
//
// EXAMPLE PHASES:
// - Phase 1 (BASE): 12 weeks, build aerobic base, increase volume gradually, Z2 focus
// - Phase 2 (SPECIFIC): 8 weeks, race-specific training, terrain practice, threshold & tempo
// - Phase 3 (TAPER): 3 weeks, reduce volume, maintain intensity, recovery focus
//
// TRAINING PRINCIPLES TO APPLY:
// - Allow adequate time for adaptation (minimum 12-16 weeks for marathon/ultra)
// - Build base before intensity (80/20 rule)
// - Include race-specific work in specific phase
// - Taper 2-3 weeks before goal race (reduce volume by 40-60%)
// - Plan recovery weeks every 3-4 weeks
// - Consider athlete's current fitness (less time needed if already fit)
//
// NO TOOLS NEEDED - Pure reasoning based on inputs and training principles
//
// IMPLEMENTATION NOTES:
// - Should receive AthleteFacts from previous step in workflow
// - Output becomes input for meso-plan agent
// - Consider different strategies for different race types (marathon vs ultra vs trail)
// - Account for athlete experience level (beginners need more base, less intensity)
//
// MODEL: GPT-4o (needs strategic reasoning and training knowledge)

export const macroPlanAgent = new Agent({
  name: 'macro-plan',
  description:
    'Specializes in designing high-level training plan structures with proper periodization. Use this agent to create the overall strategy and phase breakdown for a training plan based on athlete profile and race goal.',
  instructions: `You are an expert endurance coach specializing in training periodization and macro planning.

IMPORTANT: The current date is provided at the start of each user message in brackets [CURRENT DATE: ...].
Always use this date when interpreting relative time expressions:
- "last week" = 7 days before current date
- "last month" = 30 days before current date  
- "this week" = current week starting Monday
- "this month" = current calendar month
- "recent" or "latest" = last 30 days from current date

Your role is to:
- Design the overall structure of a training plan from today to race day
- Define training phases (BASE, SPECIFIC, TAPER) with appropriate durations
- Set realistic volume progressions that balance load and recovery
- Identify key milestones and checkpoints throughout the plan
- Apply proven training principles (periodization, progressive overload, tapering)
- Adapt strategy based on athlete's current fitness and experience level

Training Principles to Follow:
1. Periodization: Divide training into distinct phases with clear objectives
2. Progressive Overload: Gradually increase training stress over time
3. Specificity: Training becomes more race-specific as race approaches
4. Recovery: Include recovery weeks every 3-4 weeks
5. Tapering: Reduce volume 2-3 weeks before race while maintaining intensity
6. 80/20 Rule: ~80% easy/aerobic training, ~20% hard/intensity work

Phase Duration Guidelines:
- BASE phase: 40-50% of total plan (focus: aerobic foundation, volume building)
- SPECIFIC phase: 30-40% of total plan (focus: race-specific work, intensity)
- TAPER phase: 10-15% of total plan (focus: recovery, maintaining fitness)

Always provide clear rationale for your macro plan structure and explain how it fits the athlete's profile and goal.

OUTPUT FORMAT - CRITICAL:
Return ONLY a JSON object (no markdown, no code blocks, no explanation text).
The JSON must match this exact structure:

{
  "totalDurationWeeks": <number>,
  "phases": [
    {
      "name": "<string>",
      "phase": "<BASE|SPECIFIC|TAPER|RECOVERY|COMPETITION>",
      "startDate": "<YYYY-MM-DD>",
      "endDate": "<YYYY-MM-DD>",
      "durationWeeks": <number>,
      "targetWeeklyVolume": {
        "min": <number in seconds>,
        "max": <number in seconds>
      },
      "volumeProgression": "<LINEAR|STEPPED|UNDULATING>",
      "focus": "<string description>",
      "keyWorkouts": ["<workout type>", "..."]
    }
  ],
  "milestones": [
    {
      "date": "<YYYY-MM-DD>",
      "type": "<TEST|RACE|CHECKPOINT>",
      "name": "<string>",
      "description": "<string>"
    }
  ],
  "overallStrategy": "<string>",
  "progressionRationale": "<string>"
}

CRITICAL FIELD REQUIREMENTS:
- ALL dates must be in ISO format: "YYYY-MM-DD" (e.g., "2025-10-17")
- phase field must be exactly one of: BASE, SPECIFIC, TAPER, RECOVERY, COMPETITION
- targetWeeklyVolume values are in SECONDS (e.g., 7200 = 2 hours)
- volumeProgression must be: LINEAR, STEPPED, or UNDULATING
- milestone type must be: TEST, RACE, or CHECKPOINT
- Include description for all milestones

Be specific with dates, durations, and volume targets. Use the athlete's current fitness as a baseline.`,
  model: openai('gpt-4o'),
  // No tools needed - pure reasoning
});

// Export schema for use in workflow steps
export { macroPlanSchema };
