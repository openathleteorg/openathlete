import { m } from '@/paraglide/messages';
import { z } from 'zod';

import {
  COMPETITION_PRIORITY,
  EVENT_TYPE,
  SPORT_TYPE,
} from '@openathlete/shared';

// Base schema for all event types
export const baseEventFormSchema = z.object({
  startDate: z
    .union([z.date(), z.string()])
    .transform((val) => (val instanceof Date ? val : new Date(val)))
    .pipe(
      z.date({
        required_error: m.required(),
      }),
    )
    .optional(),
  endDate: z
    .union([z.date(), z.string()])
    .transform((val) => (val instanceof Date ? val : new Date(val)))
    .pipe(
      z.date({
        required_error: m.required(),
      }),
    )
    .optional(),
  name: z.string().min(1, m.required()).max(100),
  description: z.string().optional(),
  saveAsTemplate: z.boolean().optional(),
  // Only to repeat a new session; not sent with the event
  repeatEveryWeeks: z.string().optional(),
  repeatUntil: z.string().optional(),
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
  priority: z.nativeEnum(COMPETITION_PRIORITY).optional().nullable(),
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
  /** An equipment id, or 'none' */
  equipment: z.string().optional(),
  isRace: z.boolean().optional(),
});

// Discriminated union for all event types
export const eventFormSchema = z.discriminatedUnion('type', [
  trainingEventFormSchema,
  competitionEventFormSchema,
  noteEventFormSchema,
  activityEventFormSchema,
]);

export type EventFormValues = z.infer<typeof eventFormSchema>;

/** The equipment select's value for an activity without equipment */
export const NO_EQUIPMENT = 'none';

/**
 * The select holds strings: turns the activity's equipment into the id the
 * API expects, null to detach it. Leaves other events untouched.
 */
export function withEquipmentId<T extends object>(
  values: T,
): Omit<T, 'equipment'> & { equipmentId?: number | null } {
  if (!('equipment' in values) || values.equipment === undefined) {
    return values;
  }
  const { equipment, ...rest } = values as T & { equipment: string };
  return {
    ...rest,
    equipmentId: equipment === NO_EQUIPMENT ? null : Number(equipment),
  };
}
