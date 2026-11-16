export const coachKeys = {
  all: ['coach'] as const,
  dashboard: (start?: string, end?: string, compare = false) =>
    [
      ...coachKeys.all,
      'dashboard',
      start || 'auto',
      end || 'auto',
      compare,
    ] as const,
  thresholds: ['coach', 'thresholds'] as const,
  getPendingInvitations: ['coach', 'invitations', 'pending'] as const,
};
