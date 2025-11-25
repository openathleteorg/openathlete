import { z } from 'zod';

import {
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '../../misc';

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
    workoutId: z.number().optional(),
    repeatParentId: z.number().nullable().optional(),
    targets: z.array(workoutStepTargetSchema).default([]),
    repeatBlock: z
      .object({
        workoutRepeatId: z.number().optional(),
        repetitions: z.number().min(1).max(99),
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
      durationType: z.nativeEnum(WORKOUT_DURATION_TYPE).nullable().optional(),
      durationValue: z.number().nullable().optional(),
      repeatTimes: z.number().nullable().optional(),
      restTime: z.number().nullable().optional(),
      notes: z.string().nullable().optional(),
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
  targets?: CreateWorkoutStepTarget[];
  childSteps?: CreateWorkoutStepDto[];
  repeatBlock?: {
    repetitions: number;
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
