import { m } from '@/paraglide/messages';
import { Check } from 'lucide-react';

import { PlanConfig, SubscriptionPlan } from '@openathlete/shared';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { SparklesIcon } from '../ui/sparkles-icon';

interface PlanCardProps {
  plan: PlanConfig;
  onSelect: () => void;
  isLoading?: boolean;
  isCurrentPlan?: boolean;
}

const planNameMap: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.FREE]: m.plan_free_name(),
  [SubscriptionPlan.ATHLETE_PRO]: m.plan_athlete_pro_name(),
  [SubscriptionPlan.COACH_PRO]: m.plan_coach_pro_name(),
  [SubscriptionPlan.COACH_ULTRA]: m.plan_coach_ultra_name(),
  [SubscriptionPlan.CLUB_PRO]: m.plan_club_pro_name(),
  [SubscriptionPlan.CLUB_ULTRA]: m.plan_club_ultra_name(),
};

export function PlanCard({
  plan,
  onSelect,
  isLoading,
  isCurrentPlan,
}: PlanCardProps) {
  const features = [];

  if (plan.hasAIFeatures) {
    features.push(m.plan_feature_ai_generation());
    features.push(m.plan_feature_ai_modification());
    features.push(m.plan_feature_rpe_questions());
  }

  if (plan.maxAthletes === null) {
    features.push(m.plan_feature_unlimited_athletes());
  } else if (plan.maxAthletes > 0) {
    features.push(m.plan_feature_limited_athletes({ count: plan.maxAthletes }));
  }

  const priceDisplay =
    plan.price === 0
      ? m.plan_free_price()
      : `€${plan.price.toFixed(2).replace('.', ',')}/mois`;

  return (
    <Card
      className={`flex flex-col ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">{planNameMap[plan.plan]}</CardTitle>
            {isCurrentPlan && (
              <Badge variant="default">{m.paywall_current_plan()}</Badge>
            )}
          </div>
          {plan.hasAIFeatures && (
            <SparklesIcon className="w-5 h-5 text-primary" />
          )}
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4">
          <span className="text-3xl font-bold">{priceDisplay}</span>
        </div>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={onSelect}
          disabled={isLoading || isCurrentPlan}
          variant={plan.price > 0 ? 'default' : 'outline'}
        >
          {isLoading
            ? m.loading()
            : isCurrentPlan
              ? m.paywall_current_plan_button()
              : m.upgrade_now()}
        </Button>
      </CardFooter>
    </Card>
  );
}
