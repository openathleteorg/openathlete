import { ConsentBanner } from '@/components/consent/consent-banner';
import {
  OrganizationStructuredData,
  WebSiteStructuredData,
} from '@/components/seo/structured-data';
import { AppLinkAttribution } from '@/components/site/app-link-attribution';
import { Footer } from '@/components/site/footer';
import { Header } from '@/components/site/header';
import { LocaleSuggestion } from '@/components/site/locale-suggestion';
import { SITE_URL } from '@/config';
import { LocaleProvider } from '@/i18n/provider';
import { SUPPORTED_LOCALES, initLocale } from '@/i18n/server';
import { htmlLang, localePath } from '@/utils/locales';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import '../globals.css';

const geist = Geist({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-geist',
  display: 'swap',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

/* eslint-disable react-refresh/only-export-components */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'OpenAthlete', template: '%s | OpenAthlete' },
  applicationName: 'OpenAthlete',
  authors: [{ name: 'OpenAthlete' }],
  creator: 'OpenAthlete',
  formatDetection: { telephone: false },
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
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export const dynamicParams = false;
/* eslint-enable react-refresh/only-export-components */

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = initLocale((await params).locale);

  return (
    <html
      lang={htmlLang(locale)}
      className={`${geist.variable} ${geistMono.variable}`}
    >
      <body className="font-sans">
        <OrganizationStructuredData />
        <WebSiteStructuredData locale={locale} />
        <LocaleProvider locale={locale}>
          <LocaleSuggestion />
          <Header />
          <main id="main">{children}</main>
          <Footer locale={locale} />
          <ConsentBanner
            privacyPolicyHref={localePath(locale, '/privacy-policy')}
          />
          <AppLinkAttribution />
        </LocaleProvider>
      </body>
    </html>
  );
}
