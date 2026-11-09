import { SITE_URL } from '@/config';
import {
  DEFAULT_LOCALE,
  OG_LOCALES,
  SUPPORTED_LOCALES,
  type SupportedLocale,
  isSupportedLocale,
  languageAlternates,
  localizedUrl,
} from '@/utils/locales';
import type { Metadata } from 'next';

interface PageMetadataOptions {
  locale?: string;
  /** Full title, as shown in search results: the site name is not appended. */
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  /** Languages the page exists in, for hreflang. Defaults to all of them. */
  locales?: readonly SupportedLocale[];
  /** Absolute or site-relative image for social cards. */
  image?: string;
  type?: 'website' | 'article';
}

const FALLBACK_TITLE = 'OpenAthlete';
const FALLBACK_DESCRIPTION =
  'Open-source training platform for endurance athletes and coaches.';

export function generateMetadata(options: PageMetadataOptions = {}): Metadata {
  const {
    locale = DEFAULT_LOCALE,
    title = FALLBACK_TITLE,
    description = FALLBACK_DESCRIPTION,
    path = '',
    keywords,
    locales = SUPPORTED_LOCALES,
    image,
    type = 'website',
  } = options;

  const lang = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const url = localizedUrl(lang, path);
  const ogImage = image
    ? image.startsWith('http')
      ? image
      : `${SITE_URL}${image}`
    : `${SITE_URL}/og/${lang}${path === '' ? '' : path}`;

  return {
    title: { absolute: title },
    description,
    ...(keywords && { keywords }),
    openGraph: {
      title,
      description,
      url,
      siteName: 'OpenAthlete',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: OG_LOCALES[lang],
      alternateLocale: locales
        .filter((alternate) => alternate !== lang)
        .map((alternate) => OG_LOCALES[alternate]),
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      // Each translation is its own canonical page: pointing them all at the
      // English one would keep them out of the index
      canonical: url,
      languages: languageAlternates(path, locales),
    },
  };
}
