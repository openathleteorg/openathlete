import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

import { athleteProfileAgent } from '../agents/athlete-profile.agent';
import { macroPlanAgent, macroPlanSchema } from '../agents/macro-plan.agent';
import {
  mesoBlocksOutputSchema,
  mesoPlanAgent,
} from '../agents/meso-plan.agent';
import {
  microPlanAgent,
  weekIntentionsOutputSchema,
} from '../agents/micro-plan.agent';
import {
  athleteFactsSchema,
  macroPlanSchema as macroPlanSchemaType,
  mesoBlockSchema,
  weekIntentionsSchema,
} from '../types';

// TODO: Workflow for complete training plan generation from athlete profile to saved plan
//
// PURPOSE:
// Orchestrate the deterministic process of creating a training plan through all stages:
// Profile → Macro → Meso → Micro → Scheduling → QA → Persistence
//
// STEPS:
// 1. Profile Analysis: Extract athlete data and create AthleteFacts
// 2. Macro Planning: Design overall phase structure and strategy
// 3. Meso Planning: Break phases into week-by-week blocks
// 4. Micro Planning: Generate specific session plans for each week
// 5. Scheduling: Assign sessions to calendar days/times
// 6. Quality Assurance: Validate complete plan
// 7. Persistence: Save to database
//
// ERROR HANDLING:
// - If QA returns CRITICAL errors, halt before persistence
// - Return plan structure + validation report for user review
// - Allow manual approval before final save

// Step 1: Profile Analysis
const profileStep = createStep({
  id: 'profile-analysis',
  description: 'Analyze athlete profile and gather baseline data',
  inputSchema: z.object({
    athleteId: z.number(),
    goal: z.object({
      raceName: z.string(),
      raceDate: z.string(),
      distance: z.number(),
      elevationGain: z.number(),
      terrain: z.enum(['ROAD', 'TRAIL', 'MIXED']).optional(),
    }),
    preferences: z
      .object({
        preferredTrainingDays: z.array(z.number()).optional(),
        avoidDays: z.array(z.number()).optional(),
        maxWeeklyVolume: z.number().optional(),
      })
      .optional(),
  }),
  outputSchema: z.object({
    athleteFacts: athleteFactsSchema,
    goal: z.object({
      raceName: z.string(),
      raceDate: z.string(),
      distance: z.number(),
      elevationGain: z.number(),
      terrain: z.enum(['ROAD', 'TRAIL', 'MIXED']).optional(),
    }),
  }),
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

      console.log(
        `[profileStep] Calling athlete-profile agent for athlete ${athleteId}`,
      );

      const response = await athleteProfileAgent.generate(prompt, {
        runtimeContext,
        structuredOutput: {
          schema: athleteFactsSchema,
        },
      });

      console.log('[profileStep] Received structured response from agent');

      const athleteFacts = response.object;

      console.log('[profileStep] Successfully validated AthleteFacts');
      console.log(
        '[profileStep] Weekly volume:',
        athleteFacts.currentFitness.recentWeeklyVolume,
        'seconds',
      );
      console.log(
        '[profileStep] Availability slots:',
        athleteFacts.availability.length,
      );

      return { athleteFacts, goal: inputData.goal };
    } catch (error) {
      console.error('[profileStep] Error:', error);
      throw new Error(
        `Failed to analyze athlete profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

// Step 2: Macro Planning
const macroStep = createStep({
  id: 'macro-planning',
  description: 'Design high-level training phase structure',
  inputSchema: z.object({
    athleteFacts: athleteFactsSchema,
    goal: z.object({
      raceName: z.string(),
      raceDate: z.string(),
      distance: z.number(),
      elevationGain: z.number(),
      terrain: z.enum(['ROAD', 'TRAIL', 'MIXED']).optional(),
    }),
  }),
  outputSchema: z.object({
    macroPlan: macroPlanSchemaType,
    athleteFacts: athleteFactsSchema,
  }),
  execute: async ({ inputData, runtimeContext }) => {
    try {
      // Build prompt for macro-plan agent
      const currentDate = new Date().toISOString();

      const prompt = `[CURRENT DATE: ${new Date(currentDate).toLocaleDateString(
        'en-US',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      )}]

Design a comprehensive macro training plan for the following:

ATHLETE PROFILE:
${JSON.stringify(inputData.athleteFacts, null, 2)}

GOAL RACE:
- Race: ${inputData.goal.raceName}
- Date: ${new Date(inputData.goal.raceDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
- Distance: ${(inputData.goal.distance / 1000).toFixed(1)}km
- Elevation Gain: ${inputData.goal.elevationGain}m
- Terrain: ${inputData.goal.terrain || 'MIXED'}

Please create a periodized macro plan with:
1. Appropriate phase structure (BASE → SPECIFIC → TAPER)
2. Realistic volume progression based on current fitness
3. Key milestones and checkpoints
4. Clear strategy and rationale

Consider:
- Time available until race (weeks from today to race day)
- Current fitness level and weekly volume
- Race distance and demands
- Need for adequate base, specific work, and taper`;

      // Call macro-plan agent with structured output
      const response = await macroPlanAgent.generate(prompt, {
        runtimeContext,
        structuredOutput: {
          schema: macroPlanSchemaType,
        },
      });

      const macroPlan = response.object;

      console.log('[macroStep] Macro plan generated successfully');

      return {
        macroPlan,
        athleteFacts: inputData.athleteFacts,
      };
    } catch (error) {
      console.error('[macroStep] Failed to generate macro plan:', error);
      throw new Error(
        `Macro planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

// Step 3: Meso Planning
const mesoStep = createStep({
  id: 'meso-planning',
  description: 'Break phases into weekly training blocks',
  inputSchema: z.object({
    macroPlan: macroPlanSchemaType,
    athleteFacts: athleteFactsSchema,
  }),
  outputSchema: z.object({
    mesoBlocks: z.array(mesoBlockSchema),
    athleteFacts: athleteFactsSchema,
  }),
  execute: async ({ inputData, runtimeContext }) => {
    try {
      // Build prompt for meso-plan agent
      const prompt = `Break down the following macro plan into detailed meso-cycles (3-4 week training blocks).

MACRO PLAN:
${JSON.stringify(inputData.macroPlan, null, 2)}

ATHLETE PROFILE:
Current Weekly Volume: ${(inputData.athleteFacts.currentFitness.recentWeeklyVolume / 3600).toFixed(1)}h
Experience Level: ${inputData.athleteFacts.experienceLevel || 'INTERMEDIATE'}
Constraints: ${JSON.stringify(inputData.athleteFacts.constraints, null, 2)}

For each phase in the macro plan, create meso-cycles with:

1. WEEK-BY-WEEK BREAKDOWN:
   - Assign each week a specific date range
   - Set realistic volume targets in seconds (use macro phase targets as guide)
   - Apply 10% rule: no more than 10% volume increase per week
   - Include recovery weeks every 3-4 weeks (20-40% volume reduction)

2. PROGRESSION PATTERNS:
   - Use 3:1 pattern (3 weeks build + 1 recovery) for most blocks
   - Consider 2:1 pattern if athlete is less experienced
   - Ensure smooth progression between blocks

3. BLOCK THEMES:
   BASE phase blocks should focus on: aerobic foundation, volume building, endurance
   SPECIFIC phase blocks should focus on: VO2max, threshold, race-specific work
   TAPER phase blocks should focus on: volume reduction, maintaining intensity, freshness

4. INTENSITY FOCUS:
   - Assign each week an intensity focus: EASY, MODERATE, HARD, or MIXED
   - Most weeks should be EASY (80/20 principle)
   - Hard weeks should be separated by easy/recovery weeks

5. STARTING POINT:
   - Start first week at or slightly above athlete's current weekly volume: ${(inputData.athleteFacts.currentFitness.recentWeeklyVolume / 3600).toFixed(1)}h (${inputData.athleteFacts.currentFitness.recentWeeklyVolume}s)
   - Build gradually from there

Please create detailed meso-blocks for the entire plan duration.`;

      // Call meso-plan agent with structured output
      const response = await mesoPlanAgent.generate(prompt, {
        runtimeContext,
        structuredOutput: {
          schema: mesoBlocksOutputSchema,
        },
      });

      const mesoBlocks = response.object.mesoBlocks;

      console.log(
        `[mesoStep] Generated ${mesoBlocks.length} meso-blocks successfully`,
      );

      return {
        mesoBlocks,
        athleteFacts: inputData.athleteFacts,
      };
    } catch (error) {
      console.error('[mesoStep] Failed to generate meso plan:', error);
      throw new Error(
        `Meso planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

// Step 4: Micro Planning
const microStep = createStep({
  id: 'micro-planning',
  description: 'Generate specific training sessions for each week',
  inputSchema: z.object({
    mesoBlocks: z.array(mesoBlockSchema),
    athleteFacts: athleteFactsSchema,
  }),
  outputSchema: z.object({
    weekIntentions: z.array(weekIntentionsSchema),
    mesoBlocks: z.array(mesoBlockSchema),
    athleteFacts: athleteFactsSchema,
  }),
  execute: async ({ inputData, runtimeContext }) => {
    try {
      const allWeekIntentions: z.infer<typeof weekIntentionsSchema>[] = [];

      // Extract all weeks from all meso blocks
      const allWeeks = inputData.mesoBlocks.flatMap((block) =>
        block.weeks.map((week) => ({
          ...week,
          blockTheme: block.blockTheme,
          phaseName: block.phaseName,
        })),
      );

      console.log(
        `[microStep] Generating sessions for ${allWeeks.length} weeks...`,
      );

      // Process each week sequentially (could be parallelized in future)
      for (const week of allWeeks) {
        const prompt = `Create detailed training sessions for this specific week:

WEEK DETAILS:
- Week Number: ${week.weekNumber}
- Dates: ${new Date(week.startDate).toLocaleDateString()} - ${new Date(week.endDate).toLocaleDateString()}
- Theme: ${week.theme}
- Target Volume: ${(week.targetVolume / 3600).toFixed(1)}h (${week.targetVolume} seconds)
- Intensity Focus: ${week.intensityFocus}
- Is Recovery Week: ${week.isRecoveryWeek}
- Block Theme: ${week.blockTheme}
- Phase: ${week.phaseName}

ATHLETE PROFILE:
- Experience Level: ${inputData.athleteFacts.experienceLevel || 'INTERMEDIATE'}
- Current Weekly Volume: ${(inputData.athleteFacts.currentFitness.recentWeeklyVolume / 3600).toFixed(1)}h
- Longest Recent Run: ${(inputData.athleteFacts.currentFitness.longestRecentRun / 1000).toFixed(1)}km
- Constraints: ${JSON.stringify(inputData.athleteFacts.constraints, null, 2)}

REQUIREMENTS:
1. Create 4-7 training sessions for this week
2. Total session durations should equal target volume (${week.targetVolume}s)
3. Apply 80/20 rule: ~80% of volume at easy intensity (RPE ≤ 0.5), ~20% hard
4. Match intensity focus: ${week.intensityFocus}
5. Include appropriate session variety:
   - At least one long run (if not recovery week)
   - 1-2 key workouts based on block theme and intensity focus
   - Multiple easy runs to fill volume
   - Optional: strength training
   - At least 1 rest day

6. Session Types Based on Phase:
   ${week.phaseName === 'BASE' ? '- Focus on easy runs and long runs\n   - Max 1 key workout (tempo or hills, keep moderate)\n   - Include strength training' : ''}
   ${week.phaseName === 'SPECIFIC' ? '- Include 2 key workouts (VO2, threshold, or race pace)\n   - Long run with race-specific segments\n   - Reduce strength work' : ''}
   ${week.phaseName === 'TAPER' ? '- Reduce all durations significantly\n   - Keep intensity but reduce volume\n   - More rest days' : ''}

7. For each session provide:
   - type: INTERVAL, LONG_RUN, TEMPO, EASY, RECOVERY, STRENGTH, or RACE
   - sport: RUNNING, CYCLING, SWIMMING, STRENGTH, or OTHER
   - targetDuration: in seconds
   - targetDistance: in meters (optional, estimate based on duration and pace)
   - targetElevationGain: in meters (optional)
   - targetIntensity: {zone: "Z1", "Z2", etc., rpe: 0.0-1.0}
   - description: detailed description of the workout
   - priority: HIGH (key workouts), MEDIUM (long run), LOW (easy runs)

8. DO NOT assign days or times - leave dayOfWeek as null

Create a comprehensive week of training that matches the theme and volume target.`;

        // Call micro-plan agent with structured output
        const response = await microPlanAgent.generate(prompt, {
          runtimeContext,
          structuredOutput: {
            schema: weekIntentionsOutputSchema,
          },
        });

        const weekIntentions = response.object;

        allWeekIntentions.push(weekIntentions);

        console.log(
          `[microStep] Generated ${weekIntentions.sessions.length} sessions for week ${week.weekNumber}`,
        );
      }

      console.log(
        `[microStep] Successfully generated sessions for all ${allWeeks.length} weeks`,
      );

      return {
        weekIntentions: allWeekIntentions,
        mesoBlocks: inputData.mesoBlocks,
        athleteFacts: inputData.athleteFacts,
      };
    } catch (error) {
      console.error('[microStep] Failed to generate micro plan:', error);
      throw new Error(
        `Micro planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  },
});

// Step 5: Scheduling
const schedulingStep = createStep({
  id: 'scheduling',
  description: 'Assign sessions to specific days and times',
  inputSchema: z.object({
    weekIntentions: z.array(z.any()),
    athleteFacts: z.any(),
  }),
  outputSchema: z.object({
    scheduledWeeks: z.array(z.any()), // TODO: Define ScheduledWeek schema
  }),
  execute: async ({ inputData }) => {
    // TODO: Call scheduling agent for each week
    throw new Error('Not implemented - schedulingStep');
  },
});

// Step 6: Quality Assurance
const qaStep = createStep({
  id: 'quality-assurance',
  description: 'Validate complete plan against constraints',
  inputSchema: z.object({
    scheduledWeeks: z.array(z.any()),
    athleteFacts: z.any(),
    macroPlan: z.any(),
  }),
  outputSchema: z.object({
    validationReport: z.any(), // TODO: Define ValidationReport schema
    planValid: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    // TODO: Call qa agent with complete plan structure
    throw new Error('Not implemented - qaStep');
  },
});

// Step 7: Persistence
const persistenceStep = createStep({
  id: 'persistence',
  description: 'Save complete plan to database',
  inputSchema: z.object({
    athleteId: z.number(),
    macroPlan: z.any(),
    scheduledWeeks: z.array(z.any()),
    validationReport: z.any(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    trainingPlanId: z.number(),
  }),
  execute: async ({ inputData }) => {
    // TODO: Only execute if validation passed
    // Convert structured plan to database format
    // Call save-plan tool
    throw new Error('Not implemented - persistenceStep');
  },
});

// TODO: Compose workflow properly with correct input/output chaining
// Current issue: Need to pass context through steps (athleteFacts, goal, etc.)
// Solution: Use workflow context or restructure step schemas to accept full context
//
// Intended flow:
//   .then(profileStep) → athleteFacts
//   .then(macroStep) → macroPlan (needs athleteFacts + goal)
//   .then(mesoStep) → mesoBlocks (needs macroPlan + athleteFacts)
//   .then(microStep) → weekIntentions (needs mesoBlocks + athleteFacts)
//   .then(schedulingStep) → scheduledWeeks (needs weekIntentions + athleteFacts)
//   .then(qaStep) → validationReport (needs scheduledWeeks + athleteFacts + macroPlan)
//   .then(persistenceStep) → success (needs all data)

// Final step: Convert generated plan to workflow output format
const finalizeStep = createStep({
  id: 'finalize',
  description: 'Convert generated plan to final output format',
  inputSchema: z.object({
    mesoBlocks: z.array(mesoBlockSchema),
    athleteFacts: athleteFactsSchema,
    weekIntentions: z.array(weekIntentionsSchema),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    trainingPlanId: z.number().optional(),
    validationReport: z.any(),
    error: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    // TODO: Implement scheduling, QA, and persistence
    // For now, return success with generated data summary
    return {
      success: true,
      validationReport: {
        message:
          'Plan generated successfully (scheduling and persistence not yet implemented)',
        totalWeeks: inputData.mesoBlocks.reduce(
          (sum, block) => sum + block.weeks.length,
          0,
        ),
        totalSessions: inputData.weekIntentions.reduce(
          (sum, week) => sum + week.sessions.length,
          0,
        ),
        recommendation:
          'Review generated plan structure. Next steps: scheduling → QA → persistence',
      },
    };
  },
});

export const planGenerationWorkflow = createWorkflow({
  id: 'plan-generation',
  description:
    'CRITICAL WORKFLOW: Only use when athlete explicitly wants to CREATE A NEW TRAINING PLAN for a specific race. Requires race name, date, and distance. NOT for questions, data requests, or viewing existing data. Use qna agent for questions instead.',
  inputSchema: z.object({
    athleteId: z.number(),
    goal: z.object({
      raceName: z.string(),
      raceDate: z.string(),
      distance: z.number(),
      elevationGain: z.number(),
      terrain: z.enum(['ROAD', 'TRAIL', 'MIXED']).optional(),
    }),
    preferences: z
      .object({
        preferredTrainingDays: z.array(z.number()).optional(),
        avoidDays: z.array(z.number()).optional(),
        maxWeeklyVolume: z.number().optional(),
      })
      .optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    trainingPlanId: z.number().optional(),
    validationReport: z.any(),
    error: z.string().optional(),
  }),
})
  .then(profileStep)
  .then(macroStep)
  .then(mesoStep)
  .then(microStep)
  .then(finalizeStep)
  .commit();
