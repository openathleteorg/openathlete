import z from 'zod';

import { SPORT_TYPE } from '../../misc';

/** Fewer activities make a thin story: the app does not offer the review */
export const YEAR_REVIEW_MIN_ACTIVITIES = 10;

export const getYearReviewQuerySchema = z.object({
  athleteId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().min(2000).max(2100),
});
export type GetYearReviewQueryDto = z.infer<typeof getYearReviewQuerySchema>;

/**
 * What the athlete's year says about them, from when they train. The first
 * that fits wins, in this order.
 */
export const YEAR_REVIEW_PERSONAS = [
  'EARLY_BIRD',
  'LUNCH_BREAK',
  'NIGHT_OWL',
  'WEEKEND_WARRIOR',
  'ALL_ROUNDER',
  'METRONOME',
  'ENDURANCE',
  'BALANCED',
] as const;
export type YearReviewPersona = (typeof YEAR_REVIEW_PERSONAS)[number];

/** Hours of each time of day, start included and end excluded */
export const YEAR_REVIEW_PERSONA_HOURS = {
  EARLY_BIRD: [4, 8],
  LUNCH_BREAK: [11, 14],
  NIGHT_OWL: [19, 24],
} as const satisfies Partial<Record<YearReviewPersona, readonly number[]>>;

/** Families whose records the review compares from one year to the next */
export const YEAR_REVIEW_RECORD_FAMILIES = ['RUN', 'RIDE', 'SWIM'] as const;
export type YearReviewRecordFamily =
  (typeof YEAR_REVIEW_RECORD_FAMILIES)[number];

/**
 * Sports of each family. A treadmill's pace depends on its calibration and
 * an e-bike's power on its motor: neither makes a record worth comparing.
 */
export const YEAR_REVIEW_RECORD_SPORTS = {
  RUN: [SPORT_TYPE.RUNNING, SPORT_TYPE.TRAIL_RUNNING],
  RIDE: [
    SPORT_TYPE.CYCLING,
    SPORT_TYPE.GRAVEL_RIDE,
    SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
    SPORT_TYPE.VIRTUAL_RIDE,
  ],
  SWIM: [SPORT_TYPE.SWIMMING],
} as const satisfies Record<YearReviewRecordFamily, readonly SPORT_TYPE[]>;

const yearReviewRecordSchema = z.object({
  family: z.enum(YEAR_REVIEW_RECORD_FAMILIES),
  /** SPEED holds a time for a distance (lower is better), POWER watts */
  type: z.enum(['SPEED', 'POWER']),
  /** Metres, for SPEED */
  distance: z.number().nullable(),
  /** Seconds, for POWER */
  duration: z.number().nullable(),
  /** Seconds for SPEED, watts for POWER */
  value: z.number(),
  /** The best before this year, null for a first */
  previous: z.number().nullable(),
  date: z.coerce.date(),
});
export type YearReviewRecordDto = z.infer<typeof yearReviewRecordSchema>;

export const yearReviewSchema = z.object({
  year: z.number(),
  firstName: z.string().nullable(),
  totals: z.object({
    /** Metres */
    distance: z.number(),
    /** Seconds in motion */
    movingTime: z.number(),
    /** Metres */
    elevationGain: z.number(),
    activities: z.number(),
    activeDays: z.number(),
  }),
  /** By time in motion, the most practised first */
  sports: z.array(
    z.object({
      sport: z.nativeEnum(SPORT_TYPE),
      movingTime: z.number(),
      distance: z.number(),
      count: z.number(),
    }),
  ),
  /**
   * One value per day of the year on the athlete's calendar: 0 for a rest
   * day, then 1 to 3 by time in motion against their other days
   */
  days: z.array(z.number().int().min(0).max(3)),
  longestStreak: z
    .object({
      days: z.number(),
      /** YYYY-MM-DD */
      start: z.string(),
      end: z.string(),
    })
    .nullable(),
  /** January to December */
  months: z
    .array(z.object({ distance: z.number(), movingTime: z.number() }))
    .length(12),
  /** Activities started in each hour of the day, 0 to 23 */
  hours: z.array(z.number()).length(24),
  /** The usual start, in minutes after midnight */
  favoriteMinute: z.number().nullable(),
  persona: z.object({
    kind: z.enum(YEAR_REVIEW_PERSONAS),
    /** The figure behind it: a share (0-1), a count or seconds */
    value: z.number(),
  }),
  /** Chronic training load (CTL), week by week */
  fitness: z
    .object({
      points: z.array(z.object({ date: z.string(), ctl: z.number() })),
      peak: z.object({ date: z.string(), ctl: z.number() }),
    })
    .nullable(),
  /** The race of the year, or the biggest outing without one */
  highlight: z
    .object({
      kind: z.enum(['RACE', 'BIGGEST_OUTING']),
      name: z.string(),
      date: z.coerce.date(),
      sport: z.nativeEnum(SPORT_TYPE),
      /** Metres */
      distance: z.number(),
      /** Seconds from start to finish */
      duration: z.number(),
      elevationGain: z.number(),
      averageHeartrate: z.number().nullable(),
      /** Seconds, when the race had a goal time */
      goalDuration: z.number().nullable(),
    })
    .nullable(),
  records: z.object({
    /** Distances and durations beaten this year */
    improved: z.number(),
    /** The most telling ones, beaten first, then firsts */
    highlights: z.array(yearReviewRecordSchema),
  }),
  /** Planned sessions of the year done, when the athlete follows a plan */
  plan: z.object({ planned: z.number(), done: z.number() }).nullable(),
  /** Garmin requires its attribution under figures derived from its data */
  garminSourced: z.boolean(),
});
export type YearReviewDto = z.infer<typeof yearReviewSchema>;
