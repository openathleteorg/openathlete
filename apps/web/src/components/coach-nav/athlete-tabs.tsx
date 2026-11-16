import { useGetMyCoachedAthletesQuery } from '@/api/athlete';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Link, useLocation } from 'react-router-dom';

import {
  ATHLETE_PAGES,
  AthletePage,
  athletePagePath,
  athleteRoute,
} from './athlete-route';

const label = (page: AthletePage) => {
  switch (page) {
    case 'calendar':
      return m.calendar();
    case 'statistics':
      return m.statistics();
    case 'records':
      return m.records();
    case 'metrics':
      return m.metrics();
    case 'notes':
      return m.coach_notes();
    case 'settings':
      return m.settings();
  }
};

/**
 * The pages of the athlete a coach is looking at, as tabs above them: one
 * line in the sidebar per athlete, and their six pages here.
 */
export function AthleteTabs() {
  const { pathname } = useLocation();
  const route = athleteRoute(pathname);
  const { data: athletes } = useGetMyCoachedAthletesQuery();
  if (!route) return null;
  const athlete = athletes?.find((a) => a.athleteId === route.athleteId);
  // Progression is part of statistics now
  const active = route.page === 'progression' ? 'statistics' : route.page;

  return (
    <nav
      aria-label={m.coach_nav_athlete_pages()}
      className="flex shrink-0 items-center gap-1 overflow-x-auto border-b px-4 pt-2 md:px-6"
      data-athlete-tabs
    >
      {athlete && (
        <span className="mr-2 shrink-0 truncate pb-2 text-sm font-semibold">
          {athlete.user?.firstName} {athlete.user?.lastName}
        </span>
      )}
      {ATHLETE_PAGES.map((page) => (
        <Link
          key={page}
          to={athletePagePath(page, route.athleteId)}
          aria-current={active === page ? 'page' : undefined}
          className={cn(
            '-mb-px shrink-0 border-b-2 px-3 pb-2 text-sm transition-colors',
            active === page
              ? 'border-primary font-medium text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {label(page)}
        </Link>
      ))}
    </nav>
  );
}
