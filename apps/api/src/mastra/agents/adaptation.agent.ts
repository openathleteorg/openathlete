import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

// TODO: Agent that adapts training plans reactively to athlete events
//
// RESPONSIBILITIES:
// - Handle injury reports: reduce volume/intensity, suggest alternative activities
// - Handle missed sessions: redistribute volume or skip, assess recovery impact
// - Handle illness/fatigue: insert extra recovery, reduce intensity
// - Handle schedule conflicts: reschedule sessions within constraints
// - Propose multiple adaptation options (conservative vs aggressive)
// - Re-trigger scheduling and QA for modified weeks
// - Maintain overall plan integrity (don't compromise goal unless necessary)
//
// TRIGGER SCENARIOS:
// - Injury report: "I injured my knee", "My ankle hurts"
// - Illness: "I'm sick", "I have a cold"
// - Missed session: "I couldn't do yesterday's workout"
// - Schedule change: "I can't train on Tuesdays anymore", "I need an easier week"
// - Overtraining signs: "I'm exhausted", "My legs are dead"
//
// INPUT:
//   - adaptationRequest: {
//       type: 'INJURY' | 'ILLNESS' | 'MISSED_SESSION' | 'SCHEDULE_CHANGE' | 'FATIGUE' | 'OTHER',
//       description: string, // athlete's message
//       reportedDate: Date,
//       severity?: 'LOW' | 'MEDIUM' | 'HIGH', // athlete's assessment
//       affectedBodyPart?: string, // for injuries
//       missedSessionId?: number // if missed session
//     }
//   - athleteId: number
//   - threadId: string // for conversation context
//
// OUTPUT: AdaptationProposal object:
//   {
//     analysis: {
//       issueType: string,
//       severityAssessment: 'LOW' | 'MEDIUM' | 'HIGH',
//       impact: string, // narrative: how this affects the plan
//       affectedWeeks: number[], // weeks that need modification
//       recommendations: string[] // general recommendations
//     },
//     options: [{
//       optionName: string, // ex: "Conservative (Rest & Recover)", "Moderate (Adjust)", "Aggressive (Compensate)"
//       description: string,
//       modifications: [{
//         weekNumber: number,
//         changes: [{
//           sessionId?: number,
//           action: 'SKIP' | 'REDUCE' | 'RESCHEDULE' | 'REPLACE' | 'ADD',
//           details: string,
//           newDuration?: number,
//           newIntensity?: any,
//           newDate?: Date,
//           newType?: string
//         }]
//       }],
//       impactOnGoal: string, // how this affects race goal
//       riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
//     }],
//     needsUserConfirmation: boolean
//   }
//
// ADAPTATION STRATEGIES BY TYPE:
//
// INJURY (HIGH severity):
//   - STOP immediately if acute injury (sharp pain)
//   - Conservative: 1-2 weeks complete rest, cross-training only
//   - Moderate: Reduce volume 50%, lower intensity, avoid painful movements
//   - Aggressive: Minimal rest, modified training (pool running, cycling)
//   - Always recommend medical evaluation for serious injuries
//
// INJURY (MEDIUM/LOW severity):
//   - Conservative: Reduce volume 30-50%, easy intensity only
//   - Moderate: Reduce volume 20%, skip hard sessions for 1 week
//   - Aggressive: Continue with modified intensity, monitor pain
//
// ILLNESS:
//   - "Neck check" rule: above neck (cold) = light training OK, below neck (chest/fever) = rest
//   - Conservative: Complete rest until fully recovered
//   - Moderate: Easy sessions only at 50% duration, no intensity
//   - Return gradually: first week back at 70% volume, then normal
//
// MISSED SESSION:
//   - Assess: Was it a key workout or easy run?
//   - Key workout missed: Option to reschedule later in week OR skip (recovery benefit)
//   - Easy run missed: Skip it, don't compensate (not worth the extra stress)
//   - Multiple misses: Reassess overall plan feasibility
//
// SCHEDULE CHANGE:
//   - Permanent change: Update athlete availability, reschedule all future weeks
//   - Temporary change: Reschedule affected weeks only
//   - Use scheduling agent to find new session placements
//
// FATIGUE/OVERTRAINING:
//   - Immediate action: Insert recovery week (reduce volume 40%)
//   - Assess: Has athlete been following 80/20 rule? Too many hard sessions?
//   - Modify: Increase easy volume proportion, reduce intensity frequency
//   - Long-term: May need to adjust overall plan if persistent
//
// OPTION GENERATION GUIDELINES:
// - Always provide 2-3 options with different risk/reward profiles
// - Conservative: Prioritize health and long-term sustainability
// - Moderate: Balance recovery with training continuity
// - Aggressive: Minimize plan disruption, faster return (higher risk)
// - Clearly state trade-offs for each option
//
// TOOLS NEEDED:
// - fetch-current-plan: Get plan + current/upcoming weeks
// - update-session: Modify session parameters (duration, intensity, type)
// - skip-session: Mark session as cancelled/skipped
// - reschedule-session: Move session to different day
//
// After adaptation:
// - Re-run schedulingAgent on affected weeks (if sessions rescheduled)
// - Re-run qaAgent to validate modifications
// - Update plan in database
//
// IMPLEMENTATION NOTES:
// - This agent handles REACTIVE adaptations (user-initiated)
// - Use conversation context (threadId) to understand situation
// - Present options clearly, let user choose
// - Confirm before making changes
// - Log adaptation events for future reference
// - Consider adaptation history (repeated issues = bigger problem)
//
// MODEL: GPT-4o (needs reasoning to balance adaptations and assess risk)

export const adaptationAgent = new Agent({
  name: 'adaptation',
  description:
    'Specializes in adapting training plans in response to injuries, illness, missed sessions, or schedule changes. Use this agent when the athlete reports a problem or event that requires plan modifications.',
  instructions: `You are an expert at adapting training plans to real-world circumstances while maintaining athlete health and goal viability.

Your role is to:
- Assess the severity and impact of reported issues (injury, illness, missed sessions, etc.)
- Propose multiple adaptation options with different risk profiles
- Balance recovery needs with training continuity
- Maintain overall plan integrity when possible
- Provide clear trade-offs for each option
- Prioritize athlete health and long-term sustainability

Adaptation Principles:

1. Health First:
   - Never risk athlete's long-term health for short-term gains
   - Err on the side of caution with injuries and illness
   - Recommend medical evaluation when appropriate

2. Context Matters:
   - Consider how close athlete is to goal race
   - Assess overall training load and recent stress
   - Factor in athlete's history and adaptation capacity
   - Review recent weeks for patterns (overtraining signs?)

3. Smart Modifications:
   - Missed easy runs: Usually just skip (not worth compensating)
   - Missed key workouts: Option to reschedule OR skip (extra recovery can help)
   - Injuries: Reduce impact, consider cross-training alternatives
   - Illness: Full rest until recovered, gradual return
   - Fatigue: Insert recovery week, reassess intensity balance

4. Option Generation:
   Always provide 2-3 options:
   
   a) CONSERVATIVE (Low Risk):
      - Prioritize recovery and health
      - Significant reduction in volume/intensity
      - Longer recovery periods
      - May impact race goal but ensures safety
   
   b) MODERATE (Balanced):
      - Balance recovery with training continuity
      - Modest reductions and modifications
      - Reasonable return timeline
      - Minimal goal impact if managed well
   
   c) AGGRESSIVE (Higher Risk):
      - Minimize plan disruption
      - Faster return to training
      - May include compensatory workouts
      - Higher risk of prolonging issue

5. Communication:
   - Clearly explain the situation and its implications
   - Present options with trade-offs (pros/cons)
   - Recommend which option you think is best and why
   - Ask for athlete's input and preferences
   - Confirm understanding before making changes

Common Scenarios:

INJURY:
- Assess severity (sharp pain = stop, dull ache = modify)
- Recommend rest duration based on severity
- Suggest cross-training alternatives (pool, bike, elliptical)
- Plan gradual return to running
- Monitor closely on return

ILLNESS:
- Apply "neck check" rule
- Above neck (cold, sinus): Light training may be OK
- Below neck (chest, fever): Complete rest required
- Return at 50-70% volume, build back gradually

MISSED SESSIONS:
- Single miss: Usually not a problem
- Multiple misses: Reassess plan feasibility
- Key workout missed: Option to make up vs skip
- Don't over-compensate (leads to overtraining)

FATIGUE:
- Immediate recovery week insertion
- Review recent intensity (too much hard work?)
- Adjust 80/20 balance if needed
- Consider life stress factors

After presenting options, wait for athlete's choice before making modifications. Always re-validate the modified plan.

Output your adaptation analysis and options as an AdaptationProposal object.`,
  model: openai('gpt-4o'),
  // tools: [] // TODO: Add fetch-current-plan, update-session, skip-session, reschedule-session tools
});
