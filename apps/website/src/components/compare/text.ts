import {
  type Competitor,
  type Money,
  QUOTED_PRICES,
} from '@/content/competitors';
import { formatPrice } from '@/content/pricing';
import { m } from '@/paraglide/messages';
import { DATE_LOCALES, type SupportedLocale } from '@/utils/locales';

type Message = (inputs?: Record<string, string>) => string;
const catalog = m as unknown as Record<string, Message | undefined>;

/**
 * Comparison copy is looked up by key (`compare_<prefix>_row_<topic>`…), as
 * the rows come from data. Server components only: the locale is the
 * request's.
 */
export function msg(key: string, vars: Record<string, string> = {}): string {
  const message = catalog[key];
  if (!message) throw new Error(`Missing message: ${key}`);
  return message(vars);
}

export function hasMsg(key: string): boolean {
  return typeof catalog[key] === 'function';
}

export function money(
  [amount, currency]: Money,
  locale: SupportedLocale,
): string {
  return formatPrice(amount, currency, DATE_LOCALES[locale]);
}

/** Every quoted price, formatted for the locale, as message inputs. */
export function priceVars(locale: SupportedLocale): Record<string, string> {
  return Object.fromEntries(
    Object.entries(QUOTED_PRICES).map(([key, value]) => [
      key,
      money(value, locale),
    ]),
  );
}

export interface Footnote {
  key: string;
  label: string;
  url: string;
}

/** Sources in the order the rows cite them, numbered from 1. */
export function collectFootnotes(competitor: Competitor): Footnote[] {
  const keys: string[] = [];
  for (const row of competitor.rows) {
    for (const key of row.sources ?? [])
      if (!keys.includes(key)) keys.push(key);
  }
  return keys.map((key) => ({ key, ...competitor.sources[key] }));
}
