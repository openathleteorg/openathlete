import { m } from '@/paraglide/messages';
import {
  DATE_LOCALES,
  type ParaglideLocale,
  type SupportedLocale,
} from '@/utils/locales';

import type { Race } from './types';

/** The words of a race page that differ from race to race. */
export type RaceField =
  | 'name'
  /** The name as a sentence object: "the SaintéLyon", "l'UTMB". */
  | 'the'
  | 'h1'
  | 'meta'
  | 'lead'
  | 'place'
  | 'period'
  | 'start'
  | 'cutoff'
  | 'elevation'
  | 'course'
  | 'weather'
  | 'hub'
  | 's1_t'
  | 's1_b'
  | 's2_t'
  | 's2_b'
  | 's3_t'
  | 's3_b'
  | 'faq1_q'
  | 'faq1_a'
  | 'faq2_q'
  | 'faq2_a';

/**
 * A race message by field. The keys are built from the race, so a missing
 * one fails the build here instead of printing `undefined` on a page.
 */
export function raceText(
  race: Race,
  field: RaceField,
  locale?: ParaglideLocale,
): string {
  const key = `races_${race.key}_${field}`;
  const fn = (m as unknown as Record<string, unknown>)[key];
  if (typeof fn !== 'function') throw new Error(`Missing message ${key}`);
  return (fn as (i: object, o?: object) => string)(
    {},
    locale ? { locale } : undefined,
  );
}

/**
 * Date formats: the race pages write British English ("Sunday 4 April
 * 2027"), like their copy; the other languages use the site's formats.
 */
const RACE_DATE_LOCALES: Record<SupportedLocale, string> = {
  ...DATE_LOCALES,
  en: 'en-GB',
};

/** A YYYY-MM-DD as a UTC date, so no time zone moves it by a day. */
function utc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Monday of the first week of a plan that ends with the race week: the
 * Monday of the race week, minus the other weeks.
 */
export function planStartDate(raceDate: string, weeks: number): string {
  const date = utc(raceDate);
  const sinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - sinceMonday - (weeks - 1) * 7);
  return iso(date);
}

/** "Sunday, April 11, 2027" / "dimanche 11 avril 2027". */
export function formatRaceDate(
  date: string,
  locale: SupportedLocale,
  weekday = true,
): string {
  return utc(date).toLocaleDateString(RACE_DATE_LOCALES[locale], {
    timeZone: 'UTC',
    ...(weekday && { weekday: 'long' }),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * The race day, or both days of a two-day race:
 * "Saturday, April 24 – Sunday, April 25, 2027".
 */
export function formatRaceDays(
  race: Race,
  locale: SupportedLocale,
  weekday = true,
): string {
  if (!race.date) return '';
  const format = new Intl.DateTimeFormat(RACE_DATE_LOCALES[locale], {
    timeZone: 'UTC',
    ...(weekday && { weekday: 'long' }),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return race.endDate
    ? format.formatRange(utc(race.date), utc(race.endDate))
    : format.format(utc(race.date));
}

/** "≈ +280 m" when the gain is a GPS estimate, "+2 500 m" otherwise. */
export function formatGain(race: Race, locale: SupportedLocale): string {
  if (race.gainM === undefined) return '';
  return `${race.gainEstimate ? '≈\u00a0' : ''}+${formatMetres(race.gainM, locale)}\u00a0m`;
}

/** "April" / "avril", for the hub's month headings. */
export function monthName(month: number, locale: SupportedLocale): string {
  return new Date(Date.UTC(2027, month - 1, 1)).toLocaleDateString(
    DATE_LOCALES[locale],
    { timeZone: 'UTC', month: 'long' },
  );
}

export const capitalize = (text: string) =>
  text.charAt(0).toLocaleUpperCase() + text.slice(1);

/** Thousands separators as the language writes them: 10 000 / 10,000. */
export function formatMetres(value: number, locale: SupportedLocale): string {
  return value.toLocaleString(DATE_LOCALES[locale]);
}

/** Distances with their decimal: 42,195 km / 42.195 km. */
export function formatKm(value: number, locale: SupportedLocale): string {
  return value.toLocaleString(DATE_LOCALES[locale], {
    maximumFractionDigits: 3,
  });
}
