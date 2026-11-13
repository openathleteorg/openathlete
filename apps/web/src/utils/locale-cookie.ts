/** The cookie holding the app's language (see vite.config.ts). */
export const APP_LOCALE_COOKIE = 'OA_LOCALE';

const LEGACY_COOKIE = 'PARAGLIDE_LOCALE';
const LOCALES = ['en', 'fr', 'it', 'es', 'pt-BR', 'de'];
const MAX_AGE = 34560000; // 400 days, as Paraglide sets it

/**
 * Keeps the language people chose before the cookie was renamed. Several
 * PARAGLIDE_LOCALE cookies can coexist, one set for the whole parent
 * domain by another site: the app's own came later, so it is the last.
 */
export function adoptLegacyLocaleCookie(doc: Pick<Document, 'cookie'>) {
  const cookies = doc.cookie.split(';').map((cookie) => cookie.trim());
  if (cookies.some((cookie) => cookie.startsWith(`${APP_LOCALE_COOKIE}=`))) {
    return;
  }
  const legacy = cookies
    .filter((cookie) => cookie.startsWith(`${LEGACY_COOKIE}=`))
    .map((cookie) => cookie.slice(LEGACY_COOKIE.length + 1))
    .filter((locale) => LOCALES.includes(locale))
    .at(-1);
  if (legacy) {
    doc.cookie = `${APP_LOCALE_COOKIE}=${legacy}; path=/; max-age=${MAX_AGE}`;
  }
}
