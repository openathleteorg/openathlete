import { activeSupporterTransactions, buySupporter } from '@/utils/app-store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { BillingInterval, CreateCheckoutSessionDto } from '@openathlete/shared';

import { SubscriptionAPI } from './subscription.api';
import { subscriptionKeys } from './subscription.keys';

export function useCurrentSubscription({ enabled = true } = {}) {
  return useQuery({
    queryKey: subscriptionKeys.current(),
    queryFn: () => SubscriptionAPI.getCurrentSubscription(),
    enabled,
  });
}

/** How many Supporters there are, asked only where the count is shown */
export function useSupporterCountQuery(enabled: boolean) {
  return useQuery({
    queryKey: subscriptionKeys.supporters(),
    queryFn: () => SubscriptionAPI.getSupporterCount(),
    enabled,
    staleTime: 60 * 60 * 1000,
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

/**
 * Buys the Supporter subscription in the iOS app: StoreKit charges the user,
 * then the API verifies Apple's signature and records it.
 */
export function useAppStorePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interval: BillingInterval) => {
      const appAccountToken = await SubscriptionAPI.getAppleAccountToken();
      const signedTransaction = await buySupporter(interval, appAccountToken);
      return SubscriptionAPI.recordAppleTransaction(signedTransaction);
    },
    onSuccess: (subscription) => {
      queryClient.setQueryData(subscriptionKeys.current(), subscription);
    },
  });
}

/**
 * Restores App Store purchases (required by App Review): records the Apple
 * ID's active Supporter subscription, e.g. on a new device. Resolves to
 * whether there was one.
 */
export function useRestoreAppStorePurchases() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const transactions = await activeSupporterTransactions();
      for (const signedTransaction of transactions) {
        await SubscriptionAPI.recordAppleTransaction(signedTransaction);
      }
      return transactions.length > 0;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.current() });
    },
  });
}
