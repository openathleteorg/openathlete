import { m } from '@/paraglide/messages';

import type { StrengthSet, UnitSystem } from '@openathlete/shared';
import {
  WORKOUT_DURATION_TYPE,
  sameSet,
  toUnitWeight,
} from '@openathlete/shared';

import { formatSeconds, formatWork } from './strength-input';

const workLabel = (set: StrengthSet, unitSystem: UnitSystem) =>
  set.work.type === WORKOUT_DURATION_TYPE.REPS
    ? String(set.work.value)
    : formatWork(set.work, unitSystem);

/** "4 × 8 · 60 kg · rest 2'", or "10 / 8 / 6 · 60–70 kg" for a pyramid */
export function setsSummary(
  sets: StrengthSet[],
  unitSystem: UnitSystem = 'METRIC',
): string {
  const [first] = sets;
  if (!first) return '';
  const loads = sets
    .map((set) => set.load)
    .filter((load): load is number => load !== null);
  const load = loads.length
    ? (() => {
        const min = toUnitWeight(Math.min(...loads), unitSystem);
        const max = toUnitWeight(Math.max(...loads), unitSystem);
        return min.value === max.value
          ? `${min.value} ${min.unit}`
          : `${min.value}–${max.value} ${max.unit}`;
      })()
    : null;
  const rests = sets
    .map((set) => set.rest)
    .filter((rest): rest is number => !!rest);
  const rest = rests.length
    ? `${m.strength_rest()} ${formatSeconds(Math.max(...rests))}`
    : null;
  const work = sets.every((set) =>
    sameSet({ ...set, rest: null }, { ...first, rest: null }),
  )
    ? `${sets.length} × ${workLabel(first, unitSystem)}`
    : sets.map((set) => workLabel(set, unitSystem)).join(' / ');
  return [work, load, rest].filter(Boolean).join(' · ');
}
