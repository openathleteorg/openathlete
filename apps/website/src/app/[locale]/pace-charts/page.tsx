import { PaceBand } from '@/components/pace-charts/visuals';
import {
  BreadcrumbListStructuredData,
  ItemListStructuredData,
} from '@/components/seo/structured-data';
import { CtaBand } from '@/components/site/cta-band';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { initLocale } from '@/i18n/server';
import {
  buildPaceChart,
  formatDuration,
  formatNumber,
  formatPace,
  goalLabel,
} from '@/lib/pace-charts/chart';
import { chartValues, distanceCopy, raceLabel } from '@/lib/pace-charts/copy';
import { PACE_CHARTS, distanceSpec } from '@/lib/pace-charts/data';
import { m } from '@/paraglide/messages';
import { localePath, localizedUrl, toParaglideLocale } from '@/utils/locales';
import { ArrowRight, Calculator, Timer } from 'lucide-react';
import Link from 'next/link';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/pace-charts',
    title: m.pacechart_hub_seo_title(),
    description: m.pacechart_hub_seo_description(),
  });
}

/** The chart drawn next to the method: a common goal, as an example. */
const EXAMPLE = { distance: 'marathon', time: '3-45' };

export default async function PaceChartsHub({ params }: Props) {
  const locale = initLocale((await params).locale);
  const ml = toParaglideLocale(locale);
  const example = buildPaceChart(distanceSpec(EXAMPLE.distance)!, EXAMPLE.time);

  const steps = [
    [m.pacechart_hub_read_1_title(), m.pacechart_hub_read_1_body()],
    [m.pacechart_hub_read_2_title(), m.pacechart_hub_read_2_body()],
    [m.pacechart_hub_read_3_title(), m.pacechart_hub_read_3_body()],
    [m.pacechart_hub_read_4_title(), m.pacechart_hub_read_4_body()],
  ];

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          {
            name: m.pacechart_nav_label(),
            url: localizedUrl(locale, '/pace-charts'),
          },
        ]}
      />
      <ItemListStructuredData
        name={m.pacechart_hub_h1()}
        items={PACE_CHARTS.flatMap((spec) =>
          spec.goals.map((time) => {
            const chart = buildPaceChart(spec, time);
            return {
              name: distanceCopy(spec.slug).h1(chartValues(chart, ml), {
                locale: ml,
              }),
              url: localizedUrl(locale, `/pace-charts/${spec.slug}/${time}`),
            };
          }),
        )}
      />

      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)] opacity-70" />
        <Container className="relative">
          <p className="kicker mb-5 text-muted-foreground">
            {m.pacechart_nav_label()}
          </p>
          <h1 className="display-1 max-w-4xl text-ink">
            {m.pacechart_hub_h1()}
          </h1>
          <p className="lead mt-6 max-w-2xl">{m.pacechart_hub_lead()}</p>
        </Container>
      </section>

      {PACE_CHARTS.map((spec) => (
        <section key={spec.slug} className="pb-16 sm:pb-20">
          <Container>
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-border pb-4">
              <h2 className="display-3 text-ink">{raceLabel(spec.race, ml)}</h2>
              <p className="font-mono text-[0.8rem] text-muted-foreground">
                {m.pacechart_hub_count({ count: String(spec.goals.length) })}
              </p>
            </div>
            <RevealGroup className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
              {spec.goals.map((time) => {
                const chart = buildPaceChart(spec, time);
                return (
                  <RevealItem key={time}>
                    <Link
                      href={localePath(
                        locale,
                        `/pace-charts/${spec.slug}/${time}`,
                      )}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-white p-3 sm:p-4 transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[0_20px_40px_-28px_rgb(5_12_52/0.4)]"
                    >
                      <span className="font-mono text-[1.2rem] font-semibold sm:text-[1.5rem] tracking-[-0.03em] text-ink">
                        {goalLabel(time, ml)}
                      </span>
                      <span className="mt-2 font-mono text-[0.8rem] text-ink sm:text-[0.85rem]">
                        {formatPace(chart.pace)}
                        <span className="text-muted-foreground">/km</span>
                      </span>
                      <span className="font-mono text-[0.72rem] text-muted-foreground sm:text-[0.78rem]">
                        {formatNumber(chart.speedKmh, ml)} km/h
                      </span>
                      <ArrowRight className="mt-3 hidden size-4 sm:block text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-ink" />
                    </Link>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </Container>
        </section>
      ))}

      <Section tone="paper">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            <div>
              <Reveal>
                <p className="kicker mb-4 text-muted-foreground">
                  {m.pacechart_hub_read_kicker()}
                </p>
                <h2 className="display-2-side text-ink">
                  {m.pacechart_hub_read_title()}
                </h2>
              </Reveal>
              <ol className="mt-10 grid gap-8 sm:grid-cols-2">
                {steps.map(([title, body], index) => (
                  <li key={title}>
                    <Reveal delay={index * 0.05}>
                      <span className="flex size-8 items-center justify-center rounded-full border border-ink/15 font-mono text-[0.8rem] text-ink">
                        {index + 1}
                      </span>
                      <h3 className="mt-4 text-[1.1rem] font-semibold text-ink">
                        {title}
                      </h3>
                      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
                        {body}
                      </p>
                    </Reveal>
                  </li>
                ))}
              </ol>
            </div>
            <Reveal delay={0.1}>
              <Link
                href={localePath(
                  locale,
                  `/pace-charts/${EXAMPLE.distance}/${EXAMPLE.time}`,
                )}
                className="block transition-transform hover:-translate-y-0.5"
              >
                <PaceBand
                  title={`${m.pacechart_band_title()} · ${raceLabel(example.spec.race, ml)}`}
                  goal={goalLabel(EXAMPLE.time, ml)}
                  note={m.pacechart_band_note()}
                  rows={example.checkpoints.map((split) => ({
                    label:
                      split.metres === example.metres
                        ? m.pacechart_row_finish()
                        : split.metres === example.metres / 2
                          ? m.pacechart_row_halfway()
                          : `${split.metres / 1000} km`,
                    time: formatDuration(split.even),
                    strong: split.metres === example.metres,
                  }))}
                  className="mx-auto max-w-sm lg:rotate-[1.5deg]"
                />
              </Link>
            </Reveal>
          </div>
        </Container>
      </Section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <h2 className="display-3 text-ink">
                {m.pacechart_hub_tools_title()}
              </h2>
              <p className="mt-3 text-[1rem] leading-relaxed text-muted-foreground">
                {m.pacechart_hub_tools_body()}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  href: '/tools/pace-calculator',
                  name: m.tools_pace_name(),
                  card: m.tools_pace_card(),
                  Icon: Calculator,
                },
                {
                  href: '/tools/race-predictor',
                  name: m.tools_rp_name(),
                  card: m.tools_rp_card(),
                  Icon: Timer,
                },
              ].map(({ href, name, card, Icon }) => (
                <Link
                  key={href}
                  href={localePath(locale, href)}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-ink/25"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky/15 text-sky-strong">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">{name}</span>
                    <span className="mt-1 block text-[0.9rem] text-muted-foreground">
                      {card}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <CtaBand
        locale={locale}
        placement="pace_charts_hub_final"
        title={m.pacechart_hub_final_title()}
        body={m.pacechart_hub_final_body()}
      />
    </>
  );
}
