import { ConsentBanner } from '@/components/consent/consent-banner';
import { HtmlLang } from '@/components/seo/html-lang';
import { setLocale } from '@/paraglide/runtime.js';
import { DEFAULT_LOCALE, isSupportedLocale } from '@/utils/locales';
import { notFound } from 'next/navigation';
import Script from 'next/script';

import { Providers } from '../providers';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  // Set locale for Paraglide (server-side)
  setLocale(locale);

  // The locale codes are valid HTML lang values
  const htmlLang = locale;

  return (
    <>
      {/* Set HTML lang attribute synchronously before React renders */}
      <Script
        id="set-html-lang"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof document !== 'undefined') {
                document.documentElement.lang = '${htmlLang}';
              }
            })();
          `,
        }}
      />
      {/* Set locale synchronously before React renders */}
      <Script
        id="set-locale"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window !== 'undefined') {
                window.__PARAGLIDE_LOCALE__ = '${locale}';
              }
            })();
          `,
        }}
      />
      {/* Client-side fallback for lang attribute */}
      <HtmlLang locale={locale} />
      <Providers locale={locale}>
        {children}
        <ConsentBanner
          privacyPolicyHref={
            locale === DEFAULT_LOCALE
              ? '/privacy-policy'
              : `/${locale}/privacy-policy`
          }
        />
      </Providers>
    </>
  );
}
