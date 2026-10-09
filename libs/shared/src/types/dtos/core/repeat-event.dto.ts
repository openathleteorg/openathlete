import { z } from 'zod';

/** How far ahead a session may repeat */
export const REPEAT_MAX_DAYS = 90;

/**
 * Repeats a planned session every `everyWeeks` weeks, on the same weekday and
 * at the same local time, until `until` (at most 90 days after it).
 */
export const repeatEventDtoSchema = z.object({
  everyWeeks: z.number().int().min(1).max(4),
  until: z.coerce.date(),
});

export type RepeatEventDto = z.infer<typeof repeatEventDtoSchema>;
