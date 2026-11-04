import { RelatedLinks } from '@/components/tools/related-links';
import { ToolPage } from '@/components/tools/tool-page';
import { TrailTimeEstimator } from '@/components/tools/trail-time-estimator';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/tools/trail-time-estimator',
    title: m.tools_trail_seo_title(),
    description: m.tools_trail_seo_description(),
  });
}

export default async function Page({ params }: Props) {
  const locale = initLocale((await params).locale);
  return (
    <ToolPage
      locale={locale}
      slug="trail-time-estimator"
      title={m.tools_trail_h1()}
      lead={m.tools_trail_lead()}
      description={m.tools_trail_seo_description()}
      calculator={<TrailTimeEstimator />}
      method={
        <>
          <p>{m.tools_trail_how_body()}</p>
          <p className="rounded-xl border border-border bg-white px-5 py-4 font-mono text-[0.92rem] leading-relaxed text-ink">
            {m.tools_trail_formula_effort()}
            <br />T = T<sub>ref</sub> × (E / E<sub>ref</sub>)
            <sup>{m.tools_trail_formula_exp()}</sup>
          </p>
          <p>{m.tools_trail_how_example()}</p>
          <p>{m.tools_trail_how_variants()}</p>
          <p className="text-[0.92rem] text-muted-foreground">
            {m.tools_trail_how_source()}
          </p>
        </>
      }
      extra={
        <>
          <div className="mt-10">
            <h3 className="text-[1.15rem] font-semibold text-ink">
              {m.tools_trail_limits_title()}
            </h3>
            <ul className="mt-4 space-y-3 text-[0.98rem] leading-relaxed text-[#2b3354]">
              {[
                m.tools_trail_limit_terrain(),
                m.tools_trail_limit_night(),
                m.tools_trail_limit_altitude(),
                m.tools_trail_limit_heat(),
                m.tools_trail_limit_aid(),
              ].map((item) => (
                <li key={item} className="border-l-2 border-coral pl-4">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <RelatedLinks
            locale={locale}
            links={[
              { href: '/tools/grade-adjusted-pace', label: m.tools_gap_name() },
              { href: '/tools/race-predictor', label: m.tools_rp_name() },
              {
                href: '/training-plans/trail/20km/800m',
                label: m.tools_links_trail_20(),
              },
              {
                href: '/training-plans/trail/30km/1000m',
                label: m.tools_links_trail_30(),
              },
              {
                href: '/training-plans/trail/50km/2500m',
                label: m.tools_links_trail_50(),
              },
              { href: '/pace-charts', label: m.tools_links_pace_charts() },
              { href: '/features/watch-sync', label: m.tools_links_gap_app() },
            ]}
          />
        </>
      }
      faq={[
        { question: m.tools_trail_faq1_q(), answer: m.tools_trail_faq1_a() },
        { question: m.tools_trail_faq2_q(), answer: m.tools_trail_faq2_a() },
        { question: m.tools_trail_faq3_q(), answer: m.tools_trail_faq3_a() },
        { question: m.tools_trail_faq4_q(), answer: m.tools_trail_faq4_a() },
        { question: m.tools_trail_faq5_q(), answer: m.tools_trail_faq5_a() },
      ]}
    />
  );
}
