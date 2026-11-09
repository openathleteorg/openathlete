import { OtherComparisons } from '@/components/compare/compare-page';
import { TableLegend } from '@/components/compare/comparison-table';
import { HubTable } from '@/components/compare/hub-table';
import { PositioningMap } from '@/components/compare/positioning-map';
import { msg, priceVars } from '@/components/compare/text';
import {
  BreadcrumbListStructuredData,
  JsonLd,
} from '@/components/seo/structured-data';
import { CtaBand } from '@/components/site/cta-band';
import {
  Container,
  Section,
  SectionHeading,
} from '@/components/site/layout-primitives';
import { Logo } from '@/components/site/logo';
import { Reveal, RevealGroup, RevealItem } from '@/components/site/reveal';
import { CONTACT_EMAIL, SITE_URL } from '@/config';
import {
  COMPARISONS_CHECKED_ON,
  COMPETITORS,
  LANDSCAPE,
} from '@/content/competitors';
import { initLocale } from '@/i18n/server';
import { m } from '@/paraglide/messages';
import {
  formatLongDate,
  htmlLang,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/compare',
    title: m.compare_hub_seo_title(),
    description: m.compare_hub_seo_description(),
  });
}

export default async function CompareHubPage({ params }: Props) {
  const locale = initLocale((await params).locale);
  const checked = formatLongDate(COMPARISONS_CHECKED_ON, locale);
  const vars = priceVars(locale);

  const points = LANDSCAPE.map((point) => ({
    id: point.id,
    name: point.name,
    sub: msg(`compare_hub_map_${point.id}`),
    x: point.x,
    y: point.y,
    highlight: 'highlight' in point,
    href:
      'slug' in point
        ? localePath(locale, `/compare/${point.slug}`)
        : undefined,
  }));

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.compare_breadcrumb_home(), url: localizedUrl(locale) },
          {
            name: m.compare_breadcrumb(),
            url: localizedUrl(locale, '/compare'),
          },
        ]}
      />
      <JsonLd
        data={{
          '@type': 'CollectionPage',
          name: m.compare_hub_seo_title(),
          description: m.compare_hub_seo_description(),
          url: localizedUrl(locale, '/compare'),
          inLanguage: htmlLang(locale),
          dateModified: COMPARISONS_CHECKED_ON,
          isPartOf: { '@id': `${SITE_URL}/#website` },
          hasPart: COMPETITORS.map((competitor) => ({
            '@type': 'WebPage',
            name: msg(`compare_${competitor.prefix}_h1`),
            url: localizedUrl(locale, `/compare/${competitor.slug}`),
          })),
        }}
      />

      {/* Hero */}
      <section className="relative -mt-[var(--header-height)] overflow-hidden pt-[calc(var(--header-height)+3.5rem)] pb-14 sm:pt-[calc(var(--header-height)+5rem)] sm:pb-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />
          <div className="absolute top-[-12rem] left-1/2 h-[34rem] w-[56rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--sky)_30%,transparent),transparent)] blur-2xl" />
        </div>
        <Container className="relative text-center">
          <p className="kicker text-muted-foreground">
            {m.compare_breadcrumb()} · {m.compare_checked({ date: checked })}
          </p>
          <h1 className="display-1 mx-auto mt-6 max-w-4xl">
            {m.compare_hub_h1()}
          </h1>
          <p className="lead mx-auto mt-6 max-w-2xl">{m.compare_hub_lead()}</p>
          <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {COMPETITORS.map((competitor) => (
              <li key={competitor.slug}>
                <Link
                  href={localePath(locale, `/compare/${competitor.slug}`)}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-4 py-2 text-[0.9rem] font-medium shadow-[0_1px_2px_rgb(5_12_52/0.05)] backdrop-blur transition-colors hover:border-ink/25"
                >
                  <span className="text-muted-foreground">vs</span>{' '}
                  {competitor.name}
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Landscape */}
      <Section tone="ink" className="overflow-hidden">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
            <Reveal className="lg:col-span-4">
              <p className="kicker text-ink-soft">
                {m.compare_hub_map_kicker()}
              </p>
              <h2 className="display-2-side mt-4 text-white">
                {m.compare_hub_map_title()}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-white/70">
                {m.compare_hub_map_lead()}
              </p>
              <p className="mt-6 border-l-2 border-mint/60 pl-4 text-[0.9rem] leading-relaxed text-white/55">
                {m.compare_hub_map_caption()}
              </p>
            </Reveal>
            <div className="lg:col-span-8">
              <PositioningMap
                points={points}
                axes={{
                  open: m.compare_hub_map_open(),
                  closed: m.compare_hub_map_closed(),
                  cheap: m.compare_hub_map_cheap(),
                  expensive: m.compare_hub_map_expensive(),
                }}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Table */}
      <Section>
        <Container size="wide">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              kicker={m.compare_hub_table_kicker()}
              title={m.compare_hub_table_title()}
              lead={m.compare_hub_table_lead({ date: checked })}
            />
            <TableLegend className="lg:max-w-xs lg:flex-col lg:gap-2" />
          </div>
          <Reveal className="mt-10">
            <HubTable locale={locale} />
          </Reveal>
          <p className="mt-5 text-[0.8rem] text-muted-foreground">
            {m.compare_price_note()}
          </p>
        </Container>
      </Section>

      {/* Picks */}
      <Section tone="paper">
        <Container>
          <SectionHeading
            align="center"
            kicker={m.compare_hub_pick_kicker()}
            title={m.compare_hub_pick_title()}
            lead={m.compare_hub_pick_lead()}
          />
          <RevealGroup className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <RevealItem className="ink-band relative overflow-hidden rounded-3xl p-7 sm:p-9 md:col-span-2 lg:col-span-3">
              <div className="dot-grid absolute inset-0 opacity-40" />
              <div className="relative grid gap-5 md:grid-cols-[auto_1fr] md:items-center md:gap-12">
                <div>
                  <p className="kicker text-ink-soft">
                    {m.compare_hub_pick_oa_label()}
                  </p>
                  <Logo tone="light" className="mt-4 [&_span]:text-2xl" />
                  <div className="brand-gradient mt-5 h-1 w-16 rounded-full opacity-80" />
                </div>
                <p className="max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
                  {m.compare_hub_pick_oa()}
                </p>
              </div>
            </RevealItem>
            {COMPETITORS.map((competitor) => (
              <RevealItem key={competitor.slug}>
                <Link
                  href={localePath(locale, `/compare/${competitor.slug}`)}
                  className="group flex h-full flex-col rounded-3xl border border-border bg-white p-7 transition-shadow duration-300 hover:shadow-[0_30px_60px_-30px_rgb(5_12_52/0.35)]"
                >
                  <p className="kicker text-muted-foreground">
                    {m.compare_better_if()}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
                    {competitor.name}
                  </h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {msg(`compare_${competitor.prefix}_summary_them`, vars)}
                  </p>
                  <span className="mt-auto flex items-center gap-1.5 pt-6 text-[0.9rem] font-medium">
                    {m.compare_read_full()}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Method */}
      <Section className="pb-6 sm:pb-10">
        <Container size="narrow">
          <div className="rounded-3xl border border-border p-7 sm:p-10">
            <p className="kicker text-muted-foreground">
              {m.compare_checked({ date: checked })}
            </p>
            <h2 className="display-3 mt-3">{m.compare_hub_method_title()}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {m.compare_hub_method_body({ email: CONTACT_EMAIL })}
            </p>
          </div>
        </Container>
      </Section>

      <OtherComparisons locale={locale} />

      <CtaBand
        locale={locale}
        placement="compare_hub_final"
        title={m.compare_hub_cta_title()}
        body={m.compare_hub_cta_body()}
      />
    </>
  );
}
