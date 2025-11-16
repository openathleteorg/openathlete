import { z } from 'zod';

import { EVENT_TYPE, SPORT_TYPE } from '../../misc';
import { createWorkoutStepDtoSchema } from './workout.dto';

const baseEventUpdateSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  name: z.string().min(1).max(100).optional(),
  athleteId: z.number().optional().nullable(),
});

const trainingEventUpdateSchema = baseEventUpdateSchema.extend({
  type: z.literal(EVENT_TYPE.TRAINING).optional(),
  sport: z.nativeEnum(SPORT_TYPE).optional(),
  description: z.string().optional(),
  goalDistance: z.number().optional().nullable(),
  goalDuration: z.number().optional().nullable(),
  goalElevationGain: z.number().optional().nullable(),
  goalRpe: z.number().optional().nullable(),
  workout: z
    .object({
      steps: z.array(createWorkoutStepDtoSchema).optional(),
    })
    .optional()
    .nullable(),
});

const competitionEventUpdateSchema = baseEventUpdateSchema.extend({
  type: z.literal(EVENT_TYPE.COMPETITION).optional(),
  sport: z.nativeEnum(SPORT_TYPE).optional(),
  description: z.string().optional(),
  goalDistance: z.number().optional().nullable(),
  goalDuration: z.number().optional().nullable(),
  goalElevationGain: z.number().optional().nullable(),
  goalRpe: z.number().optional().nullable(),
});

const noteEventUpdateSchema = baseEventUpdateSchema.extend({
  type: z.literal(EVENT_TYPE.NOTE).optional(),
  description: z.string().optional(),
});

const activityEventUpdateSchema = baseEventUpdateSchema.extend({
  type: z.literal(EVENT_TYPE.ACTIVITY).optional(),
  sport: z.nativeEnum(SPORT_TYPE).optional(),
  description: z.string().optional(),
  rpe: z.number().optional().nullable(),
});

export const updateEventDtoSchema = z.union([
  trainingEventUpdateSchema,
  competitionEventUpdateSchema,
  noteEventUpdateSchema,
  activityEventUpdateSchema,
]);

export type UpdateEventDto = z.infer<typeof updateEventDtoSchema>;

export const reorderWorkoutStepsSchema = z.object({
  stepOrders: z.array(
    z.object({
      stepId: z.number(),
      order: z.number(),
    }),
  ),
});

export type ReorderWorkoutStepsDto = z.infer<typeof reorderWorkoutStepsSchema>;

export const duplicateWorkoutSchema = z.object({
  targetTrainingId: z.number(),
});

export type DuplicateWorkoutDto = z.infer<typeof duplicateWorkoutSchema>;
