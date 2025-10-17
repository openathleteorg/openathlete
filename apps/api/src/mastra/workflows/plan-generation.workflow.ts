import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

import { macroPlanAgent, macroPlanSchema } from '../agents/macro-plan.agent';
import {
  mesoBlocksOutputSchema,
  mesoPlanAgent,
} from '../agents/meso-plan.agent';
import {
  athleteFactsSchema,
  macroPlanSchema as macroPlanSchemaType,
  mesoBlockSchema,
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
    analysisPeriod: z
      .object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
      .optional(),
  }),
  outputSchema: z.object({
    athleteFacts: z.any(), // TODO: Define proper AthleteFacts schema
  }),
  execute: async ({ inputData }) => {
    // TODO: Call athlete-profile agent
    // const response = await athleteProfileAgent.generate(...);
    throw new Error('Not implemented - profileStep');
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
    currentDate: z.string(),
  }),
  outputSchema: z.object({
    macroPlan: macroPlanSchemaType,
  }),
  execute: async ({ inputData, runtimeContext }) => {
    try {
      // Build prompt for macro-plan agent
      const currentDate = inputData.currentDate || new Date().toISOString();

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

      // Call macro-plan agent
      const response = await macroPlanAgent.generate(prompt, {
        runtimeContext,
      });

      // Parse the response text as JSON (agent should return structured data)
      let macroPlan;
      try {
        macroPlan = JSON.parse(response.text);
      } catch (parseError) {
        console.error(
          '[macroStep] Failed to parse agent response as JSON:',
          response.text,
        );
        throw new Error('Agent did not return valid JSON structure');
      }

      // Validate against schema
      const validatedPlan = macroPlanSchemaType.parse(macroPlan);

      console.log('[macroStep] Macro plan generated successfully');

      return {
        macroPlan: validatedPlan,
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

      // Call meso-plan agent
      const response = await mesoPlanAgent.generate(prompt, {
        runtimeContext,
      });

      // Parse the response text as JSON
      let mesoData;
      try {
        mesoData = JSON.parse(response.text);
      } catch (parseError) {
        console.error(
          '[mesoStep] Failed to parse agent response as JSON:',
          response.text,
        );
        throw new Error('Agent did not return valid JSON structure');
      }

      // Validate against schema
      const validatedData = mesoBlocksOutputSchema.parse(mesoData);

      console.log(
        `[mesoStep] Generated ${validatedData.mesoBlocks.length} meso-blocks successfully`,
      );

      return {
        mesoBlocks: validatedData.mesoBlocks,
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
  description: 'Generate specific session plans for each week',
  inputSchema: z.object({
    mesoBlocks: z.array(z.any()),
    athleteFacts: z.any(),
  }),
  outputSchema: z.object({
    weekIntentions: z.array(z.any()), // TODO: Define WeekIntentions schema
  }),
  execute: async ({ inputData }) => {
    // TODO: Call micro-plan agent for each week
    // May need to parallelize or loop through weeks
    throw new Error('Not implemented - microStep');
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

// Temporary placeholder step until full implementation
const notImplementedStep = createStep({
  id: 'not-implemented',
  description: 'Placeholder step - workflow not yet implemented',
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
  execute: async ({ inputData }) => {
    return {
      success: false,
      error: `Plan generation workflow is not yet implemented. The athlete wants to create a plan for "${inputData.goal.raceName}" on ${inputData.goal.raceDate}. Please inform them this feature is under development.`,
      validationReport: {
        message: 'Workflow under construction',
        recommendation:
          'Use qna agent for questions, or contact support for manual plan creation.',
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
  .then(notImplementedStep)
  .commit();
