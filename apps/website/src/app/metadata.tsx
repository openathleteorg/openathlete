import { SITE_URL } from '@/config';
import type { Metadata } from 'next';

interface GenerateMetadataOptions {
  locale?: string;
}

export function generateMetadata(options?: GenerateMetadataOptions): Metadata {
  const { locale = 'en' } = options || {};

  // Default metadata (English)
  const defaultTitle = 'OpenAthlete — AI-assisted endurance coaching platform';
  const defaultDescription =
    'OpenAthlete is the intelligent coaching platform that helps coaches and athletes plan, analyze and prevent fatigue through AI. Save time, progress with confidence.';

  // French metadata
  const frTitle =
    "OpenAthlete — Plateforme de coaching d'endurance assistée par IA";
  const frDescription =
    "OpenAthlete est la plateforme de coaching intelligente qui aide les coachs et les athlètes à planifier, analyser et prévenir la fatigue grâce à l'IA. Gagnez du temps, progressez en toute confiance.";

  const title = locale === 'fr' ? frTitle : defaultTitle;
  const description = locale === 'fr' ? frDescription : defaultDescription;
  const ogLocale = locale === 'fr' ? 'fr_FR' : 'en_US';
  const alternateLocale = locale === 'fr' ? 'en_US' : 'fr_FR';
  const canonicalUrl = locale === 'fr' ? `${SITE_URL}/fr` : SITE_URL;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'OpenAthlete',
      images: [
        {
          url: `${SITE_URL}/logo_dark.png`,
          width: 1200,
          height: 630,
          alt: 'OpenAthlete',
        },
      ],
      locale: ogLocale,
      alternateLocale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/logo_dark.png`],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: SITE_URL,
        fr: `${SITE_URL}/fr`,
        'x-default': SITE_URL,
      },
    },
  };
}
