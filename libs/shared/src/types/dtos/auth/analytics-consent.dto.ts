import { z } from 'zod';

export const analyticsConsentDtoSchema = z.object({
  granted: z.boolean(),
});

export type AnalyticsConsentDto = z.infer<typeof analyticsConsentDtoSchema>;
