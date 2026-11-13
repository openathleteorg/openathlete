export const coachJoinLinkKeys = {
  all: ['coach-join-link'] as const,
  mine: ['coach-join-link', 'mine'] as const,
  info: (token: string) => ['coach-join-link', 'info', token] as const,
};
