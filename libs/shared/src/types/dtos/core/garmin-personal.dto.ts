import { z } from 'zod';

import {
  ActivityReviewSummary,
  activityReviewSummarySchema,
} from './activity-review.dto';

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
export interface GarminPersonalResult {
  imported: number;
  matched: number;
  needsReview: number;
  failed: number;
  pending: number;
  truncated: boolean;
}
export interface GarminPersonalStatus {
  connected: boolean;
  preferences: GarminPersonalPreferences;
  status:
    | 'disconnected'
    | 'idle'
    | 'queued'
    | 'running'
    | 'completed'
    | 'partial'
    | 'failed'
    | 'key_required';
  error: string | null;
  lastSyncedAt: string | null;
  result: GarminPersonalResult | null;
}

export const garminPersonalReviewSummarySchema = activityReviewSummarySchema;
export type GarminPersonalReviewSummary = ActivityReviewSummary;
export const garminPersonalReviewQuerySchema = z
  .object({ cursor: z.coerce.number().int().positive().optional() })
  .strict();
export const resolveGarminPersonalReviewSchema = z.discriminatedUnion(
  'action',
  [
    z
      .object({
        action: z.literal('link'),
        eventActivityId: z.number().int().positive(),
      })
      .strict(),
    z.object({ action: z.literal('import') }).strict(),
    z.object({ action: z.literal('ignore') }).strict(),
  ],
);
export type ResolveGarminPersonalReview = z.infer<
  typeof resolveGarminPersonalReviewSchema
>;
export interface GarminPersonalReviewItem {
  id: number;
  externalId: string;
  summary: GarminPersonalReviewSummary | null;
  candidates: (GarminPersonalReviewSummary & {
    eventActivityId: number;
    eventId: number;
    provider: string | null;
  })[];
}
export interface GarminPersonalReviewPage {
  total: number;
  items: GarminPersonalReviewItem[];
  nextCursor: number | null;
}
