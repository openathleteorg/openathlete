import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import { NavLink, useLocation } from 'react-router-dom';

import { coachedAthleteId, sectionOf } from './app-navigation';

const OWN_SECTIONS = ['statistics', 'records', 'metrics'];

/**
 * Switches between the sections of one tab: Statistics, Records and Metrics,
 * or everything a coach can see of an athlete.
 */
export function AppSectionTabs() {
  const { pathname } = useLocation();
  const athleteId = coachedAthleteId(pathname);
  const labels: Record<string, string> = {
    calendar: m.calendar(),
    summary: m.dashboard(),
    statistics: m.statistics(),
    records: m.records(),
    metrics: m.metrics(),
    settings: m.settings(),
  };
  const sections = athleteId
    ? ['summary', 'calendar', ...OWN_SECTIONS, 'settings']
    : OWN_SECTIONS;
  if (!athleteId && !OWN_SECTIONS.includes(sectionOf(pathname) ?? '')) {
    return null;
  }

  return (
    <nav
      aria-label={labels[sectionOf(pathname) ?? '']}
      className="scrollbar-hide flex gap-1.5 overflow-x-auto px-4 pb-2"
    >
      {sections.map((section) => (
        <NavLink
          key={section}
          to={
            athleteId
              ? `${getPath(['dashboard', section])}/${athleteId}`
              : getPath(['dashboard', section])
          }
          replace
          className={({ isActive }) =>
            cn(
              'flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground',
            )
          }
        >
          {labels[section]}
        </NavLink>
      ))}
    </nav>
  );
}
