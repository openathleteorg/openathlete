import { z } from 'zod';

import { emailLanguageSchema } from '../../../email/email';

export const providerPreferencesSchema = z
  .object({
    importActivitiesEnabled: z.boolean().optional(),
    exportWorkoutsEnabled: z.boolean().optional(),
    importMetricsEnabled: z.boolean().optional(),
    activityDescriptionEnabled: z.boolean().optional(),
    /** null: the user's language */
    activityDescriptionLanguage: emailLanguageSchema.nullable().optional(),
  })
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: 'At least one preference must be provided',
    path: [],
  });

export type ProviderPreferencesDto = z.infer<typeof providerPreferencesSchema>;
