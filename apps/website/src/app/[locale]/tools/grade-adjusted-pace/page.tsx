import { GradeAdjustedPace } from '@/components/tools/grade-adjusted-pace';
import { RelatedLinks } from '@/components/tools/related-links';
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
    path: '/tools/grade-adjusted-pace',
    title: m.tools_gap_seo_title(),
    description: m.tools_gap_seo_description(),
  });
}

export default async function Page({ params }: Props) {
  const locale = initLocale((await params).locale);
  return (
    <ToolPage
      locale={locale}
      slug="grade-adjusted-pace"
      title={m.tools_gap_h1()}
      lead={m.tools_gap_lead()}
      description={m.tools_gap_seo_description()}
      calculator={<GradeAdjustedPace />}
      method={
        <>
          <p>{m.tools_gap_how_body()}</p>
          <p className="overflow-x-auto rounded-xl border border-border bg-white px-5 py-4 font-mono text-[0.92rem] leading-relaxed whitespace-nowrap text-ink">
            {m.tools_gap_formula_flat()}
            <br />
            {m.tools_gap_formula_slope()}
          </p>
          <p>{m.tools_gap_how_example()}</p>
          <p>{m.tools_gap_how_app()}</p>
          <p className="text-[0.92rem] text-muted-foreground">
            {m.tools_gap_how_source()}
          </p>
        </>
      }
      extra={
        <RelatedLinks
          locale={locale}
          links={[
            { href: '/features/watch-sync', label: m.tools_links_gap_app() },
            {
              href: '/tools/trail-time-estimator',
              label: m.tools_trail_name(),
            },
            { href: '/tools/race-predictor', label: m.tools_rp_name() },
            {
              href: '/training-plans/trail',
              label: m.tools_links_trail_plans(),
            },
            { href: '/pace-charts', label: m.tools_links_pace_charts() },
          ]}
        />
      }
      faq={[
        { question: m.tools_gap_faq1_q(), answer: m.tools_gap_faq1_a() },
        { question: m.tools_gap_faq2_q(), answer: m.tools_gap_faq2_a() },
        { question: m.tools_gap_faq3_q(), answer: m.tools_gap_faq3_a() },
        { question: m.tools_gap_faq4_q(), answer: m.tools_gap_faq4_a() },
        { question: m.tools_gap_faq5_q(), answer: m.tools_gap_faq5_a() },
      ]}
    />
  );
}
