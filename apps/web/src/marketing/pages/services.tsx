import { m } from '@/paraglide/messages';

import { Section } from '../components/ui/section';
import { ServiceCard } from '../components/ui/service-card';
import { Seo } from '../lib/seo';

export default function ServicesPage() {
  return (
    <>
      <Seo
        title={m.mkt_services_title()}
        description={m.mkt_services_intro()}
        url={typeof window !== 'undefined' ? window.location.href : undefined}
      />

      {/* 1. Strong introduction */}
      <Section title="mkt_services_intro_strong_title" center>
        <p className="text-[var(--oa-muted)] max-w-3xl mx-auto leading-relaxed">
          {m.mkt_services_intro_strong_text()}
        </p>
      </Section>

      {/* 2-4. Detailed services */}
      <Section title="mkt_services_title">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            title="mkt_service_raceplan_title"
            description="mkt_service_raceplan_long"
            features={[
              { label: 'mkt_service_raceplan_benefit1' },
              { label: 'mkt_service_raceplan_benefit2' },
            ]}
            cta={{ label: 'mkt_service_raceplan_cta', href: '/contact' }}
          />
          <ServiceCard
            title="mkt_service_nutrition_title"
            description="mkt_service_nutrition_long"
            features={[
              { label: 'mkt_service_nutrition_benefit1' },
              { label: 'mkt_service_nutrition_benefit2' },
              { label: 'mkt_service_nutrition_example' },
            ]}
            accent="secondary"
            cta={{ label: 'mkt_service_nutrition_cta', href: '/contact' }}
          />
          <ServiceCard
            title="mkt_service_coaching_title"
            description="mkt_service_coaching_long"
            features={[
              { label: 'mkt_service_coaching_benefit1' },
              { label: 'mkt_service_coaching_benefit2' },
            ]}
            cta={{ label: 'mkt_service_coaching_cta', href: '/contact' }}
          />
        </div>
      </Section>

      {/* 5. Methodology steps */}
      <Section title="mkt_method_title" center subdued>
        <ol className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 text-sm">
          {[1, 2, 3, 4].map((i) => (
            <li
              key={i}
              className="rounded-lg border border-white/5 bg-white/2.5 p-4 text-left text-[var(--oa-fg)]"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--oa-accent)] text-[var(--oa-bg)] text-xs font-semibold">
                  {i}
                </span>
                <span className="font-semibold">
                  {(m as any)[`mkt_method_step${i}`]?.()}
                </span>
              </div>
              <p className="text-[var(--oa-muted)]">
                {(m as any)[`mkt_method_step${i}_desc`]?.()}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* 6. Why unique */}
      <Section title="mkt_unique_title">
        <ul className="grid gap-3 sm:grid-cols-2 text-[var(--oa-fg)]/90">
          {['mkt_unique_point1', 'mkt_unique_point2'].map((k) => (
            <li
              key={k}
              className="flex gap-2 items-start rounded-lg border border-white/5 bg-white/2.5 p-4"
            >
              <span className="mt-1.5 block size-2 rounded-full bg-[var(--oa-accent)]" />
              <span>{(m as any)[k]?.() || k}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 7. Final CTA */}
      <Section center subdued>
        <h3 className="text-xl text-center font-semibold text-[var(--oa-fg)] mb-6">
          {m.mkt_services_final_title()}
        </h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/contact"
            className="inline-flex rounded-md bg-[var(--oa-accent)] px-6 py-3 text-sm font-semibold text-[var(--oa-bg)] shadow hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--oa-accent)] ring-offset-[var(--oa-bg)]"
          >
            {m.mkt_services_final_cta_plan()}
          </a>
          <a
            href="/contact"
            className="inline-flex rounded-md border border-white/10 px-6 py-3 text-sm font-semibold text-[var(--oa-fg)] hover:border-[var(--oa-accent)]/60 hover:text-[var(--oa-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oa-accent)]"
          >
            {m.mkt_services_final_cta_contact()}
          </a>
        </div>
      </Section>
    </>
  );
}
