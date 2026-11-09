import { z } from 'zod';

import { COMPETITION_PRIORITY, EVENT_TYPE, SPORT_TYPE } from '../../misc';
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
  // Descriptions guide the AI generator, which writes this schema
  goalDistance: z.number().optional().nullable().describe('Meters'),
  goalDuration: z
    .number()
    .optional()
    .nullable()
    .describe(
      'Planned duration of the whole session in seconds (45 min = 2700). Equals the total the coach states, even when the steps add up to less',
    ),
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
  priority: z.nativeEnum(COMPETITION_PRIORITY).optional().nullable(),
});

export const noteEventSchema = baseEventSchema.extend({
  type: z.literal(EVENT_TYPE.NOTE),
  description: z.string().min(1),
});

/**
 * An activity logged by hand, without a device: its duration is the time
 * between its start and end, its distance and elevation are optional.
 */
export const activityEventSchema = baseEventSchema.extend({
  type: z.literal(EVENT_TYPE.ACTIVITY),
  sport: z.nativeEnum(SPORT_TYPE),
  description: z.string().optional(),
  rpe: z.number().min(0).max(1).optional().nullable(),
  /** Meters */
  distance: z.number().min(0).max(1_000_000).optional().nullable(),
  /** Meters */
  elevationGain: z.number().min(0).max(30_000).optional().nullable(),
  equipmentId: z.number().int().positive().optional().nullable(),
  isRace: z.boolean().optional(),
});

export const createEventDtoSchema = z.discriminatedUnion('type', [
  trainingEventSchema,
  competitionEventSchema,
  noteEventSchema,
  activityEventSchema,
]);

export type CreateEventDto = z.infer<typeof createEventDtoSchema>;
