/** The pages a coach opens for one athlete, in the order of their tabs */
export const ATHLETE_PAGES = [
  'calendar',
  'statistics',
  'records',
  'metrics',
  'notes',
  'settings',
] as const;
export type AthletePage = (typeof ATHLETE_PAGES)[number];

const ATHLETE_ROUTE = new RegExp(
  `^/dashboard/(${[...ATHLETE_PAGES, 'progression'].join('|')})/(\\d+)/?$`,
);

/** The athlete and page a path shows, for a coach's athlete pages */
export function athleteRoute(
  pathname: string,
): { page: string; athleteId: number } | null {
  const match = pathname.match(ATHLETE_ROUTE);
  return match ? { page: match[1], athleteId: Number(match[2]) } : null;
}

export const athletePagePath = (page: AthletePage, athleteId: number) =>
  `/dashboard/${page}/${athleteId}`;
