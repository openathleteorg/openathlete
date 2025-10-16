import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

import { fetchAthleteAvailabilityTool } from '../tools';

// TODO: Agent that places sessions into weekly calendar slots
//
// RESPONSIBILITIES:
// - Assign each session to a specific day and time slot
// - Respect athlete's availability windows (from athlete_availability)
// - Apply scheduling constraints:
//   * No two hard sessions within 24h
//   * Long runs typically on weekends (high availability)
//   * Easy runs fill remaining slots
//   * Minimum 1 rest day per week
//   * Preferred day patterns (e.g., intervals on Tuesdays)
// - Optimize for session distribution (spread volume evenly)
// - Handle conflicts gracefully (adjust if no slot available)
//
// INPUT:
//   - weekIntentions: WeekIntentions (from micro-plan agent)
//   - athleteFacts: AthleteFacts (including availability slots)
//   - preferences?: {
//       preferredHardDays?: number[], // 0=Sunday, 1=Monday, ...
//       preferredLongRunDay?: number, // typically 6 (Saturday) or 0 (Sunday)
//       avoidDays?: number[]
//     }
//
// OUTPUT: ScheduledWeek object:
//   {
//     weekNumber: number,
//     startDate: Date,
//     endDate: Date,
//     sessions: [{
//       ...sessionIntention, // all fields from WeekIntentions session
//       dayOfWeek: number, // 0=Sunday, 1=Monday, ..., 6=Saturday
//       scheduledDate: Date,
//       scheduledTime: string, // "HH:mm" format
//       availabilitySlotId?: number, // ID of the slot used (if from athlete_availability)
//       schedulingNotes?: string // any notes about scheduling decisions
//     }],
//     schedulingWarnings?: string[], // if any constraints were violated
//     unscheduledSessions?: any[] // sessions that couldn't be placed
//   }
//
// SCHEDULING CONSTRAINTS (in priority order):
//
// 1. CRITICAL CONSTRAINTS (must not be violated):
//    - Session duration must fit within available time window
//    - No hard sessions within 24h of each other
//    - Sessions only on days athlete has availability
//
// 2. HIGH PRIORITY CONSTRAINTS (should avoid violating):
//    - Long runs on preferred days (weekends with large time windows)
//    - At least 1 rest day per week
//    - Key workouts on preferred days (if specified)
//
// 3. NICE-TO-HAVE CONSTRAINTS (optimize when possible):
//    - Spread sessions evenly across the week
//    - Place hard sessions on high-priority availability slots
//    - Alternate hard and easy days when possible
//    - Morning runs on weekdays, flexible timing on weekends
//
// SCHEDULING ALGORITHM (V0 - Heuristic Approach):
//
// Step 1: Sort sessions by priority
//   1. Long runs (need big time windows)
//   2. Hard sessions (need specific day spacing)
//   3. Easy runs (flexible, fill remaining slots)
//   4. Strength training (flexible)
//   5. Rest days (placed last)
//
// Step 2: Place high-priority sessions first
//   - Long run: Find weekend day with longest availability window
//   - Hard sessions: Space them 48h apart on preferred days
//
// Step 3: Fill easy sessions
//   - Place on days between hard sessions
//   - Ensure they fit within available windows
//
// Step 4: Validate constraints
//   - Check no hard sessions <24h apart
//   - Check at least 1 rest day
//   - Check all sessions fit in availability windows
//
// Step 5: Backtrack if needed
//   - If validation fails, try alternative slot assignments
//   - Flag warnings if constraints can't be met
//
// IMPLEMENTATION V1 (FUTURE - CP-SAT Solver):
// - Model as constraint satisfaction problem
// - Define variables: session_i_day, session_i_time
// - Define constraints: hard session spacing, availability windows, rest days
// - Objective: Maximize constraint satisfaction + optimize distribution
// - Use Google OR-Tools CP-SAT solver for optimal solution
//
// TOOLS NEEDED:
// - fetch-athlete-availability: Get weekly time windows
// - validate-schedule: Check if schedule respects all constraints
//
// IMPLEMENTATION NOTES:
// - This is a complex optimization problem
// - V0: Use simple heuristic algorithm (greedy with backtracking)
// - V1: Upgrade to constraint programming solver for better results
// - Should return warnings if constraints can't be perfectly met
// - Consider athlete's work schedule, family commitments, etc.
//
// MODEL: GPT-4o (orchestrates heuristic, calls validation tool)

export const schedulingAgent = new Agent({
  name: 'scheduling',
  description:
    "Specializes in placing training sessions into weekly calendar slots while respecting athlete availability and training constraints. Use this agent to assign specific days and times to training sessions after they've been designed by the micro-plan agent.",
  instructions: `You are an expert at scheduling training sessions into athlete calendars.

Your role is to:
- Assign specific days and times to each training session
- Respect athlete's availability windows and time constraints
- Apply critical scheduling rules for optimal training adaptation
- Balance training stress across the week
- Handle scheduling conflicts and provide warnings when needed

Critical Scheduling Rules (NEVER violate):
1. Hard Session Spacing: No two hard sessions within 24 hours
2. Availability Fit: All sessions must fit within athlete's available time windows
3. Duration Match: Session duration ≤ available time window

High Priority Rules (avoid violating when possible):
1. Rest Days: Include at least 1 complete rest day per week
2. Long Run Placement: Schedule on days with longest availability (typically weekends)
3. Key Workouts: Place hard sessions on preferred days with good availability

Scheduling Strategy:
1. Sort sessions by priority:
   - Long runs first (need big time blocks)
   - Hard sessions second (need specific day spacing)
   - Easy runs third (flexible placement)
   - Strength/cross-training fourth (very flexible)

2. Optimal Weekly Pattern:
   - Monday: Easy or rest (recovery from weekend)
   - Tuesday: Intervals or tempo (good mid-week hard session)
   - Wednesday: Easy (recovery)
   - Thursday: Tempo or intervals (second hard session if needed)
   - Friday: Easy or rest (prepare for weekend)
   - Saturday/Sunday: Long run + easy run (utilize weekend availability)

3. Hard Session Spacing:
   - Ideal: 48 hours between hard sessions
   - Minimum: 24 hours (with easy days in between)
   - Pattern: Hard-Easy-Hard-Easy or Hard-Easy-Easy-Hard

4. Time of Day Considerations:
   - Morning: Typically weekdays before work
   - Midday: If athlete has flexibility
   - Evening: After work on weekdays
   - Flexible: Weekends (use largest availability windows)

When scheduling conflicts arise:
- Flag sessions that can't be placed
- Suggest modifications (shorter duration, different day)
- Provide clear warnings about constraint violations
- Propose alternative weekly structures if needed

Always explain your scheduling decisions and reasoning.

Output your schedule as a ScheduledWeek object with all sessions assigned to specific days and times.`,
  model: openai('gpt-4o'),
  tools: {
    fetchAthleteAvailabilityTool,
  }, // TODO: Add validate-schedule tools
});
