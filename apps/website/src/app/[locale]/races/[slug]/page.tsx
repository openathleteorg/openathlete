import { RaceFacts } from '@/components/races/race-facts';
import { RaceGoalTable } from '@/components/races/race-goal-table';
import { RaceTrailPrep } from '@/components/races/race-trail-prep';
import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
  JsonLd,
} from '@/components/seo/structured-data';
import { CtaBand } from '@/components/site/cta-band';
import { Faq } from '@/components/site/faq';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { SUPPORTED_LOCALES, initLocale } from '@/i18n/server';
import { formatRaceDate, planStartDate, raceText } from '@/lib/races/copy';
import { MARATHON_PLAN_WEEKS, RACES, raceBySlug } from '@/lib/races/data';
import type { Race } from '@/lib/races/types';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  localePath,
  localizedUrl,
  toParaglideLocale,
} from '@/utils/locales';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string; slug: string }> };

/* eslint-disable react-refresh/only-export-components */
export function generateStaticParams() {
  return RACES.flatMap((race) =>
    SUPPORTED_LOCALES.map((locale) => ({ locale, slug: race.slug })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = initLocale(raw);
  const race = resolve(slug);
  return pageMetadata({
    locale,
    path: `/races/${race.slug}`,
    title: raceText(race, 'h1'),
    description: raceText(race, 'meta'),
  });
}
/* eslint-enable react-refresh/only-export-components */

function resolve(slug: string): Race {
  const race = raceBySlug(slug);
  if (!race) notFound();
  return race;
}

/** Shared questions, answered with this race's facts. */
function sharedFaq(race: Race, locale: SupportedLocale) {
  const name = raceText(race, 'name');
  const the = raceText(race, 'the');
  const start =
    race.kind === 'road' && race.date
      ? formatRaceDate(planStartDate(race.date, MARATHON_PLAN_WEEKS), locale)
      : undefined;
  return [
    {
      question: m.races_faq_when_q({ the }),
      answer:
        race.kind === 'trail'
          ? m.races_faq_when_trail_a()
          : start
            ? m.races_faq_when_road_a({ date: start })
            : m.races_faq_when_road_tba_a(),
    },
    {
      question: m.races_faq_official_q({ name }),
      answer: m.races_faq_official_a({ name }),
    },
  ];
}

export default async function Page({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = initLocale(raw);
  const ml = toParaglideLocale(locale);
  const race = resolve(slug);
  const name = raceText(race, 'name');
  const title = raceText(race, 'h1');
  const path = `/races/${race.slug}`;

  const faq = [
    { question: raceText(race, 'faq1_q'), answer: raceText(race, 'faq1_a') },
    { question: raceText(race, 'faq2_q'), answer: raceText(race, 'faq2_a') },
    ...sharedFaq(race, locale),
  ];

  const specifics = (['s1', 's2', 's3'] as const).map((s) => ({
    title: raceText(race, `${s}_t`),
    body: raceText(race, `${s}_b`),
  }));

  const others = RACES.filter(
    (other) => other.kind === race.kind && other.slug !== race.slug,
  ).slice(0, 3);

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          { name: m.races_nav_label(), url: localizedUrl(locale, '/races') },
          { name: title, url: localizedUrl(locale, path) },
        ]}
      />
      <FAQPageStructuredData faqs={faq} />
      {race.date && (
        <JsonLd
          data={{
            '@type': 'SportsEvent',
            name: `${name} ${race.year}`,
            startDate: race.date,
            ...(race.endDate && { endDate: race.endDate }),
            eventStatus: 'https://schema.org/EventScheduled',
            sport: race.kind === 'road' ? 'Marathon' : 'Trail running',
            location: {
              '@type': 'Place',
              name: raceText(race, 'place'),
              address: {
                '@type': 'PostalAddress',
                addressLocality: race.place.city,
                addressCountry: race.place.country,
              },
            },
            sameAs: race.officialUrl,
          }}
        />
      )}

      {/* Hero: the title, then the facts card next to it */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)] opacity-70" />
        <Container className="relative">
          <Link
            href={localePath(locale, '/races')}
            className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink/25"
          >
            <ArrowLeft className="size-3.5" />
            {m.races_nav_all()}
          </Link>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
            <div>
              <p className="kicker mb-4 text-muted-foreground">
                {race.kind === 'road'
                  ? m.races_kicker_road()
                  : m.races_kicker_trail()}{' '}
                · {raceText(race, 'place')}
              </p>
              <h1 className="display-1 text-ink">{title}</h1>
              <p className="lead mt-6 max-w-2xl">{raceText(race, 'lead')}</p>
              <p className="mt-8 max-w-xl border-l-2 border-coral pl-4 text-[0.92rem] leading-relaxed text-muted-foreground">
                {m.races_disclaimer()}
              </p>
            </div>
            <Reveal delay={0.1}>
              <RaceFacts race={race} locale={locale} />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* What makes the course different, and what to do about it */}
      <Section tone="ink" className="!py-20 sm:!py-24">
        <Container>
          <Reveal className="max-w-[44rem]">
            <p className="kicker mb-4 text-ink-soft">
              {m.races_specific_kicker()}
            </p>
            <h2 className="display-2-side text-white">
              {m.races_specific_title({ name })}
            </h2>
          </Reveal>
          <RevealGroup className="mt-12 grid gap-5 lg:grid-cols-3">
            {specifics.map((item, index) => (
              <RevealItem
                key={item.title}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-7"
              >
                <span className="font-mono text-[0.8rem] text-ink-soft">
                  0{index + 1}
                </span>
                <h3 className="mt-3 text-[1.15rem] font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-[0.96rem] leading-relaxed text-ink-soft">
                  {item.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {race.kind === 'road' ? (
        <RaceGoalTable race={race} locale={locale} />
      ) : (
        <RaceTrailPrep race={race} locale={locale} />
      )}

      <Section className="!py-16 sm:!py-24">
        <Container size="narrow">
          <h2 className="display-3 mb-8 text-ink">
            {m.races_faq_title({ name })}
          </h2>
          <Faq items={faq} placement="race_page" />
        </Container>
      </Section>

      {others.length > 0 && (
        <section className="pb-4">
          <Container>
            <h2 className="kicker mb-5 text-muted-foreground">
              {m.races_others_title()}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((other) => (
                <Link
                  key={other.slug}
                  href={localePath(locale, `/races/${other.slug}`)}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-ink/25"
                >
                  <span>
                    <span className="block font-semibold text-ink">
                      {raceText(other, 'name', ml)}
                    </span>
                    <span className="block text-[0.82rem] text-muted-foreground">
                      {raceText(other, 'place', ml)}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-ink transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
              <Link
                href={localePath(locale, '/races')}
                className="group flex items-center justify-between rounded-2xl border border-dashed border-border p-5 transition-colors hover:border-ink/25"
              >
                <span className="font-semibold text-ink">
                  {m.races_nav_all()}
                </span>
                <ArrowRight className="size-4 text-ink transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </Container>
        </section>
      )}

      <CtaBand
        locale={locale}
        placement={`race_${race.key}_final`}
        title={m.races_final_title({ the: raceText(race, 'the') })}
        body={m.races_final_body()}
        secondary={{
          href: localePath(
            locale,
            race.kind === 'road'
              ? '/training-plans/running'
              : '/training-plans/trail',
          ),
          label: m.races_final_secondary(),
        }}
      />
    </>
  );
}
