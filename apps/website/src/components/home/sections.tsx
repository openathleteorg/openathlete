import { shots } from '@/assets/screenshots';
import { buttonStyles } from '@/components/site/button';
import { CostCalculator } from '@/components/site/cost-calculator';
import { Faq } from '@/components/site/faq';
import { AndroidIcon, AppleIcon, GithubIcon } from '@/components/site/icons';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { PricingPlans } from '@/components/site/pricing-plans';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { AiExchange } from '@/components/site/visuals/ai-exchange';
import { FitnessChart } from '@/components/site/visuals/fitness-chart';
import { ProviderLogos } from '@/components/site/visuals/provider-logos';
import { PhoneShot, Screenshot } from '@/components/site/visuals/screenshot';
import { WorkoutBlocks } from '@/components/site/visuals/workout-blocks';
import { GITHUB_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { type SupportedLocale, localePath } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  MessageSquareText,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type { StaticImageData } from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { homeFaqEntries } from './faq-entries';

export function HomeLogos() {
  return (
    <section className="pt-6 pb-16">
      <Container>
        <p className="text-center text-[0.85rem] text-muted-foreground">
          {m.home_logos_title()}
        </p>
        <ProviderLogos className="mt-6 justify-center" height={24} />
      </Container>
    </section>
  );
}

export function HomePaths({ locale }: { locale: SupportedLocale }) {
  const cards = [
    {
      href: localePath(locale, '/athletes'),
      title: m.home_paths_athlete_title(),
      body: m.home_paths_athlete_body(),
      stat: m.home_paths_athlete_stat(),
      statLabel: m.home_paths_athlete_stat_label(),
      cta: m.home_paths_athlete_cta(),
      note: null,
      accent: 'from-sky/30',
    },
    {
      href: localePath(locale, '/coaches'),
      title: m.home_paths_coach_title(),
      body: m.home_paths_coach_body(),
      stat: m.home_paths_coach_stat(),
      statLabel: m.home_paths_coach_stat_label(),
      cta: m.home_paths_coach_cta(),
      note: m.home_paths_coach_compare(),
      accent: 'from-orchid/25',
    },
  ];
  return (
    <Section className="pt-8 sm:pt-12">
      <Container>
        <p className="kicker text-center text-muted-foreground">
          {m.home_paths_kicker()}
        </p>
        <RevealGroup className="mt-8 grid gap-5 md:grid-cols-2">
          {cards.map((card) => (
            <RevealItem key={card.href}>
              <Link
                href={card.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-white p-7 transition-shadow duration-300 hover:shadow-[0_30px_60px_-30px_rgb(5_12_52/0.35)] sm:p-9"
              >
                <div
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-gradient-to-br to-transparent blur-2xl transition-opacity duration-500 group-hover:opacity-100 sm:opacity-70',
                    card.accent,
                  )}
                />
                <h2 className="display-3 relative">{card.title}</h2>
                <p className="relative mt-3 max-w-md text-muted-foreground">
                  {card.body}
                </p>
                <div className="relative mt-8 flex flex-wrap items-end justify-between gap-4 pt-2">
                  <div>
                    <p className="text-5xl font-semibold tracking-[-0.04em] tabular-nums">
                      {card.stat}
                    </p>
                    <p className="mt-1 text-[0.85rem] text-muted-foreground">
                      {card.statLabel}
                    </p>
                    {card.note && (
                      <p className="mt-1 text-[0.78rem] text-coral-strong">
                        {card.note}
                      </p>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-[0.92rem] font-medium">
                    {card.cta}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}

function TourRow({
  kicker,
  title,
  body,
  points,
  visual,
  flip,
}: {
  kicker: string;
  title: string;
  body: string;
  points?: string[];
  visual: ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
      <Reveal
        className={cn('lg:col-span-5', flip && 'lg:order-2 lg:col-start-8')}
      >
        <p className="kicker text-sky-strong">{kicker}</p>
        <h3 className="display-3 mt-3">{title}</h3>
        <p className="mt-4 leading-relaxed text-muted-foreground">{body}</p>
        {points && (
          <ul className="mt-6 grid gap-2.5">
            {points.map((point) => (
              <li key={point} className="flex gap-2.5 text-[0.95rem]">
                <Check className="mt-0.5 size-4 shrink-0 text-mint-strong" />
                {point}
              </li>
            ))}
          </ul>
        )}
      </Reveal>
      <Reveal
        delay={0.1}
        className={cn('lg:col-span-7', flip && 'lg:order-1 lg:col-start-1')}
      >
        {visual}
      </Reveal>
    </div>
  );
}

function Shot({ src, alt }: { src: StaticImageData; alt: string }) {
  return (
    <Screenshot
      src={src}
      alt={alt}
      chrome={false}
      sizes="(min-width: 1024px) 680px, 100vw"
    />
  );
}

export function HomeTour({ locale }: { locale: SupportedLocale }) {
  return (
    <Section tone="paper" id="product">
      <Container>
        <SectionHeading
          kicker={m.home_tour_kicker()}
          title={m.home_tour_title()}
          lead={m.home_tour_lead()}
          align="center"
        />
        <div className="mt-20 grid gap-24 sm:gap-32">
          <TourRow
            kicker={m.home_tour_plan_kicker()}
            title={m.home_tour_plan_title()}
            body={m.home_tour_plan_body()}
            points={[
              m.home_tour_plan_point_1(),
              m.home_tour_plan_point_2(),
              m.home_tour_plan_point_3(),
            ]}
            visual={<Shot src={shots.season} alt={m.home_tour_plan_title()} />}
          />
          <TourRow
            flip
            kicker={m.home_tour_build_kicker()}
            title={m.home_tour_build_title()}
            body={m.home_tour_build_body()}
            points={[
              m.home_tour_build_point_1(),
              m.home_tour_build_point_2(),
              m.home_tour_build_point_3(),
            ]}
            visual={
              <div className="relative pb-16 sm:pb-10">
                <Shot
                  src={shots.workoutEditor}
                  alt={m.home_tour_build_title()}
                />
                <WorkoutBlocks
                  className="absolute right-3 -bottom-2 w-[min(92%,24rem)] sm:-right-6 sm:-bottom-10"
                  title={m.home_tour_build_workout()}
                  meta={m.home_tour_build_meta()}
                  sentLabel={m.home_tour_build_sent({ device: 'COROS' })}
                />
              </div>
            }
          />
          <TourRow
            kicker={m.home_tour_analyse_kicker()}
            title={m.home_tour_analyse_title()}
            body={m.home_tour_analyse_body()}
            points={[
              m.home_tour_analyse_point_1(),
              m.home_tour_analyse_point_2(),
              m.home_tour_analyse_point_3(),
            ]}
            visual={
              <Shot src={shots.activity} alt={m.home_tour_analyse_title()} />
            }
          />
          <TourRow
            flip
            kicker={m.home_tour_records_kicker()}
            title={m.home_tour_records_title()}
            body={m.home_tour_records_body()}
            visual={
              <Shot src={shots.records} alt={m.home_tour_records_title()} />
            }
          />
          <TourRow
            kicker={m.home_tour_coach_kicker()}
            title={m.home_tour_coach_title()}
            body={m.home_tour_coach_body()}
            points={[
              m.home_tour_coach_point_1(),
              m.home_tour_coach_point_2(),
              m.home_tour_coach_point_3(),
            ]}
            visual={
              <Shot
                src={shots.coachDashboard}
                alt={m.home_tour_coach_title()}
              />
            }
          />
        </div>
        <div className="mt-20 flex justify-center">
          <Link
            href={localePath(locale, '/features')}
            className={buttonStyles({ variant: 'secondary' })}
          >
            {m.home_tour_more()}
            <ArrowRight />
          </Link>
        </div>
      </Container>
    </Section>
  );
}

export function HomeLoad({ locale }: { locale: SupportedLocale }) {
  return (
    <Section tone="ink">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="kicker text-ink-soft">{m.home_load_kicker()}</p>
            <h2 className="display-2-side mt-4 text-white">
              {m.home_load_title()}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/70">
              {m.home_load_body()}
            </p>
            <p className="mt-6 border-l-2 border-mint/60 pl-4 text-[0.95rem] leading-relaxed text-white/60">
              {m.home_load_open()}
            </p>
            <Link
              href={localePath(locale, '/features/training-load')}
              className="mt-8 inline-flex items-center gap-1.5 font-medium text-white hover:text-mint"
            >
              {m.home_load_link()}
              <ArrowRight className="size-4" />
            </Link>
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
  );
}

const AI_PROVIDERS = [
  'OpenAI',
  'Anthropic',
  'Google',
  'Mistral',
  'OpenRouter',
  'DeepSeek',
  'xAI',
  'Groq',
  'Ollama',
];

export function HomeAi({ locale }: { locale: SupportedLocale }) {
  const features = [
    {
      icon: <Wand2 />,
      title: m.home_ai_feature_1_title(),
      body: m.home_ai_feature_1_body(),
    },
    {
      icon: <MessageSquareText />,
      title: m.home_ai_feature_2_title(),
      body: m.home_ai_feature_2_body(),
    },
    {
      icon: <Sparkles />,
      title: m.home_ai_feature_3_title(),
      body: m.home_ai_feature_3_body(),
    },
  ];
  return (
    <Section>
      <Container>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <SectionHeading
              size="side"
              kicker={m.home_ai_kicker()}
              title={m.home_ai_title()}
              lead={m.home_ai_body()}
            />
            <ul className="mt-7 flex flex-wrap gap-2">
              {AI_PROVIDERS.map((provider) => (
                <li
                  key={provider}
                  className="rounded-full border border-border bg-white px-3 py-1 font-mono text-[0.75rem] text-ink/75"
                >
                  {provider}
                </li>
              ))}
            </ul>
            <RevealGroup className="mt-10 grid gap-6">
              {features.map((feature) => (
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
              {m.home_ai_cta()}
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
  );
}

export function HomeCost() {
  return (
    <Section tone="paper">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              size="side"
              kicker={m.home_cost_kicker()}
              title={m.home_cost_title()}
              lead={m.home_cost_lead()}
            />
          </div>
          <Reveal className="lg:col-span-7">
            <CostCalculator placement="home" />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

export function HomeOpenSource({ locale }: { locale: SupportedLocale }) {
  return (
    <Section tone="ink" className="overflow-hidden">
      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <p className="kicker text-ink-soft">{m.home_os_kicker()}</p>
            <h2 className="display-2-side mt-4 text-white">
              {m.home_os_title()}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/70">
              {m.home_os_body()}
            </p>
            <ul className="mt-8 grid gap-3">
              {[
                m.home_os_point_1(),
                m.home_os_point_2(),
                m.home_os_point_3(),
              ].map((point) => (
                <li key={point} className="flex gap-3 text-white/85">
                  <Check className="mt-1 size-4 shrink-0 text-mint" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href={GITHUB_URL}
                event="github_clicked"
                properties={{ placement: 'home_open_source' }}
                className={buttonStyles({ variant: 'light' })}
              >
                <GithubIcon />
                {m.home_os_cta_github()}
              </TrackedLink>
              <Link
                href={localePath(locale, '/open-source')}
                className={buttonStyles({ variant: 'outlineLight' })}
              >
                {m.home_os_cta_more()}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#030824] font-mono text-[0.82rem] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)]">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                <span className="size-2.5 rounded-full bg-coral/80" />
                <span className="size-2.5 rounded-full bg-[#f2b13c]/80" />
                <span className="size-2.5 rounded-full bg-mint/70" />
                <span className="ml-3 text-[0.72rem] text-white/40">
                  ~/openathlete
                </span>
              </div>
              <pre className="overflow-x-auto p-5 leading-7 whitespace-pre-wrap break-all text-white/80">
                <code>
                  <span className="text-white/40">$ </span>
                  curl -fsSL
                  https://raw.githubusercontent.com/openathleteorg/openathlete/main/scripts/install.sh
                  {' | sh -s -- --domain '}
                  <span className="text-sky">training.myclub.org</span>
                  {'\n\n'}
                  <span className="text-mint">✔</span> postgres{'   '}
                  <span className="text-white/40">Healthy</span>
                  {'\n'}
                  <span className="text-mint">✔</span> redis{'      '}
                  <span className="text-white/40">Healthy</span>
                  {'\n'}
                  <span className="text-mint">✔</span> api{'        '}
                  <span className="text-white/40">Healthy</span>
                  {'\n'}
                  <span className="text-mint">✔</span> web{'        '}
                  <span className="text-white/40">Healthy</span>
                  {'\n'}
                  <span className="text-mint">✔</span> caddy{'      '}
                  <span className="text-white/40">HTTPS ready</span>
                  {'\n\n'}
                  <span className="text-sky">→</span>{' '}
                  https://training.myclub.org
                </code>
              </pre>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

export function HomePricing() {
  return (
    <Section>
      <Container>
        <SectionHeading
          kicker={m.home_pricing_kicker()}
          title={m.home_pricing_title()}
          lead={m.home_pricing_lead()}
          align="center"
        />
        <div className="mt-12">
          <PricingPlans placement="home" />
        </div>
      </Container>
    </Section>
  );
}

export function HomeMobile({ locale }: { locale: SupportedLocale }) {
  return (
    <Section tone="paper" className="overflow-hidden py-16 sm:py-20">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
          <Reveal>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-[0.8rem]">
                <AppleIcon className="size-4" /> iOS
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-[0.8rem]">
                <AndroidIcon className="size-4 text-mint-strong" /> Android
              </span>
              <span className="rounded-full bg-mint/25 px-3 py-1 text-[0.8rem] font-medium text-mint-strong">
                {m.site_nav_soon()}
              </span>
            </div>
            <h2 className="display-3 mt-5">{m.home_mobile_title()}</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {m.home_mobile_body()}
            </p>
            <Link
              href={localePath(locale, '/mobile')}
              className="mt-6 inline-flex items-center gap-1.5 font-medium hover:text-sky-strong"
            >
              {m.home_mobile_cta()}
              <ArrowUpRight className="size-4" />
            </Link>
          </Reveal>
          <Reveal delay={0.1} className="relative mx-auto h-[22rem] w-[19rem]">
            <PhoneShot
              src={shots.mobileCalendar}
              alt={m.home_mobile_title()}
              className="absolute top-4 left-0 w-[11.5rem] -rotate-6"
            />
            <PhoneShot
              src={shots.mobileActivity}
              alt={m.home_mobile_title()}
              className="absolute top-0 right-0 w-[11.5rem] rotate-3"
            />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

export function HomeFaq() {
  return (
    <Section>
      <Container size="narrow">
        <h2 className="display-2 mb-10">{m.home_faq_title()}</h2>
        <Faq items={homeFaqEntries()} placement="home" />
      </Container>
    </Section>
  );
}
