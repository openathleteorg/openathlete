import { m } from '@/paraglide/messages';

import type {
  AmrapMoment,
  Moment,
  UnitSystem,
  WorkMoment,
} from '@openathlete/shared';
import {
  M_TO_YD,
  WORKOUT_DURATION_TYPE,
  WORKOUT_REPEAT_KIND,
  toUnitWeight,
} from '@openathlete/shared';

import { stepTypeLabel } from '../session-builder/step-type-label';
import { groupKindLabel } from '../strength/strength-labels';

/** "1 min 30", "45 s": a length to say or show */
export function spokenSeconds(seconds: number): string {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes === 0) return m.player_seconds({ count: rest });
  if (rest === 0) return m.player_minutes({ count: minutes });
  return m.player_minutes_seconds({ minutes, seconds: rest });
}

/** 1:05 on the clock */
export function clock(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** What to do, in words: "8 reps at 60 kg", "45 s" */
export function workText(
  moment: WorkMoment,
  unitSystem: UnitSystem = 'METRIC',
): string {
  const work = moment.work;
  const load = moment.load
    ? (() => {
        const w = toUnitWeight(moment.load, unitSystem);
        return ` · ${w.value} ${w.unit}`;
      })()
    : '';
  if (work.type === 'open') return '';
  switch (work.type) {
    case WORKOUT_DURATION_TYPE.REPS:
      return `${m.player_reps({ count: work.value })}${load}`;
    case WORKOUT_DURATION_TYPE.TIME:
      return `${spokenSeconds(work.value)}${load}`;
    default:
      return unitSystem === 'IMPERIAL'
        ? `${Math.round(work.value * M_TO_YD)} yd${load}`
        : `${work.value} m${load}`;
  }
}

/** Where the athlete is: "Set 2 of 4", "Round 1 of 3 · Superset" */
export function positionText(moment: WorkMoment): string {
  if (moment.stepType) return stepTypeLabel(moment.stepType);
  if (moment.round !== null && moment.rounds !== null && moment.group) {
    const kind =
      moment.group === WORKOUT_REPEAT_KIND.REPEAT
        ? ''
        : ` · ${groupKindLabel(moment.group)}`;
    return `${m.player_round({ round: moment.round, rounds: moment.rounds })}${kind}`;
  }
  return m.player_set({ set: moment.set, sets: moment.sets });
}

/** What the voice says on entering a moment */
export function announcement(
  moment: Moment,
  next: WorkMoment | AmrapMoment | null,
  unitSystem: UnitSystem = 'METRIC',
): string {
  if (moment.kind === 'rest') {
    const after =
      next?.kind === 'work' ? ` ${m.player_say_next({ name: next.name })}` : '';
    return `${m.player_say_rest({ length: spokenSeconds(moment.seconds) })}.${after}`;
  }
  if (moment.kind === 'amrap') {
    return m.player_say_amrap({ length: spokenSeconds(moment.seconds) });
  }
  const what = workText(moment, unitSystem);
  return what ? `${moment.name}. ${what}.` : `${moment.name}.`;
}
