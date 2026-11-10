import { z } from 'zod';

export const COACH_NOTE_TITLE_MAX = 120;
export const COACH_NOTE_CONTENT_MAX = 20_000;

export const createCoachNoteDtoSchema = z.object({
  title: z.string().trim().min(1).max(COACH_NOTE_TITLE_MAX),
  content: z.string().max(COACH_NOTE_CONTENT_MAX).default(''),
  /** The athlete the note is about; null or absent for a general note */
  athleteId: z.number().int().positive().nullable().optional(),
  pinned: z.boolean().default(false),
});

export const updateCoachNoteDtoSchema = createCoachNoteDtoSchema
  .omit({ athleteId: true })
  .partial()
  .extend({
    athleteId: z.number().int().positive().nullable().optional(),
  });

export const coachNoteSchema = z.object({
  coachNoteId: z.number(),
  title: z.string(),
  content: z.string(),
  pinned: z.boolean(),
  athleteId: z.number().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CreateCoachNoteDto = z.infer<typeof createCoachNoteDtoSchema>;
export type UpdateCoachNoteDto = z.infer<typeof updateCoachNoteDtoSchema>;
export type CoachNote = z.infer<typeof coachNoteSchema>;
