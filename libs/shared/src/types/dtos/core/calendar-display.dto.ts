import { z } from 'zod';

/**
 * What the calendar shows, chosen by each user and kept with their account
 * so it follows them across devices. Every field has a default: a stored
 * preference from an older version, or none, still reads as a full one.
 */
export const calendarDisplaySchema = z.object({
  /** Compact cards fit more sessions per day; comfortable ones show more */
  density: z.enum(['compact', 'comfortable']).catch('comfortable'),
  card: z
    .object({
      profile: z.boolean().catch(true),
      duration: z.boolean().catch(true),
      distance: z.boolean().catch(true),
      elevation: z.boolean().catch(false),
      load: z.boolean().catch(false),
    })
    .catch({
      profile: true,
      duration: true,
      distance: true,
      elevation: false,
      load: false,
    }),
  summary: z
    .object({
      duration: z.boolean().catch(true),
      distance: z.boolean().catch(true),
      elevation: z.boolean().catch(true),
      load: z.boolean().catch(true),
      form: z.boolean().catch(true),
    })
    .catch({
      duration: true,
      distance: true,
      elevation: true,
      load: true,
      form: true,
    }),
  /** Sleep, HRV, resting HR and daily form under each day, when recorded */
  wellness: z.boolean().catch(true),
});

export type CalendarDisplay = z.infer<typeof calendarDisplaySchema>;

export const DEFAULT_CALENDAR_DISPLAY: CalendarDisplay =
  calendarDisplaySchema.parse({});

/** The stored preference, whatever it holds, as a full one */
export function readCalendarDisplay(value: unknown): CalendarDisplay {
  const parsed = calendarDisplaySchema.safeParse(
    value && typeof value === 'object' ? value : {},
  );
  return parsed.success ? parsed.data : DEFAULT_CALENDAR_DISPLAY;
}
