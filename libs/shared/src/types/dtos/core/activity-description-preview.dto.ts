import { z } from 'zod';

import { emailLanguageSchema } from '../../../email/email';

export const activityDescriptionPreviewQuerySchema = z.object({
  /** Absent: the language chosen for the descriptions, or the user's */
  language: emailLanguageSchema.optional(),
});

export type ActivityDescriptionPreviewQueryDto = z.infer<
  typeof activityDescriptionPreviewQuerySchema
>;

export type ActivityDescriptionPreviewResponseDto = {
  /** null: no recent activity gives enough to say */
  description: string | null;
};
