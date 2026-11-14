import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';

import type { TrainingPlanContent } from '@openathlete/shared';

type PlanWeek = TrainingPlanContent['cycles'][number]['weeks'][number];

/** A day as the API reads it: YYYY-MM-DD, as the user's calendar shows it */
export function toDateKey(date: Date | string): string {
  const day = new Date(date);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** A YYYY-MM-DD day in the user's language, whatever their time zone */
export function formatDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(
    getDateLocale(getLocale()),
    { day: 'numeric', month: 'short', year: 'numeric' },
  );
}

/** 0 = Sunday … 6 = Saturday, as the plans count them */
export function weekdayName(dayOfWeek: number): string {
  // 4 January 1970 was a Sunday
  return new Date(1970, 0, 4 + dayOfWeek).toLocaleDateString(
    getDateLocale(getLocale()),
    { weekday: 'short' },
  );
}

/** The weeks of a plan in order, numbered through its cycles */
export function weeksOf(
  content: TrainingPlanContent,
): { number: number; cycleName: string; week: PlanWeek }[] {
  let number = 0;
  return content.cycles.flatMap((cycle) =>
    cycle.weeks.map((week) => ({
      number: ++number,
      cycleName: cycle.name,
      week,
    })),
  );
}

/** Sessions of a week from Monday to Sunday */
export function sessionsInOrder(week: PlanWeek): PlanWeek['sessions'] {
  const fromMonday = (dayOfWeek: number) => (dayOfWeek + 6) % 7;
  return [...week.sessions].sort(
    (a, b) => fromMonday(a.dayOfWeek) - fromMonday(b.dayOfWeek),
  );
}

export function planFileName(name: string): string {
  const slug =
    name
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'plan';
  return `${slug}.json`;
}

export function athleteName(athlete: {
  user?: { firstName?: string | null; lastName?: string | null } | null;
}): string {
  return `${athlete.user?.firstName ?? ''} ${athlete.user?.lastName ?? ''}`.trim();
}
