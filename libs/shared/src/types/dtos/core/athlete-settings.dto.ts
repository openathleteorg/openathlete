import { z } from 'zod';

import { METRIC_TYPE } from '../../misc';

export const updateAthleteSettingsDtoSchema = z.object({
  requireRpe: z.boolean().optional(),
  requireComment: z.boolean().optional(),
  requireFeedbackQuestions: z.boolean().optional(),
  pinnedMetrics: z
    .array(z.nativeEnum(METRIC_TYPE))
    .max(Object.values(METRIC_TYPE).length)
    .optional(),
});

export type UpdateAthleteSettingsDto = z.infer<
  typeof updateAthleteSettingsDtoSchema
>;
