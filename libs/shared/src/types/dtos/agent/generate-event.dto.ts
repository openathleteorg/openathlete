import { z } from 'zod';

import { isTimeZone } from '../../../utils/date';
import { createEventDtoSchema } from '../core/create-event.dto';

/** A calendar day, never an instant: `new Date('2026-11-26')` is UTC midnight. */
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'A date as YYYY-MM-DD')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().startsWith(value)
    );
  }, 'A real calendar date');

export const generateEventDtoSchema = z.object({
  prompt: z.string().min(1).max(500),
  /**
   * New clients send the local day. Older ones sent their local midnight as
   * a UTC instant, which the API reads back in `timeZone`.
   */
  date: z
    .union([calendarDate, z.string().datetime({ offset: true })])
    .describe('Calendar day (YYYY-MM-DD) of the event'),
  /** The browser's time zone, so the session lands on that same local day */
  timeZone: z
    .string()
    .refine(isTimeZone, 'Unknown time zone')
    .optional()
    .describe("The browser's IANA time zone, e.g. Europe/Paris"),
  athleteId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("The session's athlete; default: the user's own athlete"),
});

export type GenerateEventDto = z.infer<typeof generateEventDtoSchema>;

export const generateEventResponseDtoSchema = createEventDtoSchema;

export type GenerateEventResponseDto = z.infer<
  typeof generateEventResponseDtoSchema
>;
