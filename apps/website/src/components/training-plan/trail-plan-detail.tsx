import {
  BreadcrumbListStructuredData,
  TrainingPlanStructuredData,
} from '@/components/seo/structured-data';
import { CtaBand } from '@/components/site/cta-band';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal } from '@/components/site/reveal';
import type { PlanEntry } from '@/lib/training-plans/catalog';
import { sportLabel } from '@/lib/training-plans/labels';
import {
  formatDplus,
  formatMinutes,
  runsLabel,
  sessionTargets,
  trailDistanceLabel,
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
import { ArrowLeft, ArrowUpRight, Mountain, Watch } from 'lucide-react';
import Link from 'next/link';

import type { SEOPlanData } from '@openathlete/shared';

import { ImportButton } from './import-button';
import { TrailTargetsSection, TrailToolLinks } from './trail-sections';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const FALLBACK_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

/** Weekly kilometres and metres of climbing side by side. */
function TrailVolumeChart({
  locale,
  data,
  weeklyKm,
  weeklyDplus,
}: {
  locale: SupportedLocale;
  data: SEOPlanData;
  weeklyKm: number[];
  weeklyDplus: number[];
}) {
  const maxKm = Math.max(...weeklyKm, 1);
  const maxDplus = Math.max(...weeklyDplus, 1);
  const weeks = data.cycles.flatMap((cycle, c) =>
    cycle.weeks.map((week) => ({
      week,
      color: cycle.color ?? FALLBACK_COLORS[c % 4],
    })),
  );
  return (
    <div>
      <div className="flex h-48 items-end gap-1 sm:gap-2">
        {weeks.map(({ week, color }, index) => (
          <div
            key={week.weekNumber}
            className="flex h-full flex-1 items-end gap-px sm:gap-0.5"
            title={`${m.tplan_week({ week: String(week.weekNumber) })}: ${Math.round(weeklyKm[index])} km, ${formatDplus(locale, weeklyDplus[index])} m D+`}
          >
            <span
              className="block flex-1 rounded-t-[3px]"
              style={{
                height: `${(weeklyKm[index] / maxKm) * 100}%`,
                background: color,
              }}
            />
            <span
              className="block flex-1 rounded-t-[3px] bg-white/70"
              style={{ height: `${(weeklyDplus[index] / maxDplus) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 sm:gap-2">
        {weeks.map(({ week }) => (
          <span
            key={week.weekNumber}
            className="flex-1 text-center font-mono text-[0.6rem] text-ink-soft sm:text-[0.65rem]"
          >
            {week.weekNumber}
          </span>
        ))}
      </div>
      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.82rem] text-ink-soft">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-4 rounded-sm bg-gradient-to-r from-[#3b82f6] via-[#10b981] to-[#6366f1]" />
          {m.trailplan_volume_km()}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-4 rounded-sm bg-white/70" />
          {m.trailplan_volume_dplus()}
        </li>
        {data.cycles.map((cycle, c) => (
          <li key={cycle.name} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ background: cycle.color ?? FALLBACK_COLORS[c % 4] }}
            />
            {cycle.name}
          </li>
        ))}
      </ul>
      <p className="mt-5 max-w-2xl text-[0.82rem] text-ink-soft">
        {m.trailplan_volume_note()}
      </p>
    </div>
  );
}

/** A trail plan page: climbing, readable targets, the trail tools. */
export function TrailPlanDetail({
  locale,
  entry,
  data,
}: {
  locale: SupportedLocale;
  entry: PlanEntry;
  data: SEOPlanData;
}) {
  const stats = trailStats(data);
  const values = trailTitleValues(locale, entry.distance, data);
  const url = localizedUrl(locale, entry.path);
  const translated = entry.locales.includes(locale);
  const placement = `plan_trail_${entry.distance}_${entry.variant}`;
  const days = [
    m.tplan_day_0(),
    m.tplan_day_1(),
    m.tplan_day_2(),
    m.tplan_day_3(),
    m.tplan_day_4(),
    m.tplan_day_5(),
    m.tplan_day_6(),
  ];
  const hub = '/training-plans/trail';
  const others = trailPlans().filter((p) => p.path !== entry.path);
  const title = m.trailplan_h1(values);

  const facts: [string, string, string?][] = [
    [m.tplan_weeks(), String(stats.weeks)],
    [
      m.tplan_runs(),
      runsLabel(stats),
      stats.hasStrength ? m.trailplan_plus_strength() : undefined,
    ],
    [
      m.trailplan_stat_long(),
      formatMinutes(stats.longestMinutes),
      `${formatDplus(locale, stats.longestDplus)} m D+`,
    ],
    [
      m.trailplan_stat_peak(),
      `${stats.peakKm} km`,
      `${formatDplus(locale, stats.peakDplus)} m D+`,
    ],
  ];

  return (
    <>
      <TrainingPlanStructuredData
        title={title}
        description={data.plan.description}
        url={url}
        locale={translated ? locale : 'en'}
        sport="Trail running"
        weeks={stats.weeks}
        sessionsPerWeek={stats.runsMax}
      />
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          {
            name: m.plans_hub_kicker(),
            url: localizedUrl(locale, '/training-plans'),
          },
          { name: sportLabel('trail'), url: localizedUrl(locale, hub) },
          { name: title, url },
        ]}
      />

      <section className="relative overflow-hidden pt-12 pb-14 sm:pt-16 sm:pb-20">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)] opacity-70" />
        <Container className="relative">
          <Link
            href={localePath(locale, hub)}
            className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink/25"
          >
            <ArrowLeft className="size-3.5" />
            {m.plans_hub_trail_h1()}
          </Link>
          <p className="kicker mb-4 text-muted-foreground">
            {sportLabel('trail')} · {values.distance} · {values.dplus} m D+
          </p>
          <h1 className="display-1 max-w-4xl text-ink">{title}</h1>
          <p className="lead mt-6 max-w-2xl">{data.plan.description}</p>

          <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
            {facts.map(([label, value, sub]) => (
              <div key={label} className="bg-white px-5 py-4">
                <dt className="text-[0.8rem] text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-mono text-[1.35rem] font-semibold tracking-tight text-ink tabular-nums">
                  {value}
                </dd>
                {sub && (
                  <dd className="mt-0.5 text-[0.78rem] text-muted-foreground">
                    {sub}
                  </dd>
                )}
              </div>
            ))}
          </dl>

          <div className="mt-9 flex flex-col items-start gap-3">
            <ImportButton planData={data} placement={`${placement}_hero`} />
            <p className="text-[0.85rem] text-muted-foreground">
              {m.tplan_import_note()}
            </p>
          </div>
        </Container>
      </section>

      <Section tone="ink" className="!py-16 sm:!py-20">
        <Container>
          <p className="kicker mb-6 text-ink-soft">
            {m.trailplan_volume_title()}
          </p>
          <TrailVolumeChart
            locale={locale}
            data={data}
            weeklyKm={stats.weeklyKm}
            weeklyDplus={stats.weeklyDplus}
          />
        </Container>
      </Section>

      <Section className="!py-16 sm:!py-24">
        <Container>
          <div className="max-w-2xl">
            <h2 className="display-3 text-ink">{m.tplan_schedule_title()}</h2>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-muted-foreground">
              {m.trailplan_schedule_lead()}
            </p>
            {!translated && (
              <p className="mt-6 rounded-xl border border-sky/40 bg-sky/10 px-4 py-3 text-[0.92rem] text-ink">
                {m.tplan_fallback()}
              </p>
            )}
          </div>

          <div
            className="mt-12 space-y-14"
            lang={translated ? undefined : 'en'}
          >
            {data.cycles.map((cycle, c) => (
              <div key={cycle.name}>
                <div className="flex items-start gap-4">
                  <span
                    className="mt-1.5 h-10 w-1.5 shrink-0 rounded-full"
                    style={{
                      background: cycle.color ?? FALLBACK_COLORS[c % 4],
                    }}
                  />
                  <div>
                    <h3 className="text-[1.3rem] font-semibold tracking-[-0.02em] text-ink">
                      {cycle.name}
                    </h3>
                    <p className="mt-1 max-w-3xl text-[0.95rem] leading-relaxed text-muted-foreground">
                      {cycle.description}
                    </p>
                  </div>
                </div>
                <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                  <div className="divide-y divide-border">
                    {cycle.weeks.map((week) => {
                      const sessions = [...week.sessions].sort(
                        (a, b) =>
                          DAY_ORDER.indexOf(a.dayOfWeek) -
                          DAY_ORDER.indexOf(b.dayOfWeek),
                      );
                      const km = Math.round(
                        week.sessions.reduce(
                          (sum, s) => sum + (s.goalDistance ?? 0),
                          0,
                        ) / 1000,
                      );
                      const dplus = week.sessions.reduce(
                        (sum, s) => sum + (s.goalElevationGain ?? 0),
                        0,
                      );
                      return (
                        <div
                          key={week.weekNumber}
                          className="grid md:grid-cols-[11rem_1fr]"
                        >
                          <div className="flex items-baseline justify-between gap-3 bg-paper px-5 py-3 md:block md:py-4">
                            <span className="block font-semibold text-ink">
                              {m.tplan_week({
                                week: String(week.weekNumber),
                              })}
                            </span>
                            {week.theme && (
                              <span className="text-[0.82rem] text-muted-foreground md:mt-0.5 md:block">
                                {week.theme}
                              </span>
                            )}
                            <span className="font-mono text-[0.78rem] whitespace-nowrap text-ink md:mt-2 md:block">
                              {km} km · {formatDplus(locale, dplus)} m D+
                            </span>
                          </div>
                          <ul className="divide-y divide-border/70 px-5 py-1">
                            {sessions.map((session, index) => {
                              const targets = sessionTargets(session);
                              return (
                                <li
                                  key={index}
                                  className="grid grid-cols-[2.8rem_1fr] gap-3 py-3"
                                >
                                  <span className="pt-px font-mono text-[0.78rem] text-muted-foreground uppercase">
                                    {days[session.dayOfWeek]}
                                  </span>
                                  <div>
                                    <span className="font-medium text-ink">
                                      {session.name}
                                    </span>
                                    {session.workout?.steps?.length ? (
                                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-mint/20 px-2 py-0.5 align-middle text-[0.7rem] font-medium text-mint-strong">
                                        <Watch className="size-3" />
                                        {m.tplan_structured()}
                                      </span>
                                    ) : null}
                                    {(targets.length > 0 ||
                                      session.goalElevationGain) && (
                                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {!session.workout &&
                                          session.goalDistance && (
                                            <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[0.75rem] text-ink">
                                              {session.goalDistance / 1000} km
                                            </span>
                                          )}
                                        {targets.map((item, i) => (
                                          <span
                                            key={i}
                                            className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[0.75rem] text-ink"
                                          >
                                            {item.what}
                                            {item.target && (
                                              <span className="text-muted-foreground">
                                                {' · '}
                                                {item.target}
                                              </span>
                                            )}
                                          </span>
                                        ))}
                                        {session.goalElevationGain ? (
                                          <span className="inline-flex items-center gap-1 rounded-md bg-coral/15 px-2 py-0.5 font-mono text-[0.75rem] text-coral-strong">
                                            <Mountain className="size-3" />
                                            {formatDplus(
                                              locale,
                                              session.goalElevationGain,
                                            )}{' '}
                                            m D+
                                          </span>
                                        ) : null}
                                      </div>
                                    )}
                                    <p className="mt-1.5 text-[0.92rem] leading-relaxed text-muted-foreground">
                                      {session.description}
                                    </p>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <TrailTargetsSection />

      <Section className="!py-16 sm:!py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <TrailToolLinks locale={locale} />
            </Reveal>
            <Reveal delay={0.1}>
              <div className="ink-band relative overflow-hidden rounded-2xl p-7 sm:p-8">
                <div className="dot-grid absolute inset-0 opacity-40" />
                <div className="relative">
                  <h2 className="text-[1.3rem] font-semibold text-white">
                    {m.tplan_watch_title()}
                  </h2>
                  <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-soft">
                    {m.trailplan_watch_body()}
                  </p>
                  <div className="mt-6">
                    <ImportButton
                      planData={data}
                      placement={`${placement}_watch`}
                      tone="light"
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {others.length > 0 && (
        <section className="pb-6">
          <Container>
            <h2 className="kicker mb-5 text-muted-foreground">
              {m.trailplan_other_title()}
            </h2>
            <div className="flex flex-wrap gap-3">
              {others.map((other) => (
                <Link
                  key={other.path}
                  href={localePath(locale, other.path)}
                  className="group inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 font-mono text-[1.05rem] font-semibold text-ink transition-colors hover:border-ink/25"
                >
                  {trailDistanceLabel(other.distance)}
                  <span className="text-[0.85rem] font-normal text-muted-foreground">
                    {formatDplus(locale, parseInt(other.variant, 10))} m D+
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-ink" />
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      <CtaBand
        locale={locale}
        placement={`${placement}_final`}
        title={m.plans_hub_final_title()}
        body={m.plans_hub_final_body()}
      />
    </>
  );
}
