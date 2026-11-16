import { z } from 'zod';

/** Thresholds are set athlete by athlete, or on a whole group at once */
export const THRESHOLD_MAX_ATHLETES = 200;

export const metricThresholdSchema = z.object({
  metricThresholdId: z.number(),
  athleteId: z.number(),
  metricType: z.string(),
  min: z.number().nullable(),
  max: z.number().nullable(),
});
export type MetricThresholdDto = z.infer<typeof metricThresholdSchema>;

export const setMetricThresholdsDtoSchema = z
  .object({
    athleteIds: z
      .array(z.number().int().positive())
      .min(1)
      .max(THRESHOLD_MAX_ATHLETES),
    metricType: z.string().min(1).max(64),
    /** Below this, the coach hears of it */
    min: z.number().finite().nullable().optional(),
    /** Above this, the coach hears of it */
    max: z.number().finite().nullable().optional(),
  })
  .refine((dto) => dto.min != null || dto.max != null, {
    message: 'Set a minimum, a maximum, or both',
  })
  .refine((dto) => dto.min == null || dto.max == null || dto.min < dto.max, {
    message: 'The minimum must be below the maximum',
  });
export type SetMetricThresholdsDto = z.infer<
  typeof setMetricThresholdsDtoSchema
>;

export const metricThresholdsQuerySchema = z.object({
  athleteId: z.coerce.number().int().positive().optional(),
});
export type MetricThresholdsQueryDto = z.infer<
  typeof metricThresholdsQuerySchema
>;

export const metricThresholdParamsSchema = z.object({
  metricThresholdId: z.coerce.number().int().positive(),
});
export type MetricThresholdParamsDto = z.infer<
  typeof metricThresholdParamsSchema
>;

/** Whether a value is past the bounds a coach set */
export const isOutsideThreshold = (
  value: number,
  bounds: { min: number | null; max: number | null },
) =>
  (bounds.min !== null && value < bounds.min) ||
  (bounds.max !== null && value > bounds.max);
