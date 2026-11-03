import {
  BreadcrumbListStructuredData,
  JsonLd,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CtaBand } from '@/components/site/cta-band';
import { CoffeeIcon, DiscordIcon, GithubIcon } from '@/components/site/icons';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import {
  BUY_ME_A_COFFEE_URL,
  DISCORD_URL,
  DOCS_URL,
  GITHUB_URL,
  SELF_HOSTING_DOCS_URL,
  SITE_URL,
} from '@/config';
import { initLocale } from '@/i18n/server';
import { supporterUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import { localePath, localizedUrl } from '@/utils/locales';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  FileCode2,
  Heart,
  Languages,
  Scale,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import { generateMetadata as pageMetadata } from '../../metadata';
import { CheckList, sourceUrl } from '../pricing/page-kit';
import { InstallTerminal } from '../pricing/terminal';

type Props = { params: Promise<{ locale: string }> };

const GOOD_FIRST_ISSUES_URL = `${GITHUB_URL}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`;
const PRIVACY_TEST_PATH = 'e2e/tests/web/self-hosting.spec.ts';

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/open-source',
    title: m.opensource_seo_title(),
    description: m.opensource_seo_description(),
  });
}

/** Banister's TRIMP, as written in apps/api/src/modules/core/helpers/training-load.ts. */
function TrimpCode() {
  const k = 'text-orchid';
  const f = 'text-sky';
  const c = 'text-white/40';
  return (
    <pre className="overflow-x-auto p-5 text-[0.78rem] leading-6 text-white/80 sm:p-6">
      <code>
        <span className={c}>
          {
            '/**\n * Banister TRIMP for `minutes` spent at `hr`:\n * minutes × HRr × y × e^(k × HRr),\n * with HRr = (HR - HRrest) / (HRmax - HRrest)\n */\n'
          }
        </span>
        <span className={k}>function</span> <span className={f}>trimpAt</span>
        {'(hr, minutes, hrMax, hrRest, gender) {\n  '}
        <span className={k}>const</span>
        {' hrFraction = (hr - hrRest) / (hrMax - hrRest);\n  '}
        <span className={k}>if</span>
        {' (hrFraction <= 0) {\n    '}
        <span className={k}>return</span>
        {' 0;\n  }\n  '}
        <span className={k}>const</span>
        {' { k, y } = '}
        <span className={f}>getTrimpCoefficients</span>
        {'(gender);\n  '}
        <span className={k}>return</span>
        {' minutes * hrFraction * y * Math.'}
        <span className={f}>exp</span>
        {'(k * hrFraction);\n}'}
      </code>
    </pre>
  );
}

export default async function OpenSourcePage({ params }: Props) {
  const locale = initLocale((await params).locale);

  const formulas = [
    {
      label: m.opensource_formulas_1(),
      href: sourceUrl('apps/api/src/modules/core/helpers/training-load.ts'),
      path: 'core/helpers/training-load.ts',
    },
    {
      label: m.opensource_formulas_2(),
      href: sourceUrl(
        'apps/api/src/modules/core/helpers/grade-adjusted-speed.ts',
      ),
      path: 'core/helpers/grade-adjusted-speed.ts',
    },
    {
      label: m.opensource_formulas_3(),
      href: sourceUrl('apps/web/src/components/statistics/critical-model.ts'),
      path: 'statistics/critical-model.ts',
    },
    {
      label: m.opensource_formulas_4(),
      href: `${GITHUB_URL}/tree/main/apps/api/src/mastra/agents`,
      path: 'apps/api/src/mastra/agents/',
    },
    {
      label: m.opensource_formulas_5(),
      href: `${DOCS_URL}/docs/guides/statistics-science`,
      path: 'docs.openathlete.org',
    },
  ];

  const offSettings = [
    { label: m.opensource_host_off_email(), vars: 'SMTP_HOST · BREVO_API_KEY' },
    {
      label: m.opensource_host_off_devices(),
      vars: 'STRAVA_* · GARMIN_* · POLAR_* · SUUNTO_*',
    },
    {
      label: m.opensource_host_off_sso(),
      vars: 'OIDC_ISSUER · OIDC_CLIENT_ID',
    },
    {
      label: m.opensource_host_off_ai(),
      vars: 'OPENAI_API_KEY · AI_HOSTED_MONTHLY_BUDGET_USD',
    },
    {
      label: m.opensource_host_off_load(),
      vars: 'ENABLE_TRAINING_LOAD_ESTIMATION',
    },
    { label: m.opensource_host_off_analytics(), vars: 'POSTHOG_PROJECT_TOKEN' },
    { label: m.opensource_host_off_billing(), vars: 'STRIPE_*' },
  ];

  const timeline = [
    {
      date: m.opensource_why_1_date(),
      body: m.opensource_why_1_body(),
      tone: 'bg-white/30',
    },
    {
      date: m.opensource_why_2_date(),
      body: m.opensource_why_2_body(),
      tone: 'bg-coral',
    },
    {
      date: m.opensource_why_3_date(),
      body: m.opensource_why_3_body(),
      tone: 'bg-mint',
      ours: true,
    },
  ];

  return (
    <>
      <JsonLd
        data={{
          '@type': 'SoftwareSourceCode',
          name: 'OpenAthlete',
          description: m.opensource_seo_description(),
          url: localizedUrl(locale, '/open-source'),
          codeRepository: GITHUB_URL,
          license: 'https://www.gnu.org/licenses/agpl-3.0.html',
          programmingLanguage: 'TypeScript',
          runtimePlatform: 'Docker',
          author: { '@id': `${SITE_URL}/#organization` },
        }}
      />
      <BreadcrumbListStructuredData
        items={[
          { name: 'OpenAthlete', url: localizedUrl(locale) },
          {
            name: m.opensource_breadcrumb(),
            url: localizedUrl(locale, '/open-source'),
          },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-28">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_0%,black,transparent)]" />
          <div className="absolute top-[-10rem] right-[-6rem] h-[30rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--mint)_22%,transparent),transparent)] blur-2xl" />
        </div>
        <Container className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 py-1 pr-3 pl-1 text-[0.82rem] text-ink/80">
                <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[0.68rem] font-medium tracking-wide text-white">
                  AGPL-3.0
                </span>
                {m.opensource_breadcrumb()}
              </p>
              <h1 className="display-1 mt-6">{m.opensource_hero_title()}</h1>
              <p className="lead mt-6 max-w-xl">{m.opensource_hero_lead()}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href={GITHUB_URL}
                  event="github_clicked"
                  properties={{ placement: 'open_source_hero' }}
                  className={buttonStyles({
                    size: 'lg',
                    className: 'w-full sm:w-auto',
                  })}
                >
                  <GithubIcon />
                  {m.opensource_hero_github()}
                </TrackedLink>
                <a
                  href="#self-host"
                  className={buttonStyles({
                    variant: 'secondary',
                    size: 'lg',
                    className: 'w-full sm:w-auto',
                  })}
                >
                  {m.opensource_hero_selfhost()}
                </a>
              </div>
            </div>
            <Reveal delay={0.1} className="lg:col-span-6">
              <figure className="overflow-hidden rounded-2xl border border-white/10 bg-[#030824] font-mono shadow-[0_40px_80px_-30px_rgb(5_12_52/0.6)]">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[0.72rem] text-white/50">
                  <FileCode2 className="size-3.5" />
                  apps/api/src/modules/core/helpers/training-load.ts
                </div>
                <TrimpCode />
              </figure>
              <figcaption className="mt-3 text-[0.82rem] text-muted-foreground">
                {m.opensource_hero_code_caption()}
              </figcaption>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* The licence */}
      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.opensource_licence_kicker()}
            title={m.opensource_licence_title()}
            lead={m.opensource_licence_lead()}
          />
          <RevealGroup className="mt-12 grid gap-5 md:grid-cols-2">
            <RevealItem className="rounded-3xl border border-border bg-white p-7 sm:p-9">
              <p className="flex items-center gap-2 font-semibold text-mint-strong">
                <Check className="size-5" />
                {m.opensource_licence_may()}
              </p>
              <CheckList
                className="mt-6"
                items={[
                  m.opensource_licence_may_1(),
                  m.opensource_licence_may_2(),
                  m.opensource_licence_may_3(),
                  m.opensource_licence_may_4(),
                ]}
              />
            </RevealItem>
            <RevealItem className="rounded-3xl border border-border bg-white p-7 sm:p-9">
              <p className="flex items-center gap-2 font-semibold text-orchid-strong">
                <Scale className="size-5" />
                {m.opensource_licence_asks()}
              </p>
              <ul className="mt-6 grid gap-2.5">
                {[
                  m.opensource_licence_asks_1(),
                  m.opensource_licence_asks_2(),
                  m.opensource_licence_asks_3(),
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 text-[0.95rem]">
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-orchid-strong" />
                    {item}
                  </li>
                ))}
              </ul>
            </RevealItem>
          </RevealGroup>
          <p className="mt-6 text-[0.88rem] text-muted-foreground">
            {m.opensource_licence_note()}{' '}
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              target="_blank"
              rel="noopener"
              className="font-medium text-ink underline underline-offset-4 hover:no-underline"
            >
              {m.opensource_licence_full()}
            </a>
            .
          </p>
        </Container>
      </Section>

      {/* Why */}
      <Section tone="ink">
        <Container>
          <div className="max-w-3xl">
            <p className="kicker text-ink-soft">{m.opensource_why_kicker()}</p>
            <h2 className="display-2 mt-4 text-white">
              {m.opensource_why_title()}
            </h2>
          </div>
          <RevealGroup
            className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6"
            stagger={0.15}
          >
            <div
              aria-hidden
              className="absolute top-[0.45rem] right-0 left-0 hidden h-px bg-gradient-to-r from-white/15 via-coral/50 to-mint/70 md:block"
            />
            {timeline.map((item) => (
              <RevealItem key={item.date} className="relative">
                <span
                  className={`block size-3.5 rounded-full ring-4 ring-ink ${item.tone}`}
                />
                <p
                  className={`kicker mt-5 ${item.ours ? 'text-mint' : 'text-ink-soft'}`}
                >
                  {item.date}
                </p>
                <p
                  className={`mt-3 text-lg leading-relaxed ${item.ours ? 'text-white' : 'text-white/70'}`}
                >
                  {item.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Self-hosting */}
      <Section id="self-host">
        <Container>
          <SectionHeading
            kicker={m.opensource_host_kicker()}
            title={m.opensource_host_title()}
            lead={m.opensource_host_lead()}
          />
          <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
            <ol className="grid gap-8 lg:col-span-5">
              {[
                {
                  title: m.opensource_host_1_title(),
                  body: m.opensource_host_1_body(),
                },
                {
                  title: m.opensource_host_2_title(),
                  body: m.opensource_host_2_body(),
                },
                {
                  title: m.opensource_host_3_title(),
                  body: m.opensource_host_3_body(),
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink font-mono text-[0.8rem] text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
              <li className="flex gap-3 rounded-2xl border border-[#f2b13c]/40 bg-[#f2b13c]/10 p-4 text-[0.88rem] leading-relaxed">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#b7791f]" />
                {m.opensource_host_warn()}
              </li>
            </ol>
            <Reveal delay={0.1} className="lg:col-span-7">
              <InstallTerminal domain="your.domain" />
            </Reveal>
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-2">
            <Reveal className="rounded-3xl border border-border bg-white p-7 sm:p-8">
              <h3 className="text-lg font-semibold">
                {m.opensource_host_on_title()}
              </h3>
              <CheckList
                className="mt-5"
                items={[
                  m.opensource_host_on_1(),
                  m.opensource_host_on_2(),
                  m.opensource_host_on_3(),
                  m.opensource_host_on_4(),
                  m.opensource_host_on_5(),
                ]}
              />
            </Reveal>
            <Reveal
              delay={0.1}
              className="rounded-3xl border border-border bg-paper p-7 sm:p-8"
            >
              <h3 className="text-lg font-semibold">
                {m.opensource_host_off_title()}
              </h3>
              <ul className="mt-5 divide-y divide-border">
                {offSettings.map((setting) => (
                  <li
                    key={setting.label}
                    className="flex flex-col gap-1 py-2.5 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                  >
                    <span className="text-[0.93rem]">{setting.label}</span>
                    <code className="shrink-0 font-mono text-[0.7rem] text-muted-foreground">
                      {setting.vars}
                    </code>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <div className="mt-8 flex justify-center">
            <TrackedLink
              href={SELF_HOSTING_DOCS_URL}
              event="self_host_clicked"
              properties={{ placement: 'open_source_host' }}
              className={buttonStyles({ variant: 'secondary' })}
            >
              {m.opensource_host_guide()}
              <ArrowUpRight />
            </TrackedLink>
          </div>
        </Container>
      </Section>

      {/* Privacy */}
      <Section tone="paper" className="py-16 sm:py-20">
        <Container>
          <Reveal className="grid items-center gap-10 rounded-[2rem] bg-white p-8 shadow-[0_30px_60px_-40px_rgb(5_12_52/0.35)] sm:p-12 lg:grid-cols-12">
            <div className="lg:col-span-1">
              <span className="grid size-14 place-items-center rounded-2xl bg-mint/20 text-mint-strong">
                <ShieldCheck className="size-7" />
              </span>
            </div>
            <div className="lg:col-span-7">
              <p className="kicker text-muted-foreground">
                {m.opensource_privacy_kicker()}
              </p>
              <h2 className="display-3 mt-3">{m.opensource_privacy_title()}</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {m.opensource_privacy_body()}
              </p>
              <p className="mt-3 text-[0.88rem] leading-relaxed text-muted-foreground">
                {m.opensource_privacy_exceptions()}
              </p>
            </div>
            <div className="lg:col-span-4">
              <TrackedLink
                href={sourceUrl(PRIVACY_TEST_PATH)}
                event="github_clicked"
                properties={{ placement: 'open_source_privacy' }}
                className="group block rounded-2xl border border-white/10 bg-[#030824] p-5 font-mono text-[0.75rem] text-white/75 transition-shadow hover:shadow-[0_20px_40px_-20px_rgb(5_12_52/0.6)]"
              >
                <span className="text-white/40">{PRIVACY_TEST_PATH}</span>
                {'\n'}
                <span className="mt-2 block">
                  <span className="text-orchid">test</span>(
                  <span className="text-mint">
                    &apos;makes no third-party request&apos;
                  </span>
                  , …)
                </span>
                <span className="mt-4 flex items-center gap-1.5 font-sans text-[0.85rem] font-medium text-white">
                  {m.opensource_privacy_link()}
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </TrackedLink>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Formulas */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeading
                size="side"
                kicker={m.opensource_formulas_kicker()}
                title={m.opensource_formulas_title()}
                lead={m.opensource_formulas_lead()}
              />
            </div>
            <RevealGroup className="grid gap-3 lg:col-span-7">
              {formulas.map((formula) => (
                <RevealItem key={formula.label}>
                  <TrackedLink
                    href={formula.href}
                    event="github_clicked"
                    properties={{ placement: 'open_source_formulas' }}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-white px-5 py-4 transition-colors hover:border-ink/25 hover:bg-paper"
                  >
                    <span>
                      <span className="block font-medium">{formula.label}</span>
                      <span className="mt-0.5 block font-mono text-[0.72rem] text-muted-foreground">
                        {formula.path}
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </TrackedLink>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </Container>
      </Section>

      {/* Contribute */}
      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.opensource_contrib_kicker()}
            title={m.opensource_contrib_title()}
            align="center"
          />
          <RevealGroup className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: <Code2 />,
                title: m.opensource_contrib_code_title(),
                body: m.opensource_contrib_code_body(),
                cta: m.opensource_contrib_code_cta(),
                href: GOOD_FIRST_ISSUES_URL,
                event: 'github_clicked' as const,
                accent: 'bg-sky/20 text-sky-strong',
              },
              {
                icon: <Languages />,
                title: m.opensource_contrib_i18n_title(),
                body: m.opensource_contrib_i18n_body(),
                cta: m.opensource_contrib_i18n_cta(),
                href: `${GITHUB_URL}/tree/main/apps/web/messages`,
                event: 'github_clicked' as const,
                accent: 'bg-orchid/20 text-orchid-strong',
              },
              {
                icon: <DiscordIcon />,
                title: m.opensource_contrib_talk_title(),
                body: m.opensource_contrib_talk_body(),
                cta: m.opensource_contrib_talk_cta(),
                href: DISCORD_URL,
                event: 'cta_clicked' as const,
                accent: 'bg-[#5865f2]/15 text-[#5865f2]',
              },
            ].map((card) => (
              <RevealItem
                key={card.title}
                className="flex h-full flex-col rounded-3xl border border-border bg-white p-7"
              >
                <span
                  className={`grid size-11 place-items-center rounded-xl [&_svg]:size-5 ${card.accent}`}
                >
                  {card.icon}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {card.body}
                </p>
                <div className="flex-1" />
                <TrackedLink
                  href={card.href}
                  event={card.event}
                  properties={{
                    placement: 'open_source_contribute',
                    cta: card.title,
                  }}
                  className="mt-6 inline-flex items-center gap-1.5 font-medium hover:text-sky-strong"
                >
                  {card.cta}
                  <ArrowUpRight className="size-4" />
                </TrackedLink>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Funding */}
      <Section className="py-16 sm:py-20">
        <Container size="narrow">
          <Reveal className="text-center">
            <p className="kicker text-muted-foreground">
              {m.opensource_funding_kicker()}
            </p>
            <h2 className="display-2 mt-4">{m.opensource_funding_title()}</h2>
            <p className="lead mx-auto mt-5 max-w-2xl">
              {m.opensource_funding_body()}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <TrackedLink
                href={supporterUrl('open_source_funding')}
                event="supporter_clicked"
                properties={{ placement: 'open_source_funding' }}
                className={buttonStyles({ size: 'lg' })}
              >
                <Heart className="fill-coral text-coral" />
                {m.plans_supporter_cta()}
              </TrackedLink>
              <TrackedLink
                href={BUY_ME_A_COFFEE_URL}
                event="donation_clicked"
                properties={{ placement: 'open_source_funding' }}
                className={buttonStyles({ variant: 'coffee', size: 'lg' })}
              >
                <CoffeeIcon />
                {m.plans_coffee_cta()}
              </TrackedLink>
            </div>
            <p className="mx-auto mt-12 max-w-2xl border-t border-border pt-6 font-mono text-[0.75rem] leading-relaxed text-muted-foreground">
              {m.opensource_stack()}
            </p>
          </Reveal>
        </Container>
      </Section>

      <CtaBand
        locale={locale}
        placement="open_source_final"
        title={m.opensource_final_title()}
        body={m.opensource_final_body()}
        secondary={{
          href: localePath(locale, '/pricing'),
          label: m.site_cta_pricing(),
        }}
      />
    </>
  );
}
