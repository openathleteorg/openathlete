import {
  OrganizationStructuredData,
  WebSiteStructuredData,
} from '@/components/seo/structured-data';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

/* eslint-disable react-refresh/only-export-components */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://openathlete.org',
  ),
  title: {
    default: 'OpenAthlete — AI-assisted endurance coaching platform',
    template: '%s | OpenAthlete',
  },
  description:
    'OpenAthlete is the intelligent coaching platform that helps coaches and athletes plan, analyze and prevent fatigue through AI. Save time, progress with confidence.',
  keywords: [
    'endurance coaching',
    'AI coaching',
    'training platform',
    'athlete management',
    'training analysis',
    'fatigue prevention',
  ],
  authors: [{ name: 'OpenAthlete' }],
  creator: 'OpenAthlete',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'fr_FR',
    url: 'https://openathlete.org',
    siteName: 'OpenAthlete',
    title: 'OpenAthlete — AI-assisted endurance coaching platform',
    description:
      'OpenAthlete is the intelligent coaching platform that helps coaches and athletes plan, analyze and prevent fatigue through AI.',
    images: [
      {
        url: '/logo_dark.png',
        width: 1200,
        height: 630,
        alt: 'OpenAthlete',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenAthlete — AI-assisted endurance coaching platform',
    description:
      'OpenAthlete is the intelligent coaching platform that helps coaches and athletes plan, analyze and prevent fatigue through AI.',
    images: ['/logo_dark.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://openathlete.org',
    languages: {
      en: 'https://openathlete.org',
      fr: 'https://openathlete.org/fr',
      'x-default': 'https://openathlete.org',
    },
  },
};
/* eslint-enable react-refresh/only-export-components */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <OrganizationStructuredData />
        <WebSiteStructuredData />
        {children}
      </body>
    </html>
  );
}
