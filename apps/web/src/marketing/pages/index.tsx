import { m } from '@/paraglide/messages';

import { Hero } from '../components/ui/hero';
import { Section } from '../components/ui/section';
import { ServiceCard } from '../components/ui/service-card';
import { Seo } from '../lib/seo';

export default function MarketingHomePage() {
  return (
    <>
      <Seo
        title={m.mkt_hero_title?.()}
        description={m.mkt_hero_subtitle?.()}
        url={typeof window !== 'undefined' ? window.location.href : undefined}
      />
      <Hero
        kicker="mkt_hero_kicker"
        title="mkt_hero_title"
        subtitle="mkt_hero_subtitle"
        ctas={[{ label: 'mkt_hero_cta_primary', href: '/contact' }]}
      />
      <Section id="value" title="mkt_home_value_title" center subdued>
        <div className="mx-auto max-w-3xl text-[var(--oa-fg)]/90 text-base leading-relaxed">
          <p className="mb-4">{m.mkt_home_value_p1?.()}</p>
          <p className="">{m.mkt_home_value_p2?.()}</p>
        </div>
      </Section>
      <Section id="why" title="mkt_home_why_title" center>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {[
            'mkt_home_why_point1',
            'mkt_home_why_point2',
            'mkt_home_why_point3',
            'mkt_home_why_point4',
          ].map((k) => (
            <div
              key={k}
              className="rounded-lg border border-white/5 bg-white/2.5 p-4 text-sm text-[var(--oa-fg)]/90"
            >
              {(m as any)[k]?.() || k}
            </div>
          ))}
        </div>
      </Section>
      <Section id="services" title="mkt_services_title" center subdued>
        <div className="grid gap-6 md:grid-cols-3">
          <ServiceCard
            title="mkt_service_raceplan_title"
            description="mkt_service_raceplan_desc"
            cta={{ label: 'mkt_nav_contact', href: '/contact' }}
            features={[]}
          />
          <ServiceCard
            title="mkt_service_nutrition_title"
            description="mkt_service_nutrition_desc"
            cta={{ label: 'mkt_nav_contact', href: '/contact' }}
            features={[]}
            accent="secondary"
          />
          <ServiceCard
            title="mkt_service_coaching_title"
            description="mkt_service_coaching_desc"
            cta={{ label: 'mkt_nav_contact', href: '/contact' }}
            features={[]}
          />
        </div>
      </Section>
    </>
  );
}
