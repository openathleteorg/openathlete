import { useCurrentSubscription } from '@/api/subscription';
import { useMemo } from 'react';

import {
  FeatureName,
  PLAN_CONFIGS,
  SubscriptionPlan,
  SubscriptionStatus,
  planHasAIFeatures,
} from '@openathlete/shared';

/**
 * Check if subscription status is active (active or trialing)
 */
function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return (
    status === SubscriptionStatus.ACTIVE ||
    status === SubscriptionStatus.TRIALING
  );
}

/**
 * Hook to check if user has access to a specific feature
 */
export function useFeatureAccess(featureName: FeatureName) {
  const { data: subscription, isLoading } = useCurrentSubscription();

  const hasAccess = useMemo(() => {
    if (!subscription) {
      return false;
    }

    // Check if subscription is active (active or trialing)
    if (!isSubscriptionActive(subscription.status as SubscriptionStatus)) {
      return false;
    }

    const plan = subscription.plan as SubscriptionPlan;

    switch (featureName) {
      case FeatureName.AI_GENERATION:
      case FeatureName.AI_RPE_QUESTIONS:
        return planHasAIFeatures(plan);
      default:
        return false;
    }
  }, [subscription, featureName]);

  return {
    hasAccess,
    isLoading,
    plan: subscription?.plan as SubscriptionPlan | undefined,
    subscription,
  };
}

/**
 * Hook to get athlete limit information
 */
export function useAthleteLimit() {
  const { data: subscription, isLoading } = useCurrentSubscription();

  const maxAthletes = useMemo(() => {
    if (!subscription) {
      return 3; // Default free plan limit
    }

    // If subscription is not active, return FREE plan limits
    if (!isSubscriptionActive(subscription.status as SubscriptionStatus)) {
      return PLAN_CONFIGS[SubscriptionPlan.FREE].maxAthletes;
    }

    const plan = subscription.plan as SubscriptionPlan;
    const config = PLAN_CONFIGS[plan];
    return config.maxAthletes;
  }, [subscription]);

  // We'll need to fetch current count separately
  // For now, return the limit info
  return {
    maxAthletes,
    isLoading,
    plan: subscription?.plan as SubscriptionPlan | undefined,
    subscription,
  };
}
