import { SITE_URL } from '@/config';

/**
 * Locales as they appear in URLs. English is the base and has no prefix.
 * Brazilian Portuguese is `pt-br` in URLs (lowercase, like the rest of the
 * path) and `pt-BR` for Paraglide, hreflang and `<html lang>`.
 */
export const SUPPORTED_LOCALES = ['en', 'fr', 'es', 'it', 'pt-br'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/** Paraglide locale tags, as in project.inlang/settings.json. */
export type ParaglideLocale = 'en' | 'fr' | 'es' | 'it' | 'pt-BR';

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function toParaglideLocale(locale: SupportedLocale): ParaglideLocale {
  return locale === 'pt-br' ? 'pt-BR' : locale;
}

export function fromParaglideLocale(locale: string): SupportedLocale {
  const lower = locale.toLowerCase();
  return isSupportedLocale(lower) ? lower : DEFAULT_LOCALE;
}

/** BCP 47 tag, for hreflang and `<html lang>`. */
export function htmlLang(locale: SupportedLocale): string {
  return toParaglideLocale(locale);
}

/**
 * Picks a supported locale from an Accept-Language header: an exact match
 * first (pt-BR), then the language alone (pt-PT readers get pt-br, which
 * beats English for them).
 */
export function matchAcceptLanguage(
  header: string | null,
): SupportedLocale | null {
  if (!header) return null;
  const tags = header
    .split(',')
    .map((part) => part.split(';')[0].trim().toLowerCase())
    .filter(Boolean);
  for (const tag of tags) {
    if (isSupportedLocale(tag)) return tag;
    const language = tag.split('-')[0];
    if (language === 'pt') return 'pt-br';
    if (isSupportedLocale(language)) return language;
  }
  return null;
}

/** English pages are served without a prefix, the other locales under /<locale>. */
export function localePrefix(locale: string): string {
  return locale === DEFAULT_LOCALE ? '' : `/${locale}`;
}

/** Site-relative link to a page in a locale: `localePath('fr', '/pricing')`. */
export function localePath(locale: string, path = ''): string {
  const full = `${localePrefix(locale)}${path}`;
  return full === '' ? '/' : full;
}

export function localizedUrl(locale: string, path = ''): string {
  return `${SITE_URL}${localePrefix(locale)}${path}`;
}

/**
 * hreflang alternates for a page. Pass `locales` when the page only exists in
 * some languages (an untranslated blog post) so search engines are not told
 * that the English fallback is a translation.
 */
export function languageAlternates(
  path: string,
  locales: readonly SupportedLocale[] = SUPPORTED_LOCALES,
): Record<string, string> {
  const alternates: Record<string, string> = Object.fromEntries(
    locales.map((locale) => [htmlLang(locale), localizedUrl(locale, path)]),
  );
  // Portugal has no version of its own: Brazilian Portuguese beats English
  if (locales.includes('pt-br')) alternates.pt = localizedUrl('pt-br', path);
  alternates['x-default'] = localizedUrl(DEFAULT_LOCALE, path);
  return alternates;
}

/** Open Graph locale codes. */
export const OG_LOCALES: Record<SupportedLocale, string> = {
  en: 'en_US',
  fr: 'fr_FR',
  es: 'es_ES',
  it: 'it_IT',
  'pt-br': 'pt_BR',
};

/** BCP 47 tags for `Intl` formatting. */
export const DATE_LOCALES: Record<SupportedLocale, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  'pt-br': 'pt-BR',
};

export function formatLongDate(date: string, locale: SupportedLocale): string {
  return new Date(date).toLocaleDateString(DATE_LOCALES[locale], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  'pt-br': 'Português (Brasil)',
};

export const getLocaleName = (locale: string) =>
  isSupportedLocale(locale) ? LOCALE_NAMES[locale] : locale;
