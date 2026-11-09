import {
  AI_BRANDS,
  AI_BRAND_SLUGS,
  type AiBrand,
  brandMessage,
  getAiBrand,
} from '@/components/ai-brand/data';
import { BrandChat, BrandFlow, BrandLogo } from '@/components/ai-brand/visuals';
import { ArrowLink } from '@/components/features/kit';
import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CtaBand } from '@/components/site/cta-band';
import { Faq } from '@/components/site/faq';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { MCP_URL } from '@/config';
import { initLocale } from '@/i18n/server';
import { signupUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  ShieldCheck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string; brand: string }> };

/* eslint-disable react-refresh/only-export-components */
// The locale layout generates each language; this adds the brands
export function generateStaticParams() {
  return AI_BRAND_SLUGS.map((brand) => ({ brand }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props) {
  const { locale: rawLocale, brand: slug } = await params;
  const locale = initLocale(rawLocale);
  const brand = getAiBrand(slug);
  if (!brand) notFound();
  return pageMetadata({
    locale,
    path: `/ai/${brand.slug}`,
    title: brandMessage(brand.slug, 'seo_title'),
    description: brandMessage(brand.slug, 'seo_description'),
  });
}
/* eslint-enable react-refresh/only-export-components */

type Level = 'yes' | 'partial' | 'no';

function LevelIcon({ level }: { level: Level }) {
  const Icon = level === 'yes' ? Check : level === 'partial' ? Minus : X;
  return (
    <span
      className={cn(
        'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full',
        level === 'yes' && 'bg-mint/15 text-mint',
        level === 'partial' && 'bg-[#f2b13c]/15 text-[#f2c46b]',
        level === 'no' && 'bg-coral/15 text-[#ffb3a3]',
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.5} />
    </span>
  );
}

function ToolChain({ tools }: { tools: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tools.map((tool, i) => (
        <span key={tool} className="flex items-center gap-1.5">
          <code className="rounded-md bg-paper px-2 py-1 font-mono text-[0.72rem] text-sky-strong">
            {tool}
          </code>
          {i < tools.length - 1 && (
            <span className="text-[0.7rem] text-muted-foreground">→</span>
          )}
        </span>
      ))}
    </div>
  );
}

function Hero({ brand, locale }: { brand: AiBrand; locale: SupportedLocale }) {
  const name = brand.name;
  const placement = `ai_${brand.slug}_hero`;
  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_30%_0%,black,transparent)]" />
        <div className="absolute top-[-14rem] left-[10%] h-[30rem] w-[44rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--sky)_28%,transparent),transparent)] blur-2xl" />
        <div className="absolute top-[4rem] right-[-6rem] h-[26rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--orchid)_18%,transparent),transparent)] blur-2xl" />
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
            <li className="text-ink">{name}</li>
          </ol>
        </nav>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-3">
              <BrandLogo brand={brand} height={22} />
              <p className="kicker text-sky-strong">
                {m.aib_kicker({ brand: name })}
              </p>
              {brand.isNew && (
                <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[0.75rem] font-medium text-coral-strong">
                  {m.aib_new_badge()}
                </span>
              )}
            </div>
            {/* No entrance animation: the headline is the largest paint */}
            <h1 className="display-1 mt-5 lg:text-[3.7rem]">
              {brandMessage(brand.slug, 'h1')}
            </h1>
            <p className="lead mt-6 max-w-xl">
              {brandMessage(brand.slug, 'lead')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href={signupUrl(placement)}
                event="cta_clicked"
                properties={{ placement, cta: 'signup' }}
                className={buttonStyles({
                  size: 'lg',
                  className: 'w-full sm:w-auto',
                })}
              >
                {m.site_cta_start()}
                <ArrowRight className="transition-transform group-hover/btn:translate-x-0.5" />
              </TrackedLink>
              <Link
                href="#how"
                className={buttonStyles({
                  variant: 'secondary',
                  size: 'lg',
                  className: 'w-full sm:w-auto',
                })}
              >
                {m.aib_hero_secondary()}
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.85rem] text-muted-foreground">
              {[
                m.aib_proof_free(),
                m.aib_proof_oauth(),
                m.aib_proof_clients(),
              ].map((proof) => (
                <li key={proof} className="flex items-center gap-1.5">
                  <Check className="size-4 text-mint-strong" />
                  {proof}
                </li>
              ))}
            </ul>
          </div>
          <Reveal delay={0.1} className="lg:col-span-5">
            <BrandChat
              brand={brand}
              label={m.aib_chat_example()}
              prompt={brandMessage(brand.slug, 'chat_prompt')}
              reply={brandMessage(brand.slug, 'chat_reply')}
              via={m.aib_chat_via({ brand: name })}
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function HowItWorks({
  brand,
  locale,
}: {
  brand: AiBrand;
  locale: SupportedLocale;
}) {
  const name = brand.name;
  const steps = [
    {
      title: m.aib_how_1_title({ brand: name }),
      body: m.aib_how_1_body({ brand: name }),
      links: [
        {
          href: localePath(locale, `/connect/${brand.slug}`),
          label: m.aib_how_1_link({ brand: name }),
        },
      ],
    },
    {
      title: m.aib_how_2_title(),
      body: m.aib_how_2_body(),
      code: MCP_URL,
      links: [
        { href: localePath(locale, '/ai/claude'), label: m.aib_how_2_claude() },
        {
          href: localePath(locale, '/ai/chatgpt'),
          label: m.aib_how_2_chatgpt(),
        },
        {
          href: localePath(locale, '/features/mcp-server'),
          label: m.aib_how_2_mcp(),
        },
      ],
    },
    {
      title: m.aib_how_3_title(),
      body: m.aib_how_3_body(),
      links: [],
    },
  ];
  return (
    <Section id="how" className="scroll-mt-24">
      <Container>
        <SectionHeading kicker={m.aib_how_kicker()} title={m.aib_how_title()} />
        <RevealGroup className="mt-12 grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <RevealItem
              key={step.title}
              className="relative flex flex-col rounded-3xl border border-border bg-white p-6 sm:p-7"
            >
              <span className="brand-gradient-text font-mono text-4xl font-semibold">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {step.body}
              </p>
              {step.code && (
                <code className="mt-4 block rounded-xl bg-[#030824] px-3.5 py-2.5 font-mono text-[0.78rem] break-all text-white/90">
                  {step.code}
                </code>
              )}
              {step.links.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-6 text-[0.92rem]">
                  {step.links.map((link) => (
                    <ArrowLink key={link.href} href={link.href}>
                      {link.label}
                    </ArrowLink>
                  ))}
                </div>
              )}
            </RevealItem>
          ))}
        </RevealGroup>
        <Reveal className="mt-5 flex flex-col gap-4 rounded-3xl border border-mint/30 bg-mint/[0.07] p-6 sm:flex-row sm:p-7">
          <ShieldCheck className="size-6 shrink-0 text-mint-strong" />
          <div>
            <h3 className="font-semibold">{m.aib_auth_title()}</h3>
            <p className="mt-2 leading-relaxed text-ink/80">
              {brandMessage(brand.slug, 'auth_contrast')}
            </p>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

function DataSection({ brand }: { brand: AiBrand }) {
  const name = brand.name;
  const rows: Array<{ label: string; value: string; level: Level }> = [
    {
      label: m.aib_row_activities(),
      value: brandMessage(brand.slug, 'activities'),
      level: 'yes',
    },
    {
      label: m.aib_row_history(),
      value: brandMessage(brand.slug, 'history'),
      level:
        brand.history === 'full'
          ? 'yes'
          : brand.history === 'partial'
            ? 'partial'
            : 'no',
    },
    {
      label: m.aib_row_metrics(),
      value: brandMessage(brand.slug, 'metrics'),
      level: brand.wellness ? 'yes' : 'no',
    },
    { label: m.aib_row_load(), value: m.aib_val_load(), level: 'yes' },
    { label: m.aib_row_calendar(), value: m.aib_val_calendar(), level: 'yes' },
    {
      label: m.aib_row_watch({ brand: name }),
      value: brandMessage(brand.slug, 'watch'),
      level: brand.watch ? 'yes' : 'no',
    },
  ];
  return (
    <Section tone="ink">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-5">
            <p className="kicker text-ink-soft">{m.aib_data_kicker()}</p>
            <h2 className="display-2-side mt-3 text-white">
              {m.aib_data_title({ brand: name })}
            </h2>
            <p className="mt-5 leading-relaxed text-white/70">
              {m.aib_data_lead({ brand: name })}
            </p>
            <div className="mt-8">
              <BrandFlow
                brand={brand}
                sync={m.aib_flow_sync()}
                mcp={m.aib_flow_mcp()}
                back={
                  brand.watch
                    ? m.aib_flow_watch()
                    : m.aib_flow_no_watch({ brand: name })
                }
              />
            </div>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7">
            <dl className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[13rem_1fr] sm:gap-6 sm:px-6"
                >
                  <dt className="text-[0.9rem] font-semibold text-white">
                    {row.label}
                  </dt>
                  <dd className="flex gap-3 text-[0.92rem] leading-snug text-white/75">
                    <LevelIcon level={row.level} />
                    <span className="pt-0.5">{row.value}</span>
                  </dd>
                </div>
              ))}
            </dl>
            {brand.wellness && (
              <p className="mt-4 text-[0.82rem] text-white/50">
                {m.aib_flow_metrics_note({ brand: name })}
              </p>
            )}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

function Prompts({ brand }: { brand: AiBrand }) {
  return (
    <Section>
      <Container>
        <SectionHeading
          kicker={m.aib_prompts_kicker()}
          title={m.aib_prompts_title({ brand: brand.name })}
          lead={m.aib_prompts_lead()}
        />
        <RevealGroup className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {brand.prompts.map((tools, index) => (
            <RevealItem
              key={index}
              className={cn(
                'flex flex-col rounded-3xl border border-border bg-white p-6 sm:p-7',
                index < 2 ? 'lg:col-span-3' : 'lg:col-span-2',
              )}
            >
              <p className="text-lg leading-snug font-medium">
                “{brandMessage(brand.slug, `p${index + 1}`)}”
              </p>
              <div className="mt-auto pt-6">
                <ToolChain tools={tools} />
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}

function Comparison({ brand }: { brand: AiBrand }) {
  const name = brand.name;
  const oa = [
    m.aib_vs_oa_clients(),
    brandMessage(brand.slug, 'oa_write'),
    m.aib_vs_oa_all(),
    m.aib_vs_oa_open(),
  ];
  return (
    <Section tone="paper">
      <Container>
        <SectionHeading
          kicker={m.aib_vs_kicker()}
          title={m.aib_vs_title({ brand: name })}
          lead={m.aib_vs_lead()}
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Reveal className="rounded-3xl border border-border bg-white p-6 sm:p-8">
            <div className="flex h-8 items-center gap-3">
              <BrandLogo brand={brand} height={20} />
              <span className="kicker text-muted-foreground">
                {m.aib_vs_own({ brand: name })}
              </span>
            </div>
            <ul className="mt-6 grid gap-4">
              {[1, 2, 3].map((n) => (
                <li key={n} className="flex gap-3 leading-relaxed text-ink/85">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink/40" />
                  {brandMessage(brand.slug, `own_${n}`)}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal
            delay={0.1}
            className="rounded-3xl border border-sky/40 bg-white p-6 shadow-[0_30px_60px_-40px_rgb(5_12_52/0.45)] sm:p-8"
          >
            <div className="flex h-8 items-center gap-3">
              <span className="kicker text-sky-strong">{m.aib_vs_oa()}</span>
            </div>
            <ul className="mt-6 grid gap-4">
              {oa.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 leading-relaxed text-ink/85"
                >
                  <Check className="mt-1 size-4 shrink-0 text-mint-strong" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal className="mt-6 max-w-3xl border-l-2 border-orchid pl-5 text-[1.02rem] leading-relaxed text-ink/80">
          {brandMessage(brand.slug, 'vs_note')}
        </Reveal>
      </Container>
    </Section>
  );
}

function OtherBrands({
  brand,
  locale,
}: {
  brand: AiBrand;
  locale: SupportedLocale;
}) {
  const others = AI_BRANDS.filter((other) => other.slug !== brand.slug);
  return (
    <Section tone="paper" className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          kicker={m.aib_others_kicker()}
          title={m.aib_others_title()}
        />
        <RevealGroup className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {others.map((other) => (
            <RevealItem key={other.slug}>
              <Link
                href={localePath(locale, `/ai/${other.slug}`)}
                className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-sky"
              >
                <BrandLogo brand={other} height={20} className="self-start" />
                <span className="flex items-center gap-1.5 font-medium">
                  {other.name} + Claude / ChatGPT
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span
                  className={cn(
                    'mt-auto w-fit rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium',
                    other.watch
                      ? 'bg-mint/20 text-mint-strong'
                      : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {other.watch ? m.aib_others_watch() : m.aib_others_calendar()}
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}

function Sources({ brand }: { brand: AiBrand }) {
  return (
    <section className="pt-4 pb-12">
      <Container size="narrow">
        <div className="rounded-2xl border border-border p-5 text-[0.82rem] leading-relaxed text-muted-foreground sm:p-6">
          <h2 className="font-semibold text-ink">{m.aib_sources_title()}</h2>
          <p className="mt-1">{m.aib_sources_note({ brand: brand.name })}</p>
          <ol className="mt-3 grid list-decimal gap-1.5 pl-5">
            {brand.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener"
                  className="underline decoration-border underline-offset-2 hover:text-ink"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

export default async function AiBrandPage({ params }: Props) {
  const { locale: rawLocale, brand: slug } = await params;
  const locale = initLocale(rawLocale);
  const brand = getAiBrand(slug);
  if (!brand) notFound();

  const path = `/ai/${brand.slug}`;
  const faqs = [
    ...[1, 2, 3, 4].map((i) => ({
      question: brandMessage(brand.slug, `faq_${i}_q`),
      answer: brandMessage(brand.slug, `faq_${i}_a`),
    })),
    { question: m.aib_faq_cost_q(), answer: m.aib_faq_cost_a() },
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
          { name: brand.name, url: localizedUrl(locale, path) },
        ]}
      />
      <FAQPageStructuredData faqs={faqs} />

      <Hero brand={brand} locale={locale} />
      <HowItWorks brand={brand} locale={locale} />
      <DataSection brand={brand} />
      <Prompts brand={brand} />
      <Comparison brand={brand} />
      <Section>
        <Container size="narrow">
          <h2 className="display-2 mb-10">
            {m.aib_faq_title({ brand: brand.name })}
          </h2>
          <Faq items={faqs} placement={`ai_${brand.slug}`} />
        </Container>
      </Section>
      <OtherBrands brand={brand} locale={locale} />
      <Sources brand={brand} />
      <CtaBand
        locale={locale}
        placement={`ai_${brand.slug}_final`}
        title={m.aib_final_title({ brand: brand.name })}
        body={m.aib_final_body()}
        secondary={{
          href: localePath(locale, '/features/mcp-server'),
          label: m.aib_final_secondary(),
        }}
      />
    </>
  );
}
