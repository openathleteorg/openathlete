import {
  OrganizationStructuredData,
  WebSiteStructuredData,
} from '@/components/seo/structured-data';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

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
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};
/* eslint-enable react-refresh/only-export-components */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: lang attribute will be set dynamically in [locale]/layout.tsx
  // Default to 'en' for root layout (will be overridden by locale layout)
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HGDZFGYRSP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HGDZFGYRSP');
          `}
        </Script>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17797901653"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17797901653');
          `}
        </Script>
        {/* Google Ads Conversion Tracking */}
        <Script id="google-ads-conversion" strategy="afterInteractive">
          {`
            function gtag_report_conversion(url) {
              var callback = function () {
                if (typeof(url) != 'undefined') {
                  window.location = url;
                }
              };
              gtag('event', 'conversion', {
                'send_to': 'AW-17797901653/td2dCLqZodAbENXa2aZC',
                'event_callback': callback
              });
              return false;
            }
          `}
        </Script>
        <OrganizationStructuredData />
        <WebSiteStructuredData />
        {children}
      </body>
    </html>
  );
}
