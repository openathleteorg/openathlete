import { BreadcrumbListStructuredData } from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CoffeeIcon, DiscordIcon, GithubIcon } from '@/components/site/icons';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import {
  APP_URL,
  BUY_ME_A_COFFEE_URL,
  DISCORD_URL,
  GITHUB_URL,
} from '@/config';
import { formatPrice } from '@/content/pricing';
import {
  COSTS_UPDATED_ON,
  type CostCategory,
  MONTHLY_COSTS,
  SHIPPED,
  type ShippedItem,
  costName,
  shippedTitle,
} from '@/content/transparency';
import { initLocale } from '@/i18n/server';
import { supporterUrl } from '@/lib/links';
import { supporterPriceVars } from '@/lib/supporter-prices';
import {
  fetchContributors,
  fetchTransparency,
  tierStates,
} from '@/lib/transparency';
import { m } from '@/paraglide/messages';
import { DATE_LOCALES, localePath, localizedUrl } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Heart,
  Languages,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { FEATURES, earlyAccessEnd } from '@openathlete/shared';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

// The figures come from the API: rebuilt at most once an hour
export const revalidate = 3600;

const CONTRIBUTORS_URL = `${GITHUB_URL}/graphs/contributors`;
const GOOD_FIRST_ISSUES_URL = `${GITHUB_URL}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`;
const SHIPPED_SHOWN = 6;

/**
 * The day a shipped feature opens to everyone, while Supporters have it
 * first (FEATURES); null otherwise
 */
function earlyAccessUntil(item: ShippedItem): string | null {
  if (!item.feature) return null;
  const end = earlyAccessEnd(FEATURES[item.feature]);
  return end && Date.now() < Date.parse(`${end}T00:00:00Z`) ? end : null;
}

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/transparency',
    title: m.transparency_seo_title(),
    description: m.transparency_seo_description(),
  });
}

const CATEGORY_STYLES: Record<CostCategory, { bar: string; dot: string }> = {
  servers: { bar: 'bg-sky', dot: 'bg-sky' },
  tools: { bar: 'bg-orchid', dot: 'bg-orchid' },
  ai: { bar: 'bg-coral', dot: 'bg-coral' },
};

function ProgressBar({
  percent,
  label,
  tone = 'bg-mint',
  className,
}: {
  percent: number;
  label: string;
  tone?: string;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cn('h-2.5 overflow-hidden rounded-full bg-ink/8', className)}
    >
      <div
        className={cn('h-full rounded-full', tone)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default async function TransparencyPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const intl = DATE_LOCALES[locale];
  const [data, contributors] = await Promise.all([
    fetchTransparency(),
    fetchContributors(),
  ]);
  const prices = supporterPriceVars(locale);
  const eur = (amount: number) => formatPrice(amount, 'EUR', intl);
  const day = (iso: string) =>
    new Intl.DateTimeFormat(intl, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${iso}T00:00:00Z`));
  const number = (value: number) => new Intl.NumberFormat(intl).format(value);

  const tiers = data?.tiers ?? null;
  const states = tiers ? tierStates(tiers) : [];
  const tierCopy = [
    {
      title: m.transparency_tier_1_title(),
      body: m.transparency_tier_1_body(),
    },
    {
      title: m.transparency_tier_2_title(),
      body: m.transparency_tier_2_body(),
    },
    {
      title: m.transparency_tier_3_title(),
      body: m.transparency_tier_3_body(),
    },
    {
      title: m.transparency_tier_4_title(),
      body: m.transparency_tier_4_body(),
    },
    {
      title: m.transparency_tier_5_title(),
      body: m.transparency_tier_5_body(),
    },
  ];
  // The small team is a horizon until the API gives it a fifth threshold
  const showHorizon = tiers !== null && tiers.length < tierCopy.length;

  const categoryLabel: Record<CostCategory, string> = {
    servers: m.transparency_costs_servers(),
    tools: m.transparency_costs_tools(),
    ai: m.transparency_costs_ai(),
  };
  const categories = (['servers', 'tools', 'ai'] as const).map((category) => ({
    category,
    total: MONTHLY_COSTS.filter((cost) => cost.category === category).reduce(
      (sum, cost) => sum + cost.eur,
      0,
    ),
    items: MONTHLY_COSTS.filter((cost) => cost.category === category),
  }));
  const totalCosts = categories.reduce((sum, item) => sum + item.total, 0);

  const shipped = [...SHIPPED]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, SHIPPED_SHOWN);

  const freeForever = [
    m.transparency_free_sync(),
    m.transparency_free_history(),
    m.transparency_free_calendar(),
    m.transparency_free_watch(),
    m.transparency_free_analysis(),
    m.transparency_free_export(),
    m.transparency_free_selfhost(),
  ];

  const supporterGoal = data
    ? Math.min(
        100,
        Math.round((data.supporters.count / data.supporters.goal) * 100),
      )
    : 0;

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: 'OpenAthlete', url: localizedUrl(locale) },
          {
            name: m.transparency_breadcrumb(),
            url: localizedUrl(locale, '/transparency'),
          },
        ]}
      />

      {/* 1. The sentence that says it all, and the count */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_0%,black,transparent)]" />
          <div className="absolute top-[-10rem] right-[-6rem] h-[30rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--coral)_20%,transparent),transparent)] blur-2xl" />
        </div>
        <Container className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 py-1 pr-3 pl-1 text-[0.82rem] text-ink/80">
                <span className="grid size-6 place-items-center rounded-full bg-coral/20 text-coral-strong">
                  <Heart className="size-3.5 fill-current" />
                </span>
                {m.transparency_breadcrumb()}
              </p>
              <h1 className="display-1 mt-6">{m.transparency_hero_title()}</h1>
              <p className="lead mt-6 max-w-xl">{m.transparency_hero_lead()}</p>
              <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
                {m.transparency_hero_body()}
              </p>
              <div className="mt-8 max-w-xl rounded-3xl border border-border bg-white/70 p-5 sm:p-6">
                <p className="kicker flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4" />
                  {m.transparency_contributors_kicker()}
                </p>
                <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-5xl font-semibold tracking-[-0.04em] tabular-nums">
                    {number(contributors.count)}
                  </span>
                  <span className="text-ink/80">
                    {m.transparency_contributors_label()}
                  </span>
                </p>
                {contributors.logins.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {contributors.logins.map((login) => (
                      <li key={login}>
                        <a
                          href={`https://github.com/${login}`}
                          rel="noopener"
                          className="inline-flex rounded-full border border-border bg-white px-2.5 py-1 font-mono text-[0.75rem] text-ink/75 hover:border-sky hover:text-sky-strong"
                        >
                          {login}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <a
                  href={CONTRIBUTORS_URL}
                  rel="noopener"
                  className="mt-4 inline-flex min-h-11 items-center gap-1 text-[0.92rem] font-medium hover:text-sky-strong"
                >
                  {m.transparency_contributors_link()}
                  <ArrowUpRight className="size-4" />
                </a>
              </div>
            </div>
            <Reveal delay={0.1} className="lg:col-span-5">
              <div className="rounded-3xl border border-border bg-white p-7 shadow-[0_30px_60px_-35px_rgb(5_12_52/0.35)] sm:p-9">
                {data ? (
                  <>
                    <p className="kicker text-muted-foreground">
                      {m.transparency_count_kicker()}
                    </p>
                    <p className="mt-3 flex items-baseline gap-3">
                      <span className="text-6xl font-semibold tracking-[-0.04em] tabular-nums">
                        {number(data.supporters.count)}
                      </span>
                      <span className="text-lg text-muted-foreground">
                        {m.transparency_count_goal({
                          goal: number(data.supporters.goal),
                        })}
                      </span>
                    </p>
                    <ProgressBar
                      className="mt-6"
                      percent={supporterGoal}
                      tone="bg-coral"
                      label={m.transparency_count_label({
                        count: number(data.supporters.count),
                        goal: number(data.supporters.goal),
                      })}
                    />
                    <p className="mt-3 text-[0.9rem] text-muted-foreground">
                      {m.transparency_count_caption()}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    {m.transparency_count_unavailable()}
                  </p>
                )}
                <TrackedLink
                  href={supporterUrl('transparency_hero')}
                  event="supporter_clicked"
                  properties={{ placement: 'transparency_hero' }}
                  className={buttonStyles({
                    size: 'lg',
                    className: 'mt-7 w-full',
                  })}
                >
                  <Heart className="fill-coral text-coral" />
                  {m.plans_supporter_cta()}
                </TrackedLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* 2. The funding tiers, as a ladder */}
      {tiers && (
        <Section tone="paper" id="tiers">
          <Container>
            <SectionHeading
              kicker={m.transparency_tiers_kicker()}
              title={m.transparency_tiers_title()}
              lead={m.transparency_tiers_lead()}
            />
            <RevealGroup className="relative mt-12 grid gap-4" stagger={0.1}>
              <div
                aria-hidden
                className="absolute top-8 bottom-8 left-[1.6rem] w-px bg-gradient-to-b from-mint via-sky/60 to-border sm:left-[2.1rem]"
              />
              {tiers.map((percent, index) => {
                const state = states[index];
                return (
                  <RevealItem
                    key={tierCopy[index].title}
                    className={cn(
                      'relative flex gap-4 rounded-3xl border bg-white p-5 sm:gap-6 sm:p-7',
                      state === 'current'
                        ? 'border-sky shadow-[0_20px_50px_-30px_var(--sky-strong)] ring-1 ring-sky'
                        : 'border-border',
                      state === 'next' && 'opacity-75',
                    )}
                  >
                    <span
                      className={cn(
                        'relative z-10 grid size-7 shrink-0 place-items-center rounded-full text-[0.8rem] font-semibold sm:size-9',
                        state === 'reached' && 'bg-mint text-ink',
                        state === 'current' && 'bg-sky text-ink',
                        state === 'next' &&
                          'border border-border bg-paper text-muted-foreground',
                      )}
                    >
                      {state === 'reached' ? (
                        <Check
                          className="size-4"
                          aria-label={m.transparency_tier_reached()}
                        />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-[0.8rem] font-medium tracking-wide text-muted-foreground uppercase">
                          {m.transparency_tier_label({
                            number: String(index + 1),
                          })}
                        </p>
                        {state === 'current' && (
                          <span className="rounded-full bg-sky/20 px-2.5 py-0.5 text-[0.75rem] font-medium text-sky-strong">
                            {m.transparency_tier_current()}
                          </span>
                        )}
                        {state === 'reached' && (
                          <span className="rounded-full bg-mint/25 px-2.5 py-0.5 text-[0.75rem] font-medium text-mint-strong">
                            {m.transparency_tier_reached()}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 text-lg font-semibold sm:text-xl">
                        {tierCopy[index].title}
                      </h3>
                      <p className="mt-1 leading-relaxed text-muted-foreground">
                        {tierCopy[index].body}
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <ProgressBar
                          className="flex-1"
                          percent={percent}
                          tone={state === 'current' ? 'bg-sky' : 'bg-mint'}
                          label={m.transparency_tier_progress({
                            number: String(index + 1),
                            percent: String(percent),
                          })}
                        />
                        <span className="w-12 text-right text-[0.9rem] font-medium tabular-nums">
                          {percent} %
                        </span>
                      </div>
                    </div>
                  </RevealItem>
                );
              })}
              {showHorizon && (
                <RevealItem className="relative flex gap-4 rounded-3xl border border-dashed border-ink/20 bg-paper p-5 sm:gap-6 sm:p-7">
                  <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-dashed border-ink/25 bg-paper text-muted-foreground sm:size-9">
                    <Users className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8rem] font-medium tracking-wide text-muted-foreground uppercase">
                      {m.transparency_horizon_kicker()}
                    </p>
                    <h3 className="mt-1.5 text-lg font-semibold sm:text-xl">
                      {m.transparency_tier_5_title()}
                    </h3>
                    <p className="mt-1 max-w-2xl leading-relaxed text-muted-foreground">
                      {m.transparency_horizon_body()}
                    </p>
                  </div>
                </RevealItem>
              )}
            </RevealGroup>
          </Container>
        </Section>
      )}

      {/* 3. Where the money goes */}
      <Section tone={tiers ? 'white' : 'paper'} id="costs">
        <Container>
          <SectionHeading
            kicker={m.transparency_costs_kicker()}
            title={m.transparency_costs_title()}
            lead={m.transparency_costs_lead()}
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-12">
            <Reveal className="rounded-3xl border border-border bg-white p-7 sm:p-9 lg:col-span-7">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <p className="font-semibold">{m.transparency_costs_total()}</p>
                <p className="text-2xl font-semibold whitespace-nowrap tabular-nums">
                  {m.transparency_costs_per_month({ amount: eur(totalCosts) })}
                </p>
              </div>
              <div
                className="mt-5 flex h-4 overflow-hidden rounded-full bg-ink/8"
                role="img"
                aria-label={categories
                  .map(
                    ({ category, total }) =>
                      `${categoryLabel[category]} ${eur(total)}`,
                  )
                  .join(', ')}
              >
                {categories.map(({ category, total }) =>
                  total > 0 ? (
                    <div
                      key={category}
                      className={cn(
                        'h-full border-r-2 border-white last:border-r-0',
                        CATEGORY_STYLES[category].bar,
                      )}
                      style={{ width: `${(total / totalCosts) * 100}%` }}
                    />
                  ) : null,
                )}
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-3">
                {categories.map(({ category, total, items }) => (
                  <div key={category}>
                    <p className="flex items-center gap-2 text-[0.9rem] font-semibold">
                      <span
                        className={cn(
                          'size-2.5 rounded-full',
                          CATEGORY_STYLES[category].dot,
                        )}
                      />
                      {categoryLabel[category]}
                      <span className="ml-auto font-medium whitespace-nowrap tabular-nums">
                        {eur(total)}
                      </span>
                    </p>
                    <ul className="mt-3 grid gap-1.5 text-[0.9rem] text-muted-foreground">
                      {items.map((item) => (
                        <li
                          key={costName(item, locale)}
                          className="flex justify-between gap-3"
                        >
                          <span>{costName(item, locale)}</span>
                          <span className="tabular-nums">{eur(item.eur)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-8 border-t border-border pt-5 text-[0.82rem] text-muted-foreground">
                {m.transparency_costs_updated({ date: day(COSTS_UPDATED_ON) })}
              </p>
            </Reveal>
            <Reveal
              delay={0.1}
              className="flex flex-col rounded-3xl bg-ink p-7 text-white sm:p-9 lg:col-span-5"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-mint/20 text-mint">
                <Code2 className="size-5" />
              </span>
              <h3 className="mt-5 text-xl font-semibold">
                {m.transparency_costs_dev_title()}
              </h3>
              <p className="mt-3 leading-relaxed text-white/75">
                {m.transparency_costs_dev_body()}
              </p>
              <p className="mt-4 leading-relaxed text-white/75">
                {m.transparency_costs_ai_note()}
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* 4. What the support has paid for */}
      <Section tone={tiers ? 'paper' : 'white'} id="shipped">
        <Container size="narrow">
          <SectionHeading
            kicker={m.transparency_shipped_kicker()}
            title={m.transparency_shipped_title()}
          />
          <RevealGroup className="mt-10 grid gap-3">
            {shipped.map((item) => {
              const external = item.href.startsWith('http');
              const href = external ? item.href : localePath(locale, item.href);
              return (
                <RevealItem key={`${item.date}-${item.href}`}>
                  <Link
                    href={href}
                    {...(external && { target: '_blank', rel: 'noopener' })}
                    className="group flex flex-col gap-1 rounded-2xl border border-border bg-white px-5 py-4 transition-colors hover:border-ink/30 sm:flex-row sm:items-center sm:gap-6"
                  >
                    <time
                      dateTime={item.date}
                      className="shrink-0 text-[0.85rem] text-muted-foreground tabular-nums sm:w-40"
                    >
                      {day(item.date)}
                    </time>
                    <span className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                      {shippedTitle(item, locale)}
                      {earlyAccessUntil(item) && (
                        <span className="rounded-full bg-orchid/15 px-2.5 py-0.5 text-[0.78rem] font-medium text-ink">
                          {m.transparency_early_access({
                            date: day(earlyAccessUntil(item) as string),
                          })}
                        </span>
                      )}
                    </span>
                    <ArrowRight className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" />
                  </Link>
                </RevealItem>
              );
            })}
          </RevealGroup>
          <p className="mt-6 text-[0.88rem] text-muted-foreground">
            {m.transparency_shipped_more()}{' '}
            <a
              href={`${GITHUB_URL}/releases`}
              target="_blank"
              rel="noopener"
              className="font-medium text-ink underline underline-offset-4 hover:no-underline"
            >
              {m.transparency_shipped_releases()}
            </a>
            .
          </p>
        </Container>
      </Section>

      {/* 5. Free forever */}
      <Section tone="ink">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="kicker text-ink-soft">
                {m.transparency_free_kicker()}
              </p>
              <h2 className="display-2 mt-4 text-white">
                {m.transparency_free_title()}
              </h2>
              <p className="mt-5 leading-relaxed text-white/70">
                {m.transparency_free_lead()}
              </p>
            </div>
            <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
              {freeForever.map((item) => (
                <RevealItem
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-white/90"
                >
                  <Check className="mt-0.5 size-5 shrink-0 text-mint" />
                  {item}
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </Section>

      {/* 6. How to help */}
      <Section tone="paper" id="help">
        <Container>
          <SectionHeading
            kicker={m.transparency_help_kicker()}
            title={m.transparency_help_title()}
            align="center"
          />
          <RevealGroup className="mt-12 grid gap-5 lg:grid-cols-3">
            <RevealItem className="relative flex h-full flex-col rounded-3xl border-2 border-ink bg-white p-7">
              <span className="absolute -top-3 left-7 rounded-full bg-ink px-3 py-1 text-[0.75rem] font-medium text-white">
                {m.transparency_help_supporter_badge()}
              </span>
              <span className="grid size-11 place-items-center rounded-xl bg-coral/20 text-coral-strong">
                <Heart className="size-5 fill-current" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">
                {m.transparency_help_supporter_title()}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {m.transparency_help_supporter_body()}
              </p>
              <div className="mt-5 rounded-2xl bg-mint/15 px-4 py-3">
                <p className="text-[0.8rem] font-medium text-mint-strong">
                  {m.transparency_help_supporter_yearly_label()}
                </p>
                <p className="mt-0.5 font-semibold">
                  {m.transparency_help_supporter_yearly({
                    yearTiers: prices.yearTiers,
                  })}
                </p>
              </div>
              <p className="mt-3 px-1 text-[0.9rem] text-muted-foreground">
                {m.transparency_help_supporter_monthly({
                  monthTiers: prices.monthTiers,
                })}
              </p>
              <div className="flex-1" />
              <TrackedLink
                href={supporterUrl('transparency_help')}
                event="supporter_clicked"
                properties={{ placement: 'transparency_help' }}
                className={buttonStyles({ size: 'lg', className: 'mt-6' })}
              >
                {m.plans_supporter_cta()}
              </TrackedLink>
            </RevealItem>

            <RevealItem className="flex h-full flex-col rounded-3xl border border-border bg-white p-7">
              <span className="grid size-11 place-items-center rounded-xl bg-[#ffdd00] text-ink">
                <CoffeeIcon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">
                {m.transparency_help_coffee_title()}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {m.transparency_help_coffee_body()}
              </p>
              <div className="flex-1" />
              <TrackedLink
                href={BUY_ME_A_COFFEE_URL}
                event="donation_clicked"
                properties={{ placement: 'transparency_help' }}
                className={buttonStyles({
                  variant: 'coffee',
                  size: 'lg',
                  className: 'mt-6',
                })}
              >
                <CoffeeIcon />
                {m.plans_coffee_cta()}
              </TrackedLink>
            </RevealItem>

            <RevealItem className="flex h-full flex-col rounded-3xl border border-border bg-white p-7">
              <span className="grid size-11 place-items-center rounded-xl bg-sky/20 text-sky-strong">
                <Code2 className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">
                {m.transparency_help_contribute_title()}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {m.transparency_help_contribute_body({
                  count: number(contributors.count),
                })}
              </p>
              <ul className="mt-5 grid gap-1">
                {[
                  {
                    icon: <GithubIcon className="size-4" />,
                    label: m.transparency_help_contribute_code(),
                    href: GOOD_FIRST_ISSUES_URL,
                  },
                  {
                    icon: <Languages className="size-4" />,
                    label: m.transparency_help_contribute_translate(),
                    href: `${GITHUB_URL}/tree/main/apps/web/messages`,
                  },
                  {
                    icon: <DiscordIcon className="size-4" />,
                    label: m.transparency_help_contribute_feedback(),
                    href: DISCORD_URL,
                  },
                ].map((link) => (
                  <li key={link.href}>
                    <TrackedLink
                      href={link.href}
                      event={
                        link.href === DISCORD_URL
                          ? 'cta_clicked'
                          : 'github_clicked'
                      }
                      properties={{
                        placement: 'transparency_contribute',
                        cta: link.label,
                      }}
                      className="flex min-h-11 items-center gap-2.5 rounded-xl px-2 font-medium hover:bg-paper"
                    >
                      {link.icon}
                      {link.label}
                      <ArrowUpRight className="ml-auto size-4 text-muted-foreground" />
                    </TrackedLink>
                  </li>
                ))}
              </ul>
            </RevealItem>
          </RevealGroup>
        </Container>
      </Section>

      {/* 7. The Supporter wall */}
      {data && (
        <Section id="wall">
          <Container size="narrow">
            <SectionHeading
              kicker={m.transparency_wall_kicker()}
              title={m.transparency_wall_title()}
              lead={m.transparency_wall_lead()}
              align="center"
            />
            {data.wall.length > 0 ? (
              <Reveal>
                <ul className="mt-10 flex flex-wrap justify-center gap-2.5">
                  {data.wall.map((name, index) => (
                    <li
                      key={`${name}-${index}`}
                      className="rounded-full border border-border bg-paper px-4 py-2 font-medium"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : (
              <p className="mt-10 text-center text-muted-foreground">
                {m.transparency_wall_empty()}
              </p>
            )}
            <p className="mt-10 text-center text-[0.9rem] text-muted-foreground">
              {m.transparency_wall_how()}{' '}
              <a
                href={`${APP_URL}/dashboard/settings?tab=subscription`}
                className="font-medium text-ink underline underline-offset-4 hover:no-underline"
              >
                {m.transparency_wall_how_link()}
              </a>
              .
            </p>
          </Container>
        </Section>
      )}
    </>
  );
}
