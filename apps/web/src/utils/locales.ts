import type { Locale } from 'date-fns';
import { de, enUS, es, fr, it, ptBR } from 'date-fns/locale';

export const SUPPORTED_LOCALES = [
  'en',
  'fr',
  'it',
  'es',
  'pt-BR',
  'de',
] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const getLocaleName = (locale: string) => {
  const localeMap: Record<string, string> = {
    en: 'English',
    fr: 'Français',
    it: 'Italiano',
    es: 'Español',
    'pt-BR': 'Português (Brasil)',
    de: 'Deutsch',
  };
  return localeMap[locale] || locale;
};

export const getDateLocale = (locale: string) => {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    fr: 'fr-FR',
    it: 'it-IT',
    es: 'es-ES',
    'pt-BR': 'pt-BR',
    de: 'de-DE',
  };
  return localeMap[locale] || locale;
};

export const getDateFnsLocale = (locale: string) => {
  const localeMap: Record<string, Locale> = {
    en: enUS,
    fr,
    it,
    es,
    'pt-BR': ptBR,
    de,
  };
  return localeMap[locale] || enUS;
};

/**
 * Adapts a date-fns pattern written the European way ('EEEE d MMMM') to the
 * locale: German puts a dot after the day and a comma after the weekday
 * ("Donnerstag, 12. November"), where the others read "jeudi 12 novembre".
 */
export const localizeDatePattern = (pattern: string, locale: string) =>
  locale.startsWith('de')
    ? pattern.replace(/\bd( [ML])/g, 'd.$1').replace(/(\bE{3,4}) d\b/g, '$1, d')
    : pattern;
