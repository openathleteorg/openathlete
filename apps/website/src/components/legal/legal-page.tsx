import { proseStyles } from '@/components/blog/prose';
import { Container } from '@/components/site/layout-primitives';
import { CONTACT_EMAIL } from '@/config';
import { m } from '@/paraglide/messages';
import {
  type SupportedLocale,
  formatLongDate,
  localePath,
} from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

const PAGES = [
  { path: '/legal-notice', label: () => m.site_footer_legal() },
  { path: '/privacy-policy', label: () => m.site_footer_privacy() },
  { path: '/terms-of-sale', label: () => m.site_footer_terms() },
] as const;

/** Legal notice, privacy policy and terms: same calm, readable layout. */
export function LegalPage({
  locale,
  path,
  title,
  updated,
  intro,
  sections,
}: {
  locale: SupportedLocale;
  path: (typeof PAGES)[number]['path'];
  title: string;
  /** ISO date of the last real change to the text, never the build date. */
  updated: string;
  intro?: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-paper pt-14 pb-12 sm:pt-20 sm:pb-14">
        <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent)] opacity-70" />
        <Container className="relative">
          <p className="kicker mb-4 text-muted-foreground">
            {m.legal_kicker()}
          </p>
          <h1 className="display-2 text-ink">{title}</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {m.legal_updated({ date: formatLongDate(updated, locale) })}
          </p>
          <nav className="mt-8 flex flex-wrap gap-2">
            {PAGES.map((page) => (
              <Link
                key={page.path}
                href={localePath(locale, page.path)}
                aria-current={page.path === path ? 'page' : undefined}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                  page.path === path
                    ? 'border-ink bg-ink text-white'
                    : 'border-border bg-white text-ink hover:border-ink/25',
                )}
              >
                {page.label()}
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      <Container>
        <div className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-height)+2rem)]">
              <p className="kicker mb-4 text-muted-foreground">
                {m.legal_on_this_page()}
              </p>
              <ol className="space-y-2.5 border-l border-border text-[0.9rem]">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="-ml-px block border-l border-transparent pl-4 leading-snug text-muted-foreground transition-colors hover:border-ink hover:text-ink"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          <div className="max-w-[46rem] min-w-0">
            <div className={cn(proseStyles, 'prose-base sm:prose-lg')}>
              {intro && <div className="lead !text-[1.1rem]">{intro}</div>}
              {sections.map((section) => (
                <section key={section.id} id={section.id}>
                  <h2>{section.title}</h2>
                  {section.body}
                </section>
              ))}
            </div>
            <p className="mt-14 rounded-xl border border-border bg-paper px-5 py-4 text-[0.92rem] text-muted-foreground">
              {m.legal_questions({ email: CONTACT_EMAIL })}
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
