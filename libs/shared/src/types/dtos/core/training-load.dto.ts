import { z } from 'zod';

import { TRAINING_LOAD_CALCULATION_TYPE } from '../../misc';

// Training Load Entry
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

// Daily Training Load
export const dailyTrainingLoadSchema = z.object({
  date: z.coerce.date(),
  load: z.number(),
  activityCount: z.number(),
});

export type DailyTrainingLoad = z.infer<typeof dailyTrainingLoadSchema>;

// Training Load Metrics
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

// Training Load History
export const trainingLoadHistorySchema = z.object({
  date: z.coerce.date(),
  load: z.number(),
  atl: z.number(),
  ctl: z.number(),
  tsb: z.number(),
});

export type TrainingLoadHistory = z.infer<typeof trainingLoadHistorySchema>;

// Calculate Activity Load DTO
export const calculateActivityLoadDtoSchema = z.object({
  calculationType: z.nativeEnum(TRAINING_LOAD_CALCULATION_TYPE),
});

export type CalculateActivityLoadDto = z.infer<typeof calculateActivityLoadDtoSchema>;

// Recalculate All Loads DTO
export const recalculateAllLoadsDtoSchema = z.object({
  calculationType: z.nativeEnum(TRAINING_LOAD_CALCULATION_TYPE),
});

export type RecalculateAllLoadsDto = z.infer<typeof recalculateAllLoadsDtoSchema>;

// Recalculate All Loads Response
export const recalculateAllLoadsResponseSchema = z.object({
  processed: z.number(),
  errors: z.number(),
});

export type RecalculateAllLoadsResponse = z.infer<typeof recalculateAllLoadsResponseSchema>;
