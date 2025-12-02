import { z } from 'zod';

export const updateAthleteSettingsDtoSchema = z.object({
  requireRpe: z.boolean().optional(),
  requireComment: z.boolean().optional(),
  requireFeedbackQuestions: z.boolean().optional(),
});

export type UpdateAthleteSettingsDto = z.infer<
  typeof updateAthleteSettingsDtoSchema
>;
