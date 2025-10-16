import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';

// TODO: Agent that breaks macro phases into meso-cycles (training blocks)
//
// RESPONSIBILITIES:
// - Divide each phase into 3-4 week blocks (meso-cycles)
// - Apply progression patterns (2-3 weeks load + 1 week recovery)
// - Assign themes to each block (VO2 focus, threshold focus, long runs, etc.)
// - Set weekly volume targets that progress logically
// - Respect the 10% rule (max +10% volume increase per week)
// - Balance intensity distribution across blocks
//
// INPUT:
//   - macroPlan: MacroPlan (from macro-plan agent)
//   - athleteFacts: AthleteFacts (from athlete-profile agent)
//
// OUTPUT: MesoBlocks array:
//   [{
//     blockNumber: number,
//     phase: 'BASE' | 'SPECIFIC' | 'TAPER',
//     startDate: Date,
//     endDate: Date,
//     blockTheme: string, // ex: "Base building", "VO2max development", "Race prep"
//     progressionPattern: '3:1' | '2:1' | 'STEADY', // load:recovery ratio
//     weeks: [{
//       weekNumber: number, // global week number in plan
//       weekInBlock: number, // week number within this block (1, 2, 3, 4)
//       startDate: Date,
//       endDate: Date,
//       theme: string, // specific theme for this week
//       targetVolume: number, // seconds
//       targetLoad: number, // TRIMP estimate
//       intensityFocus: 'EASY' | 'MODERATE' | 'HARD' | 'RECOVERY',
//       notes?: string // any special notes for this week
//     }]
//   }]
//
// EXAMPLE BLOCK:
// Block 1 (Weeks 1-4 of BASE phase) - "Aerobic Foundation":
//   - Week 1: 8h (28,800s), base building, EASY focus, "Establish routine"
//   - Week 2: 9h (32,400s), base building, EASY focus, "+10% volume increase"
//   - Week 3: 10h (36,000s), base building with tempo, MODERATE focus, "Peak week"
//   - Week 4: 6h (21,600s), recovery week, EASY focus, "-40% volume for recovery"
//
// PROGRESSION PATTERNS:
// - 3:1 pattern: 3 weeks progressive load + 1 recovery week
// - 2:1 pattern: 2 weeks load + 1 recovery week (for less experienced athletes)
// - Recovery week: typically -20% to -40% volume from previous week
// - Load increase: max +10% per week (can be less for beginners)
//
// BLOCK THEMES BY PHASE:
// BASE phase blocks:
//   - "Aerobic Foundation" (Z1-Z2 focus)
//   - "Base Building" (increasing volume steadily)
//   - "Aerobic Capacity" (Z2-Z3 with some tempo)
//
// SPECIFIC phase blocks:
//   - "VO2max Development" (interval work)
//   - "Threshold Training" (tempo runs, lactate threshold work)
//   - "Race-Specific Prep" (pace work, terrain simulation)
//   - "Peak Week" (highest volume/load before taper)
//
// TAPER phase blocks:
//   - "Early Taper" (reduce volume, keep intensity)
//   - "Final Taper" (minimal volume, race prep)
//
// NO TOOLS NEEDED - Logical breakdown based on macro plan
//
// IMPLEMENTATION NOTES:
// - Each macro phase should be divided into logical blocks
// - Apply consistent progression patterns within blocks
// - Ensure smooth transitions between blocks
// - Consider athlete's current fitness when setting starting volume
// - Flag if progression seems too aggressive or conservative
//
// MODEL: GPT-4o (needs reasoning for progression logic)

export const mesoPlanAgent = new Agent({
  name: 'meso-plan',
  description:
    'Specializes in breaking training phases into structured meso-cycles with progressive loading patterns. Use this agent to create detailed week-by-week volume and theme progression within each training phase.',
  instructions: `You are an expert at creating meso-cycle training blocks with proper progression patterns.

Your role is to:
- Divide macro phases into 3-4 week training blocks
- Apply proven load:recovery patterns (typically 3:1 or 2:1)
- Set weekly volume targets that progress safely and effectively
- Assign specific themes to each block and week
- Balance training stress with adequate recovery
- Ensure smooth progression without sudden spikes

Progression Principles:
1. The 10% Rule: Never increase weekly volume by more than 10%
2. Recovery Weeks: Every 3-4 weeks, reduce volume by 20-40%
3. Progressive Overload: Gradually increase load within each block
4. Undulating Periodization: Vary intensity focus across weeks
5. Specificity Progression: Increase race-specificity as race approaches

Load:Recovery Patterns:
- 3:1 pattern: 3 weeks progressive load + 1 recovery (for experienced athletes)
- 2:1 pattern: 2 weeks load + 1 recovery (for beginners or during intense phases)
- Recovery weeks are crucial for adaptation and injury prevention

Block Theme Guidelines:
- Each block should have a clear training focus
- Themes should align with the macro phase objectives
- Within a block, week themes build on each other progressively
- Base phase: focus on aerobic development and volume
- Specific phase: focus on race-specific intensity and quality
- Taper phase: focus on recovery and maintaining sharpness

Always explain your progression rationale and flag any concerns about the athlete's ability to handle the prescribed load.

Output your meso plan as a structured MesoBlocks array.`,
  model: openai('gpt-4o'),
  // No tools needed - logical breakdown
});
