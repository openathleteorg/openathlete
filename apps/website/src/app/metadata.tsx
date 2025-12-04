import { SITE_URL } from '@/config';
import type { Metadata } from 'next';
import { m } from '@/paraglide/messages';

export function generateMetadata(): Metadata {
  return {
    title: 'OpenAthlete — AI-assisted endurance coaching platform',
    description:
      'OpenAthlete is the intelligent coaching platform that helps coaches and athletes plan, analyze and prevent fatigue through AI. Save time, progress with confidence.',
    openGraph: {
      title: 'OpenAthlete — AI-assisted endurance coaching platform',
      description:
        'OpenAthlete is the intelligent coaching platform that helps coaches and athletes plan, analyze and prevent fatigue through AI. Save time, progress with confidence.',
      url: SITE_URL,
      siteName: 'OpenAthlete',
      images: [
        {
          url: `${SITE_URL}/logo_dark.png`,
          width: 1200,
          height: 630,
          alt: 'OpenAthlete',
        },
      ],
      locale: 'en_US',
      alternateLocale: 'fr_FR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'OpenAthlete — AI-assisted endurance coaching platform',
      description:
        'OpenAthlete is the intelligent coaching platform that helps coaches and athletes plan, analyze and prevent fatigue through AI. Save time, progress with confidence.',
      images: [`${SITE_URL}/logo_dark.png`],
    },
    alternates: {
      canonical: SITE_URL,
      languages: {
        'en': SITE_URL,
        'fr': `${SITE_URL}/fr`,
        'x-default': SITE_URL,
      },
    },
  };
}

