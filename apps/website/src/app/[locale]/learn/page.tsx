import {
  BreadcrumbListStructuredData,
  JsonLd,
} from '@/components/seo/structured-data';
import { CtaBand } from '@/components/site/cta-band';
import { Container } from '@/components/site/layout-primitives';
import { Reveal } from '@/components/site/reveal';
import { learnTerms } from '@/content/learn';
import type { LearnTheme } from '@/content/learn/types';
import { initLocale } from '@/i18n/server';
import { learnTermsByTheme, sortedLearnTerms } from '@/lib/learn';
import { m } from '@/paraglide/messages';
import { htmlLang, localePath, localizedUrl } from '@/utils/locales';
import { Activity, ArrowRight, Gauge, Mountain } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { generateMetadata as pageMetadata } from '../../metadata';

type Props = { params: Promise<{ locale: string }> };

// eslint-disable-next-line react-refresh/only-export-components
export async function generateMetadata({ params }: Props) {
  const locale = initLocale((await params).locale);
  return pageMetadata({
    locale,
    path: '/learn',
    title: m.learn_hub_seo_title(),
    description: m.learn_hub_seo_description(),
  });
}

const THEME_STYLE: Record<LearnTheme, { icon: ReactNode; color: string }> = {
  load: { icon: <Activity />, color: 'bg-sky/20 text-sky-strong' },
  intensity: { icon: <Gauge />, color: 'bg-orchid/15 text-orchid-strong' },
  racing: { icon: <Mountain />, color: 'bg-mint/25 text-mint-strong' },
};

export default async function LearnHub({ params }: Props) {
  const locale = initLocale((await params).locale);
  const groups = learnTermsByTheme(locale);
  const alphabetical = sortedLearnTerms(locale);
  const themeText: Record<LearnTheme, { title: string; lead: string }> = {
    load: { title: m.learn_theme_load(), lead: m.learn_theme_load_desc() },
    intensity: {
      title: m.learn_theme_intensity(),
      lead: m.learn_theme_intensity_desc(),
    },
    racing: {
      title: m.learn_theme_racing(),
      lead: m.learn_theme_racing_desc(),
    },
  };
  const hubUrl = localizedUrl(locale, '/learn');

  return (
    <>
      <BreadcrumbListStructuredData
        items={[
          { name: m.blog_home(), url: localizedUrl(locale) },
          { name: m.learn_nav_label(), url: hubUrl },
        ]}
      />
      <JsonLd
        data={{
          '@type': 'DefinedTermSet',
          '@id': `${hubUrl}#glossary`,
          name: m.learn_hub_set_name(),
          description: m.learn_hub_seo_description(),
          url: hubUrl,
          inLanguage: htmlLang(locale),
          hasDefinedTerm: groups.flatMap(({ terms }) =>
            terms.map((term) => ({
              '@type': 'DefinedTerm',
              name: term.name[locale],
              description: term.definition[locale],
              url: localizedUrl(locale, `/learn/${term.slug}`),
            })),
          ),
        }}
      />

      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent_85%)] opacity-70" />
        <Container className="relative grid gap-12 lg:grid-cols-[1fr_22rem] lg:items-end lg:gap-16">
          <div>
            <p className="kicker mb-5 text-muted-foreground">
              {m.learn_hub_kicker()}
              <span className="mx-2 text-border">/</span>
              {m.learn_hub_count({ count: String(learnTerms.length) })}
            </p>
            <h1 className="display-1 max-w-4xl text-ink">{m.learn_hub_h1()}</h1>
            <p className="lead mt-6 max-w-2xl">{m.learn_hub_lead()}</p>
            <nav className="mt-8 flex flex-wrap gap-2">
              {groups.map(({ theme, terms }) => (
                <a
                  key={theme}
                  href={`#${theme}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/25"
                >
                  {themeText[theme].title}
                  <span className="font-mono text-[0.75rem] text-muted-foreground">
                    {terms.length}
                  </span>
                </a>
              ))}
            </nav>
          </div>
          <nav
            aria-label={m.learn_hub_az()}
            className="rounded-2xl border border-border bg-white/90 p-6 shadow-[0_20px_40px_-32px_rgb(5_12_52/0.4)] backdrop-blur"
          >
            <p className="kicker text-muted-foreground">{m.learn_hub_az()}</p>
            <ul className="mt-4 flex flex-wrap gap-x-1 gap-y-1.5">
              {alphabetical.map((term) => (
                <li key={term.slug}>
                  <Link
                    href={localePath(locale, `/learn/${term.slug}`)}
                    className="inline-flex rounded-lg px-2 py-1 text-[0.92rem] font-medium text-ink transition-colors hover:bg-paper"
                  >
                    {term.name[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </section>

      <div className="pb-20 sm:pb-28">
        {groups.map(({ theme, terms }) => (
          <section
            key={theme}
            id={theme}
            className="scroll-mt-[calc(var(--header-height)+1.5rem)] pt-10 sm:pt-14"
          >
            <Container>
              <Reveal>
                <div className="grid gap-8 border-t border-border pt-10 lg:grid-cols-[18rem_1fr] lg:gap-14">
                  <div>
                    <span
                      className={`flex size-11 items-center justify-center rounded-xl [&_svg]:size-5 ${THEME_STYLE[theme].color}`}
                    >
                      {THEME_STYLE[theme].icon}
                    </span>
                    <h2 className="display-3 mt-5 text-ink">
                      {themeText[theme].title}
                    </h2>
                    <p className="mt-3 text-[0.98rem] leading-relaxed text-muted-foreground">
                      {themeText[theme].lead}
                    </p>
                  </div>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {terms.map((term) => (
                      <li key={term.slug}>
                        <Link
                          href={localePath(locale, `/learn/${term.slug}`)}
                          className="group flex h-full flex-col rounded-2xl border border-border bg-white p-6 transition-colors hover:border-ink/20 hover:bg-paper/60"
                        >
                          <span className="flex items-center justify-between gap-4">
                            <span className="text-[1.15rem] font-semibold tracking-[-0.01em] text-ink">
                              {term.name[locale]}
                            </span>
                            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-ink" />
                          </span>
                          <span className="mt-2 text-[0.94rem] leading-relaxed text-[#2b3354]">
                            {term.definition[locale]}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </Container>
          </section>
        ))}
      </div>

      <CtaBand
        locale={locale}
        placement="learn_hub_final"
        title={m.learn_final_title()}
        body={m.learn_final_body()}
      />
    </>
  );
}
