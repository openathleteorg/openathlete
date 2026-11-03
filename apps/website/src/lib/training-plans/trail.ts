import { m } from '@/paraglide/messages';
import type { SupportedLocale } from '@/utils/locales';

import type { PlanSession, SEOPlanData } from '@openathlete/shared';

import { type PlanEntry, plansFor } from './catalog';

/**
 * Trail plans are named by distance and climbing (`30km/1000m`), not by a
 * finish time: these helpers give the facts the trail pages show.
 */

/** "30 km" from the `30km` slug. */
export function trailDistanceLabel(distance: string): string {
  return distance.replace(/^(\d+)km$/, '$1 km');
}

/** 1,000 in English; plain digits elsewhere, as people search "1000 D+". */
export function formatDplus(locale: SupportedLocale, metres: number): string {
  return locale === 'en' ? metres.toLocaleString('en') : String(metres);
}

/** "45 min", "2h30". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const min = minutes % 60;
  return min ? `${h}h${String(min).padStart(2, '0')}` : `${h}h`;
}

/** Rep lengths as runners write them: 30", 2', 1'30. */
export function formatRep(seconds: number): string {
  if (seconds < 60) return `${seconds}"`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec ? `${min}'${String(sec).padStart(2, '0')}` : `${min}'`;
}

const isRace = (data: SEOPlanData, session: PlanSession) =>
  session.goalDistance === data.plan.distance;
const isRun = (session: PlanSession) => session.sport !== 'STRENGTH';

export function trailStats(data: SEOPlanData) {
  const weeks = data.cycles.flatMap((cycle) => cycle.weeks);
  const weeklyKm = weeks.map(
    (week) =>
      week.sessions.reduce((sum, s) => sum + (s.goalDistance ?? 0), 0) / 1000,
  );
  const weeklyDplus = weeks.map((week) =>
    week.sessions.reduce((sum, s) => sum + (s.goalElevationGain ?? 0), 0),
  );
  const runs = weeks.map((week) => week.sessions.filter(isRun).length);
  // The biggest training week, race week aside
  const training = weeks
    .map((week, index) => ({ week, index }))
    .filter(({ week }) => !week.sessions.some((s) => isRace(data, s)));
  const peak = training.reduce((best, current) =>
    weeklyDplus[current.index] > weeklyDplus[best.index] ? current : best,
  );
  const longest = weeks
    .flatMap((week) => week.sessions)
    .filter((s) => isRun(s) && !isRace(data, s))
    .reduce((best, s) =>
      (s.goalDuration ?? 0) > (best.goalDuration ?? 0) ? s : best,
    );
  return {
    weeks: data.plan.duration,
    runsMin: Math.min(...runs),
    runsMax: Math.max(...runs),
    hasStrength: weeks.some((week) => week.sessions.some((s) => !isRun(s))),
    weeklyKm,
    weeklyDplus,
    peakKm: Math.round(weeklyKm[peak.index]),
    peakDplus: weeklyDplus[peak.index],
    longestMinutes: Math.round((longest.goalDuration ?? 0) / 60),
    longestDplus: longest.goalElevationGain ?? 0,
    raceDplus:
      data.plan.elevationGainRange?.max && data.plan.elevationGainRange.min
        ? Math.round(
            (data.plan.elevationGainRange.min +
              data.plan.elevationGainRange.max) /
              2,
          )
        : 0,
  };
}

export function runsLabel(stats: ReturnType<typeof trailStats>): string {
  return stats.runsMin === stats.runsMax
    ? String(stats.runsMin)
    : `${stats.runsMin}–${stats.runsMax}`;
}

/** Values for the trail page title, description and H1. */
export function trailTitleValues(
  locale: SupportedLocale,
  distance: string,
  data: SEOPlanData,
) {
  const stats = trailStats(data);
  return {
    distance: trailDistanceLabel(distance),
    dplus: formatDplus(locale, stats.raceDplus),
    weeks: String(stats.weeks),
  };
}

/** Trail plans from the shortest race to the longest. */
export function trailPlans(): PlanEntry[] {
  return plansFor('trail').sort(
    (a, b) => parseInt(a.distance, 10) - parseInt(b.distance, 10),
  );
}

// ---------------------------------------------------------------------------
// Readable targets
// ---------------------------------------------------------------------------

type Step = NonNullable<PlanSession['workout']>['steps'][number];
type Target = NonNullable<Step['targets']>[number];

const pct = (value: number | null | undefined) =>
  Math.round((value ?? 0) * 100);

export function targetLabel(target: Target | undefined): string | null {
  if (!target) return null;
  const range =
    target.targetMin != null && target.targetMax != null
      ? `${pct(target.targetMin)}–${pct(target.targetMax)}`
      : String(pct(target.targetValue));
  if (target.targetType === 'PACE' && target.metricType === 'VMA')
    return m.trailplan_t_vma({ range });
  if (target.targetType === 'HEARTRATE' && target.metricType === 'HR_MAX')
    return m.trailplan_t_hr({ range });
  if (target.targetType === 'RPE' && target.targetValue != null)
    return m.trailplan_t_rpe({ value: String(target.targetValue) });
  return null;
}

/**
 * The main sets of a structured session in a line each, warm-up and
 * cool-down left out: `8 × 2'` with `90–95% max HR`.
 */
export function sessionTargets(
  session: PlanSession,
): { what: string; target: string | null }[] {
  const items: { what: string; target: string | null }[] = [];
  for (const step of session.workout?.steps ?? []) {
    if (step.stepType === 'WARMUP' || step.stepType === 'COOLDOWN') continue;
    if (step.repeatBlock) {
      const active = step.repeatBlock.childSteps.find(
        (child) => child.stepType === 'INTERVAL_ACTIVE',
      );
      if (!active) continue;
      items.push({
        what: `${step.repeatBlock.repetitions} × ${formatRep(active.durationValue ?? 0)}`,
        target: targetLabel(active.targets?.[0]),
      });
    } else if (step.stepType === 'STEADY') {
      items.push({
        what: formatMinutes(Math.round((step.durationValue ?? 0) / 60)),
        target: targetLabel(step.targets?.[0]),
      });
    }
  }
  // 2 identical sets of 30/30 read better as "2 × (8 × 30")"
  const grouped: typeof items = [];
  for (const item of items) {
    const key = `${item.what}|${item.target}`;
    const previous = grouped.at(-1);
    if (previous && previous.what.endsWith(`(${item.what})`)) {
      const count = parseInt(previous.what, 10) + 1;
      previous.what = `${count} × (${item.what})`;
    } else if (previous && `${previous.what}|${previous.target}` === key) {
      previous.what = `2 × (${item.what})`;
    } else {
      grouped.push({ ...item });
    }
  }
  return grouped;
}
