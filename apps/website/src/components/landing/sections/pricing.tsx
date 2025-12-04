'use client';

import { Container } from '@/components/landing/container';
import { PricingCard } from '@/components/landing/pricing-card';
import { Section } from '@/components/landing/section';
import { Button } from '@/components/ui/button';
import { APP_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { cn } from '@/utils/shadcn';
import { useState } from 'react';

import { PLAN_CONFIGS, SubscriptionPlan } from '@openathlete/shared';

type TargetType = 'athletes' | 'coaches' | 'clubs';

function formatPrice(price: number, locale: string): string {
  if (price === 0) {
    return locale === 'fr' ? 'Gratuit' : 'Free';
  }
  return locale === 'fr'
    ? `${price.toFixed(2).replace('.', ',')}€/mois`
    : `€${price.toFixed(2)}/mo`;
}

function getPlanPerks(plan: SubscriptionPlan, locale: string): string[] {
  const config = PLAN_CONFIGS[plan];
  const perks: string[] = [];

  // Max athletes/members
  if (config.maxAthletes === null) {
    perks.push(locale === 'fr' ? 'Athlètes illimités' : 'Unlimited athletes');
  } else if (config.maxAthletes === 0) {
    // Athlete plan - no coaching
    perks.push(
      locale === 'fr' ? 'Pour athlètes uniquement' : 'For athletes only',
    );
  } else {
    perks.push(
      locale === 'fr'
        ? `Jusqu'à ${config.maxAthletes} athlètes`
        : `Up to ${config.maxAthletes} athletes`,
    );
  }

  // AI features
  if (config.hasAIFeatures) {
    perks.push(locale === 'fr' ? 'Fonctionnalités IA' : 'AI features');
  } else {
    perks.push(locale === 'fr' ? 'Fonctionnalités de base' : 'Basic features');
  }

  // Additional perks based on plan
  switch (plan) {
    case SubscriptionPlan.FREE:
      perks.push(
        locale === 'fr' ? 'Exportation des séances' : 'Export workouts',
      );
      break;
    case SubscriptionPlan.ATHLETE_PRO:
      perks.push(locale === 'fr' ? 'Analyses avancées' : 'Advanced analytics');
      break;
    case SubscriptionPlan.COACH_PRO:
      perks.push(
        locale === 'fr' ? 'Tableau de bord fatigue' : 'Fatigue dashboard',
      );
      break;
    case SubscriptionPlan.COACH_ULTRA:
      perks.push(locale === 'fr' ? 'Support prioritaire' : 'Priority support');
      break;
    case SubscriptionPlan.CLUB_PRO:
      perks.push(
        locale === 'fr' ? 'Gestion multi-équipes' : 'Multi-team management',
      );
      break;
    case SubscriptionPlan.CLUB_ULTRA:
      perks.push(locale === 'fr' ? 'Support dédié' : 'Dedicated support');
      break;
  }

  return perks;
}

const TARGET_CONFIGS: Record<
  TargetType,
  {
    plans: SubscriptionPlan[];
    getTitle: () => string;
    description: { en: string; fr: string };
    color: {
      bg: string;
      border: string;
      darkBg: string;
      darkBorder: string;
    };
  }
> = {
  athletes: {
    plans: [SubscriptionPlan.FREE, SubscriptionPlan.ATHLETE_PRO],
    getTitle: () => m.landing_pricing_athletes_title(),
    description: {
      en: 'Plans designed for individual athletes',
      fr: 'Plans conçus pour les athlètes individuels',
    },
    color: {
      bg: 'from-blue-50/50',
      border: 'border-blue-200/50 dark:border-blue-800/50',
      darkBg: 'dark:from-blue-950/20',
      darkBorder: '',
    },
  },
  coaches: {
    plans: [
      SubscriptionPlan.FREE,
      SubscriptionPlan.COACH_PRO,
      SubscriptionPlan.COACH_ULTRA,
    ],
    getTitle: () => m.landing_pricing_coaches_title(),
    description: {
      en: 'Plans for coaches and trainers',
      fr: 'Plans pour les coachs et entraîneurs',
    },
    color: {
      bg: 'from-green-50/50',
      border: 'border-green-200/50 dark:border-green-800/50',
      darkBg: 'dark:from-green-950/20',
      darkBorder: '',
    },
  },
  clubs: {
    plans: [
      SubscriptionPlan.FREE,
      SubscriptionPlan.CLUB_PRO,
      SubscriptionPlan.CLUB_ULTRA,
    ],
    getTitle: () => m.landing_pricing_clubs_title(),
    description: {
      en: 'Plans for clubs and organizations',
      fr: 'Plans pour les clubs et organisations',
    },
    color: {
      bg: 'from-purple-50/50',
      border: 'border-purple-200/50 dark:border-purple-800/50',
      darkBg: 'dark:from-purple-950/20',
      darkBorder: '',
    },
  },
};

export function Pricing() {
  const locale = getLocale();
  const [activeTarget, setActiveTarget] = useState<TargetType>('athletes');

  const handlePlanClick = (plan: SubscriptionPlan) => {
    window.location.href = `${APP_URL}/auth/create-account?plan=${plan}`;
  };

  const currentConfig = TARGET_CONFIGS[activeTarget];
  const plans = currentConfig.plans;

  return (
    <Section id="pricing" className="bg-muted/30">
      <Container>
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {m.landing_pricing_title()}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {m.landing_pricing_subtitle()}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {m.landing_pricing_note()}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border bg-background p-1">
            {(['athletes', 'coaches', 'clubs'] as TargetType[]).map(
              (target) => {
                const config = TARGET_CONFIGS[target];
                return (
                  <Button
                    key={target}
                    variant={activeTarget === target ? 'default' : 'ghost'}
                    size="lg"
                    onClick={() => setActiveTarget(target)}
                    className={cn(
                      'px-6 transition-all',
                      activeTarget === target && 'shadow-sm',
                    )}
                  >
                    {config.getTitle()}
                  </Button>
                );
              },
            )}
          </div>
        </div>

        {/* Plans Display */}
        <div className="relative">
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-b to-transparent rounded-3xl -z-10 transition-all duration-300',
              currentConfig.color.bg,
              currentConfig.color.darkBg,
            )}
          />
          <div
            className={cn(
              'relative bg-background/50 backdrop-blur-sm rounded-3xl p-8 md:p-12 border transition-all duration-300',
              currentConfig.color.border,
            )}
          >
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold mb-2">
                {currentConfig.getTitle()}
              </h3>
              <p className="text-muted-foreground">
                {currentConfig.description[locale as 'en' | 'fr']}
              </p>
            </div>

            <div
              className={cn(
                'grid gap-6 mx-auto transition-all duration-300',
                plans.length === 2
                  ? 'md:grid-cols-2 max-w-3xl'
                  : 'md:grid-cols-3 max-w-5xl',
              )}
            >
              {plans.map((plan) => {
                const config = PLAN_CONFIGS[plan];
                const isPremium =
                  plan === SubscriptionPlan.ATHLETE_PRO ||
                  plan === SubscriptionPlan.COACH_ULTRA ||
                  plan === SubscriptionPlan.CLUB_ULTRA;

                return (
                  <PricingCard
                    key={plan}
                    name={config.name}
                    price={formatPrice(config.price, locale)}
                    perks={getPlanPerks(plan, locale)}
                    highlighted={isPremium}
                    onCtaClick={() => handlePlanClick(plan)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
