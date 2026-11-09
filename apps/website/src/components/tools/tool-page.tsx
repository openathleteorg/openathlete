import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
  WebApplicationStructuredData,
} from '@/components/seo/structured-data';
import { buttonStyles } from '@/components/site/button';
import { CtaBand } from '@/components/site/cta-band';
import { Faq, type FaqEntry } from '@/components/site/faq';
import { Container, Section } from '@/components/site/layout-primitives';
import { Reveal } from '@/components/site/reveal';
import { TrackedLink } from '@/components/site/tracked-link';
import { signupUrl } from '@/lib/links';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { TOOLS, type ToolSlug } from './registry';

/** Shared frame of a calculator page: hero, calculator, method, FAQ. */
export function ToolPage({
  locale,
  slug,
  title,
  lead,
  description,
  calculator,
  method,
  extra,
  faq,
}: {
  locale: SupportedLocale;
  slug: ToolSlug;
  title: string;
  lead: string;
  description: string;
  calculator: ReactNode;
  method: ReactNode;
  extra?: ReactNode;
  faq: FaqEntry[];
}) {
  const url = localizedUrl(locale, `/tools/${slug}`);
  const placement = `tools_${slug.replace(/-/g, '_')}`;
  return (
    <>
      <WebApplicationStructuredData
        name={title}
        description={description}
        url={url}
        locale={locale}
      />
      <FAQPageStructuredData faqs={faq} />
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          { name: m.tools_hub_kicker(), url: localizedUrl(locale, '/tools') },
          { name: title, url },
        ]}
      />

      <section className="relative overflow-hidden pt-12 pb-10 sm:pt-16 sm:pb-14">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)] opacity-70" />
        <Container className="relative">
          <Link
            href={localePath(locale, '/tools')}
            className="mb-8 inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink/25"
          >
            <ArrowLeft className="size-3.5" />
            {m.tools_common_all()}
          </Link>
          <p className="kicker mb-4 text-muted-foreground">
            {m.tools_common_kicker()}
          </p>
          <h1 className="display-1 max-w-4xl text-ink">{title}</h1>
          <p className="lead mt-6 max-w-2xl">{lead}</p>
        </Container>
      </section>

      <section className="pb-16 sm:pb-24">
        <Container>{calculator}</Container>
      </section>

      <Section tone="paper" className="!py-16 sm:!py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <Reveal>
              <h2 className="display-3 text-ink">
                {m.tools_common_how_title()}
              </h2>
              <div className="mt-5 space-y-4 text-[1.02rem] leading-relaxed text-[#2b3354]">
                {method}
              </div>
              {extra}
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-border bg-white p-7 shadow-[0_20px_40px_-30px_rgb(5_12_52/0.35)]">
                <p className="text-[1.15rem] font-semibold text-ink">
                  {m.tools_common_watch_title()}
                </p>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
                  {m.tools_common_watch_body()}
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <TrackedLink
                    href={signupUrl(placement)}
                    event="cta_clicked"
                    properties={{ placement, cta: 'signup' }}
                    className={buttonStyles({ size: 'md' })}
                  >
                    {m.tools_common_watch_cta()}
                    <ArrowRight />
                  </TrackedLink>
                  <Link
                    href={localePath(locale, '/features/workout-builder')}
                    className={buttonStyles({ variant: 'ghost', size: 'md' })}
                  >
                    {m.tools_common_watch_more()}
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section className="!py-16 sm:!py-24">
        <Container size="narrow">
          <h2 className="display-3 mb-8 text-ink">
            {m.tools_common_faq_title()}
          </h2>
          <Faq items={faq} placement={placement} />
        </Container>
      </Section>

      <section className="pb-8">
        <Container>
          <h2 className="kicker mb-5 text-muted-foreground">
            {m.tools_common_other_title()}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {TOOLS.filter((tool) => tool.slug !== slug).map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.slug}
                  href={localePath(locale, `/tools/${tool.slug}`)}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 transition-colors hover:border-ink/20"
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tool.color}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="flex-1 font-medium text-ink">
                    {tool.name()}
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      <CtaBand
        locale={locale}
        placement={`${placement}_final`}
        title={m.tools_hub_final_title()}
        body={m.tools_hub_final_body()}
      />
    </>
  );
}
