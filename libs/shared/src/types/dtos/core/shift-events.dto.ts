import { z } from 'zod';

/** Most sessions one request may copy or move: a few weeks of training */
export const SHIFT_EVENTS_MAX = 200;

/**
 * Planned sessions, races and notes to copy or move by whole days, as the
 * week actions of the calendar do. Activities never move.
 */
export const shiftEventsDtoSchema = z.object({
  eventIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(SHIFT_EVENTS_MAX)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'eventIds must not repeat',
    }),
  /** Calendar days, in the athlete's time zone: 7 is the next week */
  offsetDays: z.number().int().min(-366).max(366),
});

export type ShiftEventsDto = z.infer<typeof shiftEventsDtoSchema>;
