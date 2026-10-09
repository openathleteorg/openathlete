const DAY_MS = 24 * 60 * 60 * 1000;

const formatters = new Map<string, Intl.DateTimeFormat>();

function wallClock(instant: Date, timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  const parts = Object.fromEntries(
    formatter.formatToParts(instant).map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    // The wall clock read as if it were UTC, to measure the zone's offset
    asUtc: Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    ),
  };
}

/** The local date (YYYY-MM-DD) and hour (0-23) at `instant` in `timeZone`. */
export function zonedClock(instant: Date, timeZone: string) {
  const { date, hour } = wallClock(instant, timeZone);
  return { date, hour };
}

/** The date `days` after `date`, both as YYYY-MM-DD. */
export function addDaysToDateKey(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** The instant `date` (YYYY-MM-DD) starts in `timeZone`. */
export function startOfZonedDay(date: string, timeZone: string): Date {
  const midnightUtc = Date.parse(`${date}T00:00:00Z`);
  const offsetAt = (instant: number) =>
    wallClock(new Date(instant), timeZone).asUtc - instant;
  // The offset at UTC midnight can differ from the one at local midnight
  // when a DST change falls in between: correct once with the latter
  const guess = midnightUtc - offsetAt(midnightUtc);
  return new Date(midnightUtc - offsetAt(guess));
}

/**
 * `instant` moved by `days` calendar days in `timeZone`, at the same wall
 * clock time: a 7:00 session moved a week across a DST change stays at 7:00.
 */
export function addZonedDays(
  instant: Date,
  days: number,
  timeZone: string,
): Date {
  const offsetAt = (at: number) => wallClock(new Date(at), timeZone).asUtc - at;
  // The wall clock has whole seconds: carry the milliseconds over
  const milliseconds = instant.getTime() % 1000;
  const wall = wallClock(instant, timeZone).asUtc + days * DAY_MS;
  const guess = wall - offsetAt(wall);
  return new Date(wall - offsetAt(guess) + milliseconds);
}

/** The instant the wall clock shows `time` (HH:mm) on `date` in `timeZone`. */
export function zonedInstant(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const offsetAt = (at: number) => wallClock(new Date(at), timeZone).asUtc - at;
  const wall = Date.parse(`${date}T00:00:00Z`) + (hours * 60 + minutes) * 60000;
  const guess = wall - offsetAt(wall);
  return new Date(wall - offsetAt(guess));
}

/** `instant` in local time with its offset, e.g. 2026-10-12T18:00+02:00 */
export function formatZoned(instant: Date, timeZone: string): string {
  const wall = wallClock(instant, timeZone).asUtc;
  const offset = Math.round((wall - instant.getTime()) / 60000);
  const sign = offset < 0 ? '-' : '+';
  const pad = (value: number) => String(Math.floor(value)).padStart(2, '0');
  const local = new Date(wall).toISOString().slice(0, 16);
  return `${local}${sign}${pad(Math.abs(offset) / 60)}:${pad(Math.abs(offset) % 60)}`;
}

/** `timeZone` when the runtime knows it, else UTC: device values can be odd */
export function validTimeZone(timeZone: string | null | undefined): string {
  if (!timeZone) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return timeZone;
  } catch {
    return 'UTC';
  }
}
