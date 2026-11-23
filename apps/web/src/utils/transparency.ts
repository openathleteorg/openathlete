import { getLocale } from '@/paraglide/runtime';

/** The transparency page of the hosted website, in the app's language */
export function transparencyPageUrl(locale: string = getLocale()): string {
  // The website serves English at its root
  const prefix = locale === 'en' ? '' : `/${locale.toLowerCase()}`;
  return `https://openathlete.org${prefix}/transparency`;
}
