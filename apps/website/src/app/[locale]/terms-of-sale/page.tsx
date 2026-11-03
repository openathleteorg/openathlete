import { LegalPage } from '@/components/legal/legal-page';
import { BreadcrumbListStructuredData } from '@/components/seo/structured-data';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localePath, localizedUrl } from '@/utils/locales';
import Link from 'next/link';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

// Update with the terms version accepted in the app; never the build date
const LAST_UPDATED = '2026-10-05';

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/terms-of-sale',
    title: `${m.terms_title()} | OpenAthlete`,
    description: m.terms_seo_description(),
  });
}

export default async function TermsOfSalePage({ params }: Props) {
  const locale = initLocale((await params).locale);

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          {
            name: m.terms_title(),
            url: localizedUrl(locale, '/terms-of-sale'),
          },
        ]}
      />
      <LegalPage
        locale={locale}
        path="/terms-of-sale"
        title={m.terms_title()}
        updated={LAST_UPDATED}
        intro={<p>{m.terms_intro()}</p>}
        sections={[
          {
            id: 'seller',
            title: m.terms_seller_title(),
            body: <p>{m.terms_seller_content()}</p>,
          },
          {
            id: 'offer',
            title: m.terms_offer_title(),
            body: (
              <>
                <p>{m.terms_offer_content()}</p>
                <ul>
                  <li>{m.terms_offer_list_1()}</li>
                  <li>{m.terms_offer_list_2()}</li>
                </ul>
                <p>{m.terms_offer_note()}</p>
              </>
            ),
          },
          {
            id: 'price',
            title: m.terms_price_title(),
            body: <p>{m.terms_price_content()}</p>,
          },
          {
            id: 'order',
            title: m.terms_order_title(),
            body: <p>{m.terms_order_content()}</p>,
          },
          {
            id: 'duration',
            title: m.terms_duration_title(),
            body: <p>{m.terms_duration_content()}</p>,
          },
          {
            // Same anchor as the previous page, which links may point to
            id: 'withdrawal',
            title: m.terms_withdrawal_title(),
            body: (
              <>
                <p>{m.terms_withdrawal_content()}</p>
                <p>{m.terms_withdrawal_how()}</p>
                <blockquote>{m.terms_withdrawal_form()}</blockquote>
              </>
            ),
          },
          {
            id: 'warranty',
            title: m.terms_warranty_title(),
            body: <p>{m.terms_warranty_content()}</p>,
          },
          {
            id: 'data',
            title: m.terms_data_title(),
            body: (
              <p>
                {m.terms_data_content()}{' '}
                <Link href={localePath(locale, '/privacy-policy')}>
                  {m.privacy_policy_title()}
                </Link>
              </p>
            ),
          },
          {
            id: 'disputes',
            title: m.terms_disputes_title(),
            body: <p>{m.terms_disputes_content()}</p>,
          },
          {
            id: 'law',
            title: m.terms_law_title(),
            body: <p>{m.terms_law_content()}</p>,
          },
        ]}
      />
    </>
  );
}
