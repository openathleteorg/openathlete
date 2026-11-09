import { m } from '@/paraglide/messages';

import type { CreateWorkoutStepDto, SEOPlanData } from '@openathlete/shared';

import { formatPace } from './catalog';

type PlanSession =
  SEOPlanData['cycles'][number]['weeks'][number]['sessions'][number];

/**
 * A step target as the plan page shows it: a share of VMA (`metricType`
 * 'VMA', 0.95 = 95%) or an absolute pace, stored as a speed range in m/s.
 */
export type SessionTarget =
  { kind: 'vma'; min: number; max: number } | { kind: 'pace'; seconds: number };

function stepTargets(step: CreateWorkoutStepDto): SessionTarget[] {
  const own = (step.targets ?? []).flatMap((target): SessionTarget[] => {
    if (target.targetType !== 'PACE') return [];
    const min = target.targetMin ?? target.targetValue;
    const max = target.targetMax ?? target.targetValue;
    if (min == null || max == null) return [];
    if (target.metricType === 'VMA') return [{ kind: 'vma', min, max }];
    if (target.metricType) return [];
    return [{ kind: 'pace', seconds: 1000 / ((min + max) / 2) }];
  });
  return [...own, ...(step.repeatBlock?.childSteps ?? []).flatMap(stepTargets)];
}

const keyOf = (target: SessionTarget) =>
  target.kind === 'vma'
    ? `vma:${target.min}:${target.max}`
    : `pace:${Math.round(target.seconds)}`;

/** The distinct targets of a session, in workout order. */
export function sessionTargets(session: PlanSession): SessionTarget[] {
  const seen = new Map<string, SessionTarget>();
  const steps = session.workout?.steps ?? [];
  // Warm-ups and cool-downs are easy running: their target is noise next to
  // the main set
  const main = steps.filter(
    (step) => step.stepType !== 'WARMUP' && step.stepType !== 'COOLDOWN',
  );
  for (const step of main.length ? main : steps) {
    for (const target of stepTargets(step)) {
      if (!seen.has(keyOf(target))) seen.set(keyOf(target), target);
    }
  }
  return [...seen.values()];
}

/** The distinct VMA bands of a whole plan, easiest first. */
export function planBands(data: SEOPlanData): { min: number; max: number }[] {
  const bands = new Map<string, { min: number; max: number }>();
  for (const session of data.cycles.flatMap((c) =>
    c.weeks.flatMap((w) => w.sessions),
  )) {
    for (const target of sessionTargets(session)) {
      if (target.kind === 'vma') bands.set(keyOf(target), target);
    }
  }
  return [...bands.values()].sort((a, b) => a.min - b.min || a.max - b.max);
}

const pc = (share: number) => String(Math.round(share * 100));

export function targetLabel(target: SessionTarget): string {
  return target.kind === 'vma'
    ? m.tplan_target_vma({ min: pc(target.min), max: pc(target.max) })
    : m.tplan_target_goal({ pace: formatPace(target.seconds) });
}

/** What the generator uses each band for (scripts/training-plans). */
export function bandUse({ min, max }: { min: number; max: number }) {
  const uses: Record<string, () => string> = {
    '60-66': m.tplan_zone_recovery,
    '62-70': m.tplan_zone_easy,
    '80-84': m.tplan_zone_tempo,
    '85-88': m.tplan_zone_threshold,
    '92-97': m.tplan_zone_vmalong,
    '95-100': m.tplan_zone_vma,
    '100-105': m.tplan_zone_vmashort,
  };
  return uses[`${pc(min)}-${pc(max)}`]?.() ?? '';
}

/** Chip colours, from easy to hard. */
export function targetTone(target: SessionTarget): string {
  if (target.kind === 'pace') return 'bg-sky/15 text-sky-strong';
  if (target.min >= 0.92) return 'bg-coral/15 text-coral-strong';
  if (target.min >= 0.78) return 'bg-orchid/15 text-orchid-strong';
  return 'bg-mint/20 text-mint-strong';
}
