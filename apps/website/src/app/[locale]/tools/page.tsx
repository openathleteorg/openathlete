import {
  BreadcrumbListStructuredData,
  ItemListStructuredData,
} from '@/components/seo/structured-data';
import { CtaBand } from '@/components/site/cta-band';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { TOOLS } from '@/components/tools/registry';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import { localePath, localizedUrl } from '@/utils/locales';
import { ArrowRight, Gauge } from 'lucide-react';
import Link from 'next/link';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/tools',
    title: m.tools_hub_seo_title(),
    description: m.tools_hub_seo_description(),
  });
}

/** A 5 × 4' session drawn as blocks, its targets read from a VMA. */
function SessionSketch() {
  const blocks = [
    { w: 14, h: 30, c: 'bg-sky/60' },
    ...Array.from({ length: 5 }).flatMap(() => [
      { w: 7, h: 88, c: 'bg-orchid' },
      { w: 3.5, h: 24, c: 'bg-white/25' },
    ]),
    { w: 10, h: 26, c: 'bg-sky/60' },
  ];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-center justify-between font-mono text-[0.75rem] text-ink-soft">
        <span>5 × 4&apos; @ 95% VMA</span>
        <span>VMA 16.0 km/h → 3:57 /km</span>
      </div>
      <div className="mt-6 flex h-28 items-end gap-[3px]">
        {blocks.map((block, index) => (
          <span
            key={index}
            className={`rounded-t-md ${block.c}`}
            style={{ flexGrow: block.w, height: `${block.h}%` }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 font-mono text-[0.72rem] text-ink-soft">
        <span className="size-2 rounded-full bg-mint" />
        Garmin · Suunto · COROS
      </div>
    </div>
  );
}

export default async function ToolsPage({ params }: Props) {
  const locale = initLocale((await params).locale);

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          { name: m.tools_hub_kicker(), url: localizedUrl(locale, '/tools') },
        ]}
      />
      <ItemListStructuredData
        name={m.tools_hub_h1()}
        items={TOOLS.map((tool) => ({
          name: tool.name(),
          url: localizedUrl(locale, `/tools/${tool.slug}`),
        }))}
      />

      <section className="relative overflow-hidden pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)] opacity-70" />
        <Container className="relative">
          <p className="kicker mb-5 text-muted-foreground">
            {m.tools_hub_kicker()}
          </p>
          <h1 className="display-1 max-w-4xl text-ink">{m.tools_hub_h1()}</h1>
          <p className="lead mt-6 max-w-2xl">{m.tools_hub_lead()}</p>
        </Container>
      </section>

      <section className="pb-20 sm:pb-28">
        <Container>
          <RevealGroup className="grid gap-5 sm:grid-cols-2">
            {TOOLS.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <RevealItem key={tool.slug}>
                  <Link
                    href={localePath(locale, `/tools/${tool.slug}`)}
                    className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border bg-white p-7 transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[0_24px_48px_-30px_rgb(5_12_52/0.4)] sm:p-8"
                  >
                    <span className="absolute top-7 right-7 font-mono text-[0.75rem] text-muted-foreground">
                      0{index + 1}
                    </span>
                    <span
                      className={`flex size-12 items-center justify-center rounded-2xl ${tool.color}`}
                    >
                      <Icon className="size-6" />
                    </span>
                    <h2 className="mt-8 text-[1.5rem] font-semibold tracking-[-0.025em] text-ink">
                      {tool.name()}
                    </h2>
                    <p className="mt-2 text-[1rem] leading-relaxed text-muted-foreground">
                      {tool.card()}
                    </p>
                    <span className="mt-8 inline-flex items-center gap-2 text-[0.95rem] font-medium text-ink">
                      {m.tools_hub_open()}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </RevealItem>
              );
            })}
          </RevealGroup>
          <Reveal className="mt-5">
            <Link
              href={localePath(locale, '/pace-charts')}
              className="group flex flex-col gap-4 rounded-[1.5rem] border border-dashed border-ink/20 bg-paper p-7 transition-colors hover:border-ink/40 sm:flex-row sm:items-center sm:justify-between sm:p-8"
            >
              <span className="flex items-start gap-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-coral/15 text-coral-strong">
                  <Gauge className="size-6" />
                </span>
                <span>
                  <span className="block text-[1.25rem] font-semibold tracking-[-0.02em] text-ink">
                    {m.pacechart_tools_card_title()}
                  </span>
                  <span className="mt-1 block text-[0.98rem] leading-relaxed text-muted-foreground">
                    {m.pacechart_tools_card_body()}
                  </span>
                </span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-ink transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </Container>
      </section>

      <Section tone="ink">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="kicker mb-4 text-ink-soft">
                {m.tools_hub_next_kicker()}
              </p>
              <h2 className="display-2-side text-white">
                {m.tools_hub_next_title()}
              </h2>
              <p className="lead mt-5 text-ink-soft">
                {m.tools_hub_next_body()}
              </p>
              <ol className="mt-8 space-y-4">
                {[
                  m.tools_hub_next_step1(),
                  m.tools_hub_next_step2(),
                  m.tools_hub_next_step3(),
                ].map((step, index) => (
                  <li key={step} className="flex gap-4 text-white">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/20 font-mono text-[0.8rem]">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal delay={0.1}>
              <SessionSketch />
            </Reveal>
          </div>
        </Container>
      </Section>

      <div className="pt-16 sm:pt-20">
        <CtaBand
          locale={locale}
          placement="tools_hub_final"
          title={m.tools_hub_final_title()}
          body={m.tools_hub_final_body()}
        />
      </div>
    </>
  );
}
