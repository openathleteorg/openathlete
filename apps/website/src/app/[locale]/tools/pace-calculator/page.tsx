import { PaceCalculator } from '@/components/tools/pace-calculator';
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
    path: '/tools/pace-calculator',
    title: m.tools_pace_seo_title(),
    description: m.tools_pace_seo_description(),
  });
}

export default async function Page({ params }: Props) {
  const locale = initLocale((await params).locale);
  return (
    <ToolPage
      locale={locale}
      slug="pace-calculator"
      title={m.tools_pace_h1()}
      lead={m.tools_pace_lead()}
      description={m.tools_pace_seo_description()}
      calculator={<PaceCalculator />}
      method={<p>{m.tools_pace_how_body()}</p>}
      faq={[
        { question: m.tools_pace_faq1_q(), answer: m.tools_pace_faq1_a() },
        { question: m.tools_pace_faq2_q(), answer: m.tools_pace_faq2_a() },
        { question: m.tools_pace_faq3_q(), answer: m.tools_pace_faq3_a() },
      ]}
    />
  );
}
