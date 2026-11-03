import { homeFaqEntries } from '@/components/home/faq-entries';
import { HomeHero } from '@/components/home/hero';
import {
  HomeAi,
  HomeCost,
  HomeFaq,
  HomeLoad,
  HomeLogos,
  HomeMobile,
  HomeOpenSource,
  HomePaths,
  HomePricing,
  HomeTour,
} from '@/components/home/sections';
import {
  FAQPageStructuredData,
  SoftwareApplicationStructuredData,
} from '@/components/seo/structured-data';
import { CtaBand } from '@/components/site/cta-band';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';

import { generateMetadata as pageMetadata } from '../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    title: m.home_seo_title(),
    description: m.home_seo_description(),
  });
}

export default async function HomePage({ params }: Props) {
  const locale = initLocale((await params).locale);

  return (
    <>
      <SoftwareApplicationStructuredData
        locale={locale}
        description={m.home_seo_description()}
      />
      <FAQPageStructuredData faqs={homeFaqEntries()} />
      <HomeHero locale={locale} />
      <HomeLogos />
      <HomePaths locale={locale} />
      <HomeTour locale={locale} />
      <HomeLoad locale={locale} />
      <HomeAi locale={locale} />
      <HomeCost />
      <HomeOpenSource locale={locale} />
      <HomePricing />
      <HomeMobile locale={locale} />
      <HomeFaq />
      <CtaBand
        locale={locale}
        placement="home_final"
        title={m.home_final_title()}
        body={m.home_final_body()}
      />
    </>
  );
}
