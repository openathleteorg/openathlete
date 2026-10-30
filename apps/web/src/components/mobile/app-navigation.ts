import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import {
  CalendarDays,
  House,
  type LucideIcon,
  MessageCircle,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';

import { UserRole } from '@openathlete/shared';

export interface AppTab {
  id: string;
  label: () => string;
  icon: LucideIcon;
  path: string;
  /** Sections of the URL (/dashboard/<section>) that belong to this tab */
  sections: string[];
}

const calendar: AppTab = {
  id: 'calendar',
  label: m.calendar,
  icon: CalendarDays,
  path: getPath(['dashboard', 'calendar']),
  sections: ['calendar'],
};

const conversations: AppTab = {
  id: 'coach',
  label: m.nav_tab_coach,
  icon: MessageCircle,
  path: getPath(['dashboard', 'messages']),
  sections: ['messages'],
};

const me: AppTab = {
  id: 'me',
  label: m.nav_tab_me,
  icon: UserRound,
  path: getPath(['dashboard', 'profile']),
  sections: ['profile', 'settings'],
};

const ATHLETE_TABS: AppTab[] = [
  {
    id: 'today',
    label: m.nav_tab_today,
    icon: House,
    path: getPath(['dashboard', 'today']),
    sections: ['today'],
  },
  calendar,
  {
    id: 'progress',
    label: m.nav_tab_progress,
    icon: TrendingUp,
    path: getPath(['dashboard', 'statistics']),
    sections: ['statistics', 'records', 'metrics'],
  },
  conversations,
  me,
];

const COACH_TABS: AppTab[] = [
  {
    id: 'athletes',
    label: m.athletes,
    icon: Users,
    path: getPath(['dashboard', 'coach']),
    sections: ['coach', 'summary'],
  },
  calendar,
  { ...conversations, label: m.messages },
  me,
];

export function getAppTabs(space: UserRole | undefined): AppTab[] {
  return space === 'COACH' ? COACH_TABS : ATHLETE_TABS;
}

export function sectionOf(pathname: string): string | undefined {
  return pathname.split('/')[2];
}

export function findTab(tabs: AppTab[], pathname: string) {
  const section = sectionOf(pathname);
  return tabs.find((tab) => section && tab.sections.includes(section));
}

/** An athlete a coach is looking at: /dashboard/<section>/<athleteId> */
export function coachedAthleteId(pathname: string): string | undefined {
  return /^\/dashboard\/(?:calendar|statistics|records|metrics|settings|summary)\/(\d+)$/.exec(
    pathname,
  )?.[1];
}

/** Screens a user lands on from a tab, without a way back. */
export function isTabRoot(tabs: AppTab[], pathname: string) {
  if (coachedAthleteId(pathname)) return false;
  const section = sectionOf(pathname);
  return (
    pathname.split('/').length === 3 &&
    // Each settings page is pushed from the Me tab
    section !== 'settings' &&
    tabs.some((tab) => section && tab.sections.includes(section))
  );
}

export function screenTitle(pathname: string): string {
  const titles: Record<string, () => string> = {
    today: m.nav_tab_today,
    calendar: m.calendar,
    statistics: m.nav_tab_progress,
    records: m.nav_tab_progress,
    metrics: m.nav_tab_progress,
    settings: m.settings,
    messages: m.messages,
    profile: m.nav_tab_me,
    coach: m.athletes,
    summary: m.dashboard,
  };
  return titles[sectionOf(pathname) ?? '']?.() ?? 'OpenAthlete';
}
