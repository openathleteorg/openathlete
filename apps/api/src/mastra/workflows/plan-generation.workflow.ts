import { createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

import {
  finalizeStep,
  macroStep,
  mesoStep,
  microStep,
  profileStep,
  qaImprovementLoopStep,
  qaStep,
  schedulingStep,
} from './steps';

/**
 * Plan Generation Workflow
 *
 * PURPOSE:
 * Orchestrate the deterministic process of creating a training plan through all stages:
 * Profile → Macro → Meso → Micro → Scheduling → QA → Improvement Loop → Finalize
 *
 * STEPS:
 * 1. Profile Analysis: Extract athlete data and create AthleteFacts
 * 2. Macro Planning: Design overall phase structure and strategy
 * 3. Meso Planning: Break phases into week-by-week blocks
 * 4. Micro Planning: Generate specific session plans for each week
 * 5. Scheduling: Assign sessions to calendar days/times
 * 6. Quality Assurance: Validate complete plan
 * 7. QA Improvement Loop: Apply corrections until plan is good (max 3 iterations)
 * 8. Finalize: Prepare final output with validation results
 *
 * ERROR HANDLING:
 * - If QA returns CRITICAL errors, improvement loop attempts fixes
 * - Loop stops when score ≥ 75 AND no critical errors, OR max 3 iterations
 * - Return plan structure + validation report for user review
 * - Allow manual approval before final save
 */

/**
 * Workflow Input Schema
 */
const planGenerationInputSchema = z.object({
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
});

/**
 * Workflow Output Schema
 */
const planGenerationOutputSchema = z.object({
  success: z.boolean(),
  trainingPlanId: z.number().optional(),
  validationReport: z.object({
    valid: z.boolean(),
    overallScore: z.number(),
    message: z.string(),
    totalWeeks: z.number(),
    totalSessionsScheduled: z.number(),
    totalSessionsUnscheduled: z.number(),
    criticalErrorsCount: z.number(),
    warningsCount: z.number(),
    errors: z.array(z.any()),
    metrics: z.any(),
    recommendation: z.string(),
  }),
  error: z.string().optional(),
});

/**
 * Create the plan generation workflow
 *
 * CRITICAL: Only use when athlete explicitly wants to CREATE A NEW TRAINING PLAN
 * for a specific race. Requires race name, date, and distance.
 * NOT for questions, data requests, or viewing existing data.
 */
export const planGenerationWorkflow = createWorkflow({
  id: 'plan-generation',
  description:
    'CRITICAL WORKFLOW: Only use when athlete explicitly wants to CREATE A NEW TRAINING PLAN for a specific race. Requires race name, date, and distance. NOT for questions, data requests, or viewing existing data. Use qna agent for questions instead.',
  inputSchema: planGenerationInputSchema,
  outputSchema: planGenerationOutputSchema,
})
  // Step 1: Analyze athlete profile
  .then(profileStep)

  // Step 2: Design macro plan structure
  .then(macroStep)

  // Step 3: Break into meso-cycles
  .then(mesoStep)

  // Step 4: Generate session intentions
  .then(microStep)

  // Step 5: Schedule sessions to calendar
  .then(schedulingStep)

  // Step 6: Validate plan quality
  .then(qaStep)

  // Step 7: QA Improvement Loop - retrieve context for improvement step
  .map(async ({ inputData, getStepResult }) => {
    const macroStepResult = getStepResult(macroStep);
    const microStepResult = getStepResult(microStep);

    return {
      validationReport: inputData.validationReport,
      scheduledWeeks: inputData.scheduledWeeks,
      weekIntentions: microStepResult.weekIntentions,
      mesoBlocks: inputData.mesoBlocks,
      athleteFacts: inputData.athleteFacts,
      macroPlan: macroStepResult.macroPlan,
      schedulingMetadata: inputData.schedulingMetadata,
    };
  })

  // Step 8: Apply improvements until plan is good enough (max 3 iterations)
  .dountil(qaImprovementLoopStep, async ({ inputData, iterationCount }) => {
    const { validationReport } = inputData;
    const criticalErrors =
      validationReport?.errors?.filter((e) => e.severity === 'CRITICAL') || [];
    const score = validationReport?.overallScore || 0;

    // Stop conditions:
    const planIsGood = score >= 75 && criticalErrors.length === 0;
    const maxIterationsReached = (iterationCount || 0) >= 3;

    if (planIsGood) {
      console.log(
        `[Workflow] Plan quality acceptable (score: ${score}/100, no critical errors). Stopping improvement loop.`,
      );
    } else if (maxIterationsReached) {
      console.log(
        `[Workflow] Max ${3} improvement iterations reached. Current score: ${score}/100 with ${criticalErrors.length} critical errors remaining.`,
      );
    }

    return planIsGood || maxIterationsReached;
  })

  // Step 9: Finalize and prepare output
  .then(finalizeStep)

  // Commit the workflow
  .commit();
