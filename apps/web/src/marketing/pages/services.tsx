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
      <Section title="mkt_services_title">
        <div className="grid gap-6 md:grid-cols-3">
          <ServiceCard
            title="mkt_service_raceplan_title"
            description="mkt_service_raceplan_desc"
          />
          <ServiceCard
            title="mkt_service_nutrition_title"
            description="mkt_service_nutrition_desc"
            accent="secondary"
          />
          <ServiceCard
            title="mkt_service_coaching_title"
            description="mkt_service_coaching_desc"
          />
        </div>
      </Section>
    </>
  );
}
