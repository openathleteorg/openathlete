import { buttonStyles } from '@/components/site/button';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { kmEffort } from '@/components/tools/grade';
import { signupUrl } from '@/lib/links';
import { formatKm, formatMetres, raceText } from '@/lib/races/copy';
import type { Race } from '@/lib/races/types';
import { m } from '@/paraglide/messages';
import { type SupportedLocale, localePath } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  ArrowRight,
  Footprints,
  Moon,
  Mountain,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';

/** Our longest trail plan: the stepping stone towards longer races. */
const STEP_PLAN = {
  path: '/training-plans/trail/50km/2500m',
  km: 50,
  gain: 2500,
};

/**
 * Trail races: no plan of ours covers these distances, so the page says so,
 * sizes the race in km-effort next to the 50 km plan, and lists what the
 * preparation has to include.
 */
export function RaceTrailPrep({
  race,
  locale,
}: {
  race: Race;
  locale: SupportedLocale;
}) {
  const name = raceText(race, 'name');
  const effort = Math.round(kmEffort(race.distanceKm, race.gainM ?? 0));
  const bars = [
    {
      label: name,
      value: effort,
      detail: `${formatKm(race.distanceKm, locale)} km · +${formatMetres(race.gainM ?? 0, locale)} m`,
      strong: true,
    },
    {
      label: m.races_trail_bar_plan(),
      value: kmEffort(STEP_PLAN.km, STEP_PLAN.gain),
      detail: `${STEP_PLAN.km} km · +${formatMetres(STEP_PLAN.gain, locale)} m`,
    },
    {
      label: m.races_trail_bar_marathon(),
      value: 42,
      detail: `${formatKm(42.2, locale)} km · 0 m`,
    },
  ];
  const max = Math.max(...bars.map((bar) => bar.value));

  const principles = [
    {
      Icon: Footprints,
      title: m.races_trail_p1_t(),
      body: m.races_trail_p1_b(),
    },
    { Icon: Moon, title: m.races_trail_p2_t(), body: m.races_trail_p2_b() },
    { Icon: Mountain, title: m.races_trail_p3_t(), body: m.races_trail_p3_b() },
    {
      Icon: TrendingDown,
      title: m.races_trail_p4_t(),
      body: m.races_trail_p4_b(),
    },
  ];

  return (
    <>
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Reveal>
              <p className="kicker mb-4 text-muted-foreground">
                {m.races_trail_kicker()}
              </p>
              <h2 className="display-2-side text-ink">
                {m.races_trail_noplan_title({ the: raceText(race, 'the') })}
              </h2>
              <p className="mt-5 text-[1.02rem] leading-relaxed text-[#2b3354]">
                {m.races_trail_noplan_body({
                  km: formatKm(race.distanceKm, locale),
                })}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={localePath(locale, STEP_PLAN.path)}
                  className={buttonStyles({ variant: 'secondary', size: 'md' })}
                >
                  {m.races_trail_plan_cta()}
                  <ArrowRight />
                </Link>
                <Link
                  href={localePath(locale, '/tools/trail-time-estimator')}
                  className={buttonStyles({ variant: 'ghost', size: 'md' })}
                >
                  {m.races_trail_tool_cta()}
                </Link>
              </div>
            </Reveal>

            {/* The race in km-effort, against what the 50 km plan builds */}
            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-border bg-white p-6 shadow-[0_20px_40px_-30px_rgb(5_12_52/0.35)] sm:p-7">
                <p className="kicker text-muted-foreground">
                  {m.races_trail_effort_kicker()}
                </p>
                <p className="mt-3 font-mono text-[2.4rem] leading-none font-semibold tracking-[-0.03em] text-ink">
                  {formatMetres(effort, locale)}
                  <span className="ml-2 text-[0.95rem] font-normal tracking-normal text-muted-foreground">
                    {m.races_trail_effort_unit()}
                  </span>
                </p>
                <ul className="mt-7 space-y-4">
                  {bars.map((bar) => (
                    <li key={bar.label}>
                      <div className="flex items-baseline justify-between gap-3 text-[0.88rem]">
                        <span
                          className={cn(
                            'text-[#2b3354]',
                            bar.strong && 'font-semibold text-ink',
                          )}
                        >
                          {bar.label}
                        </span>
                        <span className="font-mono text-[0.8rem] text-muted-foreground">
                          {bar.detail}
                        </span>
                      </div>
                      <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-paper">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            bar.strong ? 'brand-gradient' : 'bg-ink/20',
                          )}
                          style={{ width: `${(bar.value / max) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-[0.85rem] leading-relaxed text-muted-foreground">
                  {m.races_trail_effort_note({
                    km: formatKm(race.distanceKm, locale),
                    gain: formatMetres(race.gainM ?? 0, locale),
                    effort: formatMetres(effort, locale),
                    ratio: formatKm(
                      Math.round(
                        (effort / kmEffort(STEP_PLAN.km, STEP_PLAN.gain)) * 10,
                      ) / 10,
                      locale,
                    ),
                  })}
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section tone="paper" className="!py-20 sm:!py-24">
        <Container>
          <Reveal className="max-w-[44rem]">
            <p className="kicker mb-4 text-muted-foreground">
              {m.races_trail_principles_kicker()}
            </p>
            <h2 className="display-2-side text-ink">
              {m.races_trail_principles_title()}
            </h2>
          </Reveal>
          <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2">
            {principles.map(({ Icon, title, body }) => (
              <RevealItem
                key={title}
                className="rounded-2xl border border-border bg-white p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-orchid/15 text-orchid-strong">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-[1.1rem] font-semibold text-ink">
                  {title}
                </h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-[#2b3354]">
                  {body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal className="mt-10 flex flex-col items-start gap-4 rounded-2xl bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-[0.98rem] leading-relaxed text-[#2b3354]">
              {m.races_trail_cta_body()}
            </p>
            <TrackedLink
              href={signupUrl(`race_${race.key}_trail`)}
              event="cta_clicked"
              properties={{
                placement: `race_${race.key}_trail`,
                cta: 'signup',
              }}
              className={cn(
                buttonStyles({ variant: 'primary', size: 'md' }),
                'shrink-0',
              )}
            >
              {m.races_trail_cta()}
              <ArrowRight />
            </TrackedLink>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
