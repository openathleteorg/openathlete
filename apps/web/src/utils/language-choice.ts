import { UserAPI } from '@/api/user/user.api';
import { getLocale, isLocale } from '@/paraglide/runtime';
import type { SupportedLocale } from '@/utils/locales';

import type { EmailLanguage } from '@openathlete/shared';

/**
 * A language picked while signed out, saved to the profile at the next
 * sign-in. Paraglide's locale cookie cannot tell us: the first render writes
 * it for every visitor, with the default locale when nobody chose one.
 */
const STORAGE_KEY = 'openathlete-pending-language';

const EMAIL_LANGUAGE_BY_LOCALE: Record<SupportedLocale, EmailLanguage> = {
  en: 'EN',
  fr: 'FR',
  it: 'IT',
  es: 'ES',
  'pt-BR': 'PT_BR',
  de: 'DE',
};

/** Converts a Paraglide locale to the code stored by the API. */
export function toEmailLanguage(locale: SupportedLocale): EmailLanguage {
  return EMAIL_LANGUAGE_BY_LOCALE[locale] ?? 'EN';
}

/** The language the app is shown in, as the API saves it. */
export const currentLanguage = () =>
  toEmailLanguage(getLocale() as SupportedLocale);

export function rememberLanguageChoice(locale: SupportedLocale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage can be blocked: the choice then stays on this device only
  }
}

function takePendingChoice() {
  try {
    const pending = localStorage.getItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    return pending;
  } catch {
    return null;
  }
}

/**
 * Saves to the profile, where emails take it from, a language chosen through
 * a `?lang=` link or on this device before signing in. Without a choice the
 * saved language stays: the locale shown may only be the app's default.
 */
export async function saveLanguageChoice(
  saved: EmailLanguage,
  search = window.location.search,
) {
  const pending = takePendingChoice();
  const choice = [new URLSearchParams(search).get('lang'), pending].find(
    isLocale,
  );
  if (!choice) return;

  const language = toEmailLanguage(choice as SupportedLocale);
  if (language === saved) return;
  try {
    await UserAPI.updateLanguage(language);
  } catch (error) {
    console.error('Failed to update language:', error);
  }
}
