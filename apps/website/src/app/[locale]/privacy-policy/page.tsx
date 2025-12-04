import { WebPageStructuredData } from '@/components/seo/structured-data';
import { SITE_URL } from '@/config';
import { m } from '@/paraglide/messages';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

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
    title: m.privacy_policy_title(),
    description: m.privacy_policy_intro(),
    alternates: {
      canonical: `${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/privacy-policy`,
      languages: {
        en: `${SITE_URL}/privacy-policy`,
        fr: `${SITE_URL}/fr/privacy-policy`,
        'x-default': `${SITE_URL}/privacy-policy`,
      },
    },
  };
}

export default async function PrivacyPolicyPage({
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
        title={m.privacy_policy_title()}
        description={m.privacy_policy_intro()}
        url={`${SITE_URL}${locale === 'en' ? '' : `/${locale}`}/privacy-policy`}
      />
      <div className="mx-auto max-w-3xl p-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">{m.privacy_policy_title()}</h1>
          <p className="text-sm text-muted-foreground">
            {m.privacy_policy_last_updated({ date: today })}
          </p>
        </header>

        <section className="prose prose-neutral dark:prose-invert">
          <p>{m.privacy_policy_intro()}</p>

          <h2>{m.privacy_policy_data_we_collect_title()}</h2>
          <ul>
            <li>{m.privacy_policy_data_we_collect_list_1()}</li>
            <li>{m.privacy_policy_data_we_collect_list_2()}</li>
            <li>{m.privacy_policy_data_we_collect_list_3()}</li>
            <li>{m.privacy_policy_data_we_collect_list_4()}</li>
            <li>{m.privacy_policy_data_we_collect_list_5()}</li>
            <li>{m.privacy_policy_data_we_collect_list_6()}</li>
            <li>{m.privacy_policy_data_we_collect_list_7()}</li>
            <li>{m.privacy_policy_data_we_collect_list_8()}</li>
          </ul>

          <h2>{m.privacy_policy_how_we_use_title()}</h2>
          <ul>
            <li>{m.privacy_policy_how_we_use_list_1()}</li>
            <li>{m.privacy_policy_how_we_use_list_2()}</li>
            <li>{m.privacy_policy_how_we_use_list_3()}</li>
            <li>{m.privacy_policy_how_we_use_list_4()}</li>
            <li>{m.privacy_policy_how_we_use_list_5()}</li>
            <li>{m.privacy_policy_how_we_use_list_6()}</li>
          </ul>

          <h2>{m.privacy_policy_legal_basis_title()}</h2>
          <ul>
            <li>{m.privacy_policy_legal_basis_list_1()}</li>
            <li>{m.privacy_policy_legal_basis_list_2()}</li>
            <li>{m.privacy_policy_legal_basis_list_3()}</li>
          </ul>

          <h2>{m.privacy_policy_sharing_title()}</h2>
          <ul>
            <li>{m.privacy_policy_sharing_list_1()}</li>
            <li>{m.privacy_policy_sharing_list_2()}</li>
            <li>{m.privacy_policy_sharing_list_3()}</li>
            <li>{m.privacy_policy_sharing_list_4()}</li>
          </ul>

          <h2>{m.privacy_policy_data_retention_title()}</h2>
          <p>{m.privacy_policy_data_retention_content()}</p>

          <h2>{m.privacy_policy_security_title()}</h2>
          <p>{m.privacy_policy_security_content()}</p>

          <h2>{m.privacy_policy_international_transfers_title()}</h2>
          <p>{m.privacy_policy_international_transfers_content()}</p>

          <h2>{m.privacy_policy_your_rights_title()}</h2>
          <ul>
            <li>{m.privacy_policy_your_rights_list_1()}</li>
            <li>{m.privacy_policy_your_rights_list_2()}</li>
            <li>{m.privacy_policy_your_rights_list_3()}</li>
          </ul>

          <h2>{m.privacy_policy_children_title()}</h2>
          <p>{m.privacy_policy_children_content()}</p>

          <h2>{m.privacy_policy_changes_title()}</h2>
          <p>{m.privacy_policy_changes_content()}</p>

          <h2>{m.privacy_policy_contact_title()}</h2>
          <p>{m.privacy_policy_contact_content()}</p>
        </section>
      </div>
    </>
  );
}

