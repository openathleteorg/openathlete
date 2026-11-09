import { HeartRateZonesCalculator } from '@/components/tools/heart-rate-zones';
import { ToolPage } from '@/components/tools/tool-page';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/tools/heart-rate-zones',
    title: m.tools_hr_seo_title(),
    description: m.tools_hr_seo_description(),
  });
}

export default async function Page({ params }: Props) {
  const locale = initLocale((await params).locale);
  return (
    <ToolPage
      locale={locale}
      slug="heart-rate-zones"
      title={m.tools_hr_h1()}
      lead={m.tools_hr_lead()}
      description={m.tools_hr_seo_description()}
      calculator={<HeartRateZonesCalculator />}
      method={
        <>
          <p>{m.tools_hr_how_body()}</p>
          <p>{m.tools_hr_how_example()}</p>
          <p>{m.tools_hr_how_max()}</p>
        </>
      }
      faq={[
        { question: m.tools_hr_faq1_q(), answer: m.tools_hr_faq1_a() },
        { question: m.tools_hr_faq2_q(), answer: m.tools_hr_faq2_a() },
        { question: m.tools_hr_faq4_q(), answer: m.tools_hr_faq4_a() },
        { question: m.tools_hr_faq5_q(), answer: m.tools_hr_faq5_a() },
        { question: m.tools_hr_faq3_q(), answer: m.tools_hr_faq3_a() },
      ]}
    />
  );
}
