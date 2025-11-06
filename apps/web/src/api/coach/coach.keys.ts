export const coachKeys = {
  all: ['coach'] as const,
  dashboard: (start?: string, end?: string) =>
    [...coachKeys.all, 'dashboard', start || 'auto', end || 'auto'] as const,
};


