import { z } from 'zod';

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** How far ahead occurrences reach athletes' calendars */
export const CLUB_SESSION_HORIZON_DAYS = 28;

export const createClubSessionDtoSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    location: z.string().trim().max(120).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    /** A template of the club's library: the session's structured content */
    templateId: z.number().int().positive().nullable().optional(),
    /** Its athletes only; absent for all the club's athletes */
    groupId: z.number().int().positive().nullable().optional(),
    firstDate: dateKey,
    startTime: timeOfDay,
    durationMinutes: z
      .number()
      .int()
      .min(5)
      .max(24 * 60),
    weekly: z.boolean().default(false),
    untilDate: dateKey.nullable().optional(),
    /** The club's time zone: the time is the same for every athlete */
    timeZone: z.string().min(1).max(64),
  })
  .refine((dto) => !dto.untilDate || dto.untilDate >= dto.firstDate, {
    message: 'The last day comes after the first',
  });
export type CreateClubSessionDto = z.infer<typeof createClubSessionDtoSchema>;

export const clubSessionOccurrenceSchema = z.object({
  date: z.string(),
  /** Athletes it was sent to */
  invited: z.number(),
  going: z.number(),
  notGoing: z.number(),
});

export const clubSessionSchema = z.object({
  clubSessionId: z.number(),
  title: z.string(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  templateId: z.number().nullable(),
  templateName: z.string().nullable(),
  groupId: z.number().nullable(),
  groupName: z.string().nullable(),
  firstDate: z.string(),
  startTime: z.string(),
  durationMinutes: z.number(),
  weekly: z.boolean(),
  untilDate: z.string().nullable(),
  timeZone: z.string(),
  /** The next occurrences, within the horizon, not called off */
  upcoming: z.array(clubSessionOccurrenceSchema),
});
export type ClubSessionDto = z.infer<typeof clubSessionSchema>;

export const clubSessionParamsSchema = z.object({
  clubId: z.coerce.number().int().positive(),
  clubSessionId: z.coerce.number().int().positive(),
});
export type ClubSessionParamsDto = z.infer<typeof clubSessionParamsSchema>;

export const cancelClubSessionDtoSchema = z.object({ date: dateKey });
export type CancelClubSessionDto = z.infer<typeof cancelClubSessionDtoSchema>;

/** An athlete's answer for one occurrence: the event in their calendar */
export const clubSessionAnswerDtoSchema = z.object({
  eventId: z.number().int().positive(),
  going: z.boolean(),
});
export type ClubSessionAnswerDto = z.infer<typeof clubSessionAnswerDtoSchema>;

/** What an athlete sees of the club session behind one of their events */
export const clubSessionForEventSchema = z.object({
  clubSessionId: z.number(),
  clubName: z.string(),
  title: z.string(),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  date: z.string(),
  /** The athlete's own answer; null before they answer */
  going: z.boolean().nullable(),
});
export type ClubSessionForEventDto = z.infer<typeof clubSessionForEventSchema>;
