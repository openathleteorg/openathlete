import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

import { validatePlanTool } from '../tools';

// TODO: Agent that validates training plans against constraints and best practices
//
// RESPONSIBILITIES:
// - Verify load progression rules (max +10% volume/week, no sudden spikes)
// - Check recovery adequacy (at least 1 rest day/week, recovery weeks every 3-4 weeks)
// - Validate intensity distribution (80/20 rule: 80% easy, 20% hard)
// - Ensure no consecutive hard sessions within 24h
// - Check session durations fit within availability windows
// - Verify race-specific preparation (adequate long runs, terrain practice)
// - Flag potential injury risks (too much volume, insufficient recovery)
// - Suggest corrections if violations found
//
// INPUT:
//   - completePlan: {
//       training_plan_id?: number, // if already saved
//       plan: {...}, // full plan structure
//       cycles: [...],
//       weeks: [...],
//       sessions: [...] // all scheduled sessions
//     }
//   - athleteFacts: AthleteFacts
//   - validationOptions?: {
//       strictMode?: boolean, // fail on warnings or just flag them
//       customRules?: {...} // override default constraint values
//     }
//
// OUTPUT: ValidationReport object:
//   {
//     valid: boolean, // false if any CRITICAL errors found
//     overallScore: number, // 0-100 score based on constraint satisfaction
//     summary: string, // narrative summary of validation
//     errors: [{
//       type: 'LOAD_SPIKE' | 'INSUFFICIENT_RECOVERY' | 'CONSECUTIVE_HARD' |
//             'DURATION_OVERFLOW' | 'INTENSITY_IMBALANCE' | 'INADEQUATE_PREP',
//       severity: 'CRITICAL' | 'WARNING' | 'INFO',
//       description: string,
//       affectedWeeks?: number[], // which weeks have the issue
//       affectedSessions?: number[], // which sessions have the issue
//       currentValue?: number, // measured value
//       expectedValue?: number, // expected/threshold value
//       suggestion: string // how to fix the issue
//     }],
//     metrics: {
//       averageWeeklyVolume: number, // seconds
//       totalPlanVolume: number, // seconds
//       largestWeeklyIncrease: number, // percentage
//       easyHardRatio: number, // actual easy:hard volume ratio
//       totalRestDays: number,
//       recoveryWeeksCount: number,
//       longestRun: number, // meters
//       averageSessionsPerWeek: number
//     }
//   }
//
// VALIDATION RULES:
//
// 1. LOAD PROGRESSION (CRITICAL):
//    - Rule: Weekly volume increase ≤ 10-15%
//    - Check: Calculate week-to-week volume change
//    - Violation: Increase >15% = CRITICAL, >10% = WARNING
//    - Exception: Recovery weeks can decrease significantly
//
// 2. RECOVERY ADEQUACY (CRITICAL):
//    - Rule: At least 1 rest day per week
//    - Check: Count rest days in each week
//    - Violation: 0 rest days = CRITICAL
//    - Rule: Recovery week every 3-4 weeks (volume -20% to -40%)
//    - Check: Look for periodic volume drops
//    - Violation: >4 weeks without recovery = WARNING
//
// 3. HARD SESSION SPACING (CRITICAL):
//    - Rule: No hard sessions within 24h of each other
//    - Check: Calculate time between hard sessions
//    - Violation: <24h = CRITICAL
//
// 4. INTENSITY DISTRIBUTION (WARNING):
//    - Rule: ~80% easy volume, ~20% hard volume (80/20 rule)
//    - Check: Sum easy vs hard session volumes
//    - Violation: >25% hard = WARNING, >30% = CRITICAL
//    - Note: Some deviation acceptable in specific phases
//
// 5. SESSION DURATION (CRITICAL):
//    - Rule: Session duration must fit in availability window
//    - Check: Compare session duration to scheduled window
//    - Violation: Duration > window = CRITICAL
//
// 6. RACE-SPECIFIC PREPARATION (INFO):
//    - Rule: Long runs should reach ~70-80% of race distance
//    - Check: Find longest training run vs race distance
//    - Violation: <60% = INFO, <50% = WARNING
//    - Rule: Include race-specific terrain work (if trail/mountain race)
//    - Check: Look for elevation gain in long runs
//
// 7. TAPER VALIDATION (WARNING):
//    - Rule: Volume should reduce 40-60% in taper weeks
//    - Check: Compare taper weeks to peak week
//    - Violation: <30% reduction = WARNING
//    - Rule: Maintain intensity in taper (short hard efforts)
//    - Check: Ensure some race-pace work in taper
//
// 8. OVERALL BALANCE (INFO):
//    - Check: Variety of session types
//    - Check: Progression is smooth (no erratic volume)
//    - Check: Plan duration appropriate for goal
//
// SCORING SYSTEM:
// - Start with 100 points
// - CRITICAL error: -20 points each
// - WARNING: -5 points each
// - INFO: -1 point each
// - Bonus points for excellent adherence to best practices
//
// TOOLS NEEDED:
// - validate-plan: Execute validation rules (can be internal TypeScript function)
// - check-constraints: Verify specific constraint sets
//
// IMPLEMENTATION NOTES:
// - Validation rules are mostly deterministic (can be coded as TypeScript logic)
// - LLM role: interpret results, provide narrative feedback, suggest fixes
// - Should run after scheduling step in plan generation workflow
// - Can also run standalone for plan review/audit
// - If CRITICAL errors found, plan should not be saved until corrected
//
// MODEL: GPT-4o (interprets validation results, suggests fixes)

export const qaAgent = new Agent({
  name: 'qa',
  description:
    'Specializes in validating training plans against best practices and safety constraints. Use this agent to review complete training plans and identify potential issues, risks, or violations of training principles before finalizing the plan.',
  instructions: `You are an expert at quality assurance and validation of training plans.

IMPORTANT: The current date is provided at the start of each user message in brackets [CURRENT DATE: ...].
Always use this date when interpreting relative time expressions:
- "last week" = 7 days before current date
- "last month" = 30 days before current date  
- "this week" = current week starting Monday
- "this month" = current calendar month
- "recent" or "latest" = last 30 days from current date

Your role is to:
- Validate training plans against proven training principles
- Identify constraint violations and potential issues
- Assess injury risk and training sustainability
- Provide actionable suggestions for plan improvements
- Calculate plan quality metrics and scoring

Validation Categories:

1. Load Progression Safety (CRITICAL):
   - Weekly volume increases should not exceed 10-15%
   - Sudden spikes in training load increase injury risk
   - Exception: Recovery weeks can drop significantly

2. Recovery Adequacy (CRITICAL):
   - At least 1 complete rest day per week
   - Recovery weeks (-20% to -40% volume) every 3-4 weeks
   - Adequate recovery prevents overtraining and injury

3. Hard Session Spacing (CRITICAL):
   - Minimum 24 hours between hard sessions
   - Ideally 48 hours for full recovery
   - Violating this increases injury and burnout risk

4. Intensity Distribution (WARNING):
   - Follow 80/20 rule: ~80% easy volume, ~20% hard
   - Too much intensity leads to overtraining
   - Acceptable to vary by phase (more intensity in specific phase)

5. Practical Feasibility (CRITICAL):
   - All sessions must fit within athlete's availability
   - Session durations realistic and achievable
   - Consider athlete's other commitments

6. Race Preparation (INFO):
   - Long runs should reach 70-80% of race distance
   - Include race-specific terrain and conditions
   - Adequate tapering before goal race

7. Plan Structure (INFO):
   - Smooth progression without erratic volume changes
   - Appropriate phase durations
   - Logical workout sequence and variety

Severity Levels:
- CRITICAL: Must be fixed before plan is finalized (safety risk)
- WARNING: Should be addressed but not a blocker (sub-optimal)
- INFO: Nice-to-have improvements (optimization)

When providing feedback:
- Always explain WHY a rule matters (injury prevention, adaptation, performance)
- Provide specific, actionable suggestions for fixing issues
- Prioritize fixes by severity
- Acknowledge what's working well in the plan
- Calculate an overall plan quality score (0-100)

Be thorough but practical. Consider the athlete's experience level and goals when assessing the plan.

Output your validation as a detailed ValidationReport object.`,
  model: openai('gpt-4o'),
  tools: {
    validatePlan: validatePlanTool,
    // TODO: Add check-constraints tool when needed for specific constraint validation
  },
});
