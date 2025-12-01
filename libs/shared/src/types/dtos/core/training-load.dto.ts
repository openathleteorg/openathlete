import { z } from 'zod';

import { TRAINING_LOAD_CALCULATION_TYPE } from '../../misc';

export const trainingLoadEntrySchema = z.object({
  trainingLoadEntryId: z.number(),
  calculationId: z.number(),
  activityId: z.number(),
  date: z.coerce.date(),
  value: z.number(),
  metadata: z.object({
    calculationType: z.nativeEnum(TRAINING_LOAD_CALCULATION_TYPE),
    rpe: z.number().optional(),
    duration: z.number().optional(),
    avgHr: z.number().optional(),
    hrMax: z.number().optional(),
    hrRest: z.number().optional(),
    hrReserve: z.number().optional(),
    zones: z
      .array(
        z.object({
          zone: z.number(),
          duration: z.number(),
          coefficient: z.number(),
        }),
      )
      .optional(),
  }),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TrainingLoadEntry = z.infer<typeof trainingLoadEntrySchema>;

export const dailyTrainingLoadSchema = z.object({
  date: z.coerce.date(),
  load: z.number(),
  activityCount: z.number(),
});

export type DailyTrainingLoad = z.infer<typeof dailyTrainingLoadSchema>;

export const trainingLoadMetricsSchema = z.object({
  atl: z.number(),
  ctl: z.number(),
  tsb: z.number(),
  totalLoad: z.number(),
  trainingDays: z.number(),
  recommendedLoadRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  status: z.enum(['overreaching', 'optimal', 'detraining']),
});

export type TrainingLoadMetrics = z.infer<typeof trainingLoadMetricsSchema>;

export const trainingLoadHistorySchema = z.object({
  date: z.coerce.date(),
  load: z.number(),
  atl: z.number(),
  ctl: z.number(),
  tsb: z.number(),
});

export type TrainingLoadHistory = z.infer<typeof trainingLoadHistorySchema>;

export const calculateActivityLoadDtoSchema = z.object({
  calculationType: z.nativeEnum(TRAINING_LOAD_CALCULATION_TYPE),
});

export type CalculateActivityLoadDto = z.infer<
  typeof calculateActivityLoadDtoSchema
>;

export const recalculateAllLoadsDtoSchema = z.object({
  calculationType: z.nativeEnum(TRAINING_LOAD_CALCULATION_TYPE),
});

export type RecalculateAllLoadsDto = z.infer<
  typeof recalculateAllLoadsDtoSchema
>;

export const recalculateAllLoadsResponseSchema = z.object({
  processed: z.number(),
  errors: z.number(),
});

export type RecalculateAllLoadsResponse = z.infer<
  typeof recalculateAllLoadsResponseSchema
>;

export const calendarWeekLoadSummarySchema = z.object({
  weekStart: z.coerce.date(),
  weekEnd: z.coerce.date(),
  actualLoad: z.number(),
  estimatedLoad: z.number(),
  totalLoad: z.number(),
  recommendedMin: z.number(),
  recommendedMax: z.number(),
  acwr: z.number().optional(),
  acwrStatus: z
    .enum(['safe', 'optimal', 'moderate_risk', 'high_risk'])
    .optional(),
  acwrAdjusted: z.boolean().optional(),
});

export type CalendarWeekLoadSummary = z.infer<
  typeof calendarWeekLoadSummarySchema
>;
