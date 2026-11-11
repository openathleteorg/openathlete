import { LegalPage } from '@/components/legal/legal-page';
import { BreadcrumbListStructuredData } from '@/components/seo/structured-data';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localizedUrl } from '@/utils/locales';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

// Update when the policy changes; never the build date
const LAST_UPDATED = '2026-11-11';

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/privacy-policy',
    title: `${m.privacy_policy_title()} | OpenAthlete`,
    description: m.privacy_seo_description(),
  });
}

function List({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const locale = initLocale((await params).locale);

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          {
            name: m.privacy_policy_title(),
            url: localizedUrl(locale, '/privacy-policy'),
          },
        ]}
      />
      <LegalPage
        locale={locale}
        path="/privacy-policy"
        title={m.privacy_policy_title()}
        updated={LAST_UPDATED}
        intro={<p>{m.privacy_policy_intro()}</p>}
        sections={[
          {
            id: 'data-we-collect',
            title: m.privacy_policy_data_we_collect_title(),
            body: (
              <List
                items={[
                  m.privacy_policy_data_we_collect_list_1(),
                  m.privacy_policy_data_we_collect_list_2(),
                  m.privacy_policy_data_we_collect_list_3(),
                  m.privacy_policy_data_we_collect_list_4(),
                  m.privacy_policy_data_we_collect_list_5(),
                  m.privacy_policy_data_we_collect_list_6(),
                  m.privacy_policy_data_we_collect_list_7(),
                  m.privacy_policy_data_we_collect_list_8(),
                ]}
              />
            ),
          },
          {
            id: 'how-we-use',
            title: m.privacy_policy_how_we_use_title(),
            body: (
              <List
                items={[
                  m.privacy_policy_how_we_use_list_1(),
                  m.privacy_policy_how_we_use_list_2(),
                  m.privacy_policy_how_we_use_list_3(),
                  m.privacy_policy_how_we_use_list_4(),
                  m.privacy_policy_how_we_use_list_5(),
                  m.privacy_policy_how_we_use_list_6(),
                ]}
              />
            ),
          },
          {
            id: 'legal-basis',
            title: m.privacy_policy_legal_basis_title(),
            body: (
              <List
                items={[
                  m.privacy_policy_legal_basis_list_1(),
                  m.privacy_policy_legal_basis_list_2(),
                  m.privacy_policy_legal_basis_list_3(),
                ]}
              />
            ),
          },
          {
            id: 'sharing',
            title: m.privacy_policy_sharing_title(),
            body: (
              <List
                items={[
                  m.privacy_policy_sharing_list_1(),
                  m.privacy_policy_sharing_list_2(),
                  m.privacy_policy_sharing_list_3(),
                  m.privacy_policy_sharing_list_4(),
                ]}
              />
            ),
          },
          {
            id: 'processors',
            title: m.privacy_policy_processors_title(),
            body: (
              <List
                items={[
                  m.privacy_policy_processors_list_1(),
                  m.privacy_policy_processors_list_2(),
                  m.privacy_policy_processors_list_3(),
                  m.privacy_policy_processors_list_4(),
                  m.privacy_policy_processors_list_5(),
                  m.privacy_policy_processors_list_6(),
                  m.privacy_policy_processors_list_7(),
                  m.privacy_policy_processors_list_8(),
                ]}
              />
            ),
          },
          {
            id: 'cookies',
            title: m.privacy_policy_cookies_title(),
            body: <p>{m.privacy_policy_cookies_content()}</p>,
          },
          {
            id: 'retention',
            title: m.privacy_policy_data_retention_title(),
            body: <p>{m.privacy_policy_data_retention_content()}</p>,
          },
          {
            id: 'security',
            title: m.privacy_policy_security_title(),
            body: <p>{m.privacy_policy_security_content()}</p>,
          },
          {
            id: 'transfers',
            title: m.privacy_policy_international_transfers_title(),
            body: <p>{m.privacy_policy_international_transfers_content()}</p>,
          },
          {
            id: 'your-rights',
            title: m.privacy_policy_your_rights_title(),
            body: (
              <List
                items={[
                  m.privacy_policy_your_rights_list_1(),
                  m.privacy_policy_your_rights_list_2(),
                  m.privacy_policy_your_rights_list_3(),
                ]}
              />
            ),
          },
          {
            id: 'children',
            title: m.privacy_policy_children_title(),
            body: <p>{m.privacy_policy_children_content()}</p>,
          },
          {
            id: 'self-hosting',
            title: m.privacy_policy_self_hosting_title(),
            body: <p>{m.privacy_policy_self_hosting_content()}</p>,
          },
          {
            id: 'changes',
            title: m.privacy_policy_changes_title(),
            body: <p>{m.privacy_policy_changes_content()}</p>,
          },
          {
            id: 'contact',
            title: m.privacy_policy_contact_title(),
            body: <p>{m.privacy_policy_contact_content()}</p>,
          },
        ]}
      />
    </>
  );
}
