import z from 'zod';

import { RECORD_TYPE } from '../../misc/core/record-type.enum';
import { SPORT_TYPE } from '../../misc/core/sport-type.enum';

/** Best record at one distance or duration, with the activity it comes from. */
export const bestRecordSchema = z.object({
  recordId: z.number(),
  type: z.nativeEnum(RECORD_TYPE),
  /** Metres covered: pace and climbing records */
  distance: z.number().nullable(),
  /** Seconds covered: power and heart rate records */
  duration: z.number().nullable(),
  /** Seconds for pace, metres for climbing, watts or bpm otherwise */
  value: z.number(),
  date: z.coerce.date(),
  eventId: z.number().nullable(),
  activityName: z.string().nullable(),
});

export type BestRecordDto = z.infer<typeof bestRecordSchema>;

export const getRecordsQuerySchema = z.object({
  sport: z.nativeEnum(SPORT_TYPE).optional(),
  athleteId: z.coerce.number().int().positive().optional(),
  /** Records set from this date on */
  from: z.coerce.date().optional(),
  /** Records set before this date */
  to: z.coerce.date().optional(),
});

export type GetRecordsQueryDto = z.infer<typeof getRecordsQuerySchema>;

/** A record with the year it was set in, for a table across the years. */
export const yearBestRecordSchema = bestRecordSchema.extend({
  year: z.number(),
});

export type YearBestRecordDto = z.infer<typeof yearBestRecordSchema>;

/** One activity's effort at a distance or duration. */
export const recordEffortSchema = bestRecordSchema.extend({
  eventActivityId: z.number(),
  /** Set when an exclusion hides this effort from the records */
  exclusionId: z.number().nullable(),
});

export type RecordEffortDto = z.infer<typeof recordEffortSchema>;

/** Everything the records page reads for one sport, without the exclusions. */
export const recordHistorySchema = z.object({
  /** The best at each distance or duration, each year */
  years: z.array(yearBestRecordSchema),
  /** The two best activities at each distance or duration, best first */
  podium: z.array(recordEffortSchema),
});

export type RecordHistoryDto = z.infer<typeof recordHistorySchema>;

export const getRecordHistoryQuerySchema = z.object({
  sport: z.nativeEnum(SPORT_TYPE),
  athleteId: z.coerce.number().int().positive().optional(),
});

export type GetRecordHistoryQueryDto = z.infer<
  typeof getRecordHistoryQuerySchema
>;

export const getRecordEffortsQuerySchema = getRecordHistoryQuerySchema
  .extend({
    type: z.nativeEnum(RECORD_TYPE),
    distance: z.coerce.number().positive().optional(),
    duration: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (query) =>
      (query.distance === undefined) !== (query.duration === undefined),
    {
      message: 'Pass a distance or a duration',
    },
  );

export type GetRecordEffortsQueryDto = z.infer<
  typeof getRecordEffortsQuerySchema
>;

export const createRecordExclusionSchema = z
  .object({
    eventActivityId: z.number().int().positive(),
    /** Without a type, the exclusion covers the whole activity */
    type: z.nativeEnum(RECORD_TYPE).optional(),
    distance: z.number().positive().optional(),
    duration: z.number().int().positive().optional(),
  })
  .refine(
    ({ type, distance, duration }) =>
      (type !== undefined ||
        (distance === undefined && duration === undefined)) &&
      (distance === undefined || duration === undefined),
    { message: 'A distance or a duration needs a type, and only one of them' },
  );

export type CreateRecordExclusionDto = z.infer<
  typeof createRecordExclusionSchema
>;

export const recordExclusionSchema = z.object({
  recordExclusionId: z.number(),
  eventActivityId: z.number(),
  eventId: z.number(),
  activityName: z.string().nullable(),
  date: z.coerce.date(),
  type: z.nativeEnum(RECORD_TYPE).nullable(),
  distance: z.number().nullable(),
  duration: z.number().nullable(),
});

export type RecordExclusionDto = z.infer<typeof recordExclusionSchema>;

/** An FTP modelled from the best power of recent activities. */
export const modeledFtpSchema = z.object({
  /** Watts */
  value: z.number(),
  /** Seconds of the best effort the value comes from: 1200 or 3600 */
  duration: z.number(),
  /** Watts held over that duration */
  power: z.number(),
  /** Share of that power taken as FTP: 0.95 for 20 minutes, 1 for an hour */
  factor: z.number(),
  date: z.coerce.date(),
  eventId: z.number().nullable(),
  activityName: z.string().nullable(),
});

export type ModeledFtpDto = z.infer<typeof modeledFtpSchema>;

/** Metrics modelled from the activities of the last days, not entered. */
export const modeledMetricsSchema = z.object({
  /** First day of the activities the model reads */
  from: z.coerce.date(),
  days: z.number(),
  ftpRunning: modeledFtpSchema.nullable(),
  ftpCycling: modeledFtpSchema.nullable(),
});

export type ModeledMetricsDto = z.infer<typeof modeledMetricsSchema>;

/**
 * Running power per unit of speed on flat runs: watts per m/s, which is
 * joules per metre. FTP divided by it gives the threshold speed.
 */
export const runningEconomySchema = z.object({
  /** Joules per metre, the median of the runs */
  value: z.number(),
  /** Flat runs it was read from */
  activities: z.number(),
  from: z.coerce.date(),
  days: z.number(),
});

export type RunningEconomyDto = z.infer<typeof runningEconomySchema>;
