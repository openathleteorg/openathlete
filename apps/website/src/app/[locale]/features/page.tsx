import { shots } from '@/assets/screenshots';
import { msg } from '@/components/features/helpers';
import {
  ArrowLink,
  FeatureHero,
  FeatureJsonLd,
  SplitRow,
} from '@/components/features/kit';
import { CtaBand } from '@/components/site/cta-band';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { FitnessChart } from '@/components/site/visuals/fitness-chart';
import { ProviderLogos } from '@/components/site/visuals/provider-logos';
import { PhoneShot, Screenshot } from '@/components/site/visuals/screenshot';
import { WorkoutBlocks } from '@/components/site/visuals/workout-blocks';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localePath } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  Activity,
  Bot,
  Calculator,
  CalendarDays,
  CalendarSync,
  CloudSun,
  Database,
  Download,
  Eraser,
  FileUp,
  Footprints,
  Gauge,
  KeyRound,
  Languages,
  LineChart,
  Search,
  Sparkles,
  Thermometer,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
  Watch,
  Webhook,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

const PATH = '/features';

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: PATH,
    title: m.features_hub_seo_title(),
    description: m.features_hub_seo_description(),
  });
}

const LOOP = [
  {
    icon: CalendarDays,
    href: '/features/training-calendar',
    color: 'var(--sky)',
  },
  { icon: Workflow, href: '/features/workout-builder', color: 'var(--sky)' },
  { icon: Watch, href: '/features/watch-sync', color: 'var(--orchid)' },
  { icon: LineChart, href: '#analyse', color: 'var(--orchid)' },
  { icon: TrendingUp, href: '/features/training-load', color: 'var(--coral)' },
  { icon: Users, href: '/coaches', color: 'var(--mint)' },
];

const ANALYSIS_ICONS = [
  Activity,
  Gauge,
  Footprints,
  CloudSun,
  Trophy,
  TrendingUp,
  LineChart,
  Database,
];

const ELSE_ICONS = [
  CalendarSync,
  Thermometer,
  Eraser,
  CloudSun,
  Trophy,
  Footprints,
  Activity,
  Gauge,
  FileUp,
  Webhook,
  Download,
  Trash2,
  Languages,
  KeyRound,
  Search,
  Calculator,
];

export default async function FeaturesPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const p = (path: string) =>
    path.startsWith('#') ? path : localePath(locale, path);

  return (
    <>
      <FeatureJsonLd
        locale={locale}
        name={m.features_crumb_features()}
        path={PATH}
      />
      <FeatureHero
        locale={locale}
        stacked
        placement="features_hub_hero"
        kicker={m.features_hub_kicker()}
        title={m.features_hub_title()}
        lead={m.features_hub_lead()}
        proofs={[
          m.features_hub_proof_1(),
          m.features_hub_proof_2(),
          m.features_hub_proof_3(),
        ]}
        secondary={{
          href: localePath(locale, '/pricing'),
          label: m.features_hub_secondary(),
        }}
        visual={
          <div>
            <p className="kicker mb-5 text-muted-foreground">
              {m.features_hub_loop_kicker()}
            </p>
            <ol className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <span
                aria-hidden
                className="brand-gradient absolute top-[2.15rem] right-8 left-8 hidden h-px opacity-70 lg:block"
              />
              {LOOP.map(({ icon: Icon, href, color }, index) => (
                <li key={href}>
                  <Link
                    href={p(href)}
                    className="group relative flex h-full flex-col rounded-2xl border border-border bg-white p-4 transition-shadow hover:shadow-[0_20px_40px_-24px_rgb(5_12_52/0.35)]"
                  >
                    <span className="flex items-center justify-between">
                      <span
                        className="grid size-9 place-items-center rounded-xl text-ink"
                        style={{
                          background: `color-mix(in oklab, ${color} 30%, white)`,
                        }}
                      >
                        <Icon className="size-[18px]" />
                      </span>
                      <span className="font-mono text-[0.68rem] text-muted-foreground">
                        0{index + 1}
                      </span>
                    </span>
                    <span className="mt-4 font-semibold group-hover:text-sky-strong">
                      {msg(`features_hub_loop_${index + 1}`)}
                    </span>
                    <span className="mt-1 text-[0.84rem] leading-snug text-muted-foreground">
                      {msg(`features_hub_loop_${index + 1}_body`)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        }
      />

      <Section tone="paper">
        <Container>
          <SplitRow
            kicker="01"
            title={m.features_hub_cal_title()}
            body={m.features_hub_cal_body()}
            points={[
              m.features_hub_cal_p1(),
              m.features_hub_cal_p2(),
              m.features_hub_cal_p3(),
            ]}
            visual={
              <Screenshot
                src={shots.season}
                alt={m.features_hub_cal_title()}
                chrome={false}
                sizes="(min-width: 1024px) 680px, 100vw"
              />
            }
          >
            <ArrowLink href={p('/features/training-calendar')} className="mt-7">
              {m.features_nav_calendar_title()}
            </ArrowLink>
          </SplitRow>
        </Container>
      </Section>

      <Section tone="ink">
        <Container>
          <SplitRow
            flip
            tone="light"
            kicker="02 · 03"
            title={m.features_hub_build_title()}
            body={m.features_hub_build_body()}
            visual={
              <div className="grid gap-6">
                <WorkoutBlocks
                  title={m.features_hub_build_workout()}
                  meta={m.features_hub_build_meta()}
                  sentLabel={m.features_hub_build_sent()}
                />
                <div className="rounded-2xl bg-white px-6 py-5">
                  <ProviderLogos
                    tone="color"
                    height={20}
                    className="justify-center gap-x-8"
                  />
                </div>
              </div>
            }
          >
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              <ArrowLink tone="light" href={p('/features/workout-builder')}>
                {m.features_hub_build_link()}
              </ArrowLink>
              <ArrowLink tone="light" href={p('/features/watch-sync')}>
                {m.features_hub_sync_link()}
              </ArrowLink>
            </div>
          </SplitRow>
        </Container>
      </Section>

      <Section id="analyse">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              kicker="04 · 05"
              title={m.features_hub_analyse_title()}
              lead={m.features_hub_analyse_lead()}
            />
            <ArrowLink href={p('/features/training-load')}>
              {m.features_hub_load_link()}
            </ArrowLink>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-4">
            <Reveal className="rounded-3xl border border-border bg-white p-6 lg:col-span-2 lg:row-span-2">
              <h3 className="text-lg font-semibold">
                {m.features_hub_an_1_title()}
              </h3>
              <p className="mt-1.5 text-[0.92rem] text-muted-foreground">
                {m.features_hub_an_1_body()}
              </p>
              <FitnessChart
                className="mt-6"
                labels={{
                  fitness: m.features_tl_fitness(),
                  fatigue: m.features_tl_fatigue(),
                  form: m.features_tl_form(),
                  race: m.features_tl_race(),
                }}
              />
            </Reveal>
            {ANALYSIS_ICONS.slice(1).map((Icon, i) => {
              const n = i + 2;
              return (
                <Reveal
                  key={n}
                  delay={0.04 * i}
                  className={cn(
                    'rounded-3xl border border-border bg-white p-6',
                    n === 8 && 'lg:col-span-2',
                  )}
                >
                  <Icon className="size-5 text-sky-strong" />
                  <h3 className="mt-4 font-semibold">
                    {msg(`features_hub_an_${n}_title`)}
                  </h3>
                  <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted-foreground">
                    {msg(`features_hub_an_${n}_body`)}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <SectionHeading kicker="AI" title={m.features_hub_ai_title()} />
          <RevealGroup className="mt-10 grid gap-5 md:grid-cols-2">
            <RevealItem>
              <Link
                href={p('/features/ai-coach')}
                className="group flex h-full flex-col rounded-3xl border border-border bg-white p-7 transition-shadow hover:shadow-[0_30px_60px_-30px_rgb(5_12_52/0.35)] sm:p-8"
              >
                <Sparkles className="size-6 text-orchid-strong" />
                <h3 className="display-3 mt-5">{m.features_nav_ai_title()}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {m.features_hub_ai_body()}
                </p>
                <span className="mt-auto pt-6 font-medium group-hover:text-sky-strong">
                  {m.features_nav_ai_title()} →
                </span>
              </Link>
            </RevealItem>
            <RevealItem>
              <Link
                href={p('/features/mcp-server')}
                className="group ink-band flex h-full flex-col rounded-3xl p-7 sm:p-8"
              >
                <Bot className="size-6 text-mint" />
                <h3 className="display-3 mt-5 text-white">
                  {m.features_nav_mcp_title()}
                </h3>
                <p className="mt-3 leading-relaxed text-white/70">
                  {m.features_hub_mcp_body()}
                </p>
                <code className="mt-5 w-fit rounded-lg bg-white/10 px-3 py-1.5 font-mono text-[0.78rem] text-white/80">
                  plan_sessions · get_training_load · +21
                </code>
                <span className="mt-auto pt-6 font-medium text-white group-hover:text-mint">
                  {m.features_nav_mcp_title()} →
                </span>
              </Link>
            </RevealItem>
          </RevealGroup>
        </Container>
      </Section>

      <Section>
        <Container>
          <SplitRow
            kicker="06"
            title={m.features_hub_coach_title()}
            body={m.features_hub_coach_body()}
            points={[
              m.features_hub_coach_p1(),
              m.features_hub_coach_p2(),
              m.features_hub_coach_p3(),
            ]}
            visual={
              <Screenshot
                src={shots.coachDashboard}
                alt={m.features_hub_coach_title()}
                sizes="(min-width: 1024px) 680px, 100vw"
              />
            }
          >
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              <ArrowLink href={p('/coaches')}>
                {m.features_hub_coach_link()}
              </ArrowLink>
              <ArrowLink href={p('/clubs')}>
                {m.features_hub_club_link()}
              </ArrowLink>
            </div>
          </SplitRow>
        </Container>
      </Section>

      <Section tone="paper">
        <Container>
          <h2 className="display-2 max-w-3xl">
            {m.features_hub_mobile_title()}
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <Reveal className="relative flex min-h-[17rem] overflow-hidden rounded-3xl border border-border bg-white p-7 sm:p-8">
              <div className="max-w-[60%]">
                <h3 className="text-lg font-semibold">
                  {m.features_hub_mobile_link()}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {m.features_hub_mobile_body()}
                </p>
                <ArrowLink href={p('/mobile')} className="mt-6">
                  {m.features_hub_mobile_link()}
                </ArrowLink>
              </div>
              <PhoneShot
                src={shots.mobileHome}
                alt={m.features_hub_mobile_link()}
                className="absolute right-4 -bottom-28 w-[34%] max-w-[10rem] rotate-6 sm:right-8"
              />
            </Reveal>
            <Reveal
              delay={0.1}
              className="rounded-3xl border border-border bg-white p-7 sm:p-8"
            >
              <Download className="size-5 text-sky-strong" />
              <h3 className="mt-4 text-lg font-semibold">
                {m.features_hub_export_title()}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {m.features_hub_export_body()}
              </p>
              <ArrowLink href={p('/open-source')} className="mt-6">
                {m.features_hub_export_link()}
              </ArrowLink>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading
            kicker={m.features_hub_else_kicker()}
            title={m.features_hub_else_title()}
          />
          <RevealGroup className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {ELSE_ICONS.map((Icon, i) => (
              <RevealItem key={i} className="bg-white p-5">
                <Icon className="size-[18px] text-muted-foreground" />
                <h3 className="mt-3 text-[0.95rem] font-semibold">
                  {msg(`features_hub_e${i + 1}_t`)}
                </h3>
                <p className="mt-1 text-[0.86rem] leading-snug text-muted-foreground">
                  {msg(`features_hub_e${i + 1}_b`)}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
          <div className="mt-6">
            <ArrowLink href={p('/tools')}>{m.features_hub_e16_t()}</ArrowLink>
          </div>
        </Container>
      </Section>

      <CtaBand
        locale={locale}
        placement="features_hub_final"
        title={m.features_hub_final_title()}
        body={m.features_hub_final_body()}
      />
    </>
  );
}
