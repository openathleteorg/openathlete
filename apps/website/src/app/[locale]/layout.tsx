import { setLocale } from '@/paraglide/runtime.js';
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
  if (locale !== 'en' && locale !== 'fr') {
    notFound();
  }

  // Set locale for Paraglide (server-side)
  setLocale(locale);

  return (
    <>
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
      <Providers locale={locale}>{children}</Providers>
    </>
  );
}
