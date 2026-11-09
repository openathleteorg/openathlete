import {
  BreadcrumbListStructuredData,
  TrainingPlanStructuredData,
} from '@/components/seo/structured-data';
import { CtaBand } from '@/components/site/cta-band';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal } from '@/components/site/reveal';
import {
  type PlanEntry,
  formatGoalTime,
  formatPace,
  planStats,
  plansFor,
} from '@/lib/training-plans/catalog';
import { distanceLabel, sportLabel } from '@/lib/training-plans/labels';
import {
  paceAtShare,
  referenceVma,
  runningPlanSpec,
} from '@/lib/training-plans/specs';
import {
  bandUse,
  planBands,
  sessionTargets,
  targetLabel,
  targetTone,
} from '@/lib/training-plans/targets';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  htmlLang,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { ArrowLeft, ArrowUpRight, Watch } from 'lucide-react';
import Link from 'next/link';

import type { SEOPlanData } from '@openathlete/shared';

import { ImportButton } from './import-button';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAYS = () => [
  m.tplan_day_0(),
  m.tplan_day_1(),
  m.tplan_day_2(),
  m.tplan_day_3(),
  m.tplan_day_4(),
  m.tplan_day_5(),
  m.tplan_day_6(),
];
const FALLBACK_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

/** Bars of planned kilometres per week, coloured by training block. */
function VolumeChart({
  data,
  weeklyKm,
}: {
  data: SEOPlanData;
  weeklyKm: number[];
}) {
  const max = Math.max(...weeklyKm, 1);
  let index = 0;
  return (
    <div>
      <div className="flex h-44 items-end gap-1 sm:gap-1.5">
        {data.cycles.flatMap((cycle, c) =>
          cycle.weeks.map((week) => {
            const km = weeklyKm[index++];
            return (
              <div
                key={week.weekNumber}
                className="group relative flex h-full flex-1 flex-col justify-end"
              >
                <span className="mb-1 hidden text-center font-mono text-[0.65rem] text-ink-soft sm:block">
                  {Math.round(km)}
                </span>
                <span
                  className="block rounded-t-md transition-opacity group-hover:opacity-80"
                  style={{
                    height: `${(km / max) * 100}%`,
                    background: cycle.color ?? FALLBACK_COLORS[c % 4],
                  }}
                />
              </div>
            );
          }),
        )}
      </div>
      <div className="mt-2 flex gap-1 sm:gap-1.5">
        {data.cycles.flatMap((cycle) =>
          cycle.weeks.map((week) => (
            <span
              key={week.weekNumber}
              className="flex-1 text-center font-mono text-[0.6rem] text-ink-soft sm:text-[0.65rem]"
            >
              {week.weekNumber}
            </span>
          )),
        )}
      </div>
      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
        {data.cycles.map((cycle, c) => (
          <li
            key={cycle.name}
            className="flex items-center gap-2 text-[0.82rem] text-ink-soft"
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: cycle.color ?? FALLBACK_COLORS[c % 4] }}
            />
            {cycle.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "40 min", "1h45": the goal time of a plan from its URL. */
function otherTime(plan: PlanEntry): string {
  const spec = runningPlanSpec(plan.distance, plan.variant);
  return spec ? formatGoalTime(spec.goalSeconds) : plan.variant;
}

type PlanSession =
  SEOPlanData['cycles'][number]['weeks'][number]['sessions'][number];

/** "62–70% VMA", "Goal pace 5:41/km": what the watch will aim for. */
function TargetChips({ session }: { session: PlanSession }) {
  const targets = sessionTargets(session);
  if (!targets.length) return null;
  return (
    <span className="mt-1.5 flex flex-wrap gap-1.5">
      {targets.map((target) => {
        const label = targetLabel(target);
        return (
          <span
            key={label}
            className={cn(
              'rounded-full px-2 py-0.5 font-mono text-[0.7rem] font-medium whitespace-nowrap',
              targetTone(target),
            )}
          >
            {label}
          </span>
        );
      })}
    </span>
  );
}

/** Every VMA band of the plan, in paces for the VMA it is written for. */
function ReferencePaces({
  locale,
  entry,
  data,
  time,
  pace,
}: {
  locale: SupportedLocale;
  entry: PlanEntry;
  data: SEOPlanData;
  time: string;
  pace: string;
}) {
  const spec = runningPlanSpec(entry.distance, entry.variant);
  if (!spec) return null;
  const vma = referenceVma(spec);
  const rows = planBands(data).map((band) => ({
    use: bandUse(band),
    target: targetLabel({ kind: 'vma', ...band }),
    pace: `${formatPace(paceAtShare(vma, band.max))}–${formatPace(paceAtShare(vma, band.min))}`,
  }));
  rows.push({ use: m.tplan_zone_goal(), target: time, pace });
  return (
    <div className="mt-10">
      <h3 className="text-[1.1rem] font-semibold text-ink">
        {m.tplan_ref_title({ vma: vma.toLocaleString(htmlLang(locale)) })}
      </h3>
      <p className="mt-1.5 text-[0.92rem] leading-relaxed text-muted-foreground">
        {m.tplan_ref_lead()}
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-left text-[0.88rem]">
          <thead className="bg-paper">
            <tr className="text-[0.75rem] text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">
                {m.tplan_ref_col_use()}
              </th>
              <th className="px-4 py-2.5 font-medium">
                {m.tplan_ref_col_target()}
              </th>
              <th className="px-4 py-2.5 text-right font-medium">
                {m.tplan_ref_col_pace()} /km
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.target}>
                <td className="px-3 py-2.5 text-ink sm:px-4">{row.use}</td>
                <td className="px-4 py-2.5 font-mono text-[0.8rem] whitespace-nowrap text-muted-foreground">
                  {row.target}
                </td>
                <td className="px-4 py-2.5 text-right font-mono whitespace-nowrap text-ink tabular-nums">
                  {row.pace}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A plan page: header, volume, full schedule as an HTML table, paces. */
export function PlanDetail({
  locale,
  entry,
  data,
}: {
  locale: SupportedLocale;
  entry: PlanEntry;
  data: SEOPlanData;
}) {
  const stats = planStats(data);
  const time = data.plan.timeTarget ? formatGoalTime(data.plan.timeTarget) : '';
  const pace = stats.paceSeconds ? formatPace(stats.paceSeconds) : '–';
  const url = localizedUrl(locale, entry.path);
  const translated = entry.locales.includes(locale);
  const placement = `plan_${entry.distance}_${entry.variant}`;
  const days = DAYS();
  const sportHub = `/training-plans/${entry.sport}`;
  const others = plansFor(entry.sport).filter((p) => p.path !== entry.path);
  const title = data.plan.name;

  return (
    <>
      <TrainingPlanStructuredData
        title={title}
        description={data.plan.description}
        url={url}
        locale={translated ? locale : 'en'}
        sport={entry.sport === 'running' ? 'Running' : entry.sport}
        weeks={stats.weeks}
        sessionsPerWeek={stats.runs}
      />
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          {
            name: m.plans_hub_kicker(),
            url: localizedUrl(locale, '/training-plans'),
          },
          {
            name: sportLabel(entry.sport),
            url: localizedUrl(locale, sportHub),
          },
          { name: title, url },
        ]}
      />

      <section className="relative overflow-hidden pt-12 pb-14 sm:pt-16 sm:pb-20">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)] opacity-70" />
        <Container className="relative">
          <Link
            href={localePath(locale, sportHub)}
            className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink/25"
          >
            <ArrowLeft className="size-3.5" />
            {m.plans_hub_list_title()}
          </Link>
          <p className="kicker mb-4 text-muted-foreground">
            {m.tplan_kicker({
              distance: distanceLabel(entry.distance, true),
              time,
            })}
          </p>
          <h1 className="display-1 max-w-4xl text-ink">{title}</h1>
          <p className="lead mt-6 max-w-2xl">{data.plan.description}</p>

          <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
            {[
              [m.tplan_weeks(), String(stats.weeks)],
              [m.tplan_runs(), String(stats.runs)],
              [m.tplan_peak(), `${stats.peakKm} km`],
              [m.tplan_pace(), `${pace} /km`],
            ].map(([label, value]) => (
              <div key={label} className="bg-white px-5 py-4">
                <dt className="text-[0.8rem] text-muted-foreground">{label}</dt>
                <dd className="mt-1 font-mono text-[1.35rem] font-semibold tracking-tight text-ink tabular-nums">
                  {value}
                </dd>
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
          <p className="kicker mb-6 text-ink-soft">{m.tplan_volume_title()}</p>
          <VolumeChart data={data} weeklyKm={stats.weeklyKm} />
        </Container>
      </Section>

      <Section className="!py-16 sm:!py-24">
        <Container>
          <div className="max-w-2xl">
            <h2 className="display-3 text-ink">{m.tplan_schedule_title()}</h2>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-muted-foreground">
              {m.tplan_schedule_lead()}
            </p>
            <p className="mt-5 flex gap-3 rounded-xl border border-border bg-paper px-4 py-3 text-[0.92rem] leading-relaxed text-ink">
              <Watch className="mt-0.5 size-4 shrink-0 text-mint-strong" />
              {m.tplan_targets_note()}
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
                <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full text-left text-[0.92rem]">
                    <tbody className="divide-y divide-border">
                      {cycle.weeks.map((week) => {
                        const sessions = [...week.sessions].sort(
                          (a, b) =>
                            DAY_ORDER.indexOf(a.dayOfWeek) -
                            DAY_ORDER.indexOf(b.dayOfWeek),
                        );
                        const km =
                          week.sessions.reduce(
                            (sum, s) => sum + (s.goalDistance ?? 0),
                            0,
                          ) / 1000;
                        return (
                          <tr
                            key={week.weekNumber}
                            className="block align-top sm:table-row"
                          >
                            <th
                              scope="row"
                              className="flex flex-wrap items-baseline gap-x-3 bg-paper px-5 py-3 font-normal sm:table-cell sm:w-44 sm:py-4"
                            >
                              <span className="font-semibold text-ink sm:block">
                                {m.tplan_week({
                                  week: String(week.weekNumber),
                                })}
                              </span>
                              {week.theme && (
                                <span className="text-[0.82rem] text-muted-foreground sm:mt-0.5 sm:block">
                                  {week.theme}
                                </span>
                              )}
                              <span className="ml-auto font-mono text-[0.8rem] text-ink sm:mt-2 sm:ml-0 sm:inline-block">
                                {m.tplan_week_total({
                                  km: String(Math.round(km)),
                                })}
                              </span>
                            </th>
                            <td className="block px-4 py-2 sm:table-cell sm:px-5 sm:py-3">
                              <ul className="divide-y divide-border/70">
                                {sessions.map((session, index) => (
                                  <li
                                    key={index}
                                    className="grid grid-cols-[3.2rem_1fr] gap-3 py-2"
                                  >
                                    <span className="pt-px font-mono text-[0.78rem] text-muted-foreground uppercase">
                                      {days[session.dayOfWeek]}
                                    </span>
                                    <span>
                                      <span className="font-medium text-ink">
                                        {session.name}
                                      </span>
                                      <span className="block text-muted-foreground">
                                        {session.description}
                                      </span>
                                      <TargetChips session={session} />
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="paper" className="!py-16 sm:!py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal className="min-w-0">
              <h2 className="display-3 text-ink">{m.tplan_paces_title()}</h2>
              <p className="mt-4 text-[1.02rem] leading-relaxed text-[#2b3354]">
                {m.tplan_paces_body({ time, pace })}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  ['/tools/vma', m.tplan_paces_vma()],
                  ['/tools/race-predictor', m.tplan_paces_predictor()],
                  ['/tools/pace-calculator', m.tplan_paces_pace()],
                  ...(entry.distance === 'marathon'
                    ? [['/races', m.races_nav_label()]]
                    : []),
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={localePath(locale, href)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/25"
                  >
                    {label}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                ))}
              </div>
              <ReferencePaces
                locale={locale}
                entry={entry}
                data={data}
                time={time}
                pace={pace}
              />
            </Reveal>
            <Reveal delay={0.1} className="min-w-0">
              <div className="ink-band relative overflow-hidden rounded-2xl p-7 sm:p-8">
                <div className="dot-grid absolute inset-0 opacity-40" />
                <div className="relative">
                  <h2 className="text-[1.3rem] font-semibold text-white">
                    {m.tplan_watch_title()}
                  </h2>
                  <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-soft">
                    {m.tplan_watch_body()}
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
        <section className="pt-16 pb-6 sm:pt-20">
          <Container>
            <h2 className="kicker mb-5 text-muted-foreground">
              {m.tplan_other_title()}
            </h2>
            <div className="flex flex-wrap gap-3">
              {others.map((other) => (
                <Link
                  key={other.path}
                  href={localePath(locale, other.path)}
                  className={cn(
                    'rounded-xl border border-border bg-white px-5 py-3 font-mono text-[1.05rem] font-semibold text-ink transition-colors hover:border-ink/25',
                  )}
                >
                  <span className="mr-2 font-sans text-[0.85rem] font-medium text-muted-foreground">
                    {distanceLabel(other.distance, true)}
                  </span>
                  {otherTime(other)}
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
