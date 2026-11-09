import {
  CONNECTOR_SLUGS,
  OtherConnectors,
  ProviderHero,
  ProviderLimits,
  ProviderSync,
  ProviderTutorial,
  getConnector,
  providerMessage,
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
import { notFound } from 'next/navigation';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string; provider: string }> };

/* eslint-disable react-refresh/only-export-components */
// The locale layout generates each language; this adds the providers
export function generateStaticParams() {
  return CONNECTOR_SLUGS.map((provider) => ({ provider }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props) {
  const { locale: rawLocale, provider } = await params;
  const locale = initLocale(rawLocale);
  const connector = getConnector(provider);
  if (!connector) notFound();
  return pageMetadata({
    locale,
    path: `/connect/${connector.slug}`,
    title: providerMessage(connector.slug, 'seo_title'),
    description: providerMessage(connector.slug, 'seo_description'),
  });
}
/* eslint-enable react-refresh/only-export-components */

export default async function ConnectProviderPage({ params }: Props) {
  const { locale: rawLocale, provider } = await params;
  const locale = initLocale(rawLocale);
  const connector = getConnector(provider);
  if (!connector) notFound();

  const path = `/connect/${connector.slug}`;
  const faqs = [1, 2, 3, 4].map((i) => ({
    question: providerMessage(connector.slug, `faq_${i}_q`),
    answer: providerMessage(connector.slug, `faq_${i}_a`),
  }));

  return (
    <>
      <WebPageStructuredData
        locale={locale}
        title={providerMessage(connector.slug, 'seo_title')}
        description={providerMessage(connector.slug, 'seo_description')}
        url={localizedUrl(locale, path)}
      />
      <BreadcrumbListStructuredData
        items={[
          { name: m.connect_crumb_home(), url: localizedUrl(locale) },
          {
            name: m.site_nav_integrations(),
            url: localizedUrl(locale, '/connect'),
          },
          { name: connector.name, url: localizedUrl(locale, path) },
        ]}
      />
      <FAQPageStructuredData faqs={faqs} />

      <ProviderHero connector={connector} locale={locale} />
      <ProviderSync connector={connector} />
      <ProviderTutorial connector={connector} />
      <ProviderLimits connector={connector} />
      <Section>
        <Container size="narrow">
          <h2 className="display-2 mb-10">
            {m.connect_faq_title({ provider: connector.name })}
          </h2>
          <Faq items={faqs} placement={`connect_${connector.slug}`} />
        </Container>
      </Section>
      <OtherConnectors current={connector} locale={locale} />
      <CtaBand
        locale={locale}
        placement={`connect_${connector.slug}_final`}
        title={providerMessage(connector.slug, 'final_title')}
        body={providerMessage(connector.slug, 'final_body')}
        secondary={{
          href: localePath(locale, '/connect'),
          label: m.connect_hub_link(),
        }}
      />
    </>
  );
}
