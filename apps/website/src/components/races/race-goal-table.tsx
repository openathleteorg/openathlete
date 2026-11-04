import { buttonStyles } from '@/components/site/button';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { signupUrl } from '@/lib/links';
import {
  buildPaceChart,
  formatDuration,
  formatPace,
  goalLabel,
} from '@/lib/pace-charts/chart';
import { distanceSpec, planVariant } from '@/lib/pace-charts/data';
import {
  formatRaceDate,
  formatRaceDays,
  planStartDate,
  raceText,
} from '@/lib/races/copy';
import { MARATHON_PLAN_WEEKS } from '@/lib/races/data';
import type { Race } from '@/lib/races/types';
import { listPlans } from '@/lib/training-plans/catalog';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  localePath,
  toParaglideLocale,
} from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { ArrowRight, CalendarDays } from 'lucide-react';
import Link from 'next/link';

/**
 * Road marathons: every goal of the pace charts with its pace, its halfway
 * split and the free plan written for it, and the Monday the plan starts.
 */
export function RaceGoalTable({
  race,
  locale,
}: {
  race: Race;
  locale: SupportedLocale;
}) {
  const ml = toParaglideLocale(locale);
  const spec = distanceSpec('marathon')!;
  const plans = listPlans().filter(
    (plan) => plan.sport === 'running' && plan.distance === 'marathon',
  );
  const rows = spec.goals.map((time) => {
    const chart = buildPaceChart(spec, time);
    return {
      time,
      pace: formatPace(chart.pace),
      halfway: formatDuration(chart.halfway.even),
      plan: plans.find((plan) => plan.variant === planVariant(time)),
    };
  });
  const name = raceText(race, 'name');
  const start = race.date
    ? formatRaceDate(planStartDate(race.date, MARATHON_PLAN_WEEKS), locale)
    : undefined;
  const weeks = String(MARATHON_PLAN_WEEKS);

  return (
    <Section>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <Reveal>
              <p className="kicker mb-4 text-muted-foreground">
                {m.races_goals_kicker()}
              </p>
              <h2 className="display-2-side text-ink">
                {m.races_goals_title({ name })}
              </h2>
              <p className="mt-5 text-[1.02rem] leading-relaxed text-[#2b3354]">
                {m.races_goals_body()}
              </p>
            </Reveal>

            {/* When to start: a date when the race has one, the method if not */}
            <Reveal
              delay={0.1}
              className="brand-gradient mt-10 rounded-2xl p-[1.5px]"
            >
              <div className="rounded-[calc(1rem-1.5px)] bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky/15 text-sky-strong">
                    <CalendarDays className="size-5" />
                  </span>
                  <p className="text-[0.85rem] font-medium text-muted-foreground">
                    {m.races_start_kicker({ weeks })}
                  </p>
                </div>
                {start ? (
                  <>
                    <p className="mt-4 text-[1.2rem] leading-snug font-semibold text-ink">
                      {m.races_start_title({ weeks, date: start })}
                    </p>
                    <p className="mt-2 text-[0.93rem] leading-relaxed text-muted-foreground">
                      {m.races_start_body({
                        date: formatRaceDays(race, locale),
                      })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-[1.2rem] leading-snug font-semibold text-ink">
                      {m.races_start_tba_title()}
                    </p>
                    <p className="mt-2 text-[0.93rem] leading-relaxed text-muted-foreground">
                      {m.races_start_tba_body({ weeks })}
                    </p>
                  </>
                )}
                <TrackedLink
                  href={signupUrl(`race_${race.key}_plan`)}
                  event="cta_clicked"
                  properties={{
                    placement: `race_${race.key}_plan`,
                    cta: 'signup',
                  }}
                  className={cn(
                    buttonStyles({ variant: 'primary', size: 'md' }),
                    'mt-5',
                  )}
                >
                  {m.races_start_cta()}
                  <ArrowRight />
                </TrackedLink>
                <p className="mt-3 text-[0.8rem] text-muted-foreground">
                  {m.races_start_watch()}
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.05}>
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_20px_40px_-30px_rgb(5_12_52/0.35)]">
              <table className="w-full text-left">
                <thead className="bg-paper text-[0.78rem] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 font-medium sm:px-5">
                      {m.races_col_goal()}
                    </th>
                    <th className="px-3 py-3 text-right font-medium sm:px-5">
                      {m.races_col_pace()}
                    </th>
                    <th className="hidden px-3 py-3 text-right font-medium sm:table-cell sm:px-5">
                      {m.races_col_halfway()}
                    </th>
                    <th className="px-3 py-3 text-right font-medium sm:px-5">
                      {m.races_col_plan()}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-[0.92rem]">
                  {rows.map((row) => (
                    <tr
                      key={row.time}
                      className={cn(row.plan && 'bg-mint/[0.05]')}
                    >
                      <td className="px-3 py-2.5 sm:px-5">
                        <Link
                          href={localePath(
                            locale,
                            `/pace-charts/marathon/${row.time}`,
                          )}
                          className="font-mono font-semibold text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-ink"
                        >
                          {goalLabel(row.time, ml)}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-ink sm:px-5">
                        {row.pace}
                        <span className="text-muted-foreground">/km</span>
                      </td>
                      <td className="hidden px-3 py-2.5 text-right font-mono text-[#2b3354] sm:table-cell sm:px-5">
                        {row.halfway}
                      </td>
                      <td className="px-3 py-2.5 text-right sm:px-5">
                        {row.plan ? (
                          <Link
                            href={localePath(locale, row.plan.path)}
                            className="inline-flex items-center gap-1 font-medium text-mint-strong hover:underline"
                          >
                            {m.races_plan_link({ weeks })}
                            <ArrowRight className="size-3.5" />
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[0.82rem] leading-relaxed text-muted-foreground">
              {m.races_goals_note()}
            </p>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
