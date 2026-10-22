import { z } from 'zod';

import { METRIC_TYPE } from '../../misc';

const date = z.string().date();
const common = {
  date,
  sampleCount: z.number().int().positive().max(100000).optional(),
};

/** Daily summaries, not individual HealthKit samples. Units are explicit. */
export const importedHealthMetricSchema = z.discriminatedUnion('type', [
  z
    .object({
      ...common,
      type: z.literal(METRIC_TYPE.WEIGHT),
      unit: z.literal('kg'),
      value: z.number().finite().positive(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal(METRIC_TYPE.BODY_FAT),
      unit: z.literal('%'),
      value: z.number().finite().min(0).max(100),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal(METRIC_TYPE.HRV_SDNN),
      unit: z.literal('ms'),
      value: z.number().finite().positive(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal(METRIC_TYPE.HR_REST),
      unit: z.literal('bpm'),
      value: z.number().finite().positive(),
    })
    .strict(),
  z
    .object({
      ...common,
      type: z.literal(METRIC_TYPE.SLEEP_DURATION),
      unit: z.literal('h'),
      // A local day can have 25 hours when daylight saving time ends.
      value: z.number().finite().min(0).max(25),
    })
    .strict(),
]);

export const importHealthMetricsDtoSchema = z
  .object({
    source: z.literal('APPLE_HEALTH'),
    timeZone: z
      .string()
      .min(1)
      .max(100)
      .refine((value) => {
        try {
          if (/^[+-]/.test(value)) return false;
          return Boolean(
            new Intl.DateTimeFormat('en', { timeZone: value }).resolvedOptions()
              .timeZone,
          );
        } catch {
          return false;
        }
      }, 'Expected an IANA time zone'),
    metrics: z.array(importedHealthMetricSchema).min(1).max(500),
  })
  .strict()
  .superRefine(({ metrics }, ctx) => {
    const keys = new Set<string>();
    metrics.forEach((metric, index) => {
      const key = `${metric.type}:${metric.date}`;
      if (keys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Only one summary per metric type and date is allowed',
          path: ['metrics', index],
        });
      }
      keys.add(key);
    });
  });

export type ImportHealthMetricsDto = z.infer<
  typeof importHealthMetricsDtoSchema
>;

export type ImportHealthMetricsResponseDto = {
  imported: number;
  skipped: number;
};
