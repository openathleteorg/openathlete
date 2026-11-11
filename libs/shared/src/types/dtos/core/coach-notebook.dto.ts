import { z } from 'zod';

export const COACH_NOTEBOOK_MAX = 100_000;

/** A coach's general notebook: one free text, for every athlete */
export const updateCoachNotebookDtoSchema = z.object({
  content: z.string().max(COACH_NOTEBOOK_MAX),
});

export const coachNotebookSchema = z.object({
  content: z.string(),
  /** Null until the first save */
  updatedAt: z.coerce.date().nullable(),
});

export type UpdateCoachNotebookDto = z.infer<
  typeof updateCoachNotebookDtoSchema
>;
export type CoachNotebook = z.infer<typeof coachNotebookSchema>;
