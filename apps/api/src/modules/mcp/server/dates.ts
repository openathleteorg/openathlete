import { z } from 'zod';

import { addDaysToDateKey, startOfZonedDay } from 'src/common/utils/time-zone';

import { ToolError } from './context';

const DAY_MS = 24 * 3600 * 1000;

export const localDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'A date as YYYY-MM-DD')
  .refine(
    (value) => new Date(`${value}T00:00:00Z`).toISOString().startsWith(value),
    'Not a calendar date',
  )
  .describe("Date as YYYY-MM-DD, in the athlete's time zone");

export const localTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'A time as HH:mm')
  .describe("Time as HH:mm (24 h), in the athlete's time zone");

/** Calendar days from `from` to `to`, both YYYY-MM-DD */
export function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS,
  );
}

/**
 * The instants from the start of `from` to the end of `to` (both included)
 * in `timeZone`, refusing ranges longer than `maxDays` to keep answers small.
 */
export function localRange(
  from: string,
  to: string,
  timeZone: string,
  maxDays: number,
): { start: Date; end: Date } {
  const days = daysBetween(from, to) + 1;
  if (days < 1) {
    throw new ToolError('The end date is before the start date.');
  }
  if (days > maxDays) {
    throw new ToolError(
      `At most ${maxDays} days at a time: split the range in several calls.`,
    );
  }
  return {
    start: startOfZonedDay(from, timeZone),
    end: new Date(
      startOfZonedDay(addDaysToDateKey(to, 1), timeZone).getTime() - 1,
    ),
  };
}
