import {
  BreadcrumbListStructuredData,
  ItemListStructuredData,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CtaBand } from '@/components/site/cta-band';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import {
  type PlanSport,
  formatGoalTime,
  formatPace,
  planStats,
  plansFor,
} from '@/lib/training-plans/catalog';
import { distanceLabel, sportLabel } from '@/lib/training-plans/labels';
import { loadPlan } from '@/lib/training-plans/plan-loader';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { ArrowRight, Bike, Footprints, Mountain } from 'lucide-react';
import Link from 'next/link';

const SPORTS = [
  {
    sport: 'running' as const,
    icon: Footprints,
    color: 'text-sky-strong bg-sky/15',
    body: () => m.plans_hub_running_body(),
  },
  {
    sport: 'trail' as const,
    icon: Mountain,
    color: 'text-mint-strong bg-mint/20',
    body: () => m.plans_hub_trail_body(),
  },
  {
    sport: 'triathlon' as const,
    icon: Bike,
    color: 'text-orchid-strong bg-orchid/15',
    body: () => m.plans_hub_triathlon_body(),
  },
];

/** Running plans as rows, one table per race: goal, length, load, race pace. */
async function PlanList({ locale }: { locale: SupportedLocale }) {
  const plans = await Promise.all(
    plansFor('running').map(async (entry) => {
      const data = await loadPlan(
        entry.sport,
        entry.distance,
        entry.variant,
        locale,
      );
      return { entry, data, stats: planStats(data) };
    }),
  );
  // plansFor already orders by race, then goal time
  const groups = [...new Set(plans.map((plan) => plan.entry.distance))].map(
    (distance) => ({
      distance,
      plans: plans.filter((plan) => plan.entry.distance === distance),
    }),
  );
  return (
    <div className="space-y-12">
      {groups.map((group) => (
        <div key={group.distance}>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h3 className="text-[1.3rem] font-semibold tracking-[-0.02em] text-ink">
              {distanceLabel(group.distance, true)}
            </h3>
            <span className="font-mono text-[0.8rem] text-muted-foreground">
              {m.plans_hub_group_count({ count: String(group.plans.length) })}
            </span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full min-w-[38rem] text-left">
              <thead className="bg-paper">
                <tr className="kicker text-muted-foreground">
                  <th className="px-6 py-4 font-medium">
                    {m.plans_hub_col_goal()}
                  </th>
                  <th className="px-4 py-4 font-medium">
                    {m.plans_hub_col_weeks()}
                  </th>
                  <th className="px-4 py-4 font-medium">
                    {m.plans_hub_col_sessions()}
                  </th>
                  <th className="px-4 py-4 font-medium">
                    {m.plans_hub_col_peak()}
                  </th>
                  <th className="px-4 py-4 font-medium">
                    {m.plans_hub_col_pace()}
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {group.plans.map(({ entry, data, stats }) => (
                  <tr
                    key={entry.path}
                    className="group relative transition-colors hover:bg-paper/60"
                  >
                    <td className="px-6 py-5">
                      <Link
                        href={localePath(locale, entry.path)}
                        className="font-semibold text-ink after:absolute after:inset-0"
                      >
                        <span className="font-mono text-[1.2rem] whitespace-nowrap">
                          {data.plan.timeTarget
                            ? formatGoalTime(data.plan.timeTarget)
                            : entry.variant}
                        </span>
                        <span className="ml-3 text-[0.9rem] font-normal text-muted-foreground">
                          {data.plan.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-5 font-mono tabular-nums">
                      {stats.weeks}
                    </td>
                    <td className="px-4 py-5 font-mono tabular-nums">
                      {stats.runs}
                    </td>
                    <td className="px-4 py-5 font-mono whitespace-nowrap tabular-nums">
                      {stats.peakKm} km
                    </td>
                    <td className="px-4 py-5 font-mono whitespace-nowrap tabular-nums">
                      {stats.paceSeconds
                        ? `${formatPace(stats.paceSeconds)} /km`
                        : '–'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-ink">
                        {m.plans_hub_view()}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function ComingSoon({ locale }: { locale: SupportedLocale }) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-ink/20 bg-paper p-8 sm:p-12">
      <p className="kicker mb-4 text-muted-foreground">{m.plans_hub_soon()}</p>
      <h2 className="display-3 max-w-2xl text-ink">
        {m.plans_hub_soon_title()}
      </h2>
      <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-muted-foreground">
        {m.plans_hub_soon_body()}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={localePath(locale, '/features/mcp-server')}
          className={buttonStyles({ size: 'md' })}
        >
          {m.plans_hub_soon_mcp()}
          <ArrowRight />
        </Link>
        <Link
          href={localePath(locale, '/tools')}
          className={buttonStyles({ variant: 'secondary', size: 'md' })}
        >
          {m.plans_hub_soon_tools()}
        </Link>
        <Link
          href={localePath(locale, '/training-plans/running')}
          className={buttonStyles({ variant: 'ghost', size: 'md' })}
        >
          {m.plans_hub_soon_marathon()}
        </Link>
      </div>
    </div>
  );
}

/**
 * `/training-plans` (every sport) and `/training-plans/<sport>` hubs.
 */
export async function PlansHub({
  locale,
  sport,
  title,
}: {
  locale: SupportedLocale;
  sport?: PlanSport;
  title: string;
}) {
  const path = sport ? `/training-plans/${sport}` : '/training-plans';
  const running = plansFor('running');
  const showList = !sport || sport === 'running';
  const listed = showList ? running : plansFor(sport!);

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          {
            name: m.plans_hub_kicker(),
            url: localizedUrl(locale, '/training-plans'),
          },
          ...(sport
            ? [{ name: sportLabel(sport), url: localizedUrl(locale, path) }]
            : []),
        ]}
      />
      {listed.length > 0 && (
        <ItemListStructuredData
          name={title}
          items={listed.map((entry) => ({
            name: `${distanceLabel(entry.distance, true)} ${entry.variant}`,
            url: localizedUrl(locale, entry.path),
          }))}
        />
      )}

      <section className="relative overflow-hidden pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)] opacity-70" />
        <Container className="relative">
          <p className="kicker mb-5 text-muted-foreground">
            {sport ? (
              <>
                <Link
                  href={localePath(locale, '/training-plans')}
                  className="hover:text-ink"
                >
                  {m.plans_hub_kicker()}
                </Link>{' '}
                / {sportLabel(sport)}
              </>
            ) : (
              m.plans_hub_kicker()
            )}
          </p>
          <h1 className="display-1 max-w-4xl text-ink">{title}</h1>
          <p className="lead mt-6 max-w-2xl">
            {sport && sport !== 'running'
              ? SPORTS.find((item) => item.sport === sport)?.body()
              : m.plans_hub_lead()}
          </p>
          {!sport && (
            <Link
              href={localePath(locale, '/races')}
              className="mt-6 inline-flex items-center gap-1.5 text-[0.95rem] font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink"
            >
              {m.races_link_plans()}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </Container>
      </section>

      {!sport && (
        <section className="pb-16 sm:pb-20">
          <Container>
            <RevealGroup className="grid gap-5 md:grid-cols-3">
              {SPORTS.map((item) => {
                const Icon = item.icon;
                const count = plansFor(item.sport).length;
                return (
                  <RevealItem key={item.sport} className="h-full">
                    <Link
                      href={localePath(locale, `/training-plans/${item.sport}`)}
                      className="group flex h-full flex-col rounded-[1.5rem] border border-border bg-white p-7 transition-[border-color,box-shadow] hover:border-ink/15 hover:shadow-[0_24px_48px_-30px_rgb(5_12_52/0.4)]"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex size-11 items-center justify-center rounded-2xl ${item.color}`}
                        >
                          <Icon className="size-5" />
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-3 py-1 text-[0.75rem] font-medium',
                            count > 0
                              ? 'bg-mint/20 text-mint-strong'
                              : 'bg-secondary text-muted-foreground',
                          )}
                        >
                          {count > 0
                            ? m.plans_hub_available({ count: String(count) })
                            : m.plans_hub_soon()}
                        </span>
                      </div>
                      <h2 className="mt-7 text-[1.35rem] font-semibold tracking-[-0.02em] text-ink">
                        {sportLabel(item.sport)}
                      </h2>
                      <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted-foreground">
                        {item.body()}
                      </p>
                      <ArrowRight className="mt-6 size-5 text-ink transition-transform group-hover:translate-x-1" />
                    </Link>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </Container>
        </section>
      )}

      <section className="pb-20 sm:pb-24">
        <Container>
          {showList ? (
            <>
              <h2 className="display-3 mb-8 text-ink">
                {m.plans_hub_list_title()}
              </h2>
              <PlanList locale={locale} />
            </>
          ) : (
            <ComingSoon locale={locale} />
          )}
        </Container>
      </section>

      <Section tone="ink" className="!py-16 sm:!py-24">
        <Container>
          <Reveal>
            <h2 className="display-2-side max-w-xl text-white">
              {m.plans_hub_how_title()}
            </h2>
          </Reveal>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              m.plans_hub_how_1(),
              m.plans_hub_how_2(),
              m.plans_hub_how_3(),
            ].map((step, index) => (
              <li
                key={step}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
              >
                <span className="font-mono text-[0.8rem] text-ink-soft">
                  0{index + 1}
                </span>
                <p className="mt-3 text-[1.02rem] leading-relaxed text-white">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <div className="pt-16 sm:pt-20">
        <CtaBand
          locale={locale}
          placement={sport ? `plans_${sport}_final` : 'plans_hub_final'}
          title={m.plans_hub_final_title()}
          body={m.plans_hub_final_body()}
        />
      </div>
    </>
  );
}
