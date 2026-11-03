import {
  PaceBand,
  PaceScale,
  StepDot,
  WorkoutBars,
} from '@/components/pace-charts/visuals';
import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CtaBand } from '@/components/site/cta-band';
import { Faq } from '@/components/site/faq';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { SUPPORTED_LOCALES, initLocale } from '@/i18n/server';
import { signupUrl } from '@/lib/links';
import {
  type PaceChart,
  type Split,
  buildPaceChart,
  formatDuration,
  formatNumber,
  formatPace,
  goalLabel,
  hoursLabel,
  neighbours,
  paceOfSpeed,
} from '@/lib/pace-charts/chart';
import {
  chartValues,
  distanceCopy,
  inSentence,
  raceLabel,
} from '@/lib/pace-charts/copy';
import { distanceSpec, paceChartPaths } from '@/lib/pace-charts/data';
import { listPlans } from '@/lib/training-plans/catalog';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  localePath,
  localizedUrl,
  toParaglideLocale,
} from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { ArrowLeft, ArrowRight, Watch } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { generateMetadata as pageMetadata } from '../../../../metadata';

type Props = {
  params: Promise<{ locale: string; distance: string; time: string }>;
};

/* eslint-disable react-refresh/only-export-components */
export function generateStaticParams() {
  return paceChartPaths().flatMap((path) =>
    SUPPORTED_LOCALES.map((locale) => ({ locale, ...path })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props) {
  const { locale: raw, distance, time } = await params;
  const locale = initLocale(raw);
  const chart = resolve(distance, time);
  const ml = toParaglideLocale(locale);
  const values = chartValues(chart, ml);
  const copy = distanceCopy(chart.spec.slug);
  return pageMetadata({
    locale,
    path: `/pace-charts/${distance}/${time}`,
    title: copy.h1(values, { locale: ml }),
    description: copy.meta(values, { locale: ml }),
  });
}
/* eslint-enable react-refresh/only-export-components */

function resolve(distance: string, time: string): PaceChart {
  const spec = distanceSpec(distance);
  if (!spec || !spec.goals.includes(time)) notFound();
  return buildPaceChart(spec, time);
}

function km(metres: number, locale: SupportedLocale) {
  const value = metres / 1000;
  return Number.isInteger(value)
    ? String(value)
    : formatNumber(value, toParaglideLocale(locale), 1);
}

const capitalize = (text: string) =>
  text.charAt(0).toLocaleUpperCase() + text.slice(1);

function checkpointLabel(split: Split, chart: PaceChart) {
  if (split.metres === chart.metres) return m.pacechart_row_finish();
  if (split.metres === chart.metres / 2) return m.pacechart_row_halfway();
  return undefined;
}

export default async function Page({ params }: Props) {
  const { locale: raw, distance, time } = await params;
  const locale = initLocale(raw);
  const ml = toParaglideLocale(locale);
  const chart = resolve(distance, time);
  const values = chartValues(chart, ml);
  const copy = distanceCopy(chart.spec.slug);
  const o = { locale: ml };
  const path = `/pace-charts/${distance}/${time}`;
  const title = copy.h1(values, o);
  const race = raceLabel(chart.spec.race, ml);
  const near = neighbours(chart.spec, time);
  const plan = listPlans().find(
    (p) =>
      p.sport === 'running' &&
      p.distance === chart.spec.planDistance &&
      p.variant === time.replace('-', 'h'),
  );

  const faq = [
    { question: copy.faq1(values, o), answer: m.pacechart_faq1_a(values) },
    copy.faq2(chart, values, o),
    {
      question: m.pacechart_faq3_q(),
      answer: m.pacechart_faq3_a({
        halfway: values.halfway,
        first: formatDuration(chart.halfway.first),
        second: formatDuration(chart.halfway.second),
      }),
    },
  ];

  const bench = chart.benchmarks[0];
  const { paces } = chart;
  const workoutLabel = {
    warmUp: m.pacechart_wo_warmup(),
    goal: m.pacechart_wo_goal(),
    float: m.pacechart_wo_float(),
    coolDown: m.pacechart_wo_cooldown(),
  };

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          {
            name: m.pacechart_nav_label(),
            url: localizedUrl(locale, '/pace-charts'),
          },
          { name: title, url: localizedUrl(locale, path) },
        ]}
      />
      <FAQPageStructuredData faqs={faq} />

      {/* Hero: the numbers first, the wristband next to them */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)] opacity-70" />
        <Container className="relative">
          <Link
            href={localePath(locale, '/pace-charts')}
            className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink/25"
          >
            <ArrowLeft className="size-3.5" />
            {m.pacechart_nav_all()}
          </Link>
          <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-start lg:gap-16">
            <div>
              <p className="kicker mb-4 text-muted-foreground">
                {m.pacechart_kicker()} · {race}
              </p>
              <h1 className="display-1 text-ink">{title}</h1>
              <p className="lead mt-6 max-w-2xl">{m.pacechart_lead(values)}</p>
              <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
                {[
                  { label: m.pacechart_stat_km(), value: values.pace },
                  { label: m.pacechart_stat_mile(), value: values.mile },
                  {
                    label: m.pacechart_stat_speed(),
                    value: `${values.speed}`,
                    unit: 'km/h',
                  },
                  { label: m.pacechart_stat_halfway(), value: values.halfway },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white px-5 py-4">
                    <dt className="text-[0.82rem] text-muted-foreground">
                      {stat.label}
                    </dt>
                    <dd className="mt-1 font-mono text-[1.45rem] font-semibold tracking-[-0.02em] text-ink">
                      {stat.value}
                      {stat.unit && (
                        <span className="ml-1 text-[0.8rem] font-normal text-muted-foreground">
                          {stat.unit}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <Reveal delay={0.1}>
              <PaceBand
                title={m.pacechart_band_title()}
                goal={values.time}
                note={m.pacechart_band_note()}
                rows={chart.checkpoints.map((split) => ({
                  label:
                    checkpointLabel(split, chart) ??
                    `${km(split.metres, locale)} km`,
                  time: formatDuration(split.even),
                  strong: split.metres === chart.metres,
                }))}
                className="mx-auto max-w-sm lg:-rotate-[1.5deg]"
              />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Splits: checkpoints, then every kilometre */}
      <Section className="!pt-4">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Reveal>
              <p className="kicker mb-4 text-muted-foreground">
                {m.pacechart_splits_kicker()}
              </p>
              <h2 className="display-2-side text-ink">
                {m.pacechart_splits_title()}
              </h2>
              <p className="mt-5 text-[1.02rem] leading-relaxed text-[#2b3354]">
                {m.pacechart_splits_body({
                  pace: values.pace,
                  slow: formatPace(chart.firstHalfPace),
                  fast: formatPace(chart.secondHalfPace),
                  first: formatDuration(chart.halfway.first),
                  second: formatDuration(chart.halfway.second),
                })}
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_20px_40px_-30px_rgb(5_12_52/0.35)]">
                <table className="w-full text-left">
                  <thead className="bg-paper text-[0.8rem] text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium sm:px-6">
                        {m.pacechart_col_distance()}
                      </th>
                      <th className="px-4 py-3 text-right font-medium sm:px-6">
                        {m.pacechart_col_even()}
                      </th>
                      <th className="px-4 py-3 text-right font-medium sm:px-6">
                        {m.pacechart_col_negative()}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono text-[0.95rem]">
                    {chart.checkpoints.map((split) => {
                      const label = checkpointLabel(split, chart);
                      return (
                        <tr
                          key={split.metres}
                          className={cn(label && 'bg-mint/[0.07]')}
                        >
                          <td className="px-4 py-2.5 whitespace-nowrap text-ink sm:px-6">
                            {km(split.metres, locale)} km
                            {label && (
                              <span className="block font-sans text-[0.78rem] text-mint-strong sm:ml-2 sm:inline">
                                {label}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-ink sm:px-6">
                            {formatDuration(split.even)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-[#2b3354] sm:px-6">
                            {formatDuration(split.negative)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>

          <div className="mt-16 sm:mt-20">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <h3 className="display-3 text-ink">
                {m.pacechart_perkm_title()}
              </h3>
              <p className="text-[0.88rem] text-muted-foreground">
                {m.pacechart_perkm_note()}
              </p>
            </div>
            <ol className="mt-6 grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-6">
              {chart.everyKm.map((split) => (
                <li
                  key={split.metres}
                  className={cn(
                    'rounded-xl border px-2.5 py-2 sm:px-3 sm:py-2.5',
                    split.metres % 5000 === 0 || split.metres === chart.metres
                      ? 'border-ink/15 bg-paper'
                      : 'border-border bg-white',
                  )}
                >
                  <p className="font-mono text-[0.72rem] text-muted-foreground">
                    {km(split.metres, locale)} km
                  </p>
                  <p className="font-mono text-[0.88rem] sm:text-[0.98rem] font-semibold text-ink">
                    {formatDuration(split.even)}
                  </p>
                  <p className="font-mono text-[0.78rem] text-orchid-strong">
                    {formatDuration(split.negative)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {/* Equivalents and training paces */}
      <Section tone="paper">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <Reveal className="rounded-[1.5rem] border border-border bg-white p-6 sm:p-8">
              <p className="kicker mb-3 text-muted-foreground">
                {m.pacechart_eq_kicker()}
              </p>
              <h2 className="display-3 text-ink">
                {m.pacechart_eq_title(values)}
              </h2>
              <p className="mt-4 text-[1rem] leading-relaxed text-[#2b3354]">
                {m.pacechart_eq_body({
                  bench: inSentence(raceLabel(bench.race, ml), ml),
                  benchTime: formatDuration(bench.seconds),
                })}
              </p>
              <table className="mt-6 w-full text-left">
                <thead className="text-[0.8rem] text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 font-medium">
                      {m.pacechart_eq_col_race()}
                    </th>
                    <th className="py-2 text-right font-medium">
                      {m.pacechart_eq_col_time()}
                    </th>
                    <th className="py-2 text-right font-medium">
                      {m.pacechart_eq_col_pace()}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-[0.95rem]">
                  {[
                    ...chart.equivalents,
                    {
                      race: chart.spec.race,
                      seconds: chart.seconds,
                      pace: chart.pace,
                      goal: true,
                    },
                  ]
                    .sort((a, b) => a.seconds - b.seconds)
                    .map((row) => (
                      <tr
                        key={row.race}
                        className={cn('goal' in row && 'text-coral-strong')}
                      >
                        <td className="py-2.5 font-sans text-ink">
                          {raceLabel(row.race, ml)}
                          {'goal' in row && (
                            <span className="ml-2 rounded-full bg-coral/15 px-2 py-0.5 text-[0.72rem] font-medium text-coral-strong">
                              {m.pacechart_eq_goal()}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-semibold">
                          {formatDuration(row.seconds)}
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">
                          {formatPace(row.pace)}/km
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <p className="mt-6 text-[0.9rem] leading-relaxed text-muted-foreground">
                {m.pacechart_eq_note()}{' '}
                <Link
                  href={localePath(locale, '/tools/race-predictor')}
                  className="font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
                >
                  {m.pacechart_eq_link()}
                </Link>
              </p>
            </Reveal>

            <Reveal
              delay={0.1}
              className="rounded-[1.5rem] border border-border bg-white p-6 sm:p-8"
            >
              <p className="kicker mb-3 text-muted-foreground">
                {m.pacechart_tp_kicker()}
              </p>
              <h2 className="display-3 text-ink">
                {m.pacechart_tp_title(values)}
              </h2>
              <p className="mt-4 text-[1rem] leading-relaxed text-[#2b3354]">
                {m.pacechart_tp_body({ vdot: formatNumber(chart.vdot, ml) })}
              </p>
              <div className="mt-7">
                <PaceScale
                  rows={[
                    {
                      label: m.pacechart_tp_easy(),
                      description: m.pacechart_tp_easy_desc(),
                      pace: `${paceOfSpeed(paces.easy.slowest)}–${paceOfSpeed(paces.easy.fastest)}`,
                      from: paces.easy.slowest,
                      to: paces.easy.fastest,
                      color: '#9fd3fb',
                    },
                    {
                      label: m.pacechart_tp_marathon(),
                      description: m.pacechart_tp_marathon_desc(),
                      pace: paceOfSpeed(paces.marathon),
                      to: paces.marathon,
                      color: '#12a594',
                    },
                    {
                      label: m.pacechart_tp_threshold(),
                      description: m.pacechart_tp_threshold_desc(),
                      pace: paceOfSpeed(paces.threshold),
                      to: paces.threshold,
                      color: '#f2b13c',
                    },
                    {
                      label: m.pacechart_tp_interval(),
                      description: m.pacechart_tp_interval_desc(),
                      pace: paceOfSpeed(paces.interval),
                      to: paces.interval,
                      color: '#f4743b',
                    },
                    {
                      label: m.pacechart_tp_repetition(),
                      description: m.pacechart_tp_repetition_desc(),
                      pace: paceOfSpeed(paces.repetition),
                      to: paces.repetition,
                      color: '#e2582a',
                    },
                  ]}
                />
              </div>
              <p className="mt-7 border-t border-border pt-4 text-[0.82rem] leading-relaxed text-muted-foreground">
                {m.pacechart_tp_source()}
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* The key session, and the way to the watch */}
      <Section tone="ink">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 [&>*]:min-w-0">
            <Reveal>
              <p className="kicker mb-4 text-ink-soft">
                {m.pacechart_wo_kicker()}
              </p>
              <h2 className="display-2-side text-white">
                {copy.workoutTitle(values, o)}
              </h2>
              <p className="lead mt-5 text-ink-soft">
                {copy.workoutBody(values, o)}
              </p>
              <div className="mt-8">
                <TrackedLink
                  href={signupUrl('pace_chart_workout')}
                  event="cta_clicked"
                  properties={{
                    placement: 'pace_chart_workout',
                    cta: 'signup',
                  }}
                  className={cn(
                    buttonStyles({ variant: 'light', size: 'lg' }),
                    'h-auto min-h-12 py-3 text-left whitespace-normal',
                  )}
                >
                  <Watch />
                  {m.pacechart_wo_cta()}
                </TrackedLink>
                <p className="mt-4 max-w-md text-[0.88rem] leading-relaxed text-white/55">
                  {m.pacechart_wo_cta_note()}
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-border bg-white p-5 text-ink shadow-[0_24px_48px_-28px_rgb(0_0_0/0.5)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-[0.95rem] font-semibold">
                    {copy.workoutTitle(values, o)}
                  </p>
                  <p className="shrink-0 font-mono text-[0.72rem] text-muted-foreground">
                    {m.pacechart_wo_total({
                      km: String(chart.workout.km),
                      duration: hoursLabel(chart.workout.seconds, ml),
                    })}
                  </p>
                </div>
                <div className="mt-5">
                  <WorkoutBars steps={chart.workout.steps} />
                </div>
                <ol className="mt-5 divide-y divide-border text-[0.9rem]">
                  {chart.workout.steps.map((step, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span className="flex items-center gap-2.5">
                        <StepDot kind={step.kind} />
                        <span className="w-12 font-mono text-muted-foreground">
                          {step.km} km
                        </span>
                        <span
                          className={cn(
                            step.kind === 'goal' && 'font-semibold text-ink',
                          )}
                        >
                          {workoutLabel[step.kind]}
                        </span>
                      </span>
                      <span className="font-mono text-ink">
                        {formatPace(step.pace)}/km
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Who the goal fits */}
      <Section>
        <Container>
          <Reveal className="max-w-[44rem]">
            <p className="kicker mb-4 text-muted-foreground">
              {m.pacechart_fit_kicker()}
            </p>
            <h2 className="display-2-side text-ink">
              {m.pacechart_fit_title(values)}
            </h2>
          </Reveal>
          <RevealGroup className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(
              [
                ...chart.benchmarks.map((b) => ({
                  label: capitalize(
                    m.pacechart_fit_race_label({
                      race: inSentence(raceLabel(b.race, ml), ml),
                    }),
                  ),
                  value: formatDuration(b.seconds),
                  note: m.pacechart_fit_race_note(),
                })),
                {
                  label: m.pacechart_fit_peak_label(),
                  value: `${chart.fit.peakKm[0]}–${chart.fit.peakKm[1]}`,
                  unit: 'km',
                },
                {
                  label: m.pacechart_fit_runs_label(),
                  value: `${chart.fit.runsPerWeek[0]}–${chart.fit.runsPerWeek[1]}`,
                },
              ] as {
                label: string;
                value: string;
                unit?: string;
                note?: string;
              }[]
            ).map((card) => (
              <RevealItem
                key={card.label}
                className="rounded-2xl border border-border bg-white p-5"
              >
                <p className="text-[0.85rem] text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-2 font-mono text-[1.6rem] font-semibold tracking-[-0.02em] text-ink">
                  {card.value}
                  {card.unit && (
                    <span className="ml-1 text-[0.85rem] font-normal text-muted-foreground">
                      {card.unit}
                    </span>
                  )}
                </p>
                {card.note && (
                  <p className="mt-1 text-[0.78rem] text-muted-foreground">
                    {card.note}
                  </p>
                )}
              </RevealItem>
            ))}
          </RevealGroup>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <p className="text-[1rem] leading-relaxed text-[#2b3354]">
              {m.pacechart_fit_body()}
            </p>
            <Reveal className="brand-gradient rounded-2xl p-[1.5px]">
              <div className="rounded-[calc(1rem-1.5px)] bg-white p-6">
                <p className="text-[1.1rem] font-semibold text-ink">
                  {plan
                    ? m.pacechart_fit_plan_title()
                    : m.pacechart_fit_noplan_title()}
                </p>
                <p className="mt-2 text-[0.93rem] leading-relaxed text-muted-foreground">
                  {plan
                    ? m.pacechart_fit_plan_body()
                    : m.pacechart_fit_noplan_body()}
                </p>
                <Link
                  href={localePath(locale, plan?.path ?? '/training-plans')}
                  className={cn(
                    buttonStyles({ variant: 'secondary', size: 'md' }),
                    'mt-5',
                  )}
                >
                  {plan
                    ? m.pacechart_fit_plan_cta(values)
                    : m.pacechart_fit_noplan_cta()}
                  <ArrowRight />
                </Link>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Nearby goals */}
      <section className="pb-4">
        <Container>
          <h2 className="kicker mb-5 text-muted-foreground">
            {m.pacechart_nav_title()}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              near.faster && {
                slug: near.faster,
                label: m.pacechart_nav_faster(),
              },
              near.slower && {
                slug: near.slower,
                label: m.pacechart_nav_slower(),
              },
            ]
              .filter((link) => !!link)
              .map((link) => {
                const other = buildPaceChart(chart.spec, link.slug);
                return (
                  <Link
                    key={link.slug}
                    href={localePath(
                      locale,
                      `/pace-charts/${distance}/${link.slug}`,
                    )}
                    className="group flex items-center justify-between rounded-2xl border border-border bg-white p-5 transition-colors hover:border-ink/25"
                  >
                    <span>
                      <span className="block text-[0.82rem] text-muted-foreground">
                        {link.label}
                      </span>
                      <span className="mt-0.5 block font-semibold text-ink">
                        {race} {goalLabel(link.slug, ml)}
                      </span>
                      <span className="block font-mono text-[0.82rem] text-muted-foreground">
                        {formatPace(other.pace)}/km
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-ink transition-transform group-hover:translate-x-1" />
                  </Link>
                );
              })}
            <Link
              href={localePath(locale, '/pace-charts')}
              className="group flex items-center justify-between rounded-2xl border border-dashed border-border p-5 transition-colors hover:border-ink/25"
            >
              <span className="font-semibold text-ink">
                {m.pacechart_nav_all()}
              </span>
              <ArrowRight className="size-4 text-ink transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Container>
      </section>

      <Section className="!py-16 sm:!py-24">
        <Container size="narrow">
          <h2 className="display-3 mb-8 text-ink">
            {m.tools_common_faq_title()}
          </h2>
          <Faq items={faq} placement="pace_chart" />
        </Container>
      </Section>

      <CtaBand
        locale={locale}
        placement="pace_chart_final"
        title={m.pacechart_final_title(values)}
        body={m.pacechart_final_body()}
      />
    </>
  );
}
