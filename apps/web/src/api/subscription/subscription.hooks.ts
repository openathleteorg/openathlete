import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { CreateCheckoutSessionDto, FeatureName } from '@openathlete/shared';

import { SubscriptionAPI } from './subscription.api';
import { subscriptionKeys } from './subscription.keys';

export function useCurrentSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.current(),
    queryFn: () => SubscriptionAPI.getCurrentSubscription(),
  });
}

export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCheckoutSessionDto) =>
      SubscriptionAPI.createCheckoutSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => SubscriptionAPI.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
    },
  });
}

export function useResumeSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => SubscriptionAPI.resumeSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
    },
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: subscriptionKeys.invoices(),
    queryFn: () => SubscriptionAPI.getInvoices(),
  });
}

export function useCustomerPortal() {
  return useMutation({
    mutationFn: (returnUrl: string) =>
      SubscriptionAPI.getCustomerPortalUrl(returnUrl),
  });
}

export function useAthleteFeatureAccess(
  athleteId: number | undefined,
  featureName: FeatureName,
) {
  return useQuery({
    queryKey: [
      ...subscriptionKeys.all,
      'athleteFeatureAccess',
      athleteId,
      featureName,
    ],
    queryFn: () =>
      SubscriptionAPI.getAthleteFeatureAccess(athleteId!, featureName),
    enabled: !!athleteId,
  });
}
