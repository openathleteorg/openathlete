export const subscriptionKeys = {
  all: ['subscription'] as const,
  current: () => [...subscriptionKeys.all, 'current'] as const,
  supporters: () => [...subscriptionKeys.all, 'supporters'] as const,
  invoices: () => [...subscriptionKeys.all, 'invoices'] as const,
  portal: () => [...subscriptionKeys.all, 'portal'] as const,
};
