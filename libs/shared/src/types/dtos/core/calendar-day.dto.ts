import { METRIC_TYPE } from '../../misc';

/**
 * The wellness measurements the calendar shows under each day: last night's
 * sleep and HRV, resting heart rate, and the Hooper index (fatigue, stress,
 * soreness, sleep quality).
 */
export const CALENDAR_WELLNESS_METRICS = [
  METRIC_TYPE.SLEEP_DURATION,
  METRIC_TYPE.SLEEP_SCORE,
  METRIC_TYPE.HRV_LAST_NIGHT_AVG,
  METRIC_TYPE.HR_REST,
  METRIC_TYPE.HOOPER_INDEX,
] as const;

export type CalendarWellnessMetric = (typeof CALENDAR_WELLNESS_METRICS)[number];

/**
 * The measurements that show an athlete tracks their wellness day by day.
 * Not the resting heart rate: onboarding records one for everyone.
 */
export const DAILY_WELLNESS_SIGNALS = [
  METRIC_TYPE.SLEEP_DURATION,
  METRIC_TYPE.SLEEP_SCORE,
  METRIC_TYPE.HRV_LAST_NIGHT_AVG,
  METRIC_TYPE.HOOPER_INDEX,
] as const;

/** One day of the calendar: its load, the form it leads to, and wellness */
export type CalendarDayForm = {
  /** UTC date, YYYY-MM-DD, as training load is bucketed */
  date: string;
  load: number;
  ctl: number;
  atl: number;
  tsb: number;
  /** Today or later: counts the sessions still to do */
  projected: boolean;
  /** Only the measurements of that day, when asked for */
  wellness?: Partial<Record<CalendarWellnessMetric, number>>;
};
