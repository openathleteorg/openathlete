import { z } from 'zod';

import {
  EXERCISE_SIDE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_REPEAT_KIND,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '../../misc';

/** "c:<slug>" for the bundled catalog, "u:<id>" for a custom exercise */
export const exerciseRefSchema = z
  .string()
  .regex(/^(c:[a-z0-9-]{1,80}|u:\d{1,10})$/);

/** Eccentric-pause-concentric-pause seconds, X for explosive: "3-1-X-0" */
export const tempoSchema = z.string().regex(/^[0-9xX]{1,2}(-[0-9xX]{1,2}){3}$/);

/** Strength fields of a step, and the way a repeat block runs */
const strengthStepFields = {
  exerciseRef: exerciseRefSchema
    .nullable()
    .optional()
    .describe('Strength exercise: "c:<slug>" from the catalog'),
  tempo: tempoSchema.nullable().optional(),
  side: z.nativeEnum(EXERCISE_SIDE).nullable().optional(),
};
const repeatModeFields = {
  kind: z.nativeEnum(WORKOUT_REPEAT_KIND).optional(),
  intervalSeconds: z.number().int().min(10).max(3600).nullable().optional(),
  timeCapSeconds: z.number().int().min(30).max(14400).nullable().optional(),
};

export const workoutStepTargetSchema = z.object({
  workoutStepTargetId: z.number().optional(),
  targetType: z.nativeEnum(WORKOUT_TARGET_TYPE),
  targetMin: z.number().nullable().optional(),
  targetMax: z.number().nullable().optional(),
  targetValue: z.number().nullable().optional(),
  metricType: z.string().nullable().optional(),
  stepId: z.number().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type WorkoutStepTargetDto = z.infer<typeof workoutStepTargetSchema>;

export const workoutStepSchema: z.ZodSchema = z.lazy(() =>
  z.object({
    workoutStepId: z.number().optional(),
    orderIndex: z.number(),
    stepType: z.nativeEnum(WORKOUT_STEP_TYPE),
    name: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    durationType: z.nativeEnum(WORKOUT_DURATION_TYPE),
    durationValue: z.number().nullable().optional(),
    durationTarget: z.number().nullable().optional(),
    ...strengthStepFields,
    workoutId: z.number().optional(),
    repeatParentId: z.number().nullable().optional(),
    targets: z.array(workoutStepTargetSchema).default([]),
    repeatBlock: z
      .object({
        workoutRepeatId: z.number().optional(),
        repetitions: z.number().min(1).max(99),
        ...repeatModeFields,
        stepId: z.number().optional(),
        childSteps: z.array(workoutStepSchema).default([]),
        createdAt: z.coerce.date().optional(),
        updatedAt: z.coerce.date().optional(),
      })
      .nullable()
      .optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
);

export type WorkoutStepDto = z.infer<typeof workoutStepSchema>;

export const workoutRepeatSchema = z.object({
  workoutRepeatId: z.number().optional(),
  repetitions: z.number().min(1).max(99),
  ...repeatModeFields,
  stepId: z.number().optional(),
  childSteps: z.array(workoutStepSchema).default([]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type WorkoutRepeatDto = z.infer<typeof workoutRepeatSchema>;

export const workoutSchema = z.object({
  workoutId: z.number().optional(),
  eventTrainingId: z.number(),
  steps: z.array(workoutStepSchema).default([]),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type WorkoutDto = z.infer<typeof workoutSchema>;

// ============================================================================
// Create/Update DTOs
// ============================================================================

export const createWorkoutStepTargetSchema = workoutStepTargetSchema
  .omit({
    workoutStepTargetId: true,
    stepId: true,
    createdAt: true,
    updatedAt: true,
  })
  .strict();

export type CreateWorkoutStepTarget = z.infer<
  typeof createWorkoutStepTargetSchema
>;

export const createWorkoutStepDtoSchema = z
  .lazy(() =>
    z.object({
      stepType: z.nativeEnum(WORKOUT_STEP_TYPE),
      name: z.string().nullable().optional(),
      durationType: z
        .nativeEnum(WORKOUT_DURATION_TYPE)
        .nullable()
        .optional()
        .describe(
          'TIME or DISTANCE for endurance steps (pool lengths are DISTANCE); REPS only for strength exercises',
        ),
      durationValue: z
        .number()
        .nullable()
        .optional()
        .describe('Seconds for TIME, meters for DISTANCE, count for REPS'),
      repeatTimes: z.number().nullable().optional(),
      restTime: z.number().nullable().optional(),
      notes: z.string().nullable().optional(),
      ...strengthStepFields,
      targets: z.array(createWorkoutStepTargetSchema).default([]),
      // Recursive type for REPEAT steps that contain child steps
      childSteps: z
        .union([
          z.array(z.lazy(() => z.undefined())),
          z.lazy(() => z.array(createWorkoutStepDtoSchema)).default([]),
        ])
        .optional(),
      // Alternative format: repeatBlock with repetitions and childSteps
      repeatBlock: z
        .object({
          repetitions: z.number().min(1).max(99),
          ...repeatModeFields,
          childSteps: z
            .lazy(() => z.array(createWorkoutStepDtoSchema))
            .default([]),
        })
        .nullable()
        .optional(),
    }),
  )
  .refine(
    (step) => {
      // If this step has a repeatBlock, check that child steps don't contain repeat blocks
      if (step.repeatBlock && step.repeatBlock.childSteps) {
        return !step.repeatBlock.childSteps.some(
          (childStep) =>
            childStep.stepType === WORKOUT_STEP_TYPE.REPEAT &&
            childStep.repeatBlock,
        );
      }
      return true;
    },
    {
      message:
        'Repeat blocks cannot be nested. A repeat block cannot contain another repeat block (max depth of 1).',
      path: ['repeatBlock', 'childSteps'],
    },
  ) as z.ZodSchema<CreateWorkoutStepDto>;

export type CreateWorkoutStepDto = {
  stepType: WORKOUT_STEP_TYPE;
  name?: string | null;
  durationType?: WORKOUT_DURATION_TYPE | null;
  durationValue?: number | null;
  repeatTimes?: number | null;
  restTime?: number | null;
  notes?: string | null;
  exerciseRef?: string | null;
  tempo?: string | null;
  side?: EXERCISE_SIDE | null;
  targets?: CreateWorkoutStepTarget[];
  childSteps?: CreateWorkoutStepDto[];
  repeatBlock?: {
    repetitions: number;
    kind?: WORKOUT_REPEAT_KIND;
    intervalSeconds?: number | null;
    timeCapSeconds?: number | null;
    childSteps: CreateWorkoutStepDto[];
  } | null;
};

export const createWorkoutSchema = z.object({
  steps: z.array(createWorkoutStepDtoSchema).default([]),
});

export type CreateWorkoutDto = z.infer<typeof createWorkoutSchema>;

export const updateWorkoutSchema = z.object({
  steps: z.array(createWorkoutStepDtoSchema).optional(),
});

export type UpdateWorkoutDto = z.infer<typeof updateWorkoutSchema>;

// ============================================================================
// Reorder Steps DTO
// ============================================================================

export const reorderStepsSchema = z.object({
  stepOrders: z.array(
    z.object({
      stepId: z.number(),
      order: z.number(),
    }),
  ),
});

export type ReorderStepsDto = z.infer<typeof reorderStepsSchema>;
