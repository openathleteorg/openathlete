import { proseStyles } from '@/components/blog/prose';
import {
  BreadcrumbListStructuredData,
  FAQPageStructuredData,
  JsonLd,
} from '@/components/seo/structured-data';
import { CtaBand } from '@/components/site/cta-band';
import { Faq } from '@/components/site/faq';
import { Container, Section } from '@/components/site/layout-primitives';
import { learnTerms } from '@/content/learn';
import type { LearnTheme } from '@/content/learn/types';
import { SUPPORTED_LOCALES, initLocale } from '@/i18n/server';
import { getLearnTerm, relatedLearnTerms, resolveLearnLink } from '@/lib/learn';
import { m } from '@/paraglide/messages';
import {
  formatLongDate,
  htmlLang,
  localePath,
  localizedUrl,
} from '@/utils/locales';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { generateMetadata as pageMetadata } from '../../../metadata';

type Props = { params: Promise<{ locale: string; term: string }> };

/* eslint-disable react-refresh/only-export-components */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) =>
    learnTerms.map((term) => ({ locale, term: term.slug })),
  );
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, term: slug } = await params;
  const locale = initLocale(raw);
  const term = getLearnTerm(slug);
  if (!term) notFound();
  const metadata = pageMetadata({
    locale,
    path: `/learn/${slug}`,
    title: term.title[locale],
    description: term.description[locale],
    type: 'article',
  });
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      modifiedTime: term.updatedAt,
    },
  };
}
/* eslint-enable react-refresh/only-export-components */

function themeName(theme: LearnTheme): string {
  if (theme === 'load') return m.learn_theme_load();
  if (theme === 'intensity') return m.learn_theme_intensity();
  return m.learn_theme_racing();
}

export default async function LearnTermPage({ params }: Props) {
  const { locale: raw, term: slug } = await params;
  const locale = initLocale(raw);
  const term = getLearnTerm(slug);
  if (!term) notFound();

  const Body = term.content[locale];
  const url = localizedUrl(locale, `/learn/${slug}`);
  const hubUrl = localizedUrl(locale, '/learn');
  const related = relatedLearnTerms(term);
  const links = term.links.map((link) => resolveLearnLink(link, locale));
  const faq = term.faq[locale];
  const aliases = term.aliases?.[locale] ?? [];

  return (
    <>
      <JsonLd
        data={{
          '@type': 'DefinedTerm',
          '@id': `${url}#term`,
          name: term.name[locale],
          ...(aliases.length > 0 && { alternateName: aliases }),
          description: term.definition[locale],
          url,
          inLanguage: htmlLang(locale),
          inDefinedTermSet: {
            '@type': 'DefinedTermSet',
            '@id': `${hubUrl}#glossary`,
            name: m.learn_hub_set_name(),
            url: hubUrl,
          },
        }}
      />
      <FAQPageStructuredData faqs={faq} />
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          { name: m.learn_nav_label(), url: hubUrl },
          { name: term.name[locale], url },
        ]}
      />

      <article>
        <header className="relative overflow-hidden pt-12 pb-4 sm:pt-16 sm:pb-6">
          <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_80%)] opacity-60" />
          <Container className="relative max-w-[64rem]">
            <div className="max-w-[46rem]">
              <nav className="mb-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Link
                  href={localePath(locale, '/learn')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 font-medium text-ink transition-colors hover:border-ink/25"
                >
                  <ArrowLeft className="size-3.5" />
                  {m.learn_nav_label()}
                </Link>
                <Link
                  href={`${localePath(locale, '/learn')}#${term.theme}`}
                  className="kicker hover:text-ink"
                >
                  {themeName(term.theme)}
                </Link>
              </nav>
              <h1 className="text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.06] font-semibold tracking-[-0.04em] text-ink">
                {term.title[locale]}
              </h1>
              <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-[0_20px_40px_-32px_rgb(5_12_52/0.4)] sm:p-7">
                <p className="kicker text-sky-strong">
                  {m.learn_term_definition()}
                </p>
                <p className="mt-3 text-[1.15rem] leading-relaxed text-ink sm:text-[1.25rem]">
                  {term.definition[locale]}
                </p>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                <time dateTime={term.updatedAt}>
                  {m.learn_term_updated({
                    date: formatLongDate(term.updatedAt, locale),
                  })}
                </time>
              </p>
            </div>
          </Container>
        </header>

        <Container className="max-w-[64rem]">
          <div className="grid gap-12 pt-6 pb-16 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-14">
            <div className="min-w-0">
              <div className={proseStyles}>
                <Body />
              </div>

              {term.sources.length > 0 && (
                <section className="mt-14 border-t border-border pt-8">
                  <h2 className="kicker text-muted-foreground">
                    {m.learn_term_sources()}
                  </h2>
                  <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-[0.9rem] leading-relaxed text-[#2b3354] marker:text-muted-foreground">
                    {term.sources.map((source) => (
                      <li key={source.citation}>
                        {source.citation}
                        {source.url && (
                          <>
                            {' '}
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener"
                              className="break-all text-ink underline decoration-sky/70 underline-offset-2 hover:decoration-orchid"
                            >
                              {source.url.replace(/^https?:\/\//, '')}
                            </a>
                          </>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>

            <aside className="space-y-6 lg:pt-1">
              <div className="space-y-6 lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
                {links.length > 0 && (
                  <div className="ink-band relative overflow-hidden rounded-2xl p-6">
                    <div className="dot-grid absolute inset-0 opacity-40" />
                    <div className="relative">
                      <p className="kicker text-ink-soft">
                        {m.learn_term_links()}
                      </p>
                      <ul className="mt-4 space-y-4">
                        {links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={localePath(locale, link.href)}
                              className="group block"
                            >
                              {link.kicker && (
                                <span className="block text-[0.75rem] text-ink-soft">
                                  {link.kicker}
                                </span>
                              )}
                              <span className="flex items-start justify-between gap-3 text-[0.95rem] leading-snug font-medium text-white">
                                {link.label}
                                <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </Container>
      </article>

      {faq.length > 0 && (
        <Section tone="paper" className="!py-16 sm:!py-20">
          <Container size="narrow">
            <h2 className="display-3 mb-8 text-ink">{m.learn_term_faq()}</h2>
            <Faq items={faq} placement={`learn_${slug.replace(/-/g, '_')}`} />
          </Container>
        </Section>
      )}

      {related.length > 0 && (
        <section className="border-t border-border py-14 sm:py-16">
          <Container>
            <h2 className="kicker mb-6 text-muted-foreground">
              {m.learn_term_related()}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((other) => (
                <Link
                  key={other.slug}
                  href={localePath(locale, `/learn/${other.slug}`)}
                  className="group rounded-2xl border border-border bg-white p-6 transition-colors hover:border-ink/20"
                >
                  <span className="flex items-center justify-between gap-3 text-[1.05rem] font-semibold text-ink">
                    {other.name[locale]}
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-ink" />
                  </span>
                  <span className="mt-2 block text-[0.92rem] leading-relaxed text-muted-foreground">
                    {other.definition[locale]}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href={localePath(locale, '/learn')}
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-border underline-offset-4 hover:decoration-ink"
            >
              {m.learn_term_all()}
              <ArrowRight className="size-3.5" />
            </Link>
          </Container>
        </section>
      )}

      <CtaBand
        locale={locale}
        placement={`learn_${slug.replace(/-/g, '_')}_final`}
        title={m.learn_final_title()}
        body={m.learn_final_body()}
      />
    </>
  );
}
