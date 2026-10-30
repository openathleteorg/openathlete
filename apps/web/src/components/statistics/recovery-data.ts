import { StatisticsRecoveryDto } from '@openathlete/shared';

type Day = StatisticsRecoveryDto['days'][number];

const WINDOW = 7;
/** Fewer nights a week and the average reads the night, not the trend */
const MIN_NIGHTS = 3;

const utc = (date: string) => Date.parse(`${date}T00:00:00Z`);
const DAY_MS = 24 * 3600 * 1000;

export interface RecoveryPoint {
  date: string;
  /** Rolling 7-day mean of ln rMSSD */
  hrv: number | null;
  restingHeartrate: number | null;
  sleepHours: number | null;
}

/**
 * Readings of a single night say little: HRV is read as a rolling 7-day mean
 * of its logarithm (Plews 2013), against nothing but itself.
 */
export function recoveryTrend(days: Day[], from: string): RecoveryPoint[] {
  return days
    .filter(({ date }) => date >= from)
    .map(({ date, restingHeartrate, sleepHours }) => {
      const nights = days
        .filter((day) => {
          const age = (utc(date) - utc(day.date)) / DAY_MS;
          return age >= 0 && age < WINDOW && day.hrv !== null && day.hrv > 0;
        })
        .map((day) => Math.log(day.hrv!));
      return {
        date,
        hrv:
          nights.length >= MIN_NIGHTS
            ? nights.reduce((sum, value) => sum + value, 0) / nights.length
            : null,
        restingHeartrate,
        sleepHours,
      };
    });
}
