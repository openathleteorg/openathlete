import { z } from 'zod';

import {
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  WORKOUT_TARGET_UNIT,
} from './dtos/core/workout.dto';
import { SPORT_TYPE } from './misc/core/sport-type.enum';

// Normalized structure for provider exports (repeat blocks are flattened)

export const normalizedWorkoutStepTargetSchema = z.object({
  targetType: z.nativeEnum(WORKOUT_TARGET_TYPE),
  targetMin: z.number().nullable().optional(),
  targetMax: z.number().nullable().optional(),
  targetValue: z.number().nullable().optional(),
  unit: z.nativeEnum(WORKOUT_TARGET_UNIT).nullable().optional(),
});

export type NormalizedWorkoutStepTarget = z.infer<
  typeof normalizedWorkoutStepTargetSchema
>;

export const normalizedWorkoutStepSchema = z.object({
  orderIndex: z.number(),
  stepType: z.nativeEnum(WORKOUT_STEP_TYPE),
  name: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  durationType: z.nativeEnum(WORKOUT_DURATION_TYPE),
  durationValue: z.number().nullable().optional(),
  durationTarget: z.number().nullable().optional(),
  targets: z.array(normalizedWorkoutStepTargetSchema).default([]),
});

export type NormalizedWorkoutStep = z.infer<typeof normalizedWorkoutStepSchema>;

export const normalizedWorkoutSchema = z.object({
  sport: z.nativeEnum(SPORT_TYPE),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  steps: z.array(normalizedWorkoutStepSchema).default([]),
});

export type NormalizedWorkout = z.infer<typeof normalizedWorkoutSchema>;
