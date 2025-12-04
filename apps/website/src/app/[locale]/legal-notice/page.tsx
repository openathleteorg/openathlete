import { WebPageStructuredData } from '@/components/seo/structured-data';
import { SITE_URL } from '@/config';
import { m } from '@/paraglide/messages';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

/* eslint-disable react-refresh/only-export-components */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'en' && locale !== 'fr') {
    notFound();
  }

  return {
    title: m.legal_notice_title(),
    alternates: {
      canonical: `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/legal-notice`,
      languages: {
        en: `${SITE_URL}/legal-notice`,
        fr: `${SITE_URL}/fr/legal-notice`,
        'x-default': `${SITE_URL}/legal-notice`,
      },
    },
  };
}
/* eslint-enable react-refresh/only-export-components */

export default async function LegalNoticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'en' && locale !== 'fr') {
    notFound();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <WebPageStructuredData
        title={m.legal_notice_title()}
        description={m.legal_notice_identification_content()}
        url={`${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/legal-notice`}
      />
      <div className="mx-auto max-w-3xl p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">{m.legal_notice_title()}</h1>
          <p className="text-sm text-muted-foreground">
            {m.legal_notice_last_updated({ date: today })}
          </p>
        </header>

        <section className="prose prose-neutral dark:prose-invert">
          <h2>{m.legal_notice_identification_title()}</h2>
          <p>{m.legal_notice_identification_content()}</p>
          <ul>
            <li>{m.legal_notice_identification_list_1()}</li>
            <li>{m.legal_notice_identification_list_2()}</li>
            <li>{m.legal_notice_identification_list_3()}</li>
            <li>{m.legal_notice_identification_list_4()}</li>
            <li>{m.legal_notice_identification_list_5()}</li>
          </ul>

          <h2>{m.legal_notice_publication_director_title()}</h2>
          <p>{m.legal_notice_publication_director_content()}</p>

          <h2>{m.legal_notice_hosting_title()}</h2>
          <p>{m.legal_notice_hosting_content()}</p>
          <ul>
            <li>{m.legal_notice_hosting_list_1()}</li>
            {m.legal_notice_hosting_list_2() && (
              <li>{m.legal_notice_hosting_list_2()}</li>
            )}
          </ul>

          <h2>{m.legal_notice_contact_title()}</h2>
          <p>{m.legal_notice_contact_content()}</p>

          <h2>{m.legal_notice_intellectual_property_title()}</h2>
          <p>{m.legal_notice_intellectual_property_content()}</p>

          <h2>{m.legal_notice_liability_title()}</h2>
          <p>{m.legal_notice_liability_content()}</p>

          <h2>{m.legal_notice_accessibility_title()}</h2>
          <p>{m.legal_notice_accessibility_content()}</p>

          <h2>{m.legal_notice_applicable_law_title()}</h2>
          <p>{m.legal_notice_applicable_law_content()}</p>

          <h2>{m.legal_notice_dispute_resolution_title()}</h2>
          <p>{m.legal_notice_dispute_resolution_content()}</p>
        </section>
      </div>
    </>
  );
}
