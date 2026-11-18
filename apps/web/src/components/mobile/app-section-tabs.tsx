import { useGetMyCoachesQuery } from '@/api/athlete';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { coachedAthleteId, sectionOf } from './app-navigation';

const OWN_SECTIONS = ['statistics', 'records', 'metrics'];
/** An athlete with a coach also finds their questionnaires there */
const COACHED_SECTIONS = [...OWN_SECTIONS, 'my-questionnaires'];

/**
 * Switches between the sections of one tab: Statistics, Records and Metrics,
 * or everything a coach can see of an athlete.
 */
export function AppSectionTabs() {
  const { pathname } = useLocation();
  const athleteId = coachedAthleteId(pathname);
  const { data: coaches } = useGetMyCoachesQuery();
  const own = coaches?.length ? COACHED_SECTIONS : OWN_SECTIONS;
  const labels: Record<string, string> = {
    calendar: m.calendar(),
    summary: m.dashboard(),
    statistics: m.statistics(),
    records: m.records(),
    metrics: m.metrics(),
    notes: m.coach_notes(),
    questionnaires: m.questionnaires(),
    'my-questionnaires': m.questionnaires(),
    settings: m.settings(),
  };
  const sections = athleteId
    ? [
        'summary',
        'calendar',
        ...OWN_SECTIONS,
        'questionnaires',
        'notes',
        'settings',
      ]
    : own;
  const nav = useRef<HTMLElement>(null);
  // The row scrolls: the current section stays in sight, even the last one
  useEffect(() => {
    nav.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [pathname, sections.length]);
  if (!athleteId && !own.includes(sectionOf(pathname) ?? '')) {
    return null;
  }

  return (
    <nav
      ref={nav}
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
