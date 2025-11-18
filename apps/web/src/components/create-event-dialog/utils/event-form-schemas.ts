import { m } from '@/paraglide/messages';
import { z } from 'zod';

import { EVENT_TYPE, SPORT_TYPE } from '@openathlete/shared';

// Base schema for all event types
export const baseEventFormSchema = z.object({
  startDate: z.date({
    required_error: m.required(),
  }),
  endDate: z.date({
    required_error: m.required(),
  }),
  name: z.string().min(1, m.required()).max(100),
  description: z.string().optional(),
  saveAsTemplate: z.boolean().optional(),
});

// Training event schema
export const trainingEventFormSchema = baseEventFormSchema.extend({
  type: z.literal(EVENT_TYPE.TRAINING),
  sport: z.nativeEnum(SPORT_TYPE, {
    required_error: m.required(),
  }),
  description: z.string(),
  goalDistance: z.number().optional().nullable(),
  goalDuration: z.number().optional().nullable(),
  goalElevationGain: z.number().optional().nullable(),
  goalRpe: z.number().optional().nullable(),
});

// Competition event schema
export const competitionEventFormSchema = baseEventFormSchema.extend({
  type: z.literal(EVENT_TYPE.COMPETITION),
  sport: z.nativeEnum(SPORT_TYPE, {
    required_error: m.required(),
  }),
  description: z.string(),
  goalDistance: z.number().optional().nullable(),
  goalDuration: z.number().optional().nullable(),
  goalElevationGain: z.number().optional().nullable(),
  goalRpe: z.number().optional().nullable(),
});

// Note event schema
export const noteEventFormSchema = baseEventFormSchema.extend({
  type: z.literal(EVENT_TYPE.NOTE),
  description: z.string().min(1, m.required()),
});

// Activity event schema
export const activityEventFormSchema = baseEventFormSchema.extend({
  type: z.literal(EVENT_TYPE.ACTIVITY),
  sport: z.nativeEnum(SPORT_TYPE, {
    required_error: m.required(),
  }),
  description: z.string().optional(),
  rpe: z.number().optional().nullable(),
});

// Discriminated union for all event types
export const eventFormSchema = z.discriminatedUnion('type', [
  trainingEventFormSchema,
  competitionEventFormSchema,
  noteEventFormSchema,
  activityEventFormSchema,
]);

export type EventFormValues = z.infer<typeof eventFormSchema>;
