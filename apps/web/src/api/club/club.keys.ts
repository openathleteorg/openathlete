export const clubKeys = {
  all: ['club'] as const,
  mine: ['club', 'mine'] as const,
  detail: (clubId: number) => ['club', 'detail', clubId] as const,
  joinLinks: (clubId: number) => ['club', 'join-links', clubId] as const,
  joinInfo: (token: string) => ['club', 'join-info', token] as const,
};

export const athleteGroupKeys = {
  all: ['athlete-groups'] as const,
  /** clubId null: the coach's own groups */
  list: (clubId: number | null) => ['athlete-groups', clubId] as const,
};
