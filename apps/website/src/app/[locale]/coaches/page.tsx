import { shots } from '@/assets/screenshots';
import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
  SoftwareApplicationStructuredData,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CostCalculator } from '@/components/site/cost-calculator';
import { CtaBand } from '@/components/site/cta-band';
import { Faq } from '@/components/site/faq';
import { DiscordIcon, GithubIcon } from '@/components/site/icons';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { Screenshot } from '@/components/site/visuals/screenshot';
import { TiltIn } from '@/components/site/visuals/tilt-in';
import { DISCORD_URL, GITHUB_URL, SUPPORTER_YEARLY_EUR } from '@/config';
import { PRICES_CHECKED_ON, formatPrice } from '@/content/pricing';
import { initLocale } from '@/i18n/server';
import { signupUrl, supporterUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import {
  DATE_LOCALES,
  formatLongDate,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import {
  ArrowRight,
  CalendarCog,
  CopyPlus,
  Heart,
  Info,
  Layers,
  ListChecks,
  Palette,
  Wand2,
} from 'lucide-react';
import Link from 'next/link';

import { generateMetadata as pageMetadata } from '../../metadata';
import { CheckList, PHOTOS, Photo, faqEntries } from '../pricing/page-kit';
import {
  AiKeyFlow,
  RosterDots,
  RosterTable,
  WatchList,
  WatchMatrix,
} from './visuals';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/coaches',
    title: m.coachespage_seo_title(),
    description: m.coachespage_seo_description(),
  });
}

export default async function CoachesPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const intl = DATE_LOCALES[locale];
  const faqs = faqEntries('coachespage_faq', 6);
  const checkedOn = formatLongDate(PRICES_CHECKED_ON, locale);

  const stats = [
    {
      value: formatPrice(SUPPORTER_YEARLY_EUR, 'EUR', intl),
      label: m.coachespage_stat_1(),
    },
    { value: formatPrice(0, 'EUR', intl), label: m.coachespage_stat_2() },
    { value: formatPrice(0, 'EUR', intl), label: m.coachespage_stat_3() },
    { value: '5', label: m.coachespage_stat_4() },
  ];

  const planning = [
    {
      icon: <Layers />,
      title: m.coachespage_plan_1_title(),
      body: m.coachespage_plan_1_body(),
    },
    {
      icon: <CopyPlus />,
      title: m.coachespage_plan_2_title(),
      body: m.coachespage_plan_2_body(),
    },
    {
      icon: <CalendarCog />,
      title: m.coachespage_plan_3_title(),
      body: m.coachespage_plan_3_body(),
    },
    {
      icon: <Wand2 />,
      title: m.coachespage_plan_4_title(),
      body: m.coachespage_plan_4_body(),
    },
    {
      icon: <Palette />,
      title: m.coachespage_plan_5_title(),
      body: m.coachespage_plan_5_body(),
    },
    {
      icon: <ListChecks />,
      title: m.coachespage_plan_6_title(),
      body: m.coachespage_plan_6_body(),
    },
  ];

  const steps = [1, 2, 3, 4, 5].map((index) => ({
    title: (
      m[`coachespage_switch_${index}_title` as keyof typeof m] as () => string
    )(),
    body: (
      m[`coachespage_switch_${index}_body` as keyof typeof m] as () => string
    )(),
  }));

  return (
    <>
      <SoftwareApplicationStructuredData
        locale={locale}
        description={m.coachespage_seo_description()}
      />
      <BreadcrumbListStructuredData
        items={[
          { name: 'OpenAthlete', url: localizedUrl(locale) },
          {
            name: m.coachespage_breadcrumb(),
            url: localizedUrl(locale, '/coaches'),
          },
        ]}
      />
      <FAQPageStructuredData faqs={faqs} />

      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_80%_0%,black,transparent)]" />
          <div className="absolute top-[-8rem] right-[-10rem] h-[32rem] w-[44rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--orchid)_24%,transparent),transparent)] blur-2xl" />
        </div>
        <Container className="relative">
          <div className="max-w-4xl">
            <p className="kicker text-orchid-strong">
              {m.coachespage_hero_kicker()}
            </p>
            <h1 className="display-1 mt-5">
              {m.coachespage_hero_title_1()}{' '}
              <span className="brand-gradient-text">
                {m.coachespage_hero_title_2()}
              </span>
              <span className="align-super text-[0.4em] text-muted-foreground">
                *
              </span>
            </h1>
            <p className="lead mt-6 max-w-2xl">{m.coachespage_hero_lead()}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href={signupUrl('coaches_hero')}
                event="cta_clicked"
                properties={{ placement: 'coaches_hero', cta: 'signup' }}
                className={buttonStyles({
                  size: 'lg',
                  className: 'w-full sm:w-auto',
                })}
              >
                {m.coachespage_hero_cta()}
                <ArrowRight className="transition-transform group-hover/btn:translate-x-0.5" />
              </TrackedLink>
              <TrackedLink
                href={supporterUrl('coaches_hero')}
                event="supporter_clicked"
                properties={{ placement: 'coaches_hero' }}
                className={buttonStyles({
                  variant: 'secondary',
                  size: 'lg',
                  className: 'w-full sm:w-auto',
                })}
              >
                <Heart className="fill-coral text-coral" />
                {m.plans_supporter_cta()}
              </TrackedLink>
            </div>
          </div>

          <TiltIn className="relative mt-14 sm:mt-16">
            <Screenshot
              src={shots.coachDashboard}
              alt={m.coachespage_hero_shot_alt()}
              priority
              sizes="(min-width: 1200px) 1150px, 100vw"
            />
          </TiltIn>
          <p className="mt-8 max-w-3xl text-[0.75rem] leading-relaxed text-muted-foreground">
            {m.coachespage_hero_footnote({ date: checkedOn })}
          </p>
        </Container>
      </section>

      {/* Stats over the track */}
      <section className="relative overflow-hidden">
        <Photo
          src={PHOTOS.trackAerial}
          alt={m.coachespage_photo_alt()}
          sizes="100vw"
          width={2400}
          height={1000}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-ink/85" />
        <Container className="relative py-16 sm:py-20">
          <RevealGroup className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
            {stats.map((stat) => (
              <RevealItem
                key={stat.label}
                className="border-l border-white/20 pl-5"
              >
                <p className="text-5xl font-semibold tracking-[-0.04em] text-white tabular-nums sm:text-6xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-[0.9rem] text-white/70">{stat.label}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* Dashboard */}
      <Section>
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeading
                size="side"
                kicker={m.coachespage_dash_kicker()}
                title={m.coachespage_dash_title()}
                lead={m.coachespage_dash_body()}
              />
              <CheckList
                className="mt-7"
                items={[
                  m.coachespage_dash_point_1(),
                  m.coachespage_dash_point_2(),
                  m.coachespage_dash_point_3(),
                ]}
              />
              <p className="mt-7 flex gap-2.5 rounded-2xl bg-paper p-4 text-[0.88rem] leading-relaxed text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0 text-sky-strong" />
                {m.coachespage_dash_honest()}
              </p>
            </div>
            <Reveal delay={0.1} className="relative lg:col-span-7">
              <WatchList className="mb-4 sm:w-[21rem]" />
              <RosterTable />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Planning */}
      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.coachespage_plan_kicker()}
            title={m.coachespage_plan_title()}
            lead={m.coachespage_plan_lead()}
          />
          <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planning.map((card) => (
              <RevealItem
                key={card.title}
                className="rounded-3xl border border-border bg-white p-7 [&_svg]:size-5 [&_svg]:text-orchid-strong"
              >
                {card.icon}
                <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">
                  {card.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal className="mt-10">
            <Screenshot
              src={shots.coachAthleteCalendar}
              alt={m.coachespage_plan_title()}
              sizes="(min-width: 1200px) 1150px, 100vw"
            />
          </Reveal>
        </Container>
      </Section>

      {/* Watches */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHeading
                size="side"
                kicker={m.coachespage_watch_kicker()}
                title={m.coachespage_watch_title()}
                lead={m.coachespage_watch_lead()}
              />
            </div>
            <Reveal delay={0.1} className="min-w-0 lg:col-span-7">
              <WatchMatrix />
              <p className="mt-4 text-[0.82rem] leading-relaxed text-muted-foreground">
                {m.coachespage_watch_note()}
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Communication */}
      <Section tone="paper">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:order-2 lg:col-span-5">
              <SectionHeading
                size="side"
                kicker={m.coachespage_comm_kicker()}
                title={m.coachespage_comm_title()}
                lead={m.coachespage_comm_body()}
              />
              <p className="mt-7 border-l-2 border-orchid/50 pl-4 text-[0.95rem] leading-relaxed text-muted-foreground">
                {m.coachespage_comm_ai()}
              </p>
            </Reveal>
            <Reveal delay={0.1} className="lg:order-1 lg:col-span-7">
              <Screenshot
                src={shots.chat}
                alt={m.coachespage_comm_shot_alt()}
                chrome={false}
                sizes="(min-width: 1024px) 680px, 100vw"
              />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* AI on the coach's key */}
      <Section tone="ink">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-12">
            <Reveal className="lg:col-span-6">
              <p className="kicker text-ink-soft">
                {m.coachespage_ai_kicker()}
              </p>
              <h2 className="display-2-side mt-4 text-white">
                {m.coachespage_ai_title()}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-white/70">
                {m.coachespage_ai_body()}
              </p>
              <p className="mt-6 border-l-2 border-mint/60 pl-4 text-[0.95rem] leading-relaxed text-white/60">
                {m.coachespage_ai_note()}
              </p>
            </Reveal>
            <Reveal delay={0.15} className="lg:col-span-5 lg:col-start-8">
              <AiKeyFlow />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Pricing */}
      <Section>
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeading
                size="side"
                kicker={m.coachespage_price_kicker()}
                title={m.coachespage_price_title()}
                lead={m.coachespage_price_lead()}
              />
              <div className="mt-8">
                <RosterDots />
              </div>
              <p className="mt-8 rounded-2xl border border-border bg-paper p-5 text-[0.9rem] leading-relaxed text-muted-foreground">
                {m.coachespage_price_stop()}
              </p>
            </div>
            <Reveal delay={0.1} className="lg:col-span-7">
              <CostCalculator placement="coaches" />
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Switching */}
      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.coachespage_switch_kicker()}
            title={m.coachespage_switch_title()}
            lead={m.coachespage_switch_lead()}
          />
          <RevealGroup className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <RevealItem
                key={step.title}
                className={
                  index === 3
                    ? 'rounded-3xl border border-coral/40 bg-white p-6 shadow-[0_0_0_4px_color-mix(in_oklab,var(--coral)_10%,transparent)]'
                    : 'rounded-3xl border border-border bg-white p-6'
                }
              >
                <span className="grid size-9 place-items-center rounded-full bg-ink font-mono text-[0.8rem] text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 font-semibold">{step.title}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-[0.92rem] text-muted-foreground">
              {m.coachespage_switch_tip()}
            </p>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.92rem]">
              <span className="text-muted-foreground">
                {m.coachespage_switch_compare()}
              </span>
              <Link
                href={localePath(locale, '/compare/trainingpeaks')}
                className="inline-flex items-center gap-1 font-medium hover:text-orchid-strong"
              >
                TrainingPeaks <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href={localePath(locale, '/compare/nolio')}
                className="inline-flex items-center gap-1 font-medium hover:text-orchid-strong"
              >
                Nolio <ArrowRight className="size-3.5" />
              </Link>
            </p>
          </div>
        </Container>
      </Section>

      {/* Limits */}
      <Section className="py-16 sm:py-20">
        <Container size="narrow">
          <Reveal className="rounded-3xl border border-dashed border-border p-7 sm:p-10">
            <p className="kicker text-muted-foreground">
              {m.coachespage_limits_kicker()}
            </p>
            <h2 className="display-3 mt-3">{m.coachespage_limits_title()}</h2>
            <ul className="mt-7 grid gap-3.5">
              {[
                m.coachespage_limits_1(),
                m.coachespage_limits_2(),
                m.coachespage_limits_3(),
                m.coachespage_limits_4(),
                m.coachespage_limits_5(),
              ].map((limit) => (
                <li
                  key={limit}
                  className="flex gap-3 text-[0.97rem] leading-relaxed"
                >
                  <span className="mt-2.5 h-px w-3 shrink-0 bg-ink/40" />
                  {limit}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.92rem] text-muted-foreground">
                {m.coachespage_limits_outro()}
              </p>
              <div className="flex gap-2">
                <TrackedLink
                  href={`${GITHUB_URL}/issues`}
                  event="github_clicked"
                  properties={{ placement: 'coaches_limits' }}
                  aria-label="GitHub"
                  className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                >
                  <GithubIcon />
                  GitHub
                </TrackedLink>
                <TrackedLink
                  href={DISCORD_URL}
                  event="cta_clicked"
                  properties={{ placement: 'coaches_limits', cta: 'discord' }}
                  aria-label="Discord"
                  className={buttonStyles({ variant: 'secondary', size: 'sm' })}
                >
                  <DiscordIcon />
                  Discord
                </TrackedLink>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Supporter */}
      <section className="pb-6">
        <Container>
          <Reveal className="relative overflow-hidden rounded-[2rem] bg-ink p-8 text-white sm:p-12">
            <div className="brand-gradient absolute inset-x-0 top-0 h-1" />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-orchid/25 blur-3xl"
            />
            <div className="relative grid items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <p className="kicker text-ink-soft">
                  {m.coachespage_supporter_kicker()}
                </p>
                <h2 className="display-3 mt-3 text-white">
                  {m.coachespage_supporter_title()}
                </h2>
                <p className="mt-4 max-w-2xl leading-relaxed text-white/70">
                  {m.coachespage_supporter_body({
                    monthly: formatPrice(
                      Math.round((SUPPORTER_YEARLY_EUR / 12) * 100) / 100,
                      'EUR',
                      intl,
                    ),
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:col-span-4">
                <TrackedLink
                  href={supporterUrl('coaches_supporter')}
                  event="supporter_clicked"
                  properties={{
                    placement: 'coaches_supporter',
                    period: 'yearly',
                  }}
                  className={buttonStyles({ variant: 'light', size: 'lg' })}
                >
                  <Heart className="fill-coral text-coral" />
                  {m.plans_supporter_cta()}
                </TrackedLink>
                <TrackedLink
                  href={signupUrl('coaches_supporter')}
                  event="cta_clicked"
                  properties={{ placement: 'coaches_supporter', cta: 'signup' }}
                  className={buttonStyles({
                    variant: 'outlineLight',
                    size: 'lg',
                  })}
                >
                  {m.coachespage_supporter_free()}
                </TrackedLink>
                <p className="text-center text-[0.75rem] text-white/50">
                  {m.plans_supporter_vat()}
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* FAQ */}
      <Section>
        <Container size="narrow">
          <h2 className="display-2 mb-10">{m.coachespage_faq_title()}</h2>
          <Faq items={faqs} placement="coaches" />
        </Container>
      </Section>

      <CtaBand
        locale={locale}
        placement="coaches_final"
        title={m.coachespage_final_title()}
        body={m.coachespage_final_body()}
      />
    </>
  );
}
