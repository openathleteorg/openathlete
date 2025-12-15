import { SITE_URL } from '@/config';
import type { Metadata } from 'next';

interface GenerateMetadataOptions {
  locale?: string;
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
}

export function generateMetadata(options?: GenerateMetadataOptions): Metadata {
  const { locale = 'en', title: customTitle, description: customDescription, path = '', keywords } = options || {};

  // Default metadata (English)
  const defaultTitle = 'OpenAthlete — AI-assisted endurance coaching platform';
  const defaultDescription =
    'OpenAthlete is the intelligent coaching platform that helps coaches and athletes plan, analyze and prevent fatigue through AI. Save time, progress with confidence.';

  // French metadata
  const frTitle =
    "OpenAthlete — Plateforme de coaching d'endurance assistée par IA";
  const frDescription =
    "OpenAthlete est la plateforme de coaching intelligente qui aide les coachs et les athlètes à planifier, analyser et prévenir la fatigue grâce à l'IA. Gagnez du temps, progressez en toute confiance.";

  // Coaches page metadata
  const coachesTitleEn = 'OpenAthlete — For Coaches';
  const coachesDescriptionEn = 'Manage more athletes with less time. AI assists you in planning, fatigue detection, and injury prevention.';
  const coachesTitleFr = 'OpenAthlete — Pour les Coachs';
  const coachesDescriptionFr = "Gérez plus d'athlètes avec moins de temps. L'IA vous assiste dans la planification, la détection de fatigue et la prévention des blessures.";

  // Clubs page metadata
  const clubsTitleEn = 'OpenAthlete — For Clubs';
  const clubsDescriptionEn = 'Manage your club efficiently. Offer personalized tracking to all your athletes. Your coaches save time, your club gains quality.';
  const clubsTitleFr = 'OpenAthlete — Pour les Clubs';
  const clubsDescriptionFr = "Gérez votre club efficacement. Offrez un suivi personnalisé à tous vos athlètes. Vos coachs gagnent du temps, votre club gagne en qualité.";

  // Determine title and description based on path
  let title: string;
  let description: string;

  if (path === '/coaches') {
    title = customTitle || (locale === 'fr' ? coachesTitleFr : coachesTitleEn);
    description = customDescription || (locale === 'fr' ? coachesDescriptionFr : coachesDescriptionEn);
  } else if (path === '/clubs') {
    title = customTitle || (locale === 'fr' ? clubsTitleFr : clubsTitleEn);
    description = customDescription || (locale === 'fr' ? clubsDescriptionFr : clubsDescriptionEn);
  } else {
    title = customTitle || (locale === 'fr' ? frTitle : defaultTitle);
    description = customDescription || (locale === 'fr' ? frDescription : defaultDescription);
  }
  const ogLocale = locale === 'fr' ? 'fr_FR' : 'en_US';
  const alternateLocale = locale === 'fr' ? 'en_US' : 'fr_FR';
  const localePath = locale === 'fr' ? '/fr' : '';
  const canonicalUrl = `${SITE_URL}${localePath}${path}`;

  return {
    title,
    description,
    ...(keywords && { keywords }),
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
