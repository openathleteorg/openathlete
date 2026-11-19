import { getLocale } from '@/paraglide/runtime';

/*
 * Figures of the review in the athlete's language. Grouping uses a plain
 * no-break space: the narrow one some locales use vanishes at display sizes.
 */

const plainSpaces = (text: string) => text.replace(/\u202f/g, '\u00a0');

const numberFormats = new Map<number, Intl.NumberFormat>();

export function formatNumber(value: number, decimals = 0): string {
  let format = numberFormats.get(decimals);
  if (!format) {
    format = new Intl.NumberFormat(getLocale(), {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    numberFormats.set(decimals, format);
  }
  return plainSpaces(format.format(value));
}

/** A share between 0 and 1, rounded to the unit: "45 %" or "45%" */
export function formatPercent(share: number): string {
  return plainSpaces(
    new Intl.NumberFormat(getLocale(), {
      style: 'percent',
      maximumFractionDigits: 0,
    }).format(share),
  );
}

export const kilometers = (meters: number) => Math.round(meters / 1000);

export const hours = (seconds: number) => Math.round(seconds / 3600);

/** 3:18:42, or 41:12 under an hour */
export function formatClock(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** "1 h 30" or "45 min" */
export function formatShortDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const h = Math.floor(minutes / 60);
  return h
    ? `${h} h ${String(minutes % 60).padStart(2, '0')}`
    : `${minutes} min`;
}

/** Minutes and seconds per kilometre */
export const formatPace = (meters: number, seconds: number) =>
  formatClock(seconds / (meters / 1000));

/** A time of day, as the athlete's language writes it */
export function formatTimeOfDay(minuteOfDay: number): string {
  const date = new Date(2000, 0, 1, Math.floor(minuteOfDay / 60));
  date.setMinutes(minuteOfDay % 60);
  return new Intl.DateTimeFormat(getLocale(), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** "12 April", in the athlete's language */
export function formatDayMonth(date: Date | string): string {
  const day = typeof date === 'string' ? new Date(`${date}T12:00:00`) : date;
  return new Intl.DateTimeFormat(getLocale(), {
    day: 'numeric',
    month: 'long',
  }).format(day);
}

/** "Sunday 12 April 2026" */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(getLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** The month's name; `narrow` gives its initial */
export function monthName(
  month: number,
  width: 'narrow' | 'short' | 'long' = 'long',
): string {
  return new Intl.DateTimeFormat(getLocale(), { month: width }).format(
    new Date(2000, month, 15),
  );
}
