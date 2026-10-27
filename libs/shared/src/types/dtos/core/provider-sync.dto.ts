import { z } from 'zod';

/** Older servers can acknowledge the request without supporting progress. */
export const providerSyncResponseSchema = z.object({
  success: z.literal(true),
  queued: z.literal(true),
  syncId: z.string().optional(),
});

export const providerSyncStatusSchema = z.object({
  state: z.enum(['queued', 'running', 'completed', 'failed', 'unavailable']),
  total: z.number().int().nonnegative(),
  imported: z.number().int().nonnegative(),
  needsReview: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  retrying: z.boolean(),
});

export type ProviderSyncResponse = z.infer<typeof providerSyncResponseSchema>;
export type ProviderSyncStatus = z.infer<typeof providerSyncStatusSchema>;
