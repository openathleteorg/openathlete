import { SUPPORTED_LOCALES, type SupportedLocale } from '@/utils/locales';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

import type { SEOPlanData } from '@openathlete/shared';

import { DISTANCE_ORDER, type RunningDistance, runningPlanSpec } from './specs';

export type PlanSport = 'running' | 'trail' | 'triathlon';

export interface PlanEntry {
  sport: PlanSport;
  distance: string;
  variant: string;
  /** Languages with a plan file of their own; the others show English. */
  locales: SupportedLocale[];
  path: string;
}

const PLANS_DIR = join(process.cwd(), 'src/lib/training-plans/plans');

/** Every plan with a JSON file, read from disk at build time. */
export function listPlans(): PlanEntry[] {
  const plans = new Map<string, PlanEntry>();
  if (!existsSync(PLANS_DIR)) return [];
  for (const sport of ['running', 'trail', 'triathlon'] as const) {
    const dir = join(PLANS_DIR, sport);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      // {distance}-{variant}.{locale}.json, e.g. marathon-4h30.fr.json
      const match = file.match(
        /^(.+)-([^-]+?)\.([a-z]{2}(?:-[a-z]{2})?)\.json$/i,
      );
      if (!match) continue;
      const [, distance, variant, rawLocale] = match;
      const locale = rawLocale.toLowerCase();
      const key = `${sport}/${distance}/${variant}`;
      const entry = plans.get(key) ?? {
        sport,
        distance,
        variant,
        locales: [],
        path: `/training-plans/${key}`,
      };
      if (
        SUPPORTED_LOCALES.includes(locale as SupportedLocale) &&
        !entry.locales.includes(locale as SupportedLocale)
      ) {
        entry.locales.push(locale as SupportedLocale);
      }
      plans.set(key, entry);
    }
  }
  return [...plans.values()]
    .filter((plan) => plan.locales.includes('en'))
    .map((plan) => ({
      ...plan,
      locales: SUPPORTED_LOCALES.filter((l) => plan.locales.includes(l)),
    }));
}

/** Shortest race first, then fastest goal first. */
function planOrder(plan: PlanEntry): [number, number] {
  const distance = DISTANCE_ORDER.indexOf(plan.distance as RunningDistance);
  const spec = runningPlanSpec(plan.distance, plan.variant);
  return [
    distance === -1 ? DISTANCE_ORDER.length : distance,
    spec?.goalSeconds ?? Infinity,
  ];
}

export function plansFor(sport: PlanSport): PlanEntry[] {
  return listPlans()
    .filter((plan) => plan.sport === sport)
    .sort((a, b) => {
      const [da, ta] = planOrder(a);
      const [db, tb] = planOrder(b);
      return da - db || ta - tb || a.variant.localeCompare(b.variant);
    });
}

/** Facts shown in plan lists and headers. */
export function planStats(data: SEOPlanData) {
  const weeks = data.cycles.flatMap((cycle) => cycle.weeks);
  const weeklyKm = weeks.map(
    (week) =>
      week.sessions.reduce((sum, s) => sum + (s.goalDistance ?? 0), 0) / 1000,
  );
  const runs = Math.max(...weeks.map((week) => week.sessions.length));
  const paceSeconds =
    data.plan.timeTarget && data.plan.distance
      ? data.plan.timeTarget / (data.plan.distance / 1000)
      : null;
  return {
    weeks: data.plan.duration,
    runs,
    weeklyKm,
    // The last week holds the race: the biggest training week is the figure
    peakKm: Math.round(
      Math.max(...(weeklyKm.length > 1 ? weeklyKm.slice(0, -1) : weeklyKm)),
    ),
    paceSeconds,
  };
}

/** "4h00" from 14400 seconds, "50 min" under an hour. */
export function formatGoalTime(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  const min = Math.round((seconds % 3600) / 60);
  return `${h}h${String(min).padStart(2, '0')}`;
}

export function formatPace(seconds: number): string {
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}
