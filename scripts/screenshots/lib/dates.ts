/**
 * Calendar helpers. Days are UTC midnights standing for a local date in the
 * athletes' time zone; `at` turns a local wall-clock time into the instant.
 */
export const TIME_ZONE = 'Europe/Paris';
const DAY_MS = 86_400_000;

/** Today in the athletes' time zone (SEED_TODAY=YYYY-MM-DD overrides it). */
export function today(): Date {
  const fixed = process.env.SEED_TODAY;
  if (fixed) return new Date(`${fixed}T00:00:00Z`);
  const local = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return new Date(`${local}T00:00:00Z`);
}

export function addDays(day: Date, days: number): Date {
  return new Date(day.getTime() + days * DAY_MS);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/** Monday of the week holding `day`. */
export function mondayOf(day: Date): Date {
  return addDays(day, -((day.getUTCDay() + 6) % 7));
}

/** 0 = Monday ... 6 = Sunday */
export function weekday(day: Date): number {
  return (day.getUTCDay() + 6) % 7;
}

/** Offset of the time zone from UTC at an instant, in minutes. */
function offsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/** The instant of a local wall-clock time on a day. */
export function at(day: Date, hours: number, minutes = 0): Date {
  const naive = new Date(day.getTime() + (hours * 60 + minutes) * 60_000);
  return new Date(naive.getTime() - offsetMinutes(naive) * 60_000);
}

export function isoDay(day: Date): string {
  return day.toISOString().slice(0, 10);
}
