import { shots } from '@/assets/screenshots';
import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
  SoftwareApplicationStructuredData,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CtaBand } from '@/components/site/cta-band';
import { Faq } from '@/components/site/faq';
import { CoffeeIcon } from '@/components/site/icons';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { AiExchange } from '@/components/site/visuals/ai-exchange';
import { FitnessChart } from '@/components/site/visuals/fitness-chart';
import { ProviderLogos } from '@/components/site/visuals/provider-logos';
import { Screenshot } from '@/components/site/visuals/screenshot';
import { BUY_ME_A_COFFEE_URL } from '@/config';
import { initLocale } from '@/i18n/server';
import { signupUrl, supporterUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import { localePath, localizedUrl } from '@/utils/locales';
import {
  ArrowRight,
  CalendarRange,
  Check,
  Download,
  HeartPulse,
  LineChart,
  Mic,
  Plane,
  Trophy,
  UserPlus,
  Wand2,
  Watch,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';

import { generateMetadata as pageMetadata } from '../../metadata';
import { AthletePrices } from '../pricing/athlete-prices';
import { PHOTOS, Photo, faqEntries, sourceUrl } from '../pricing/page-kit';
import { AthleteWeek } from './week';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/athletes',
    title: m.athletes_seo_title(),
    description: m.athletes_seo_description(),
  });
}

export default async function AthletesPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const faqs = faqEntries('athletes_faq', 6);

  return (
    <>
      <SoftwareApplicationStructuredData
        locale={locale}
        description={m.athletes_seo_description()}
      />
      <BreadcrumbListStructuredData
        items={[
          { name: 'OpenAthlete', url: localizedUrl(locale) },
          {
            name: m.athletes_breadcrumb(),
            url: localizedUrl(locale, '/athletes'),
          },
        ]}
      />
      <FAQPageStructuredData faqs={faqs} />

      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_20%_0%,black,transparent)]" />
          <div className="absolute top-[-10rem] left-[-8rem] h-[30rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--sky)_30%,transparent),transparent)] blur-2xl" />
        </div>
        <Container className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-6">
              <p className="kicker text-sky-strong">
                {m.athletes_hero_kicker()}
              </p>
              <h1 className="display-1 mt-5">
                {m.athletes_hero_title_1()}{' '}
                <span className="brand-gradient-text">
                  {m.athletes_hero_title_2()}
                </span>
              </h1>
              <p className="lead mt-6 max-w-xl">{m.athletes_hero_lead()}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href={signupUrl('athletes_hero')}
                  event="cta_clicked"
                  properties={{ placement: 'athletes_hero', cta: 'signup' }}
                  className={buttonStyles({
                    size: 'lg',
                    className: 'w-full sm:w-auto',
                  })}
                >
                  {m.site_cta_start()}
                  <ArrowRight className="transition-transform group-hover/btn:translate-x-0.5" />
                </TrackedLink>
                <a
                  href="#week"
                  className={buttonStyles({
                    variant: 'secondary',
                    size: 'lg',
                    className: 'w-full sm:w-auto',
                  })}
                >
                  {m.athletes_hero_cta_secondary()}
                </a>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.85rem] text-muted-foreground">
                {[
                  m.athletes_hero_proof_1(),
                  m.athletes_hero_proof_2(),
                  m.athletes_hero_proof_3(),
                ].map((proof) => (
                  <li key={proof} className="flex items-center gap-1.5">
                    <Check className="size-4 text-mint-strong" />
                    {proof}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative lg:col-span-6">
              <div className="relative overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-30px_rgb(5_12_52/0.5)]">
                <Photo
                  src={PHOTOS.trailRidge}
                  alt={m.athletes_hero_photo_alt()}
                  priority
                  sizes="(min-width: 1024px) 600px, 100vw"
                  className="aspect-[4/3.4] w-full sm:aspect-[4/3]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
              </div>
              {/* Two cards from the app, floating over the photo */}
              <div className="absolute -bottom-6 left-3 w-[15.5rem] rounded-2xl border border-border bg-white/95 p-4 shadow-[0_24px_48px_-24px_rgb(5_12_52/0.45)] backdrop-blur sm:-left-6">
                <p className="text-[0.85rem] font-semibold">
                  {m.athletes_hero_card_session()}
                </p>
                <div className="mt-3 flex h-8 items-end gap-[2px]">
                  {[2, 1, 4, 0, 4, 0, 4, 0, 4, 0, 4, 1].map((zone, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-t-[2px]"
                      style={{
                        height: `${[35, 50, 65, 80, 100][zone]}%`,
                        background: [
                          '#9fd3fb',
                          '#6ec1fc',
                          '#12a594',
                          '#f2b13c',
                          '#f4743b',
                        ][zone],
                      }}
                    />
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 font-mono text-[0.68rem] text-mint-strong">
                  <Watch className="size-3.5" />
                  {m.athletes_hero_card_sent()}
                </p>
              </div>
              <div className="absolute top-4 right-3 rounded-2xl border border-white/20 bg-ink/80 px-4 py-3 text-white shadow-lg backdrop-blur sm:-right-4 sm:top-8">
                <p className="font-mono text-[0.65rem] tracking-wider text-white/60 uppercase">
                  {m.home_load_form()}
                </p>
                <p className="text-3xl font-semibold tracking-[-0.03em] text-mint tabular-nums">
                  +6
                </p>
                <p className="max-w-[9rem] text-[0.72rem] leading-snug text-white/70">
                  {m.athletes_hero_card_form_note()}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Watches */}
      <section className="border-y border-border bg-paper py-12">
        <Container>
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="display-3">{m.athletes_watch_title()}</h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
                {m.athletes_watch_body()}
              </p>
            </div>
            <div className="lg:col-span-7">
              <ProviderLogos
                className="justify-start lg:justify-end"
                height={26}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* A week */}
      <Section id="week">
        <Container>
          <SectionHeading
            kicker={m.athletes_week_kicker()}
            title={m.athletes_week_title()}
            lead={m.athletes_week_lead()}
          />
          <AthleteWeek locale={locale} />
        </Container>
      </Section>

      {/* Toolkit */}
      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.athletes_tools_kicker()}
            title={m.athletes_tools_title()}
            lead={m.athletes_tools_lead()}
            align="center"
          />
          <RevealGroup className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <RevealItem className="overflow-hidden rounded-3xl border border-border bg-white md:col-span-2 lg:row-span-2">
              <div className="p-7 pb-0">
                <CalendarRange className="size-5 text-sky-strong" />
                <h3 className="mt-4 text-lg font-semibold">
                  {m.athletes_tools_season_title()}
                </h3>
                <p className="mt-2 max-w-lg text-[0.95rem] leading-relaxed text-muted-foreground">
                  {m.athletes_tools_season_body()}
                </p>
              </div>
              <div className="mt-6 pl-7">
                <Screenshot
                  src={shots.season}
                  alt={m.athletes_tools_season_title()}
                  chrome={false}
                  className="rounded-r-none rounded-b-none border-r-0 border-b-0"
                  sizes="(min-width: 1024px) 760px, 100vw"
                />
              </div>
            </RevealItem>
            {[
              {
                icon: <Workflow />,
                title: m.athletes_tools_builder_title(),
                body: m.athletes_tools_builder_body(),
              },
              {
                icon: <Trophy />,
                title: m.athletes_tools_records_title(),
                body: m.athletes_tools_records_body(),
              },
              {
                icon: <LineChart />,
                title: m.athletes_tools_analysis_title(),
                body: m.athletes_tools_analysis_body(),
              },
              {
                icon: <Plane />,
                title: m.athletes_tools_periods_title(),
                body: m.athletes_tools_periods_body(),
              },
              {
                icon: <HeartPulse />,
                title: m.athletes_tools_metrics_title(),
                body: m.athletes_tools_metrics_body(),
              },
            ].map((card) => (
              <RevealItem
                key={card.title}
                className="rounded-3xl border border-border bg-white p-7 [&_svg]:size-5 [&_svg]:text-sky-strong"
              >
                {card.icon}
                <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
                  {card.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
          <div className="mt-12 flex justify-center">
            <Link
              href={localePath(locale, '/features')}
              className={buttonStyles({ variant: 'secondary' })}
            >
              {m.athletes_tools_more()}
              <ArrowRight />
            </Link>
          </div>
        </Container>
      </Section>

      {/* Training load */}
      <Section tone="ink">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <p className="kicker text-ink-soft">{m.athletes_load_kicker()}</p>
              <h2 className="display-2-side mt-4 text-white">
                {m.athletes_load_title()}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-white/70">
                {m.athletes_load_body()}
              </p>
              <p className="mt-6 border-l-2 border-mint/60 pl-4 text-[0.95rem] leading-relaxed text-white/60">
                {m.athletes_load_open()}
              </p>
              <TrackedLink
                href={sourceUrl(
                  'apps/api/src/modules/core/helpers/training-load.ts',
                )}
                event="github_clicked"
                properties={{ placement: 'athletes_load' }}
                className="mt-8 inline-flex items-center gap-1.5 font-medium text-white hover:text-mint"
              >
                {m.athletes_load_link()}
                <ArrowRight className="size-4" />
              </TrackedLink>
            </Reveal>
            <Reveal delay={0.15} className="lg:col-span-7">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">
                <FitnessChart
                  tone="dark"
                  labels={{
                    fitness: m.home_load_fitness(),
                    fatigue: m.home_load_fatigue(),
                    form: m.home_load_form(),
                    race: m.home_load_race(),
                  }}
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* AI */}
      <Section>
        <Container>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <SectionHeading
                size="side"
                kicker={m.athletes_ai_kicker()}
                title={m.athletes_ai_title()}
                lead={m.athletes_ai_body()}
              />
              <RevealGroup className="mt-10 grid gap-7">
                {[
                  {
                    icon: <Wand2 />,
                    title: m.athletes_ai_1_title(),
                    body: m.athletes_ai_1_body(),
                  },
                  {
                    icon: <Mic />,
                    title: m.athletes_ai_2_title(),
                    body: m.athletes_ai_2_body(),
                  },
                  {
                    icon: <Workflow />,
                    title: m.athletes_ai_3_title(),
                    body: m.athletes_ai_3_body(),
                  },
                ].map((feature) => (
                  <RevealItem key={feature.title} className="flex gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-paper text-ink [&_svg]:size-[18px]">
                      {feature.icon}
                    </span>
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="mt-1 text-[0.95rem] leading-relaxed text-muted-foreground">
                        {feature.body}
                      </p>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>
              <Link
                href={localePath(locale, '/features/ai-coach')}
                className={buttonStyles({
                  variant: 'secondary',
                  className: 'mt-10',
                })}
              >
                {m.athletes_ai_cta()}
                <ArrowRight />
              </Link>
            </div>
            <Reveal delay={0.1} className="lg:col-span-6">
              <div className="ink-band relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:sticky lg:top-28">
                <div className="dot-grid absolute inset-0 opacity-50" />
                <div className="relative">
                  <AiExchange
                    prompt={m.home_ai_prompt()}
                    reply={m.home_ai_reply()}
                    via={m.home_ai_via()}
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Coach and data */}
      <Section tone="paper" className="py-16 sm:py-20">
        <Container>
          <RevealGroup className="grid gap-5 md:grid-cols-2">
            <RevealItem className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-gradient-to-br from-orchid/25 to-transparent blur-2xl"
              />
              <UserPlus className="relative size-6 text-orchid-strong" />
              <h2 className="display-3 relative mt-5">
                {m.athletes_coach_title()}
              </h2>
              <p className="relative mt-3 leading-relaxed text-muted-foreground">
                {m.athletes_coach_body()}
              </p>
              <div className="flex-1" />
              <Link
                href={localePath(locale, '/coaches')}
                className="relative mt-6 inline-flex items-center gap-1.5 font-medium hover:text-orchid-strong"
              >
                {m.athletes_coach_link()}
                <ArrowRight className="size-4" />
              </Link>
            </RevealItem>
            <RevealItem className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-gradient-to-br from-mint/30 to-transparent blur-2xl"
              />
              <Download className="relative size-6 text-mint-strong" />
              <h2 className="display-3 relative mt-5">
                {m.athletes_data_title()}
              </h2>
              <p className="relative mt-3 leading-relaxed text-muted-foreground">
                {m.athletes_data_body()}
              </p>
              <div className="flex-1" />
              <Link
                href={localePath(locale, '/open-source')}
                className="relative mt-6 inline-flex items-center gap-1.5 font-medium hover:text-mint-strong"
              >
                {m.athletes_data_link()}
                <ArrowRight className="size-4" />
              </Link>
            </RevealItem>
          </RevealGroup>
        </Container>
      </Section>

      {/* Prices */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <AthletePrices locale={locale} />
            </div>
            <Reveal delay={0.1} className="lg:col-span-5 lg:pt-28">
              <div className="relative overflow-hidden rounded-3xl bg-ink p-7 text-white sm:p-8 lg:sticky lg:top-28">
                <div className="brand-gradient absolute inset-x-0 top-0 h-1" />
                <h3 className="text-xl font-semibold tracking-[-0.02em]">
                  {m.athletes_support_title()}
                </h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-white/70">
                  {m.athletes_support_body()}
                </p>
                <div className="mt-7 flex flex-col gap-3">
                  <TrackedLink
                    href={supporterUrl('athletes_support')}
                    event="supporter_clicked"
                    properties={{ placement: 'athletes_support' }}
                    className={buttonStyles({ variant: 'light' })}
                  >
                    {m.plans_supporter_cta()}
                  </TrackedLink>
                  <TrackedLink
                    href={BUY_ME_A_COFFEE_URL}
                    event="donation_clicked"
                    properties={{ placement: 'athletes_support' }}
                    className={buttonStyles({ variant: 'coffee' })}
                  >
                    <CoffeeIcon />
                    {m.plans_coffee_cta()}
                  </TrackedLink>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section tone="paper">
        <Container size="narrow">
          <h2 className="display-2 mb-10">{m.athletes_faq_title()}</h2>
          <Faq items={faqs} placement="athletes" />
        </Container>
      </Section>

      <div className="pt-10">
        <CtaBand
          locale={locale}
          placement="athletes_final"
          title={m.athletes_final_title()}
          body={m.athletes_final_body()}
        />
      </div>
    </>
  );
}
