export const subscriptionKeys = {
  all: ['subscription'] as const,
  current: () => [...subscriptionKeys.all, 'current'] as const,
  supporters: () => [...subscriptionKeys.all, 'supporters'] as const,
  badges: (userIds: readonly number[]) =>
    [...subscriptionKeys.all, 'badges', ...userIds] as const,
  invoices: () => [...subscriptionKeys.all, 'invoices'] as const,
  portal: () => [...subscriptionKeys.all, 'portal'] as const,
};
