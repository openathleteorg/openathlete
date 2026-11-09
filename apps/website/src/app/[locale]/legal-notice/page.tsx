import { LegalPage } from '@/components/legal/legal-page';
import { BreadcrumbListStructuredData } from '@/components/seo/structured-data';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localizedUrl } from '@/utils/locales';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

// Update when the text changes; never the build date
const LAST_UPDATED = '2026-11-02';

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/legal-notice',
    title: `${m.legal_notice_title()} | OpenAthlete`,
    description: m.legal_notice_seo_description(),
  });
}

export default async function LegalNoticePage({ params }: Props) {
  const locale = initLocale((await params).locale);

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          {
            name: m.legal_notice_title(),
            url: localizedUrl(locale, '/legal-notice'),
          },
        ]}
      />
      <LegalPage
        locale={locale}
        path="/legal-notice"
        title={m.legal_notice_title()}
        updated={LAST_UPDATED}
        sections={[
          {
            id: 'publisher',
            title: m.legal_notice_identification_title(),
            body: (
              <>
                <p>{m.legal_notice_identification_content()}</p>
                <ul>
                  <li>{m.legal_notice_identification_list_1()}</li>
                  <li>{m.legal_notice_identification_list_2()}</li>
                  <li>{m.legal_notice_identification_list_3()}</li>
                  <li>{m.legal_notice_identification_list_4()}</li>
                  <li>{m.legal_notice_identification_list_5()}</li>
                </ul>
              </>
            ),
          },
          {
            id: 'director',
            title: m.legal_notice_publication_director_title(),
            body: <p>{m.legal_notice_publication_director_content()}</p>,
          },
          {
            id: 'hosting',
            title: m.legal_notice_hosting_title(),
            body: (
              <>
                <p>{m.legal_notice_hosting_content()}</p>
                <ul>
                  <li>{m.legal_notice_hosting_list_1()}</li>
                  <li>{m.legal_notice_hosting_list_2()}</li>
                </ul>
              </>
            ),
          },
          {
            id: 'contact',
            title: m.legal_notice_contact_title(),
            body: <p>{m.legal_notice_contact_content()}</p>,
          },
          {
            id: 'intellectual-property',
            title: m.legal_notice_intellectual_property_title(),
            body: <p>{m.legal_notice_intellectual_property_content()}</p>,
          },
          {
            id: 'liability',
            title: m.legal_notice_liability_title(),
            body: <p>{m.legal_notice_liability_content()}</p>,
          },
          {
            id: 'accessibility',
            title: m.legal_notice_accessibility_title(),
            body: <p>{m.legal_notice_accessibility_content()}</p>,
          },
          {
            id: 'law',
            title: m.legal_notice_applicable_law_title(),
            body: <p>{m.legal_notice_applicable_law_content()}</p>,
          },
          {
            id: 'disputes',
            title: m.legal_notice_dispute_resolution_title(),
            body: <p>{m.legal_notice_dispute_resolution_content()}</p>,
          },
        ]}
      />
    </>
  );
}
