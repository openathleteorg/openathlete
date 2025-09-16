import { m } from '@/paraglide/messages';

import { Section } from '../components/ui/section';
import { Seo } from '../lib/seo';

export default function AboutPage() {
  return (
    <>
      <Seo
        title={m.mkt_about_title?.()}
        description={m.mkt_about_values_science?.()}
        url={typeof window !== 'undefined' ? window.location.href : undefined}
      />
      <Section title="mkt_about_title" eyebrow="mkt_about_founder">
        <div className="prose prose-invert max-w-none text-[var(--oa-muted)]">
          <ul className="grid gap-3 md:grid-cols-3 not-prose mt-8">
            <li className="rounded-lg border border-white/5 p-4 text-sm bg-white/2.5">
              {m.mkt_about_values_science?.() || 'Science'}
            </li>
            <li className="rounded-lg border border-white/5 p-4 text-sm bg-white/2.5">
              {m.mkt_about_values_personal?.() || 'Personal'}
            </li>
            <li className="rounded-lg border border-white/5 p-4 text-sm bg-white/2.5">
              {m.mkt_about_values_field?.() || 'Field'}
            </li>
          </ul>
        </div>
      </Section>
    </>
  );
}
