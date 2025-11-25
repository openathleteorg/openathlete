import { z } from 'zod';

import { EVENT_TYPE, SPORT_TYPE } from '../../misc';
import {
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '../core';

/**
 * Simplified schema for AI event generation
 * This avoids recursive references that OpenAI cannot handle
 * The workout steps are limited to a flat structure (no nested repeat blocks)
 */
const baseEventSchema = z.object({
  startDate: z.string().describe('ISO date string'),
  endDate: z.string().describe('ISO date string'),
  name: z.string().min(1).max(100),
});

const workoutStepTargetSchema = z.object({
  targetType: z.nativeEnum(WORKOUT_TARGET_TYPE),
  targetMin: z.number().optional(),
  targetMax: z.number().optional(),
  targetValue: z.number().optional(),
  metricType: z.string().optional().describe('Metric type to use as percentage reference (e.g., "VMA", "HR_MAX", "FTP_CYCLING"). When set, target values are stored as 0-1 (percentage).'),
});

// Simplified workout step - completely flat, no recursion at all
// For REPEAT blocks, we'll use a simple array structure that can be transformed later
const workoutStepSchema = z.object({
  stepType: z.nativeEnum(WORKOUT_STEP_TYPE),
  name: z.string().optional(),
  durationType: z.nativeEnum(WORKOUT_DURATION_TYPE).optional(),
  durationValue: z.number().optional(),
  notes: z.string().optional(),
  targets: z.array(workoutStepTargetSchema).default([]),
  // For REPEAT steps: number of times to repeat the following steps
  repeatCount: z
    .number()
    .min(1)
    .max(99)
    .optional()
    .describe(
      'For REPEAT step type: number of times to repeat. The following steps in the array will be repeated.',
    ),
});

const trainingEventSchema = baseEventSchema.extend({
  type: z.literal(EVENT_TYPE.TRAINING),
  sport: z.nativeEnum(SPORT_TYPE),
  description: z.string(),
  goalDistance: z.number().optional(),
  goalDuration: z.number().optional(),
  goalElevationGain: z.number().optional(),
  goalRpe: z.number().optional(),
  workout: z
    .object({
      steps: z.array(workoutStepSchema).default([]),
    })
    .optional(),
});

const competitionEventSchema = baseEventSchema.extend({
  type: z.literal(EVENT_TYPE.COMPETITION),
  sport: z.nativeEnum(SPORT_TYPE),
  description: z.string(),
  goalDistance: z.number().optional(),
  goalDuration: z.number().optional(),
  goalElevationGain: z.number().optional(),
  goalRpe: z.number().optional(),
});

const noteEventSchema = baseEventSchema.extend({
  type: z.literal(EVENT_TYPE.NOTE),
  description: z.string().min(1),
});

const activityEventSchema = baseEventSchema.extend({
  type: z.literal(EVENT_TYPE.ACTIVITY),
  sport: z.nativeEnum(SPORT_TYPE),
  description: z.string().optional(),
  rpe: z.number().optional(),
});

// Use discriminated union for better JSON Schema compatibility
// OpenAI structured output works better with discriminated unions
export const generateEventResponseSchema = z.discriminatedUnion('type', [
  trainingEventSchema,
  competitionEventSchema,
  noteEventSchema,
  activityEventSchema,
]);

export type GenerateEventResponseSchema = z.infer<
  typeof generateEventResponseSchema
>;
