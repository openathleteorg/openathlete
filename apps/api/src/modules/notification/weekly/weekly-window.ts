import {
  addDaysToDateKey,
  startOfZonedDay,
  zonedClock,
} from 'src/common/utils/time-zone';

const DAY = 24 * 3_600_000;

/** The Monday email goes out from 7:00, the athlete's time */
export const WEEKLY_HOUR = 7;
/** A late run (after a restart) still sends until 11:59, never later */
export const WEEKLY_LAST_HOUR = 11;
/** Without activity or planned session for that long, the email stops */
export const INACTIVE_AFTER = 21 * DAY;
/** The Supporter bar shows one week in this many, at most */
export const SUPPORTER_BAR_EVERY = 4;

/**
 * The Monday (YYYY-MM-DD, local) whose email is due at `now` in `timeZone`,
 * or null outside Monday morning.
 */
export function dueMonday(now: Date, timeZone: string): string | null {
  const { date, hour } = zonedClock(now, timeZone);
  if (new Date(`${date}T00:00:00Z`).getUTCDay() !== 1) return null;
  if (hour < WEEKLY_HOUR || hour > WEEKLY_LAST_HOUR) return null;
  return date;
}

export interface Range {
  from: Date;
  to: Date;
}

/**
 * The weeks around `monday`, from local midnight to local midnight: a week
 * that crosses a change of time lasts 167 or 169 hours.
 */
export function weeksAround(monday: string, timeZone: string) {
  const start = (offset: number) =>
    startOfZonedDay(addDaysToDateKey(monday, offset), timeZone);
  return {
    /** The week the email recaps */
    past: { from: start(-7), to: start(0) },
    /** The one before, to compare */
    previous: { from: start(-14), to: start(-7) },
    /** The week the email shows to come */
    next: { from: start(0), to: start(7) },
  } satisfies Record<string, Range>;
}

/** Weeks since the epoch, the same count wherever the Monday falls */
export function weekIndex(monday: string): number {
  return Math.floor(Date.parse(`${monday}T00:00:00Z`) / (7 * DAY));
}

/**
 * Whether this week's email carries the Supporter bar: one week in four,
 * each person on their own week so the asks don't all fall together.
 */
export function showsSupporterBar(monday: string, userId: number): boolean {
  return (weekIndex(monday) + userId) % SUPPORTER_BAR_EVERY === 0;
}

/**
 * Still worth an email: an activity or a planned session in the last three
 * weeks, or a session planned for the week to come.
 */
export function isStillTraining(
  now: Date,
  lastActivityAt: Date | null,
  lastPlannedAt: Date | null,
): boolean {
  const since = now.getTime() - INACTIVE_AFTER;
  return (
    (lastActivityAt !== null && lastActivityAt.getTime() >= since) ||
    (lastPlannedAt !== null && lastPlannedAt.getTime() >= since)
  );
}
