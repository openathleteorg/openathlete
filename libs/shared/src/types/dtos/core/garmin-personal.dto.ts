import { z } from 'zod';

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  });
export const garminPersonalPreferencesSchema = z
  .object({
    activities: z.boolean(),
    automatic: z.boolean(),
  })
  .strict();
export const connectGarminPersonalSchema = garminPersonalPreferencesSchema
  .extend({
    apiKey: z
      .string()
      .trim()
      .min(8)
      .max(4096)
      .regex(/^[^\s\r\n]+$/),
  })
  .strict();
export const garminPersonalSyncSchema = z
  .object({
    startDate: date,
    endDate: date,
  })
  .strict()
  .refine(
    ({ startDate, endDate }) => {
      const days = (Date.parse(endDate) - Date.parse(startDate)) / 86400000;
      return (
        days >= 0 &&
        days < 28 &&
        endDate <= new Date().toISOString().slice(0, 10)
      );
    },
    { message: 'Choose up to 28 calendar days ending today or earlier' },
  );
export type GarminPersonalPreferences = z.infer<
  typeof garminPersonalPreferencesSchema
>;
export type ConnectGarminPersonal = z.infer<typeof connectGarminPersonalSchema>;
export type GarminPersonalSync = z.infer<typeof garminPersonalSyncSchema>;
export const garminPersonalResultSchema = z
  .object({
    imported: z.number().int().nonnegative(),
    matched: z.number().int().nonnegative(),
    // Older persisted results predate terminal unsupported-file receipts.
    skipped: z.number().int().nonnegative().default(0),
    needsReview: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
    truncated: z.boolean(),
  })
  .strict();
export const garminPersonalStatusSchema = z
  .object({
    connected: z.boolean(),
    preferences: garminPersonalPreferencesSchema,
    status: z.enum([
      'disconnected',
      'idle',
      'queued',
      'running',
      'completed',
      'partial',
      'failed',
      'key_required',
    ]),
    error: z.string().nullable(),
    lastSyncedAt: z.string().datetime().nullable(),
    result: garminPersonalResultSchema.nullable(),
  })
  .strict();
export type GarminPersonalResult = z.infer<typeof garminPersonalResultSchema>;
export type GarminPersonalStatus = z.infer<typeof garminPersonalStatusSchema>;
