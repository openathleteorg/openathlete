import { z } from 'zod';

import { EVENT_TYPE, SPORT_TYPE } from '../../misc';
import { createWorkoutStepDtoSchema } from './workout.dto';

const baseEventSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  name: z.string().min(1).max(100),
  athleteId: z.number().optional().nullable(),
});

export const trainingEventSchema = baseEventSchema.extend({
  type: z.literal(EVENT_TYPE.TRAINING),
  sport: z.nativeEnum(SPORT_TYPE),
  description: z.string(),
  goalDistance: z.number().optional().nullable(),
  goalDuration: z.number().optional().nullable(),
  goalElevationGain: z.number().optional().nullable(),
  goalRpe: z.number().optional().nullable(),
  // Workout data for structured training sessions
  workout: z
    .object({
      steps: z.array(createWorkoutStepDtoSchema).default([]),
    })
    .optional()
    .nullable(),
});

export const competitionEventSchema = baseEventSchema.extend({
  type: z.literal(EVENT_TYPE.COMPETITION),
  sport: z.nativeEnum(SPORT_TYPE),
  description: z.string(),
  goalDistance: z.number().optional().nullable(),
  goalDuration: z.number().optional().nullable(),
  goalElevationGain: z.number().optional().nullable(),
  goalRpe: z.number().optional().nullable(),
});

export const noteEventSchema = baseEventSchema.extend({
  type: z.literal(EVENT_TYPE.NOTE),
  description: z.string().min(1),
});

export const activityEventSchema = baseEventSchema.extend({
  type: z.literal(EVENT_TYPE.ACTIVITY),
  sport: z.nativeEnum(SPORT_TYPE),
  description: z.string().optional(),
  rpe: z.number().optional().nullable(),
});

export const createEventDtoSchema = z.discriminatedUnion('type', [
  trainingEventSchema,
  competitionEventSchema,
  noteEventSchema,
  activityEventSchema,
]);

export type CreateEventDto = z.infer<typeof createEventDtoSchema>;
