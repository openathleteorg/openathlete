import { PLAN_ANCHOR } from '@openathlete/shared';

import { addDaysToDateKey } from 'src/common/utils/time-zone';

import { planSessionDayOffset } from './plan-session-day';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Day of the week of a YYYY-MM-DD date, 0 = Sunday … 6 = Saturday */
export function weekdayOfDateKey(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** The first day of the week holding `date`, weeks starting on `weekStartsOn` */
export function weekStartOfDateKey(date: string, weekStartsOn: number): string {
  return addDaysToDateKey(
    date,
    -planSessionDayOffset(weekdayOfDateKey(date), weekStartsOn),
  );
}

/** Whole days from `from` to `to`, both YYYY-MM-DD */
export function daysBetweenDateKeys(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS,
  );
}

export interface PlanRange {
  /** First day of plan week 1 */
  firstWeekStart: string;
  /** First and last day a session may fall on */
  startDate: string;
  endDate: string;
}

/**
 * Where a plan of `weeks` weeks lands. Weeks always start on `weekStartsOn`,
 * so a plan started mid-week, or ending on a race mid-week, loses the
 * sessions before the start or after the race (`isInRange`).
 */
export function planRange(
  anchor: PLAN_ANCHOR,
  date: string,
  weeks: number,
  weekStartsOn: number,
): PlanRange {
  const anchorWeek = weekStartOfDateKey(date, weekStartsOn);
  if (anchor === PLAN_ANCHOR.END) {
    const firstWeekStart = addDaysToDateKey(anchorWeek, -7 * (weeks - 1));
    return { firstWeekStart, startDate: firstWeekStart, endDate: date };
  }
  return {
    firstWeekStart: anchorWeek,
    startDate: date,
    endDate: addDaysToDateKey(anchorWeek, 7 * weeks - 1),
  };
}

/** The day of a session of plan week `weekIndex` (0-based) */
export function planSessionDateKey(
  range: PlanRange,
  weekIndex: number,
  dayOfWeek: number,
  weekStartsOn: number,
): string {
  return addDaysToDateKey(
    range.firstWeekStart,
    7 * weekIndex + planSessionDayOffset(dayOfWeek, weekStartsOn),
  );
}

export function isInRange(range: PlanRange, date: string): boolean {
  return date >= range.startDate && date <= range.endDate;
}

/** Plan week (1-based) `date` falls in, or null outside the plan */
export function currentPlanWeek(
  firstWeekStart: string,
  weeks: number,
  date: string,
): number | null {
  const days = daysBetweenDateKeys(firstWeekStart, date);
  if (days < 0) return null;
  const week = Math.floor(days / 7) + 1;
  return week > weeks ? null : week;
}
