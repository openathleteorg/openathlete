/**
 * Workflow Steps - Central export point
 *
 * All steps for the plan generation workflow are exported from here.
 * Each step is fully typed and self-contained.
 */

// Step 1: Profile Analysis
export {
  profileStep,
  profileStepInputSchema,
  profileStepOutputSchema,
  goalSchema,
  preferencesSchema,
  type Goal,
  type Preferences,
  type ProfileStepInput,
  type ProfileStepOutput,
} from './profile-analysis.step';

// Step 2: Macro Planning
export {
  macroStep,
  macroStepInputSchema,
  macroStepOutputSchema,
  type MacroStepInput,
  type MacroStepOutput,
} from './macro-planning.step';

// Step 3: Meso Planning
export {
  mesoStep,
  mesoStepInputSchema,
  mesoStepOutputSchema,
  type MesoStepInput,
  type MesoStepOutput,
} from './meso-planning.step';

// Step 4: Micro Planning
export {
  microStep,
  microStepInputSchema,
  microStepOutputSchema,
  type MicroStepInput,
  type MicroStepOutput,
} from './micro-planning.step';

// Step 5: Scheduling
export {
  schedulingStep,
  schedulingStepInputSchema,
  schedulingStepOutputSchema,
  type SchedulingStepInput,
  type SchedulingStepOutput,
} from './scheduling.step';

// Step 6: QA Validation
export {
  qaStep,
  qaStepInputSchema,
  qaStepOutputSchema,
  type QAStepInput,
  type QAStepOutput,
  type TrainingPlan,
  type TrainingPlanCycle,
} from './qa-validation.step';

// Step 7: QA Improvement Loop
export {
  qaImprovementLoopStep,
  qaImprovementLoopStepInputSchema,
  qaImprovementLoopStepOutputSchema,
  applyCorrections,
  type QAImprovementLoopStepInput,
  type QAImprovementLoopStepOutput,
} from './qa-improvement-loop.step';

// Step 8: Finalize
export {
  finalizeStep,
  finalizeStepInputSchema,
  finalizeStepOutputSchema,
  type FinalizeStepInput,
  type FinalizeStepOutput,
} from './finalize.step';
