import type { Locale } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

export const getLocaleName = (locale: string) => {
  const localeMap: Record<string, string> = {
    en: 'English',
    fr: 'Français',
  };
  return localeMap[locale] || locale;
};

export const getDateLocale = (locale: string) => {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    fr: 'fr-FR',
  };
  return localeMap[locale] || locale;
};

export const getDateFnsLocale = (locale: string) => {
  const localeMap: Record<string, Locale> = {
    en: enUS,
    fr,
  };
  return localeMap[locale] || enUS;
};
