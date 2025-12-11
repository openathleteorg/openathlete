import z from 'zod';

export const progressionDataPointSchema = z.object({
  period: z.string(), // ISO date string for the start of the period (week start, month start, etc.)
  totalDistance: z.number(), // in meters
  averageDistancePerActivity: z.number(), // in meters
  averageSpeed: z.number(), // in m/s
  averageGapSpeed: z.number().nullable(), // in m/s
  efficiency: z.number().nullable(), // hr average / gap (if gap available)
  totalElevationGain: z.number(), // in meters
  averageElevationGainPerActivity: z.number(), // in meters
  averageHeartrate: z.number().nullable(), // in bpm
  averageCadence: z.number().nullable(), // in rpm
  activityCount: z.number(), // number of activities in this period
});

export const getProgressionDataResponseSchema = z.object({
  data: z.array(progressionDataPointSchema),
  aggregationType: z.enum(['week', 'month']), // how the data is aggregated
});

export type ProgressionDataPoint = z.infer<typeof progressionDataPointSchema>;
export type GetProgressionDataResponseDto = z.infer<
  typeof getProgressionDataResponseSchema
>;
