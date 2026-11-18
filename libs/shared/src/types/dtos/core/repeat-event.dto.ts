import { z } from 'zod';

/** How far ahead a session may repeat */
export const REPEAT_MAX_DAYS = 90;

/**
 * Repeats a planned session every `everyWeeks` weeks, on the same weekday and
 * at the same local time, until `until` (at most 90 days after it). Daily
 * questionnaires repeat every `everyDays` days instead.
 */
export const repeatEventDtoSchema = z
  .object({
    everyWeeks: z.number().int().min(1).max(4).optional(),
    everyDays: z.number().int().min(1).max(6).optional(),
    until: z.coerce.date(),
  })
  .refine(
    (dto) => (dto.everyWeeks === undefined) !== (dto.everyDays === undefined),
    {
      message: 'Repeat every few weeks or every few days',
      path: ['everyWeeks'],
    },
  );

export type RepeatEventDto = z.infer<typeof repeatEventDtoSchema>;
