import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';

import { weekIntentionsSchema } from '../types';

// TODO: Agent that generates weekly session intentions (types and targets)
//
// RESPONSIBILITIES:
// - Propose specific session types for each week (intervals, long run, tempo, easy, strength)
// - Define session parameters (duration, intensity zones, structure)
// - Select from training methodology library (VO2 intervals, threshold runs, long slow distance)
// - Balance hard/easy sessions (avoid consecutive hard days)
// - Match session types to meso-block themes
// - Respect athlete's weekly volume target
// - Propose cross-training or strength sessions where appropriate
//
// INPUT:
//   - weekData: {
//       weekNumber: number,
//       startDate: Date,
//       endDate: Date,
//       theme: string,
//       targetVolume: number, // seconds
//       targetLoad: number,
//       intensityFocus: 'EASY' | 'MODERATE' | 'HARD' | 'RECOVERY',
//       blockTheme: string,
//       phase: 'BASE' | 'SPECIFIC' | 'TAPER'
//     }
//   - athleteFacts: AthleteFacts
//
// OUTPUT: WeekIntentions object:
//   {
//     weekNumber: number,
//     totalPlannedVolume: number, // sum of all session durations
//     sessions: [{
//       sessionNumber: number, // 1, 2, 3, ... within the week
//       dayOfWeek: null, // NOT scheduled yet - that's scheduling agent's job
//       scheduledDate: null,
//       scheduledTime: null,
//       type: 'INTERVAL' | 'LONG_RUN' | 'TEMPO' | 'EASY' | 'STRENGTH' | 'CROSS_TRAINING' | 'REST',
//       sport: 'RUNNING' | 'CYCLING' | 'SWIMMING' | 'STRENGTH',
//       targetDuration: number, // seconds
//       targetIntensity: {
//         zone?: number, // HR zone or pace zone (1-5)
//         rpe?: number, // 0-1 (0.0 = very easy, 1.0 = max effort)
//         paceRange?: {min: number, max: number} // m/s
//       },
//       description: string, // ex: "2x20min at threshold with 5min recovery"
//       workoutStructure?: {
//         warmup?: {duration: number, intensity: 'EASY'},
//         mainSet: {
//           type: 'INTERVALS' | 'STEADY' | 'PROGRESSIVE',
//           intervals?: [{work: number, rest: number, intensity: string, repeats: number}],
//           steadyDuration?: number,
//           steadyIntensity?: string
//         },
//         cooldown?: {duration: number, intensity: 'EASY'}
//       },
//       rationale: string // why this session for this week
//     }]
//   }
//
// SESSION TYPES & METHODOLOGIES:
//
// EASY RUNS (Z1-Z2, RPE 0.2-0.4):
//   - Purpose: Aerobic base, recovery, volume accumulation
//   - Duration: 30-90 minutes
//   - Frequency: Most runs should be easy (80/20 rule)
//
// LONG RUNS (Z1-Z2, RPE 0.3-0.5):
//   - Purpose: Endurance, metabolic adaptation, mental toughness
//   - Duration: 1.5-4+ hours depending on goal distance
//   - Frequency: 1-2 per week (typically weekend)
//   - Progression: Increase duration gradually (10% rule)
//
// TEMPO/THRESHOLD RUNS (Z3-Z4, RPE 0.6-0.8):
//   - Purpose: Lactate threshold, sustained pace work
//   - Duration: 20-60 minutes at tempo pace
//   - Example: 10min warmup + 3x12min @ threshold w/ 3min recovery + 10min cooldown
//
// VO2MAX INTERVALS (Z5, RPE 0.8-0.95):
//   - Purpose: Aerobic power, VO2max improvement
//   - Duration: 3-8 minutes work intervals
//   - Example: 15min warmup + 5x4min @ VO2max w/ 3min recovery + 10min cooldown
//
// HILL REPEATS (Z4-Z5, RPE 0.7-0.9):
//   - Purpose: Strength, power, climbing economy
//   - Example: 8x90s hill repeats @ hard effort w/ jog-down recovery
//
// RACE-SPECIFIC WORK (Z3-Z4, RPE 0.6-0.8):
//   - Purpose: Practice goal race pace, terrain simulation
//   - Example: Long run with middle section at goal race pace
//
// STRENGTH TRAINING:
//   - Purpose: Injury prevention, power development
//   - Frequency: 1-2x per week in base/early specific phase
//   - Focus: Lower body, core, stability
//
// SESSION DISTRIBUTION GUIDELINES:
// - Easy runs: 3-5 per week (fill remaining slots)
// - Long run: 1 per week (typically weekend)
// - Key workouts: 1-2 per week depending on phase and experience
// - Strength: 0-2 per week
// - Rest days: At least 1 per week
//
// WEEKLY STRUCTURE EXAMPLES:
//
// BASE PHASE WEEK (EASY focus):
//   - 1x Long Run (2-3 hours, Z1-Z2)
//   - 1x Tempo or Hills (optional, light intensity)
//   - 3-4x Easy Runs (45-75 min each)
//   - 1x Strength
//   - 1x Rest
//
// SPECIFIC PHASE WEEK (MODERATE/HARD focus):
//   - 1x Long Run (2.5-4 hours, Z1-Z2 with race pace segments)
//   - 1x VO2max Intervals
//   - 1x Tempo/Threshold
//   - 2-3x Easy Runs (45-60 min)
//   - 1x Rest
//
// TAPER WEEK (RECOVERY focus):
//   - 1x Shorter Long Run (1.5 hours max)
//   - 1x Short Tempo with race pace (30 min total)
//   - 2x Short Easy Runs (30-40 min)
//   - 2x Rest
//
// TOOLS NEEDED (FUTURE):
// - fetch-session-templates: Query session library (RAG/vector search)
//
// For now: Generate sessions based on training principles and common workout types
//
// IMPLEMENTATION NOTES:
// - This agent generates SESSION INTENTIONS, not scheduled sessions
// - Scheduling (day/time assignment) is done by scheduling agent
// - Should validate that total session volume ≈ target weekly volume
// - Consider athlete's experience level (beginners: fewer hard sessions)
// - Apply 80/20 rule: roughly 80% easy volume, 20% hard volume
// - Hard sessions should not be back-to-back
//
// MODEL: GPT-4o (needs creativity + training knowledge)

export const microPlanAgent = new Agent({
  name: 'micro-plan',
  description:
    'Specializes in creating detailed weekly training session plans with specific workout types and intensities. Use this agent to generate the actual workouts that make up each training week based on meso-cycle themes and athlete capabilities.',
  instructions: `You are an expert at designing specific training sessions and weekly workout structures.

IMPORTANT: The current date is provided at the start of each user message in brackets [CURRENT DATE: ...].
Always use this date when interpreting relative time expressions:
- "last week" = 7 days before current date
- "last month" = 30 days before current date  
- "this week" = current week starting Monday
- "this month" = current calendar month
- "recent" or "latest" = last 30 days from current date

Your role is to:
- Create detailed session plans for each week based on the meso-cycle theme
- Select appropriate workout types (intervals, tempo, long runs, easy runs, strength)
- Define specific workout parameters (duration, intensity, structure)
- Balance training stress across the week (hard/easy distribution)
- Apply the 80/20 rule (80% easy volume, 20% hard volume)
- Ensure sessions align with the week's theme and intensity focus

Session Design Principles:
1. Specificity: Workouts should match the training phase and race goal
2. Progressive Overload: Gradually increase session difficulty
3. Recovery: Balance hard sessions with easy days
4. Variety: Include different session types for well-rounded training
5. Practicality: Sessions should fit within athlete's time constraints

Training Intensity Distribution (80/20 Rule):
- ~80% of weekly volume should be at EASY intensity (Z1-Z2, RPE 0.2-0.5)
- ~20% of weekly volume at MODERATE-HARD intensity (Z3-Z5, RPE 0.6-0.95)
- This applies to weekly volume, not number of sessions

Key Workout Types by Phase:
BASE Phase:
- Focus on easy runs and long runs (aerobic base)
- 1-2 key workouts per week max (tempo or hills, keep moderate)
- High volume, lower intensity
- Include strength training

SPECIFIC Phase:
- 2-3 key workouts per week (VO2, threshold, race pace)
- Long runs with race-specific segments
- Higher intensity, maintained volume
- Reduce strength work as race approaches

TAPER Phase:
- Reduce volume by 40-60%
- Maintain workout intensity but reduce duration
- Include short race-pace efforts to stay sharp
- More rest and recovery

Hard Session Rules:
- Never schedule hard sessions back-to-back (need 24-48h recovery)
- Space key workouts throughout the week (e.g., Tuesday, Thursday, Saturday)
- Surround hard days with easy days or rest

Always provide clear rationale for each session and explain how it fits the week's objectives.

Output Format:
You MUST return a WeekIntentions object containing:
- weekNumber: the week number in the plan
- startDate, endDate: ISO date strings
- theme: the week's training theme
- targetVolume: target weekly volume in seconds
- sessions: array of session objects with:
  * sessionId: optional unique identifier
  * type: INTERVAL, LONG_RUN, TEMPO, EASY, RECOVERY, STRENGTH, or RACE
  * sport: RUNNING, CYCLING, SWIMMING, STRENGTH, or OTHER
  * targetDuration: session duration in seconds
  * targetDistance: optional distance in meters
  * targetElevationGain: optional elevation in meters
  * targetIntensity: {zone, rpe} where rpe is 0-1 scale
  * description: detailed session description
  * structure: optional structured workout definition
  * dayOfWeek: leave null (scheduling agent will assign)
  * priority: HIGH, MEDIUM, or LOW for scheduling

CRITICAL:
- Total of all session durations should approximately equal targetVolume
- Apply 80/20 rule: ~80% of volume at easy intensity (RPE ≤ 0.5)
- Include variety: long run, key workouts, easy runs, rest
- Provide specific durations in seconds (e.g., 3600 = 1 hour)
- Use RPE scale: 0.0-0.3 = very easy, 0.4-0.5 = easy, 0.6-0.7 = moderate, 0.8+ = hard`,
  model: openai('gpt-4o'),
  // tools: [] // TODO: Add fetch-session-templates tool when available
});

// Export schema for use in workflow steps
export const weekIntentionsOutputSchema = weekIntentionsSchema;

export { weekIntentionsSchema };
