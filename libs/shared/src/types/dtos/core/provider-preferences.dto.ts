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

/**
 * A historical import limited to the last months, as the onboarding asks:
 * the whole history costs provider quota that is shared by every user.
 * Without it, the import goes as far back as the provider allows.
 */
export const importAllActivitiesDtoSchema = z
  .object({ months: z.number().int().min(1).max(24).optional() })
  .optional();
export type ImportAllActivitiesDto = z.infer<
  typeof importAllActivitiesDtoSchema
>;
