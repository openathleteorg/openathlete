import { m } from '@/paraglide/messages';

import type { StrengthSet } from '@openathlete/shared';
import { WORKOUT_DURATION_TYPE, sameSet } from '@openathlete/shared';

import { formatSeconds, formatWork } from './strength-input';

const workLabel = (set: StrengthSet) =>
  set.work.type === WORKOUT_DURATION_TYPE.REPS
    ? String(set.work.value)
    : formatWork(set.work);

/** "4 × 8 · 60 kg · rest 2'", or "10 / 8 / 6 · 60–70 kg" for a pyramid */
export function setsSummary(sets: StrengthSet[]): string {
  const [first] = sets;
  if (!first) return '';
  const loads = sets
    .map((set) => set.load)
    .filter((load): load is number => load !== null);
  const load = loads.length
    ? Math.min(...loads) === Math.max(...loads)
      ? `${loads[0]} kg`
      : `${Math.min(...loads)}–${Math.max(...loads)} kg`
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
    ? `${sets.length} × ${workLabel(first)}`
    : sets.map(workLabel).join(' / ');
  return [work, load, rest].filter(Boolean).join(' · ');
}
