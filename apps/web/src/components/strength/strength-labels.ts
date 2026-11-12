import { m } from '@/paraglide/messages';

import type { StrengthGroupKind } from '@openathlete/shared';
import { EXERCISE_SIDE, WORKOUT_REPEAT_KIND } from '@openathlete/shared';

export function groupKindLabel(kind: StrengthGroupKind): string {
  switch (kind) {
    case WORKOUT_REPEAT_KIND.CIRCUIT:
      return m.strength_group_circuit();
    case WORKOUT_REPEAT_KIND.EMOM:
      return 'EMOM';
    case WORKOUT_REPEAT_KIND.AMRAP:
      return 'AMRAP';
    case WORKOUT_REPEAT_KIND.TABATA:
      return 'Tabata';
    default:
      return m.strength_group_superset();
  }
}

export function groupKindHint(kind: StrengthGroupKind): string {
  switch (kind) {
    case WORKOUT_REPEAT_KIND.CIRCUIT:
      return m.strength_group_circuit_hint();
    case WORKOUT_REPEAT_KIND.EMOM:
      return m.strength_group_emom_hint();
    case WORKOUT_REPEAT_KIND.AMRAP:
      return m.strength_group_amrap_hint();
    case WORKOUT_REPEAT_KIND.TABATA:
      return m.strength_group_tabata_hint();
    default:
      return m.strength_group_superset_hint();
  }
}

export function sideLabel(side: EXERCISE_SIDE): string {
  switch (side) {
    case EXERCISE_SIDE.LEFT:
      return m.strength_side_left();
    case EXERCISE_SIDE.RIGHT:
      return m.strength_side_right();
    case EXERCISE_SIDE.ALTERNATE:
      return m.strength_side_alternate();
    default:
      return m.strength_side_each();
  }
}
