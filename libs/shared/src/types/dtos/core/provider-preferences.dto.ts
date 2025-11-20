import { z } from 'zod';

export const providerPreferencesSchema = z
  .object({
    importActivitiesEnabled: z.boolean().optional(),
    exportWorkoutsEnabled: z.boolean().optional(),
    importMetricsEnabled: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.importActivitiesEnabled !== undefined ||
      value.exportWorkoutsEnabled !== undefined ||
      value.importMetricsEnabled !== undefined,
    {
      message: 'At least one preference must be provided',
      path: [],
    },
  );

export type ProviderPreferencesDto = z.infer<typeof providerPreferencesSchema>;
