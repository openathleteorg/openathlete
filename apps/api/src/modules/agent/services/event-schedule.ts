import { zonedClock, zonedInstant } from 'src/common/utils/time-zone';

/** Planned sessions start at noon, as they do without AI */
const START_TIME = '12:00';
const DEFAULT_DURATION_SECONDS = 60 * 60;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The calendar day a generated session belongs to, as YYYY-MM-DD.
 * Older clients sent their local midnight as a UTC instant, so it is read in
 * the client's time zone rather than the server's.
 */
export function generatedEventDay(date: string, timeZone: string): string {
  if (DATE_KEY.test(date)) return date;
  return zonedClock(new Date(date), timeZone).date;
}

/**
 * The local noon window of a generated session. The server's own time zone
 * never comes into it: the client says which day it picked, in which zone.
 */
export function generatedEventWindow(
  date: string,
  timeZone: string,
  goalDuration: number | null | undefined,
): { startDate: Date; endDate: Date } {
  const startDate = zonedInstant(
    generatedEventDay(date, timeZone),
    START_TIME,
    timeZone,
  );
  const seconds = goalDuration || DEFAULT_DURATION_SECONDS;

  return {
    startDate,
    endDate: new Date(startDate.getTime() + seconds * 1000),
  };
}
