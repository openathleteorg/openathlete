import { RacePredictor } from '@/components/tools/race-predictor';
import { ToolPage } from '@/components/tools/tool-page';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localePath } from '@/utils/locales';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/tools/race-predictor',
    title: m.tools_rp_seo_title(),
    description: m.tools_rp_seo_description(),
  });
}

export default async function Page({ params }: Props) {
  const locale = initLocale((await params).locale);
  return (
    <ToolPage
      locale={locale}
      slug="race-predictor"
      title={m.tools_rp_h1()}
      lead={m.tools_rp_lead()}
      description={m.tools_rp_seo_description()}
      calculator={<RacePredictor />}
      extra={
        <Link
          href={localePath(locale, '/pace-charts')}
          className="group mt-8 flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-ink/25"
        >
          <span>
            <span className="block font-semibold text-ink">
              {m.pacechart_tools_card_title()}
            </span>
            <span className="mt-1 block text-[0.92rem] leading-relaxed text-muted-foreground">
              {m.pacechart_tools_card_body()}
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-ink transition-transform group-hover:translate-x-1" />
        </Link>
      }
      method={
        <>
          <p>{m.tools_rp_how_body()}</p>
          <p>{m.tools_rp_how_example()}</p>
          <p className="text-[0.92rem] text-muted-foreground">
            {m.tools_rp_how_source()}
          </p>
        </>
      }
      faq={[
        { question: m.tools_rp_faq1_q(), answer: m.tools_rp_faq1_a() },
        { question: m.tools_rp_faq2_q(), answer: m.tools_rp_faq2_a() },
        { question: m.tools_rp_faq3_q(), answer: m.tools_rp_faq3_a() },
        { question: m.tools_rp_faq4_q(), answer: m.tools_rp_faq4_a() },
      ]}
    />
  );
}
