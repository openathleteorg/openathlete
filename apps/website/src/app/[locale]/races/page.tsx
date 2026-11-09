import {
  BreadcrumbListStructuredData,
  ItemListStructuredData,
} from '@/components/seo/structured-data';
import { CtaBand } from '@/components/site/cta-band';
import { Container } from '@/components/site/layout-primitives';
import { Reveal } from '@/components/site/reveal';
import { initLocale } from '@/i18n/server';
import {
  formatGain,
  formatKm,
  formatRaceDays,
  monthName,
  raceText,
} from '@/lib/races/copy';
import { RACES } from '@/lib/races/data';
import type { Race, RaceKind } from '@/lib/races/types';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { ArrowRight, Gauge, Timer } from 'lucide-react';
import Link from 'next/link';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/races',
    title: m.races_hub_seo_title(),
    description: m.races_hub_seo_description(),
  });
}

/** Races of a kind, by next edition: month groups in calendar order. */
function byMonth(kind: RaceKind) {
  const groups = new Map<
    string,
    { year: number; month: number; races: Race[] }
  >();
  const races = RACES.filter((race) => race.kind === kind).sort(
    (a, b) =>
      a.year - b.year ||
      a.month - b.month ||
      (a.date ?? '').localeCompare(b.date ?? ''),
  );
  for (const race of races) {
    const key = `${race.year}-${race.month}`;
    const group = groups.get(key) ?? {
      year: race.year,
      month: race.month,
      races: [],
    };
    group.races.push(race);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function RaceRow({ race, locale }: { race: Race; locale: SupportedLocale }) {
  return (
    <Link
      href={localePath(locale, `/races/${race.slug}`)}
      className="group grid gap-x-6 gap-y-1 px-5 py-5 transition-colors hover:bg-paper sm:px-6 md:grid-cols-[1fr_11rem_10rem_1.25rem] md:items-center"
    >
      <span className="min-w-0">
        <span className="block text-[0.8rem] text-muted-foreground">
          {raceText(race, 'place')}
        </span>
        <span className="mt-0.5 block text-[1.1rem] font-semibold text-ink">
          {raceText(race, 'name')}
        </span>
        <span className="mt-1 block text-[0.92rem] leading-relaxed text-muted-foreground">
          {raceText(race, 'hub')}
        </span>
      </span>
      <span className="mt-2 text-[0.9rem] font-medium text-ink md:mt-0">
        {race.date
          ? formatRaceDays(race, locale, false)
          : m.races_fact_date_tba({ year: String(race.year) })}
      </span>
      <span className="font-mono text-[0.85rem] text-[#2b3354] md:text-right">
        {formatKm(race.distanceKm, locale)}&nbsp;km
        {race.gainM !== undefined && (
          <span className="block">{formatGain(race, locale)}</span>
        )}
      </span>
      <ArrowRight className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-ink md:block" />
    </Link>
  );
}

export default async function RacesHub({ params }: Props) {
  const locale = initLocale((await params).locale);
  const sections: { kind: RaceKind; title: string; lead: string }[] = [
    {
      kind: 'road',
      title: m.races_hub_road_title(),
      lead: m.races_hub_road_lead(),
    },
    {
      kind: 'trail',
      title: m.races_hub_trail_title(),
      lead: m.races_hub_trail_lead(),
    },
  ];

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          { name: m.races_nav_label(), url: localizedUrl(locale, '/races') },
        ]}
      />
      <ItemListStructuredData
        name={m.races_hub_h1()}
        items={RACES.map((race) => ({
          name: raceText(race, 'h1'),
          url: localizedUrl(locale, `/races/${race.slug}`),
        }))}
      />

      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)] opacity-70" />
        <Container className="relative">
          <p className="kicker mb-5 text-muted-foreground">
            {m.races_nav_label()}
          </p>
          <h1 className="display-1 max-w-4xl text-ink">{m.races_hub_h1()}</h1>
          <p className="lead mt-6 max-w-2xl">{m.races_hub_lead()}</p>
          <p className="mt-6 max-w-2xl border-l-2 border-coral pl-4 text-[0.9rem] leading-relaxed text-muted-foreground">
            {m.races_disclaimer()} {m.races_checked()}
          </p>
          <nav className="mt-8 flex flex-wrap gap-2">
            {sections.map((section) => (
              <a
                key={section.kind}
                href={`#${section.kind}`}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/25"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </Container>
      </section>

      {sections.map((section) => (
        <section
          key={section.kind}
          id={section.kind}
          className="scroll-mt-24 pb-16 sm:pb-20"
        >
          <Container>
            <div className="mb-8 border-b border-border pb-5">
              <h2 className="display-3 text-ink">{section.title}</h2>
              <p className="mt-2 max-w-2xl text-[0.98rem] leading-relaxed text-muted-foreground">
                {section.lead}
              </p>
            </div>
            <div className="space-y-8">
              {byMonth(section.kind).map((group) => (
                <div
                  key={`${group.year}-${group.month}`}
                  className="grid gap-3 lg:grid-cols-[9rem_1fr] lg:gap-8"
                >
                  <h3 className="kicker pt-1 text-muted-foreground lg:pt-6">
                    {monthName(group.month, locale)} {group.year}
                  </h3>
                  <Reveal className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
                    {group.races.map((race) => (
                      <RaceRow key={race.slug} race={race} locale={locale} />
                    ))}
                  </Reveal>
                </div>
              ))}
            </div>
          </Container>
        </section>
      ))}

      <section className="pb-16 sm:pb-20">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <h2 className="display-3 text-ink">
                {m.races_hub_tools_title()}
              </h2>
              <p className="mt-3 text-[1rem] leading-relaxed text-muted-foreground">
                {m.races_hub_tools_body()}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  href: '/training-plans',
                  name: m.site_nav_training_plans(),
                  card: m.races_hub_plans_card(),
                  Icon: Timer,
                },
                {
                  href: '/pace-charts',
                  name: m.pacechart_nav_label(),
                  card: m.races_hub_charts_card(),
                  Icon: Gauge,
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
        placement="races_hub_final"
        title={m.races_hub_final_title()}
        body={m.races_final_body()}
      />
    </>
  );
}
