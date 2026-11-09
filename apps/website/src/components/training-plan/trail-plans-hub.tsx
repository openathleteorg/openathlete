import {
  BreadcrumbListStructuredData,
  ItemListStructuredData,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CtaBand } from '@/components/site/cta-band';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { sportLabel } from '@/lib/training-plans/labels';
import { loadPlan } from '@/lib/training-plans/plan-loader';
import {
  formatDplus,
  formatMinutes,
  runsLabel,
  trailPlans,
  trailStats,
  trailTitleValues,
} from '@/lib/training-plans/trail';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { TrailTargetsSection, TrailToolLinks } from './trail-sections';

/** Weekly climbing as a ridge line: the shape of the plan at a glance. */
function DplusProfile({ weekly }: { weekly: number[] }) {
  const max = Math.max(...weekly, 1);
  const width = 100;
  const height = 36;
  const step = width / (weekly.length - 1);
  const points = weekly.map(
    (value, index) =>
      `${(index * step).toFixed(2)},${(height - (value / max) * (height - 4)).toFixed(2)}`,
  );
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-14 w-full"
      aria-hidden
    >
      <polygon
        points={`0,${height} ${points.join(' ')} ${width},${height}`}
        className="fill-mint/25"
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        vectorEffect="non-scaling-stroke"
        className="stroke-mint-strong"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const COACHING = () => [
  [m.trailplan_coach_1_title(), m.trailplan_coach_1_body()],
  [m.trailplan_coach_2_title(), m.trailplan_coach_2_body()],
  [m.trailplan_coach_3_title(), m.trailplan_coach_3_body()],
  [m.trailplan_coach_4_title(), m.trailplan_coach_4_body()],
  [m.trailplan_coach_5_title(), m.trailplan_coach_5_body()],
  [m.trailplan_coach_6_title(), m.trailplan_coach_6_body()],
];

/** `/training-plans/trail`: the plans by race, how they train, the tools. */
export async function TrailPlansHub({ locale }: { locale: SupportedLocale }) {
  const path = '/training-plans/trail';
  const plans = await Promise.all(
    trailPlans().map(async (entry) => {
      const data = await loadPlan(
        entry.sport,
        entry.distance,
        entry.variant,
        locale,
      );
      return {
        entry,
        stats: trailStats(data),
        values: trailTitleValues(locale, entry.distance, data),
      };
    }),
  );
  const title = m.plans_hub_trail_h1();

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          {
            name: m.plans_hub_kicker(),
            url: localizedUrl(locale, '/training-plans'),
          },
          { name: sportLabel('trail'), url: localizedUrl(locale, path) },
        ]}
      />
      {plans.length > 0 && (
        <ItemListStructuredData
          name={title}
          items={plans.map(({ entry, values }) => ({
            name: m.trailplan_h1(values),
            url: localizedUrl(locale, entry.path),
          }))}
        />
      )}

      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)] opacity-70" />
        <Container className="relative">
          <p className="kicker mb-5 text-muted-foreground">
            <Link
              href={localePath(locale, '/training-plans')}
              className="hover:text-ink"
            >
              {m.plans_hub_kicker()}
            </Link>{' '}
            / {sportLabel('trail')}
          </p>
          <h1 className="display-1 max-w-4xl text-ink">{title}</h1>
          <p className="lead mt-6 max-w-2xl">{m.trailhub_lead()}</p>
        </Container>
      </section>

      <section className="pb-16 sm:pb-24">
        <Container>
          <h2 className="display-3 mb-8 text-ink">{m.trailhub_list_title()}</h2>
          <RevealGroup className="grid gap-5 md:grid-cols-3">
            {plans.map(({ entry, stats, values }) => (
              <RevealItem key={entry.path} className="h-full">
                <Link
                  href={localePath(locale, entry.path)}
                  className="group flex h-full flex-col rounded-[1.5rem] border border-border bg-white p-6 transition-[border-color,box-shadow] hover:border-ink/15 hover:shadow-[0_24px_48px_-30px_rgb(5_12_52/0.4)] sm:p-7"
                >
                  <p className="font-mono text-[2.1rem] leading-none font-semibold tracking-tight text-ink">
                    {values.distance}
                  </p>
                  <p className="mt-2 font-mono text-[1rem] text-mint-strong">
                    {values.dplus} m D+
                  </p>
                  <p className="mt-4 text-[0.9rem] text-muted-foreground">
                    {m.trailhub_card_weeks({ weeks: values.weeks })} ·{' '}
                    {m.trailhub_card_runs({ runs: runsLabel(stats) })}
                  </p>
                  <div className="mt-5">
                    <p className="text-[0.75rem] text-muted-foreground">
                      {m.trailhub_card_profile()}
                    </p>
                    <DplusProfile weekly={stats.weeklyDplus} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-[0.85rem]">
                    <div>
                      <dt className="text-muted-foreground">
                        {m.trailplan_stat_long()}
                      </dt>
                      <dd className="mt-0.5 font-mono text-ink">
                        {formatMinutes(stats.longestMinutes)} ·{' '}
                        {formatDplus(locale, stats.longestDplus)} m
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        {m.trailplan_stat_peak()}
                      </dt>
                      <dd className="mt-0.5 font-mono text-ink">
                        {stats.peakKm} km ·{' '}
                        {formatDplus(locale, stats.peakDplus)} m
                      </dd>
                    </div>
                  </dl>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink">
                    {m.plans_hub_view()}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
          <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-ink/20 bg-paper p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
              {m.trailhub_more()}
            </p>
            <Link
              href={localePath(locale, '/features/mcp-server')}
              className={buttonStyles({ variant: 'secondary', size: 'md' })}
            >
              {m.plans_hub_soon_mcp()}
              <ArrowRight />
            </Link>
          </div>
        </Container>
      </section>

      <Section tone="ink" className="!py-16 sm:!py-24">
        <Container>
          <Reveal>
            <h2 className="display-2-side max-w-xl text-white">
              {m.trailplan_coach_title()}
            </h2>
          </Reveal>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COACHING().map(([heading, body], index) => (
              <li
                key={heading}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
              >
                <span className="font-mono text-[0.8rem] text-ink-soft">
                  0{index + 1}
                </span>
                <h3 className="mt-3 text-[1.1rem] font-semibold text-white">
                  {heading}
                </h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <TrailTargetsSection />

      <Section className="!py-16 sm:!py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <TrailToolLinks locale={locale} />
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="display-3 text-ink">{m.plans_hub_how_title()}</h2>
              <ol className="mt-6 space-y-3">
                {[
                  m.plans_hub_how_1(),
                  m.plans_hub_how_2(),
                  m.plans_hub_how_3(),
                ].map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-4 rounded-2xl border border-border bg-white p-5"
                  >
                    <span className="font-mono text-[0.8rem] text-muted-foreground">
                      0{index + 1}
                    </span>
                    <p className="text-[0.98rem] leading-relaxed text-ink">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </Container>
      </Section>

      <CtaBand
        locale={locale}
        placement="plans_trail_final"
        title={m.plans_hub_final_title()}
        body={m.plans_hub_final_body()}
      />
    </>
  );
}
