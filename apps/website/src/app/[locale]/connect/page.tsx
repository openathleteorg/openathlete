import {
  HubHero,
  HubMatrix,
  HubOtherWays,
  HubSelfHost,
} from '@/components/connect';
import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
  WebPageStructuredData,
} from '@/components/seo/structured-data';
import { CtaBand } from '@/components/site/cta-band';
import { Faq } from '@/components/site/faq';
import { Container, Section } from '@/components/site/layout-primitives';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localePath, localizedUrl } from '@/utils/locales';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/connect',
    title: m.connect_hub_seo_title(),
    description: m.connect_hub_seo_description(),
  });
}

function hubFaqs() {
  return [
    { question: m.connect_hub_faq_1_q(), answer: m.connect_hub_faq_1_a() },
    { question: m.connect_hub_faq_2_q(), answer: m.connect_hub_faq_2_a() },
    { question: m.connect_hub_faq_3_q(), answer: m.connect_hub_faq_3_a() },
    { question: m.connect_hub_faq_4_q(), answer: m.connect_hub_faq_4_a() },
    { question: m.connect_hub_faq_5_q(), answer: m.connect_hub_faq_5_a() },
  ];
}

export default async function ConnectHubPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const faqs = hubFaqs();
  return (
    <>
      <WebPageStructuredData
        locale={locale}
        title={m.connect_hub_seo_title()}
        description={m.connect_hub_seo_description()}
        url={localizedUrl(locale, '/connect')}
      />
      <BreadcrumbListStructuredData
        items={[
          { name: m.connect_crumb_home(), url: localizedUrl(locale) },
          {
            name: m.site_nav_integrations(),
            url: localizedUrl(locale, '/connect'),
          },
        ]}
      />
      <FAQPageStructuredData faqs={faqs} />

      <HubHero locale={locale} />
      <HubMatrix locale={locale} />
      <HubOtherWays locale={locale} />
      <HubSelfHost />
      <Section>
        <Container size="narrow">
          <h2 className="display-2 mb-10">{m.connect_hub_faq_title()}</h2>
          <Faq items={faqs} placement="connect_hub" />
        </Container>
      </Section>
      <CtaBand
        locale={locale}
        placement="connect_hub_final"
        title={m.connect_hub_final_title()}
        body={m.connect_hub_final_body()}
        secondary={{
          href: localePath(locale, '/features/watch-sync'),
          label: m.connect_hero_secondary(),
        }}
      />
    </>
  );
}
