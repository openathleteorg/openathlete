import z from 'zod';

import { SPORT_TYPE } from '../../misc';

export type StatisticsGranularity = 'day' | 'week' | 'month';

/** Days a chart keeps one bar a day, then one a week */
const DAILY_MAX_DAYS = 31;
const WEEKLY_MAX_DAYS = 200;

/** Size of a chart's buckets for a period: enough to read, never too many */
export function statisticsGranularity(
  from: Date,
  to: Date,
): StatisticsGranularity {
  const days = (to.getTime() - from.getTime()) / (24 * 3600 * 1000);
  if (days <= DAILY_MAX_DAYS) return 'day';
  return days <= WEEKLY_MAX_DAYS ? 'week' : 'month';
}

/** Sports read together when an athlete practises several forms of one */
export const SPORT_GROUPS = {
  RUNNING: [SPORT_TYPE.RUNNING, SPORT_TYPE.TRAIL_RUNNING],
  CYCLING: [
    SPORT_TYPE.CYCLING,
    SPORT_TYPE.GRAVEL_RIDE,
    SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
  ],
  SKIING: [
    SPORT_TYPE.NORDIC_SKI,
    SPORT_TYPE.BACKCOUNTRY_SKI,
    SPORT_TYPE.ROLLER_SKI,
  ],
} as const satisfies Record<string, readonly SPORT_TYPE[]>;
export type SportGroup = keyof typeof SPORT_GROUPS;
const sportGroupSchema = z.enum(['RUNNING', 'CYCLING', 'SKIING']);

/** Efficiency figures are a runner's: grade-adjusted pace, running power */
export const RUN_EFFICIENCY_SPORTS: readonly SPORT_TYPE[] = [
  SPORT_TYPE.RUNNING,
  SPORT_TYPE.TRAIL_RUNNING,
  SPORT_TYPE.VIRTUAL_RUN,
];

/**
 * The runs a sport filter leaves for the efficiency figures. They are grade
 * adjusted, so road and trail runs read on one scale: without a sport, all
 * the runs count, not only those of the most practised running sport.
 */
export function runEfficiencySports(
  sport?: SPORT_TYPE,
  group?: SportGroup,
): SPORT_TYPE[] {
  const chosen: readonly SPORT_TYPE[] | null = sport
    ? [sport]
    : group
      ? SPORT_GROUPS[group]
      : null;
  return RUN_EFFICIENCY_SPORTS.filter(
    (value) => !chosen || chosen.includes(value),
  );
}

const statisticsPeriodSchema = z.object({
  athleteId: z.coerce.number().int().positive(),
  from: z.coerce.date(),
  to: z.coerce.date(),
  sport: z.nativeEnum(SPORT_TYPE).optional(),
  group: sportGroupSchema.optional(),
});

const orderedPeriod = ({ from, to }: { from: Date; to: Date }) => from < to;
const orderedPeriodError = { message: 'from must be before to' };

export const getStatisticsSectionQuerySchema = statisticsPeriodSchema.refine(
  orderedPeriod,
  orderedPeriodError,
);
export type GetStatisticsSectionQueryDto = z.infer<
  typeof getStatisticsSectionQuerySchema
>;

export const getStatisticsOverviewQuerySchema = statisticsPeriodSchema
  .extend({
    /** The period to compare with */
    compareFrom: z.coerce.date().optional(),
    compareTo: z.coerce.date().optional(),
  })
  .refine(orderedPeriod, orderedPeriodError)
  .refine(({ compareFrom, compareTo }) => !compareFrom === !compareTo, {
    message: 'compareFrom and compareTo go together',
  });
export type GetStatisticsOverviewQueryDto = z.infer<
  typeof getStatisticsOverviewQuerySchema
>;

export const getStatisticsTrendsQuerySchema = statisticsPeriodSchema
  .required({ sport: true })
  .refine(orderedPeriod, orderedPeriodError);
export type GetStatisticsTrendsQueryDto = z.infer<
  typeof getStatisticsTrendsQuerySchema
>;

export const getStatisticsFiltersQuerySchema = z.object({
  athleteId: z.coerce.number().int().positive(),
});
export type GetStatisticsFiltersQueryDto = z.infer<
  typeof getStatisticsFiltersQuerySchema
>;

export const statisticsFiltersSchema = z.object({
  firstActivityDate: z.coerce.date().nullable(),
  /** Sports of the athlete, the most practised first */
  sports: z.array(z.nativeEnum(SPORT_TYPE)),
});
export type StatisticsFiltersDto = z.infer<typeof statisticsFiltersSchema>;

const statisticsTotalsSchema = z.object({
  /** Seconds in motion */
  movingTime: z.number(),
  /** Metres */
  distance: z.number(),
  /** Metres */
  elevationGain: z.number(),
  count: z.number(),
  /** TRIMP */
  load: z.number(),
});
export type StatisticsTotalsDto = z.infer<typeof statisticsTotalsSchema>;

export const statisticsOverviewSchema = z.object({
  totals: statisticsTotalsSchema,
  /** Totals of the compared period, null without one */
  compared: statisticsTotalsSchema.nullable(),
  sports: z.array(
    statisticsTotalsSchema.extend({ sport: z.nativeEnum(SPORT_TYPE) }),
  ),
});
export type StatisticsOverviewDto = z.infer<typeof statisticsOverviewSchema>;

const statisticsBucketSchema = z.object({
  /** First day of the bucket on the athlete's calendar (YYYY-MM-DD) */
  period: z.string(),
  /** Cut by the period or still running: not comparable with a full one */
  partial: z.boolean(),
});

export const statisticsVolumeSchema = z.object({
  granularity: z.enum(['day', 'week', 'month']),
  buckets: z.array(
    statisticsBucketSchema.extend({
      sports: z.array(
        statisticsTotalsSchema
          .omit({ load: true })
          .extend({ sport: z.nativeEnum(SPORT_TYPE) }),
      ),
    }),
  ),
});
export type StatisticsVolumeDto = z.infer<typeof statisticsVolumeSchema>;

export const statisticsTrendsSchema = z.object({
  granularity: z.enum(['day', 'week', 'month']),
  /**
   * Averages are over time in motion, so a long outing weighs more than a
   * short one. Null when no activity of the bucket has the figure.
   */
  buckets: z.array(
    statisticsBucketSchema.extend({
      count: z.number(),
      /** Metres per activity */
      distancePerActivity: z.number().nullable(),
      /** Metres per activity */
      elevationPerActivity: z.number().nullable(),
      /** m/s */
      averageSpeed: z.number().nullable(),
      /** m/s */
      averageGapSpeed: z.number().nullable(),
      averageHeartrate: z.number().nullable(),
      averageCadence: z.number().nullable(),
      averageWatts: z.number().nullable(),
      /** Power weighted towards hard efforts, as the device gave it */
      weightedWatts: z.number().nullable(),
      /** Metres climbed per hour in motion */
      verticalSpeed: z.number().nullable(),
    }),
  ),
});
export type StatisticsTrendsDto = z.infer<typeof statisticsTrendsSchema>;

export const statisticsDaysSchema = z.object({
  /** Days with an activity, on the athlete's calendar, oldest first */
  days: z.array(
    statisticsTotalsSchema.omit({ load: true }).extend({
      /** YYYY-MM-DD */
      date: z.string(),
    }),
  ),
});
export type StatisticsDaysDto = z.infer<typeof statisticsDaysSchema>;

export const statisticsIntensitySchema = z.object({
  granularity: z.enum(['day', 'week', 'month']),
  /** Still the zones every athlete starts with, not their own */
  defaultZones: z.boolean(),
  buckets: z.array(
    statisticsBucketSchema.extend({
      /** Seconds below, between and above the two thresholds */
      low: z.number(),
      middle: z.number(),
      high: z.number(),
      /** Steady outings only: long, and mostly below the first threshold */
      steadyCount: z.number(),
      /** Metres or watts per heartbeat, null without a steady outing */
      efficiency: z.number().nullable(),
      /** Percent, null without a steady outing */
      decoupling: z.number().nullable(),
    }),
  ),
});
export type StatisticsIntensityDto = z.infer<typeof statisticsIntensitySchema>;

export const statisticsLongRunsSchema = z.object({
  /** Runs well beyond the longest of the 30 days before them, latest first */
  runs: z.array(
    z.object({
      eventId: z.number(),
      name: z.string(),
      /** YYYY-MM-DD */
      date: z.string(),
      /** Metres */
      distance: z.number(),
      /** Metres: the longest run of the 30 days before */
      longest: z.number(),
    }),
  ),
});
export type StatisticsLongRunsDto = z.infer<typeof statisticsLongRunsSchema>;

const quantilesSchema = z.object({
  /** Middle half of the activities, and their median */
  low: z.number(),
  median: z.number(),
  high: z.number(),
  /** Activities behind the figure */
  count: z.number(),
});

const profileBinSchema = quantilesSchema.extend({
  /** Percent of slope, km/h or watts */
  bin: z.number(),
});

export const statisticsTerrainSchema = z.object({
  bins: z.array(profileBinSchema),
  /** Metres climbed and descended by class of slope */
  classes: z.array(
    z.object({
      /** Lower bound of the class, in percent */
      from: z.number(),
      climbed: z.number(),
      descended: z.number(),
    }),
  ),
});
export type StatisticsTerrainDto = z.infer<typeof statisticsTerrainSchema>;

export const statisticsCardiacCostSchema = z.object({
  /** The output heart rate is read against */
  unit: z.enum(['speed', 'power']),
  bins: z.array(profileBinSchema),
});
export type StatisticsCardiacCostDto = z.infer<
  typeof statisticsCardiacCostSchema
>;

/** The efficiency of each run of the period, oldest first */
export const statisticsEfficiencySchema = z.object({
  runs: z.array(
    z.object({
      eventId: z.number(),
      name: z.string(),
      date: z.coerce.date(),
      /**
       * Steady and aerobic (40 minutes or more, 80 % of the time below the
       * first threshold): the runs efficiency is compared on
       */
      steady: z.boolean(),
      /** Efficiency factor: grade-adjusted metres a minute per beat a minute */
      factor: z.number().nullable(),
      /** Efficiency factor of power: watts per beat a minute */
      powerFactor: z.number().nullable(),
      /** Running effectiveness: m/s per W/kg on the flat, in kg/N */
      effectiveness: z.number().nullable(),
      /** Efficiency lost from the first half to the second, in percent */
      decoupling: z.number().nullable(),
    }),
  ),
  /** False when no weight is known: running effectiveness needs it */
  hasWeight: z.boolean(),
});
export type StatisticsEfficiencyDto = z.infer<
  typeof statisticsEfficiencySchema
>;

/**
 * The one figure of the Lab a non-Supporter sees: the capacity of the
 * profile that progressed the most over the last twelve months against the
 * twelve before, real and computed for the athlete. Null without progress.
 */
export const labTeaserSchema = z
  .object({
    axis: z.enum(['climb', 'descent', 'critical', 'cost']),
    /** m/h (climb, descent), m/s or W (critical), bpm (cost) */
    value: z.number(),
    /** Progress in percent, positive: better */
    change: z.number(),
    /** What critical output or cardiac cost is read against */
    unit: z.enum(['speed', 'power']).nullable(),
    /** Cardiac cost: the speed (km/h) or power (W) it is read at */
    reference: z.number().nullable(),
  })
  .nullable();
export type LabTeaserDto = z.infer<typeof labTeaserSchema>;

/** What a Lab endpoint answers a user who does not have the Lab */
export const lockedStatisticsSchema = z.object({
  locked: z.literal(true),
  teaser: labTeaserSchema,
});
export type LockedStatisticsDto = z.infer<typeof lockedStatisticsSchema>;

/** A Lab answer: the data, or the teaser when locked */
export type LabResponse<T> = T | LockedStatisticsDto;

export function isLockedStatistics<T extends object>(
  data: LabResponse<T> | undefined,
): data is LockedStatisticsDto {
  return !!data && 'locked' in data && data.locked === true;
}

export const statisticsDurabilitySchema = z.object({
  /** How much the output dropped and the heart rate rose, by outing length */
  series: z.array(
    z.object({
      kind: z.enum(['DRIFT_PACE', 'DRIFT_POWER', 'DRIFT_HEARTRATE']),
      classes: z.array(quantilesSchema.extend({ fromHours: z.number() })),
    }),
  ),
  /** Every outing, for the cloud */
  outings: z.array(
    z.object({
      kind: z.enum(['DRIFT_PACE', 'DRIFT_POWER', 'DRIFT_HEARTRATE']),
      hours: z.number(),
      percent: z.number(),
    }),
  ),
});
export type StatisticsDurabilityDto = z.infer<
  typeof statisticsDurabilitySchema
>;

export const statisticsRecoverySchema = z.object({
  /** A few days before the period too, for the rolling means */
  days: z.array(
    z.object({
      /** YYYY-MM-DD */
      date: z.string(),
      /** ms, from one source only: they are not interchangeable */
      hrv: z.number().nullable(),
      restingHeartrate: z.number().nullable(),
      sleepHours: z.number().nullable(),
    }),
  ),
});
export type StatisticsRecoveryDto = z.infer<typeof statisticsRecoverySchema>;

export const statisticsLoadSchema = z.object({
  granularity: z.enum(['day', 'week']),
  /** A week holds its total load, and its form on its last day */
  points: z.array(
    z.object({
      /** YYYY-MM-DD, UTC like training load */
      date: z.string(),
      load: z.number(),
      /** Session RPE of the day or week, 0 without a rated session */
      sessionRpe: z.number(),
      ctl: z.number(),
      atl: z.number(),
      tsb: z.number(),
      /** From today on: counts the sessions still planned */
      projected: z.boolean(),
    }),
  ),
  /** Foster's monotony of the last 7 days: null on an empty or even week */
  monotony: z.number().nullable(),
  /** Days of a race, within the period */
  races: z.array(z.string()),
  /** Days of load behind the last point: below 126, fitness is still rising */
  historyDays: z.number(),
});
export type StatisticsLoadDto = z.infer<typeof statisticsLoadSchema>;
