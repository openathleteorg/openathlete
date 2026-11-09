import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
  JsonLd,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CostCalculator } from '@/components/site/cost-calculator';
import { CtaBand } from '@/components/site/cta-band';
import { Faq } from '@/components/site/faq';
import { CoffeeIcon } from '@/components/site/icons';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Logo } from '@/components/site/logo';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { BUY_ME_A_COFFEE_URL, CONTACT_EMAIL, SITE_URL } from '@/config';
import {
  COMPARISONS_CHECKED_ON,
  COMPETITORS,
  type Competitor,
  GARMIN_PRESS_RELEASE,
  OWNERSHIP_TIMELINE,
  QUOTED_PRICES,
} from '@/content/competitors';
import { supporterUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  formatLongDate,
  htmlLang,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Info,
  X,
} from 'lucide-react';
import Link from 'next/link';

import { ComparisonTable, TableLegend } from './comparison-table';
import { type PriceBar, PriceBars } from './price-bars';
import { collectFootnotes, hasMsg, money, msg, priceVars } from './text';

const USD_TO_EUR = 0.87;

function range(count: number) {
  return Array.from({ length: count }, (_, index) => index + 1);
}

function competitorFaqs(competitor: Competitor, vars: Record<string, string>) {
  return range(competitor.faqs).map((index) => ({
    question: msg(`compare_${competitor.prefix}_faq_${index}_q`, vars),
    answer: msg(`compare_${competitor.prefix}_faq_${index}_a`, vars),
  }));
}

function athleteBars(
  competitor: Competitor,
  locale: SupportedLocale,
  vars: Record<string, string>,
) {
  const bar = (
    id: string,
    label: string,
    sub: string,
    price: readonly [number, 'EUR' | 'USD'],
    ours = false,
  ): PriceBar => ({
    id,
    label,
    sub,
    display: money(price, locale),
    value: price[1] === 'USD' ? price[0] * USD_TO_EUR : price[0],
    ours,
  });
  const ours = [
    bar('oa', 'OpenAthlete', m.compare_bar_oa_free(), [0, 'EUR'], true),
    bar(
      'oa-supporter',
      'OpenAthlete Supporter',
      m.compare_bar_oa_supporter(),
      QUOTED_PRICES.oaYear,
      true,
    ),
  ];
  const bundle = bar(
    'bundle',
    'Strava + Runna',
    m.compare_bar_bundle(),
    QUOTED_PRICES.bundle,
  );
  if (competitor.slug === 'intervals-icu') {
    return [
      ...ours,
      bar(
        'icu',
        'intervals.icu',
        msg('compare_bar_icu', vars),
        QUOTED_PRICES.icuYear,
      ),
    ];
  }
  if (competitor.slug === 'runna') {
    return [
      ...ours,
      bar('runna', 'Runna', m.compare_bar_runna(), QUOTED_PRICES.runnaYear),
      bundle,
    ];
  }
  return [
    ...ours,
    bar('strava', 'Strava', m.compare_bar_strava(), QUOTED_PRICES.stravaYear),
    bundle,
  ];
}

export function ComparePage({
  competitor,
  locale,
}: {
  competitor: Competitor;
  locale: SupportedLocale;
}) {
  const p = competitor.prefix;
  const name = competitor.name;
  const vars = { ...priceVars(locale), name };
  const t = (key: string) => msg(`compare_${p}_${key}`, vars);
  const checked = formatLongDate(COMPARISONS_CHECKED_ON, locale);
  const footnotes = collectFootnotes(competitor);
  const faqs = competitorFaqs(competitor, vars);
  const path = `/compare/${competitor.slug}`;
  const isTp = competitor.slug === 'trainingpeaks';

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.compare_breadcrumb_home(), url: localizedUrl(locale) },
          {
            name: m.compare_breadcrumb(),
            url: localizedUrl(locale, '/compare'),
          },
          { name: t('h1'), url: localizedUrl(locale, path) },
        ]}
      />
      <FAQPageStructuredData faqs={faqs} />
      <JsonLd
        data={{
          '@type': 'WebPage',
          name: t('seo_title'),
          description: t('seo_description'),
          url: localizedUrl(locale, path),
          inLanguage: htmlLang(locale),
          dateModified: COMPARISONS_CHECKED_ON,
          isPartOf: { '@id': `${SITE_URL}/#website` },
          about: [
            {
              '@type': 'SoftwareApplication',
              name: 'OpenAthlete',
              url: SITE_URL,
            },
            { '@type': 'SoftwareApplication', name },
          ],
        }}
      />

      {/* Hero */}
      <section className="relative -mt-[var(--header-height)] overflow-hidden pt-[calc(var(--header-height)+2.5rem)] pb-16 sm:pt-[calc(var(--header-height)+4rem)] sm:pb-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_0%,black,transparent)]" />
          <div className="absolute top-[-10rem] left-[10%] h-[30rem] w-[44rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--sky)_28%,transparent),transparent)] blur-2xl" />
          <div className="absolute top-[6rem] right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--orchid)_20%,transparent),transparent)] blur-2xl" />
        </div>
        <Container className="relative">
          <nav
            aria-label="Breadcrumb"
            className="text-[0.82rem] text-muted-foreground"
          >
            <Link
              href={localePath(locale, '/compare')}
              className="hover:text-ink"
            >
              {m.compare_breadcrumb()}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-ink">{name}</span>
          </nav>
          <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="kicker text-muted-foreground">
                {m.compare_hero_kicker()} ·{' '}
                {m.compare_checked({ date: checked })}
              </p>
              <h1 className="display-1 mt-5">{t('h1')}</h1>
              <div className="mt-7 grid max-w-2xl gap-4 text-[1.06rem] leading-relaxed text-muted-foreground">
                <p>{t('intro_1')}</p>
                <p>{t('intro_2')}</p>
              </div>
              {isTp && (
                <a
                  href="#ownership"
                  className="group mt-8 inline-flex items-center gap-2 rounded-full border border-coral/40 bg-coral/10 py-1.5 pr-4 pl-1.5 text-[0.86rem] text-ink hover:border-coral"
                >
                  <span className="rounded-full bg-coral-strong px-2 py-0.5 font-mono text-[0.66rem] font-medium text-white">
                    2026
                  </span>
                  {t('callout')}
                  <ArrowDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                </a>
              )}
            </div>
            <Reveal delay={0.1} className="lg:col-span-5 lg:pt-10">
              <div className="grid gap-3">
                <div className="rounded-3xl border border-border bg-white/80 p-6 backdrop-blur sm:p-7">
                  <p className="kicker text-muted-foreground">
                    {m.compare_better_if()}
                  </p>
                  <p className="mt-3 text-xl font-semibold tracking-[-0.02em]">
                    {name}
                  </p>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {t('summary_them')}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="rounded-full border border-border bg-white px-3 py-1 font-mono text-[0.72rem] tracking-[0.14em] text-muted-foreground">
                    VS
                  </span>
                </div>
                <div className="ink-band relative overflow-hidden rounded-3xl p-6 sm:p-7">
                  <div className="dot-grid absolute inset-0 opacity-40" />
                  <div className="relative">
                    <p className="kicker text-ink-soft">
                      {m.compare_better_if()}
                    </p>
                    <Logo tone="light" className="mt-3" />
                    <p className="mt-2 leading-relaxed text-white/75">
                      {t('summary_oa')}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Table */}
      <Section tone="paper" id="table">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              kicker={m.compare_table_kicker()}
              title={m.compare_table_title({ name })}
              lead={m.compare_table_lead({ name })}
            />
            <TableLegend className="lg:max-w-xs lg:flex-col lg:gap-2" />
          </div>
          <Reveal className="mt-10">
            <ComparisonTable
              competitor={competitor}
              footnotes={footnotes}
              vars={vars}
            />
          </Reveal>
          <div className="mt-8 grid gap-6 text-[0.82rem] text-muted-foreground md:grid-cols-[1fr_1fr]">
            <div>
              <h3 className="kicker text-ink">{m.compare_sources_title()}</h3>
              <ol className="mt-3 grid gap-1.5">
                {footnotes.map((note, index) => (
                  <li
                    key={note.key}
                    id={`source-${index + 1}`}
                    className="flex gap-2"
                  >
                    <span className="font-mono text-sky-strong">
                      [{index + 1}]
                    </span>
                    <a
                      href={note.url}
                      target="_blank"
                      rel="noopener"
                      className="underline decoration-border underline-offset-2 hover:text-ink"
                    >
                      {note.label}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
            <p className="leading-relaxed md:pt-7">
              {m.compare_checked({ date: checked })}.{' '}
              {m.compare_sources_note({ email: CONTACT_EMAIL })}
            </p>
          </div>
        </Container>
      </Section>

      {isTp && <OwnershipSection locale={locale} t={t} />}

      {/* Strengths */}
      <Section>
        <Container>
          <SectionHeading
            align="center"
            kicker={m.compare_better_kicker()}
            title={m.compare_better_heading()}
          />
          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <Reveal className="ink-band relative overflow-hidden rounded-3xl p-7 sm:p-10">
              <div className="dot-grid absolute inset-0 opacity-40" />
              <div className="relative">
                <h3 className="display-3 text-white">
                  {m.compare_better_oa_title()}
                </h3>
                <ul className="mt-8 grid gap-7">
                  {range(competitor.betterOa).map((index) => (
                    <li key={index} className="flex gap-4">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-mint/20 text-mint">
                        <Check className="size-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-white">
                          {t(`better_oa_${index}_title`)}
                        </p>
                        <p className="mt-1.5 leading-relaxed text-white/65">
                          {t(`better_oa_${index}_body`)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal
              delay={0.1}
              className="rounded-3xl border border-border bg-white p-7 sm:p-10"
            >
              <h3 className="display-3">
                {m.compare_better_them_title({ name })}
              </h3>
              <ul className="mt-8 grid gap-7">
                {range(competitor.betterThem).map((index) => (
                  <li key={index} className="flex gap-4">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-orchid/15 text-orchid-strong">
                      <Check className="size-4" />
                    </span>
                    <div>
                      <p className="font-semibold">
                        {t(`better_them_${index}_title`)}
                      </p>
                      <p className="mt-1.5 leading-relaxed text-muted-foreground">
                        {t(`better_them_${index}_body`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Price */}
      <Section tone="paper">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeading
                size="side"
                kicker={m.compare_price_kicker()}
                title={
                  competitor.audience === 'coach'
                    ? m.compare_price_coach_title()
                    : m.compare_price_athlete_title()
                }
                lead={
                  competitor.audience === 'coach'
                    ? m.compare_price_coach_lead()
                    : m.compare_price_athlete_lead()
                }
              />
              <div className="mt-10 rounded-3xl border border-border bg-white p-6 sm:p-7">
                <h3 className="font-semibold">{m.compare_support_title()}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
                  {msg('compare_support_body', vars)}
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <TrackedLink
                    href={supporterUrl(`compare_${p}_support`)}
                    event="supporter_clicked"
                    properties={{ placement: `compare_${p}_support` }}
                    className={buttonStyles({ size: 'sm' })}
                  >
                    {m.compare_support_cta()}
                  </TrackedLink>
                  <TrackedLink
                    href={BUY_ME_A_COFFEE_URL}
                    event="donation_clicked"
                    properties={{ placement: `compare_${p}_support` }}
                    className={buttonStyles({ variant: 'coffee', size: 'sm' })}
                  >
                    <CoffeeIcon />
                    {m.compare_support_coffee()}
                  </TrackedLink>
                </div>
              </div>
            </div>
            <Reveal delay={0.1} className="lg:col-span-7">
              {competitor.audience === 'coach' ? (
                <CostCalculator placement={`compare_${p}`} />
              ) : (
                <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_30px_60px_-40px_rgb(5_12_52/0.35)] sm:p-8">
                  <PriceBars
                    bars={athleteBars(competitor, locale, vars)}
                    perYear={m.compare_per_year()}
                  />
                  <p className="mt-8 border-t border-border pt-4 text-[0.78rem] leading-relaxed text-muted-foreground">
                    {m.compare_checked({ date: checked })}.{' '}
                    {m.compare_price_note()}
                  </p>
                </div>
              )}
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Switching */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <SectionHeading
                size="side"
                kicker={m.compare_switch_kicker()}
                title={
                  hasMsg(`compare_${p}_switch_title`)
                    ? t('switch_title')
                    : m.compare_switch_title({ name })
                }
                lead={m.compare_switch_lead()}
              />
              <RevealGroup className="relative mt-10 grid gap-8">
                <div
                  aria-hidden
                  className="brand-gradient absolute top-2 bottom-2 left-[1.05rem] w-px opacity-60"
                />
                {range(5).map((index) => (
                  <RevealItem key={index} className="relative flex gap-5">
                    <span className="relative z-10 grid size-[2.15rem] shrink-0 place-items-center rounded-full border border-border bg-white font-mono text-[0.8rem] font-medium">
                      {index}
                    </span>
                    <div className="pt-1">
                      <h3 className="font-semibold">
                        {msg(`compare_switch_${index}_title`, vars)}
                      </h3>
                      <p className="mt-1.5 leading-relaxed text-muted-foreground">
                        {msg(`compare_switch_${index}_body`, vars)}
                      </p>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
            </div>
            <div className="grid content-start gap-5 lg:col-span-5 lg:pt-24">
              <Reveal className="rounded-3xl border border-sky/40 bg-sky/[0.07] p-6 sm:p-7">
                <p className="flex items-center gap-2 font-semibold">
                  <Info className="size-4 text-sky-strong" />
                  {m.compare_switch_note_label({ name })}
                </p>
                <p className="mt-2 leading-relaxed text-ink/80">
                  {t('switch_note')}
                </p>
              </Reveal>
              <Reveal
                delay={0.1}
                className="rounded-3xl border border-border bg-paper p-6 sm:p-7"
              >
                <h3 className="font-semibold">{m.compare_limits_title()}</h3>
                <ul className="mt-4 grid gap-3">
                  {range(6).map((index) => (
                    <li
                      key={index}
                      className="flex gap-3 text-[0.93rem] leading-relaxed text-muted-foreground"
                    >
                      <X className="mt-1 size-3.5 shrink-0 text-coral-strong" />
                      {msg(`compare_limits_${index}`)}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section tone="paper">
        <Container size="narrow">
          <h2 className="display-2 mb-10">{m.compare_faq_title()}</h2>
          <Faq items={faqs} placement={`compare_${p}`} />
        </Container>
      </Section>

      <OtherComparisons locale={locale} current={competitor.slug} />

      <CtaBand
        locale={locale}
        placement={`compare_${p}_final`}
        title={m.compare_cta_title({ name })}
        body={m.compare_cta_body()}
        secondary={{
          href: localePath(locale, '/compare'),
          label: m.compare_all(),
        }}
      />
    </>
  );
}

function OwnershipSection({
  locale,
  t,
}: {
  locale: SupportedLocale;
  t: (key: string) => string;
}) {
  return (
    <Section tone="ink" id="ownership" className="overflow-hidden">
      <Container>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <p className="kicker text-ink-soft">{t('garmin_kicker')}</p>
            <h2 className="display-2-side mt-4 text-white">
              {t('garmin_title')}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/70">
              {t('garmin_body_1')}
            </p>
            <p className="mt-5 border-l-2 border-coral/60 pl-4 leading-relaxed text-white/60">
              {t('garmin_body_2')}
            </p>
            <a
              href={GARMIN_PRESS_RELEASE}
              target="_blank"
              rel="noopener"
              className="mt-8 inline-flex items-center gap-1.5 font-medium text-white hover:text-coral"
            >
              {t('garmin_link')}
              <ArrowUpRight className="size-4" />
            </a>
          </Reveal>
          <RevealGroup className="relative grid gap-4 lg:col-span-7">
            {OWNERSHIP_TIMELINE.map((event) => {
              const today = event.date === null;
              return (
                <RevealItem key={event.id}>
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener"
                    className={
                      today
                        ? 'block rounded-2xl border border-mint/40 bg-mint/10 p-5 sm:p-6'
                        : 'block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/25 sm:p-6'
                    }
                  >
                    <p
                      className={
                        today
                          ? 'font-mono text-[0.75rem] tracking-[0.1em] text-mint uppercase'
                          : 'font-mono text-[0.75rem] tracking-[0.1em] text-white/45 uppercase'
                      }
                    >
                      {today
                        ? t('garmin_today')
                        : formatLongDate(event.date, locale)}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {t(`timeline_${event.id}_title`)}
                    </p>
                    <p className="mt-1 leading-relaxed text-white/60">
                      {t(`timeline_${event.id}_body`)}
                    </p>
                  </a>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </Container>
    </Section>
  );
}

export function OtherComparisons({
  locale,
  current,
}: {
  locale: SupportedLocale;
  current?: string;
}) {
  const others = COMPETITORS.filter(
    (competitor) => competitor.slug !== current,
  );
  return (
    <section className="pt-20 pb-10 sm:pt-24">
      <Container>
        <h2 className="kicker text-muted-foreground">
          {m.compare_other_title()}
        </h2>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {others.map((competitor) => (
            <li key={competitor.slug}>
              <Link
                href={localePath(locale, `/compare/${competitor.slug}`)}
                className="group flex h-full items-center justify-between gap-2 rounded-2xl border border-border bg-white px-4 py-3.5 text-[0.92rem] font-medium transition-shadow hover:shadow-[0_12px_30px_-18px_rgb(5_12_52/0.4)]"
              >
                <span>
                  <span className="text-muted-foreground">vs </span>
                  {competitor.name}
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
