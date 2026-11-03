import { ArrowLink } from '@/components/features/kit';
import { McpChat } from '@/components/features/mcp-visuals';
import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
  JsonLd,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CtaBand } from '@/components/site/cta-band';
import { Faq } from '@/components/site/faq';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { PROVIDERS } from '@/components/site/providers';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import {
  MCP_URL,
  SELF_HOSTING_DOCS_URL,
  SUPPORTER_MONTHLY_EUR,
  SUPPORTER_YEARLY_EUR,
} from '@/config';
import { signupUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  htmlLang,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  Check,
  ChevronRight,
  HardDrive,
  History,
  KeyRound,
  Plane,
  Server,
  ShieldCheck,
  Users,
  Watch,
  X,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { GUIDE_BRANDS, type GuideBrand } from './brands';
import { CopyButton } from './copy-button';
import {
  ChatGptServerMock,
  ClaudeConnectorMock,
  ConnectorsMock,
  ConsentMock,
  FirstPromptMock,
  SignupMock,
} from './mocks';

type Props = { locale: SupportedLocale; brand: GuideBrand };

/** Prompt groups, each prompt with the tools an agent typically calls. */
const LIBRARY = [
  {
    title: m.aig_lib_g1,
    icon: BarChart3,
    prompts: [
      {
        text: m.aig_lib_p1,
        tools: ['get_athlete_context', 'get_calendar', 'get_training_load'],
      },
      { text: m.aig_lib_p2, tools: ['get_activities', 'get_activity'] },
    ],
  },
  {
    title: m.aig_lib_g2,
    icon: CalendarRange,
    prompts: [
      {
        text: m.aig_lib_p3,
        tools: [
          'get_athlete_context',
          'get_training_volume',
          'get_training_load',
          'plan_sessions',
        ],
      },
      {
        text: m.aig_lib_p4,
        tools: ['update_training_zone', 'get_calendar', 'update_session'],
      },
    ],
  },
  {
    title: m.aig_lib_g3,
    icon: Plane,
    prompts: [
      {
        text: m.aig_lib_p5,
        tools: ['create_period', 'get_calendar', 'update_session'],
      },
      {
        text: m.aig_lib_p6,
        tools: [
          'create_period',
          'get_calendar',
          'move_sessions',
          'update_session',
        ],
      },
    ],
  },
  {
    title: m.aig_lib_g4,
    icon: History,
    note: m.aig_lib_g4_note,
    prompts: [
      { text: m.aig_lib_p7, tools: ['get_training_volume', 'get_activities'] },
      { text: m.aig_lib_p8, tools: ['get_records'] },
    ],
  },
  {
    title: m.aig_lib_g5,
    icon: Users,
    note: m.aig_lib_g5_note,
    prompts: [
      {
        text: m.aig_lib_p9,
        tools: ['list_athletes', 'get_calendar', 'get_training_load'],
      },
      {
        text: m.aig_lib_p10,
        tools: ['list_athletes', 'copy_sessions', 'move_sessions'],
      },
    ],
  },
];

/** Quotation marks as each language prints them. */
function quote(locale: SupportedLocale, text: string): string {
  if (locale === 'fr') return `«\u00a0${text}\u00a0»`;
  if (locale === 'es' || locale === 'it') return `«${text}»`;
  return `“${text}”`;
}

function ToolChain({ tools }: { tools: string[] }) {
  return (
    <p className="flex flex-wrap items-center gap-1.5">
      {tools.map((tool, i) => (
        <span key={tool} className="flex items-center gap-1.5">
          <code className="rounded-md bg-paper px-1.5 py-0.5 font-mono text-[0.7rem] text-sky-strong">
            {tool}
          </code>
          {i < tools.length - 1 && (
            <span className="text-[0.7rem] text-muted-foreground" aria-hidden>
              →
            </span>
          )}
        </span>
      ))}
    </p>
  );
}

function UrlBox({ placement }: { placement: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="kicker text-muted-foreground">
          {m.aig_url_label()}
        </span>
        <CopyButton text={MCP_URL} placement={placement} cta="copy_mcp_url" />
      </div>
      <code className="mt-2 block font-mono text-[0.95rem] break-all text-ink sm:text-base">
        {MCP_URL}
      </code>
      <p className="mt-2 font-mono text-[0.72rem] break-all text-muted-foreground">
        {m.aig_url_selfhost()}
      </p>
    </div>
  );
}

function Step({
  n,
  title,
  body,
  visual,
  extra,
  last,
}: {
  n: number;
  title: string;
  body: string;
  visual: ReactNode;
  extra?: ReactNode;
  last?: boolean;
}) {
  return (
    <li
      id={`step-${n}`}
      className="relative grid scroll-mt-24 gap-6 pb-14 last:pb-0 lg:grid-cols-12 lg:gap-12"
    >
      {!last && (
        <span
          aria-hidden
          className="absolute top-12 bottom-2 left-[1.15rem] w-px bg-gradient-to-b from-border to-transparent"
        />
      )}
      <Reveal className="relative flex gap-5 lg:col-span-5">
        <span className="brand-gradient grid size-[2.3rem] shrink-0 place-items-center rounded-full font-mono text-[0.85rem] font-semibold text-ink">
          {n}
        </span>
        <div className="min-w-0 pt-1">
          <p className="kicker text-muted-foreground">
            {m.aig_step_label()} {n}
          </p>
          <h3 className="mt-2 text-xl leading-snug font-semibold sm:text-[1.35rem]">
            {title}
          </h3>
          <p className="mt-3 leading-relaxed text-ink/80">{body}</p>
          {extra && <div className="mt-5">{extra}</div>}
        </div>
      </Reveal>
      <Reveal
        delay={0.08}
        className="min-w-0 pl-[3.55rem] lg:col-span-7 lg:pl-0"
      >
        {visual}
      </Reveal>
    </li>
  );
}

export function AiGuidePage({ locale, brand }: Props) {
  const ai = brand.name;
  const company = brand.company;
  const other = GUIDE_BRANDS[brand.other];
  const placement = `aig_${brand.id}`;
  const url = localizedUrl(locale, brand.path);
  const faqs = brand.faqs.map(([q, a]) => ({ question: q(), answer: a() }));

  const steps = [
    { title: m.aig_step1_title(), body: m.aig_step1_body() },
    { title: m.aig_step2_title(), body: m.aig_step2_body() },
    { title: brand.step3Title(), body: brand.step3Body() },
    { title: m.aig_step4_title(), body: m.aig_step4_body({ ai }) },
    { title: m.aig_step5_title(), body: brand.step5Body() },
  ];

  const privacy = [
    {
      icon: Server,
      title: m.aig_priv_1_title({ company }),
      body: m.aig_priv_1_body({ ai, company }),
      wide: true,
    },
    { icon: KeyRound, title: m.aig_priv_2_title(), body: brand.revoke() },
    {
      icon: ShieldCheck,
      title: m.aig_priv_3_title(),
      body: m.aig_priv_3_body(),
    },
    { icon: Watch, title: m.aig_priv_4_title(), body: m.aig_priv_4_body() },
    {
      icon: HardDrive,
      title: m.aig_priv_5_title(),
      body: m.aig_priv_5_body({ ai, company }),
      link: { href: SELF_HOSTING_DOCS_URL, label: m.aig_priv_5_link() },
    },
  ];

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.features_crumb_home(), url: localizedUrl(locale, '') },
          {
            name: m.features_nav_mcp_title(),
            url: localizedUrl(locale, '/features/mcp-server'),
          },
          { name: brand.title(), url },
        ]}
      />
      <FAQPageStructuredData faqs={faqs} />
      <JsonLd
        data={{
          '@type': 'HowTo',
          name: brand.title(),
          description: brand.seoDescription(),
          inLanguage: htmlLang(locale),
          url,
          totalTime: 'PT10M',
          tool: [{ '@type': 'HowToTool', name: ai }],
          step: steps.map((step, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: step.title,
            text: step.body,
            url: `${url}#step-${index + 1}`,
          })),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_0%,black,transparent)]" />
          <div className="absolute top-[-14rem] left-[10%] h-[30rem] w-[44rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--sky)_28%,transparent),transparent)] blur-2xl" />
          <div className="absolute top-[4rem] right-[-6rem] h-[26rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--coral)_16%,transparent),transparent)] blur-2xl" />
        </div>
        <Container className="relative">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-1 text-[0.82rem] text-muted-foreground">
              <li>
                <Link href={localePath(locale, '')} className="hover:text-ink">
                  {m.features_crumb_home()}
                </Link>
              </li>
              <ChevronRight className="size-3.5 opacity-50" aria-hidden />
              <li>
                <Link
                  href={localePath(locale, '/features/mcp-server')}
                  className="hover:text-ink"
                >
                  {m.features_nav_mcp_title()}
                </Link>
              </li>
              <ChevronRight className="size-3.5 opacity-50" aria-hidden />
              <li className="text-ink" aria-current="page">
                {brand.crumb()}
              </li>
            </ol>
          </nav>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-6">
              <p className="kicker text-sky-strong">{m.aig_kicker()}</p>
              {/* No entrance animation on the headline: it is the largest paint */}
              <h1 className="display-1 mt-4">{brand.title()}</h1>
              <p className="lead mt-6 max-w-xl">{m.aig_hero_lead({ ai })}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href={signupUrl(`${placement}_hero`)}
                  event="cta_clicked"
                  properties={{ placement: `${placement}_hero`, cta: 'signup' }}
                  className={buttonStyles({
                    size: 'lg',
                    className: 'w-full sm:w-auto',
                  })}
                >
                  {m.site_cta_start()}
                  <ArrowRight className="transition-transform group-hover/btn:translate-x-0.5" />
                </TrackedLink>
                <a
                  href="#setup"
                  className={buttonStyles({
                    variant: 'secondary',
                    size: 'lg',
                    className: 'w-full sm:w-auto',
                  })}
                >
                  {m.aig_hero_secondary()}
                </a>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.85rem] text-muted-foreground">
                {[
                  m.aig_hero_proof_1(),
                  m.aig_hero_proof_2(),
                  m.aig_hero_proof_3(),
                ].map((proof) => (
                  <li key={proof} className="flex items-center gap-1.5">
                    <Check className="size-4 text-mint-strong" />
                    {proof}
                  </li>
                ))}
              </ul>
              <p className="mt-5 max-w-xl border-l-2 border-coral pl-3 text-[0.88rem] text-ink/75">
                {brand.heroNote()}
              </p>
            </div>
            <Reveal delay={0.1} className="min-w-0 lg:col-span-6">
              <McpChat
                client={`${ai} · OpenAthlete`}
                prompt={m.aig_chat_prompt()}
                calls={[
                  { tool: 'get_athlete_context', detail: m.aig_chat_c1() },
                  { tool: 'get_calendar', detail: m.aig_chat_c2() },
                  { tool: 'get_training_load', detail: m.aig_chat_c3() },
                  { tool: 'update_session', detail: m.aig_chat_c4() },
                ]}
                reply={m.aig_chat_reply()}
              />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Why real data */}
      <Section tone="paper">
        <Container>
          <SectionHeading
            kicker={m.aig_why_kicker()}
            title={m.aig_why_title()}
            lead={m.aig_why_lead({ ai })}
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Reveal className="flex flex-col rounded-3xl border border-border bg-white p-6 sm:p-7">
              <p className="kicker text-coral-strong">
                {m.aig_why_generic_label()}
              </p>
              <p className="mt-5 ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-paper px-4 py-3 text-[0.92rem]">
                {m.aig_why_question()}
              </p>
              <p className="mt-3 max-w-[90%] rounded-2xl rounded-tl-md border border-border px-4 py-3 text-[0.92rem] leading-relaxed text-ink/80">
                {m.aig_why_generic_answer()}
              </p>
              <p className="mt-auto flex items-center gap-2 pt-6 text-[0.82rem] font-medium text-coral-strong">
                <X className="size-4" />
                {m.aig_why_generic_tag()}
              </p>
            </Reveal>
            <Reveal
              delay={0.08}
              className="flex flex-col rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_30px_60px_-36px_rgb(5_12_52/0.45)] sm:p-7"
            >
              <p className="kicker text-mint-strong">
                {m.aig_why_real_label()}
              </p>
              <p className="mt-5 ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-paper px-4 py-3 text-[0.92rem]">
                {m.aig_why_question()}
              </p>
              <div className="mt-3">
                <ToolChain tools={['get_training_load', 'get_calendar']} />
              </div>
              <p className="mt-3 max-w-[90%] rounded-2xl rounded-tl-md border border-mint/40 bg-mint/[0.06] px-4 py-3 text-[0.92rem] leading-relaxed">
                {m.aig_why_real_answer()}
              </p>
            </Reveal>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {[
              {
                title: m.aig_do_title(),
                items: [m.aig_do_1(), m.aig_do_2(), m.aig_do_3(), m.aig_do_4()],
                good: true,
              },
              {
                title: m.aig_dont_title(),
                items: [
                  m.aig_dont_1(),
                  m.aig_dont_2(),
                  m.aig_dont_3(),
                  m.aig_dont_4(),
                ],
                good: false,
              },
            ].map((list, index) => (
              <Reveal
                key={list.title}
                delay={index * 0.08}
                className="rounded-3xl border border-border bg-white p-6 sm:p-7"
              >
                <h3 className="text-lg font-semibold">{list.title}</h3>
                <ul className="mt-4 grid gap-3">
                  {list.items.map((item) => (
                    <li key={item} className="flex gap-3 text-[0.94rem]">
                      {list.good ? (
                        <Check className="mt-0.5 size-4 shrink-0 text-mint-strong" />
                      ) : (
                        <X className="mt-0.5 size-4 shrink-0 text-coral-strong" />
                      )}
                      <span className="leading-relaxed text-ink/85">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Setup */}
      <Section id="setup">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <SectionHeading
                kicker={m.aig_setup_kicker()}
                title={m.aig_setup_title()}
                lead={m.aig_setup_lead({ ai })}
              />
            </div>
            <Reveal className="rounded-3xl border border-coral/30 bg-coral/[0.05] p-6 lg:col-span-5">
              <p className="kicker text-coral-strong">{m.aig_plans_kicker()}</p>
              <h3 className="mt-2 text-lg font-semibold">
                {brand.plansTitle()}
              </h3>
              <ul className="mt-4 grid gap-2.5 text-[0.92rem]">
                {brand.plans.map((plan) => (
                  <li key={plan()} className="flex gap-2.5">
                    <ChevronRight className="mt-1 size-3.5 shrink-0 text-coral-strong" />
                    <span className="leading-relaxed">{plan()}</span>
                  </li>
                ))}
              </ul>
              {brand.id === 'chatgpt' && (
                <>
                  <p className="mt-4 text-[0.85rem] text-muted-foreground">
                    {m.aig_chatgpt_plans_note()}
                  </p>
                  <p className="mt-4 border-t border-coral/20 pt-4 text-[0.9rem]">
                    {m.aig_chatgpt_plans_alt()}
                  </p>
                  <ArrowLink
                    href={localePath(locale, '/ai/claude')}
                    className="mt-2"
                  >
                    {m.aig_chatgpt_plans_alt_link()}
                  </ArrowLink>
                </>
              )}
            </Reveal>
          </div>

          <ol className="mt-16 sm:mt-20">
            {steps.map((step, index) => {
              const n = index + 1;
              const visuals: ReactNode[] = [
                <SignupMock key="1" />,
                <ConnectorsMock key="2" />,
                <div key="3" className="grid gap-4">
                  {brand.id === 'claude' ? (
                    <ClaudeConnectorMock />
                  ) : (
                    <ChatGptServerMock />
                  )}
                  <UrlBox placement={`${placement}_setup`} />
                </div>,
                <ConsentMock key="4" brand={brand} />,
                <FirstPromptMock key="5" brand={brand} />,
              ];
              const extras: Record<number, ReactNode> = {
                1: (
                  <TrackedLink
                    href={signupUrl(`${placement}_step1`)}
                    event="cta_clicked"
                    properties={{
                      placement: `${placement}_step1`,
                      cta: 'signup',
                    }}
                    className={buttonStyles({ size: 'sm' })}
                  >
                    {m.aig_step1_cta()}
                    <ArrowRight />
                  </TrackedLink>
                ),
                3: (
                  <p className="rounded-2xl bg-paper p-4 text-[0.86rem] leading-relaxed text-ink/75">
                    {brand.step3Team()}
                  </p>
                ),
                5: (
                  <div className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[0.92rem] leading-relaxed font-medium">
                        {quote(locale, m.aig_first_prompt())}
                      </p>
                      <CopyButton
                        text={m.aig_first_prompt()}
                        placement={`${placement}_step5`}
                        cta="copy_prompt"
                      />
                    </div>
                    <p className="mt-3 text-[0.82rem] text-muted-foreground">
                      {m.aig_first_prompt_tip()}
                    </p>
                  </div>
                ),
              };
              return (
                <Step
                  key={step.title}
                  n={n}
                  title={step.title}
                  body={step.body}
                  visual={visuals[index]}
                  extra={extras[n]}
                  last={n === steps.length}
                />
              );
            })}
          </ol>

          <div className="mt-16 grid gap-5 lg:grid-cols-12">
            {brand.id === 'claude' && (
              <Reveal className="rounded-3xl bg-[#030824] p-6 text-white lg:col-span-6">
                <h3 className="text-lg font-semibold">
                  {m.aig_claude_code_title()}
                </h3>
                <p className="mt-2 text-[0.9rem] text-white/70">
                  {m.aig_claude_code_body()}
                </p>
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <code className="min-w-0 flex-1 font-mono text-[0.75rem] leading-6 break-all text-white/85">
                    claude mcp add --transport http openathlete {MCP_URL}
                  </code>
                  <CopyButton
                    text={`claude mcp add --transport http openathlete ${MCP_URL}`}
                    placement={`${placement}_code`}
                    cta="copy_command"
                    tone="dark"
                  />
                </div>
              </Reveal>
            )}
            <Reveal
              className={cn(
                'rounded-3xl border border-border p-6',
                brand.id === 'claude' ? 'lg:col-span-6' : 'lg:col-span-12',
              )}
            >
              <h3 className="kicker text-muted-foreground">
                {m.aig_sources_title()}
              </h3>
              <ul className="mt-4 grid gap-2 text-[0.88rem]">
                {brand.sources.map((source) => (
                  <li key={source.href}>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener"
                      className="group inline-flex items-start gap-1.5 text-ink/80 underline decoration-border underline-offset-4 hover:text-ink hover:decoration-ink/40"
                    >
                      {source.label}
                      <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Prompt library */}
      <Section tone="paper" id="prompts">
        <Container>
          <SectionHeading
            kicker={m.aig_lib_kicker()}
            title={m.aig_lib_title()}
            lead={m.aig_lib_lead({ ai })}
          />
          <RevealGroup className="mt-12 columns-1 gap-5 lg:columns-2">
            {LIBRARY.map((group) => {
              const Icon = group.icon;
              return (
                <RevealItem
                  key={group.title()}
                  className="mb-5 break-inside-avoid rounded-3xl border border-border bg-white"
                >
                  <div className="flex items-center gap-3 border-b border-border px-5 py-4 sm:px-6">
                    <span className="grid size-9 place-items-center rounded-xl bg-paper">
                      <Icon className="size-4.5 text-sky-strong" />
                    </span>
                    <h3 className="font-semibold">{group.title()}</h3>
                  </div>
                  {group.note && (
                    <p className="border-b border-border bg-paper/50 px-5 py-3 text-[0.82rem] text-muted-foreground sm:px-6">
                      {group.note()}
                    </p>
                  )}
                  <ul className="divide-y divide-border">
                    {group.prompts.map((prompt) => (
                      <li key={prompt.text()} className="px-5 py-5 sm:px-6">
                        <div className="flex items-start justify-between gap-4">
                          <p className="leading-relaxed font-medium">
                            {quote(locale, prompt.text())}
                          </p>
                          <CopyButton
                            text={prompt.text()}
                            placement={`${placement}_library`}
                            cta="copy_prompt"
                          />
                        </div>
                        <div className="mt-3">
                          <ToolChain tools={prompt.tools} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </RevealItem>
              );
            })}
          </RevealGroup>
          <Reveal className="mt-2 max-w-3xl text-[0.9rem] text-muted-foreground">
            {m.aig_lib_builtin()}
          </Reveal>
        </Container>
      </Section>

      {/* Supporter is not needed */}
      <Section tone="ink">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <p className="kicker text-ink-soft">{m.aig_sup_kicker()}</p>
              <h2 className="display-2-side mt-3 text-white">
                {m.aig_sup_title()}
              </h2>
              <p className="mt-5 leading-relaxed text-white/70">
                {m.aig_sup_body({
                  ai,
                  company,
                  month: String(SUPPORTER_MONTHLY_EUR),
                  year: String(SUPPORTER_YEARLY_EUR),
                })}
              </p>
              <ArrowLink
                tone="light"
                href={localePath(locale, '/pricing')}
                className="mt-7"
              >
                {m.aig_sup_link()}
              </ArrowLink>
            </Reveal>
            <Reveal delay={0.1} className="min-w-0 lg:col-span-7">
              <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.04]">
                <table className="w-full min-w-[30rem] text-left text-[0.9rem] text-white">
                  <thead>
                    <tr className="border-b border-white/10 text-[0.78rem] text-white/55">
                      <th className="px-5 py-4 font-medium">
                        {m.aig_sup_col_feature()}
                      </th>
                      <th className="px-5 py-4 font-medium">
                        {m.aig_sup_col_free()}
                      </th>
                      <th className="px-5 py-4 font-medium">
                        {m.aig_sup_col_supporter()}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    <tr className="bg-mint/[0.06]">
                      <td className="px-5 py-4 font-medium">
                        {m.aig_sup_row_mcp({ ai })}
                      </td>
                      <td className="px-5 py-4">
                        <Check className="size-5 text-mint" />
                      </td>
                      <td className="px-5 py-4">
                        <Check className="size-5 text-mint" />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4">{m.aig_sup_row_ai()}</td>
                      <td className="px-5 py-4 text-white/70">
                        {m.aig_sup_ai_free()}
                      </td>
                      <td className="px-5 py-4 text-white/70">
                        {m.aig_sup_ai_supporter()}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4">{m.aig_sup_row_athletes()}</td>
                      <td className="px-5 py-4 text-white/70">5</td>
                      <td className="px-5 py-4 text-white/70">
                        {m.aig_sup_unlimited()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-[0.85rem] text-white/55">
                {m.aig_sup_selfhost()}
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Limits and privacy */}
      <Section>
        <Container>
          <SectionHeading
            kicker={m.aig_priv_kicker()}
            title={m.aig_priv_title({ ai })}
          />
          <RevealGroup className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {privacy.map((item) => {
              const Icon = item.icon;
              return (
                <RevealItem
                  key={item.title}
                  className={cn(
                    'flex flex-col rounded-3xl border border-border p-6',
                    item.wide && 'bg-paper md:col-span-2',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-5',
                      item.wide ? 'text-coral-strong' : 'text-mint-strong',
                    )}
                  />
                  <h3
                    className={cn(
                      'mt-4 font-semibold',
                      item.wide ? 'text-xl sm:text-2xl' : 'text-lg',
                    )}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={cn(
                      'mt-2 leading-relaxed text-ink/80',
                      item.wide ? 'text-[1.02rem]' : 'text-[0.92rem]',
                    )}
                  >
                    {item.body}
                  </p>
                  {item.link && (
                    <ArrowLink href={item.link.href} className="mt-auto pt-4">
                      {item.link.label}
                    </ArrowLink>
                  )}
                </RevealItem>
              );
            })}
          </RevealGroup>
        </Container>
      </Section>

      {/* Related */}
      <Section tone="paper" className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            kicker={m.aig_rel_kicker()}
            title={m.aig_rel_title()}
          />
          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: localePath(locale, other.path),
                title:
                  other.id === 'claude'
                    ? m.aig_rel_claude()
                    : m.aig_rel_chatgpt(),
                body: m.aig_rel_guide_body(),
              },
              {
                href: localePath(locale, '/features/mcp-server'),
                title: m.aig_rel_mcp(),
                body: m.aig_rel_mcp_body(),
              },
              {
                href: localePath(locale, '/features/ai-coach'),
                title: m.aig_rel_ai(),
                body: m.aig_rel_ai_body(),
              },
            ].map((card) => (
              <RevealItem key={card.href}>
                <Link
                  href={card.href}
                  className="group flex h-full flex-col rounded-3xl border border-border bg-white p-6 transition-colors hover:border-ink/25"
                >
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="mt-2 text-[0.9rem] text-muted-foreground">
                    {card.body}
                  </p>
                  <ArrowRight className="mt-auto size-4 pt-0 text-ink/50 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                </Link>
              </RevealItem>
            ))}
            <RevealItem className="rounded-3xl border border-border bg-white p-6">
              <h3 className="font-semibold">{m.aig_rel_watches()}</h3>
              <p className="mt-2 text-[0.9rem] text-muted-foreground">
                {m.aig_rel_watches_body()}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {PROVIDERS.map((provider) => (
                  <li key={provider.slug}>
                    <Link
                      href={localePath(locale, `/ai/${provider.slug}`)}
                      className="inline-flex rounded-full border border-border px-3 py-1 text-[0.82rem] hover:border-ink/30 hover:bg-paper"
                    >
                      {provider.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </RevealItem>
          </RevealGroup>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container size="narrow">
          <h2 className="display-2">{m.aig_faq_title()}</h2>
          <div className="mt-10">
            <Faq items={faqs} placement={`${placement}_faq`} />
          </div>
        </Container>
      </Section>

      <CtaBand
        locale={locale}
        placement={`${placement}_final`}
        title={brand.finalTitle()}
        body={m.aig_final_body()}
        secondary={{
          href: localePath(locale, '/features/mcp-server'),
          label: m.aig_final_secondary(),
        }}
      />
    </>
  );
}
