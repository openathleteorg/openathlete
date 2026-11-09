import { baseLocale, overwriteGetLocale } from '@/paraglide/runtime';
import {
  type ParaglideLocale,
  type SupportedLocale,
  isSupportedLocale,
  toParaglideLocale,
} from '@/utils/locales';
import { notFound } from 'next/navigation';
import { cache } from 'react';

/**
 * Server components render several pages at once, in several languages:
 * a global locale would leak from one request into another. React's cache
 * gives each request its own slot, filled by `initLocale` at the top of
 * every layout and page (they render independently of each other).
 */
const requestLocale = cache(() => ({ current: baseLocale as ParaglideLocale }));

overwriteGetLocale(() => requestLocale().current);

/** Validates the `[locale]` segment and makes `m.*()` speak it. */
export function initLocale(locale: string): SupportedLocale {
  if (!isSupportedLocale(locale)) notFound();
  requestLocale().current = toParaglideLocale(locale);
  return locale;
}

/** Every page is prerendered once per language. */
export { SUPPORTED_LOCALES } from '@/utils/locales';
