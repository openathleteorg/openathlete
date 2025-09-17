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
      <Section title="mkt_about_title">
        <p className="text-[var(--oa-muted)] leading-relaxed max-w-4xl">
          {m.mkt_about_intro?.()}
        </p>
      </Section>

      <Section eyebrow="mkt_about_founder" title="mkt_about_founder_title">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <ul className="space-y-2 text-[var(--oa-fg)]/90">
              <li>• {m.mkt_about_founder_b1?.()}</li>
              <li>• {m.mkt_about_founder_b2?.()}</li>
            </ul>
          </div>
          <blockquote className="rounded-lg border border-white/10 bg-white/2.5 p-4 text-sm text-[var(--oa-muted)] italic">
            “{m.mkt_about_founder_quote?.()}”
          </blockquote>
        </div>
      </Section>

      <Section title="mkt_about_guiding_title">
        <ul className="grid gap-3 md:grid-cols-3 text-[var(--oa-fg)]/90">
          <li className="rounded-lg border border-white/5 p-4 bg-white/2.5">
            {m.mkt_about_values_science?.()}
          </li>
          <li className="rounded-lg border border-white/5 p-4 bg-white/2.5">
            {m.mkt_about_values_personal?.()}
          </li>
          <li className="rounded-lg border border-white/5 p-4 bg-white/2.5">
            {m.mkt_about_values_field?.()}
          </li>
        </ul>
      </Section>

      <Section title="mkt_about_vision_title" subdued>
        <p className="text-[var(--oa-muted)] leading-relaxed max-w-3xl">
          {m.mkt_about_vision_text?.()}
        </p>
      </Section>
    </>
  );
}
