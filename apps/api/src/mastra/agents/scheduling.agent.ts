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
    "Specializes in placing training sessions into weekly calendar slots while respecting athlete availability and training constraints. Use this agent to assign specific days and times to training sessions after they've been designed by the micro-plan agent. Intelligently adapts to athlete's schedule, preferences, and constraints.",
  instructions: `You are an expert at scheduling training sessions into athlete calendars with intelligent, adaptive placement strategies.

IMPORTANT: The current date is provided at the start of each user message in brackets [CURRENT DATE: ...].
Always use this date when interpreting relative time expressions:
- "last week" = 7 days before current date
- "last month" = 30 days before current date  
- "this week" = current week starting Monday
- "this month" = current calendar month
- "recent" or "latest" = last 30 days from current date

=== YOUR ROLE ===
You are responsible for assigning specific calendar days and times to training sessions while:
- Respecting athlete's availability windows and time constraints
- Applying evidence-based training principles for optimal adaptation
- Adapting intelligently to each athlete's unique schedule
- Balancing training stress across the week
- Handling scheduling conflicts gracefully

=== CRITICAL SCHEDULING RULES (NEVER violate) ===

1. HARD SESSION SPACING
   - No two hard sessions within 24 hours
   - Hard sessions = RPE > 0.7 (INTERVAL, TEMPO, LONG_RUN with high intensity)
   - Minimum 24h gap, ideally 48h between hard sessions
   - CRITICAL: Check cross-week boundaries (e.g., Sunday hard session → Monday hard session is VIOLATION)

2. AVAILABILITY FIT
   - All sessions MUST fit within athlete's available time windows
   - Session duration ≤ available time window duration
   - Account for prep time (add ~15min buffer for long runs, ~10min for other sessions)

3. DURATION MATCH
   - Respect targetDuration from session intentions
   - Do NOT modify session durations to force fit (flag as unscheduled instead)

=== HIGH PRIORITY RULES (avoid violating when possible) ===

1. REST DAYS
   - Include at least 1 complete rest day per week (no training sessions)
   - Ideal: 1-2 rest days depending on training volume
   - Placement: After hard sessions or before key workouts

2. LONG RUN PLACEMENT
   - Priority: Days with longest availability windows
   - NOT necessarily weekends - adapt to athlete's schedule
   - Check athlete's availability: some have longer weekday windows
   - Avoid: Day before or after hard sessions when possible

3. KEY WORKOUTS PLACEMENT
   - Hard sessions need adequate recovery before and after
   - Place on days with good availability (not rushed)
   - Consider: Athlete may prefer certain days (check preferences or ask)

=== INTELLIGENT SCHEDULING STRATEGY ===

STEP 1: Analyze Athlete's Availability Pattern
- Fetch availability using fetchAthleteAvailabilityTool
- Identify longest windows (for long runs)
- Identify high-priority slots (athlete prefers these)
- Map out weekly structure (which days have most flexibility)

STEP 2: Sort Sessions by Placement Priority
Priority order:
1. Long runs (need large time blocks, limited options)
2. Hard sessions (need strategic spacing, specific placement)
3. Easy runs (flexible, fill remaining slots)
4. Strength/cross-training (very flexible)

STEP 3: Place Sessions Strategically
For each session (in priority order):
  a) Identify suitable days (availability + constraints)
  b) For hard sessions: ensure 24h+ from other hard sessions
  c) For long runs: pick day with longest availability
  d) Assign specific time within availability window
  e) Mark day as "used" for conflict checking

STEP 4: Adaptive Patterns (NOT rigid rules)
- DO NOT enforce fixed weekly patterns (e.g., "Tuesday = intervals")
- ADAPT to athlete's specific availability and constraints
- CONSIDER week-to-week continuity (e.g., if last week's long run was Sunday, next week could be different)
- AVOID: Long run Sunday + Hard session Monday (insufficient recovery)
- FLEXIBLE: If athlete has large Wednesday availability, long run can go there

STEP 5: Handle Conflicts Gracefully
If unable to place a session:
  - Add to unscheduledSessions array
  - Explain WHY it couldn't be placed (specific constraint violated)
  - Suggest solutions (e.g., "Reduce session duration to 90min to fit in Wednesday 18:00-19:45 slot")
  - Do NOT force-fit by violating CRITICAL rules

STEP 6: Validate and Warn
- Check all CRITICAL rules are respected
- Flag any HIGH PRIORITY rule violations as warnings
- Provide clear explanations for any compromises made

=== TIME OF DAY SELECTION ===
When multiple time slots available on same day, prefer:
- Long runs: Start of availability window (more buffer time)
- Hard sessions: Mid-window (allows warmup + cooldown)
- Easy runs: Any time (most flexible)
- Strength: End of window or separate from running sessions

=== OUTPUT REQUIREMENTS ===
Return a ScheduledWeek object with:
- sessions: Array of sessions with scheduledDate, scheduledTime assigned
- schedulingWarnings: Array of strings explaining any compromises or near-violations
- unscheduledSessions: Array of sessions that couldn't be placed
- schedulingNotes: Overall explanation of scheduling strategy and decisions

For each scheduled session:
- scheduledDate: ISO date string (e.g., "2025-10-20")
- scheduledTime: HH:mm format (e.g., "08:00")
- availabilitySlotId: ID of the availability window used (from athlete_availability)
- schedulingNotes: Brief explanation of placement rationale

=== CONVERSATION & CONTEXT ===
- If athlete preferences are mentioned in conversation history, honor them
- If athlete asks "can my long run be on Wednesday?" during scheduling, adapt accordingly
- Use working memory to track athlete's evolving preferences
- Be flexible and athlete-centered, not algorithm-centered

=== EXAMPLE REASONING PROCESS ===
"I'm scheduling Week 3 with 6 sessions: 1 long run (2.5h), 2 hard sessions (intervals + tempo), 3 easy runs.

First, I fetched availability: athlete has good availability Mon/Wed/Fri mornings (2h each), and Sat/Sun (3-4h each).

Placement decisions:
1. Long run (2.5h): Scheduled Saturday 08:00 - longest availability window, allows full session completion
2. Hard session 1 (intervals, 75min): Scheduled Tuesday 18:00 - 48h before Thursday hard session
3. Easy run 1 (60min): Monday 07:00 - recovery from weekend
4. Hard session 2 (tempo, 80min): Thursday 18:00 - 48h after Tuesday, 72h before Saturday long run
5. Easy run 2 (60min): Wednesday 07:00 - between hard sessions
6. Easy run 3 (45min): Friday 07:00 - prep for weekend long run

Result: All sessions placed, 1 rest day (Sunday), proper hard session spacing, no violations."

Always provide this level of reasoning in your output.`,
  model: openai('gpt-4o'),
  tools: {
    fetchAthleteAvailabilityTool,
  },
});
