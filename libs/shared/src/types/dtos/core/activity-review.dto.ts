import { z } from 'zod';

import { SPORT_TYPE } from '../../misc';

export const activityReviewSummarySchema = z.object({
  name: z.string().min(1).max(500),
  sport: z.nativeEnum(SPORT_TYPE),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  distance: z.number().finite().nonnegative(),
});
export type ActivityReviewSummary = z.infer<typeof activityReviewSummarySchema>;

export const activityReviewIdSchema = z
  .string()
  .regex(/^(garmin-personal|source):[1-9]\d{0,9}$/)
  .refine((value) => Number(value.split(':')[1]) <= 2147483647);
export const activityReviewQuerySchema = z
  .object({
    cursor: z.union([z.literal('source'), activityReviewIdSchema]).optional(),
  })
  .strict();
export const resolveActivityReviewSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('link'),
      revision: z.number().int().positive(),
      eventActivityId: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      action: z.literal('import'),
      revision: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      action: z.literal('ignore'),
      revision: z.number().int().positive(),
    })
    .strict(),
]);
export type ResolveActivityReview = z.infer<typeof resolveActivityReviewSchema>;
export interface ActivityReviewItem {
  id: string;
  revision: number;
  provider: string;
  externalId: string;
  summary: ActivityReviewSummary | null;
  candidates: (ActivityReviewSummary & {
    eventActivityId: number;
    eventId: number;
    provider: string | null;
  })[];
  canImport: boolean;
  canLoadDetails: boolean;
}
export interface ActivityReviewPage {
  total: number;
  counts: Record<string, number>;
  items: ActivityReviewItem[];
  nextCursor: string | null;
}
