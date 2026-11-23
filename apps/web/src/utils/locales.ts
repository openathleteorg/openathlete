import type { Locale } from 'date-fns';
import { de, enUS, es, fr, it, nl, pl, ptBR } from 'date-fns/locale';

export const SUPPORTED_LOCALES = [
  'en',
  'fr',
  'it',
  'es',
  'pt-BR',
  'de',
  'pl',
  'nl',
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
    pl: 'Polski',
    nl: 'Nederlands',
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
    pl: 'pl-PL',
    nl: 'nl-NL',
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
    pl,
    nl,
  };
  return localeMap[locale] || enUS;
};

/**
 * Adapts a date-fns pattern written the European way ('EEEE d MMMM') to the
 * locale: German puts a dot after the day and a comma after the weekday
 * ("Donnerstag, 12. November"), Polish only the comma ("czwartek,
 * 12 listopada"), where the others read "jeudi 12 novembre".
 */
export const localizeDatePattern = (pattern: string, locale: string) => {
  if (locale.startsWith('de')) {
    return pattern
      .replace(/\bd( [ML])/g, 'd.$1')
      .replace(/(\bE{3,4}) d\b/g, '$1, d');
  }
  if (locale.startsWith('pl'))
    return pattern.replace(/(\bE{3,4}) d\b/g, '$1, d');
  return pattern;
};
