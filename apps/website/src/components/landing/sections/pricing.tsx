'use client';

import { Container } from '@/components/landing/container';
import { PricingCard } from '@/components/landing/pricing-card';
import { Section } from '@/components/landing/section';
import { APP_URL } from '@/config';
import { m } from '@/paraglide/messages';

export function Pricing() {
  const tiers = [
    {
      name: m.landing_pricing_tier_1_name(),
      price: m.landing_pricing_tier_1_price(),
      perks: [
        m.landing_pricing_tier_1_perk_1(),
        m.landing_pricing_tier_1_perk_2(),
        m.landing_pricing_tier_1_perk_3(),
      ],
    },
    {
      name: m.landing_pricing_tier_2_name(),
      price: m.landing_pricing_tier_2_price(),
      perks: [
        m.landing_pricing_tier_2_perk_1(),
        m.landing_pricing_tier_2_perk_2(),
        m.landing_pricing_tier_2_perk_3(),
      ],
      highlighted: true,
    },
    {
      name: m.landing_pricing_tier_3_name(),
      price: m.landing_pricing_tier_3_price(),
      perks: [
        m.landing_pricing_tier_3_perk_1(),
        m.landing_pricing_tier_3_perk_2(),
        m.landing_pricing_tier_3_perk_3(),
      ],
    },
  ];

  return (
    <Section id="pricing" className="bg-muted/30">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.landing_pricing_title()}
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            {m.landing_pricing_note()}
          </p>
        </div>

        {/* <div className="mt-12">
          <ImagePlaceholder
            description="Screenshot ou illustration montrant la valeur apportée : comparaison avant/après, ou vue d'ensemble de ce que l'utilisateur obtient avec chaque plan. Style clean, mettant en avant les bénéfices concrets."
            aspectRatio="16/9"
            className="max-w-4xl mx-auto"
          />
        </div> */}

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier, index) => (
              <PricingCard
                key={index}
                name={tier.name}
                price={tier.price}
                perks={tier.perks}
                highlighted={tier.highlighted}
                // badge={'Beta'}
                onCtaClick={() => {
                  window.location.href = `${APP_URL}/auth/create-account`;
                }}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
