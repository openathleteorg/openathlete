import type { Locale } from 'date-fns';
import { enUS, es, fr, it } from 'date-fns/locale';

export const SUPPORTED_LOCALES = ['en', 'fr', 'it', 'es'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const getLocaleName = (locale: string) => {
  const localeMap: Record<string, string> = {
    en: 'English',
    fr: 'Français',
    it: 'Italiano',
    es: 'Español',
  };
  return localeMap[locale] || locale;
};

export const getDateLocale = (locale: string) => {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    fr: 'fr-FR',
    it: 'it-IT',
    es: 'es-ES',
  };
  return localeMap[locale] || locale;
};

export const getDateFnsLocale = (locale: string) => {
  const localeMap: Record<string, Locale> = {
    en: enUS,
    fr,
    it,
    es,
  };
  return localeMap[locale] || enUS;
};
