import { m } from '@/paraglide/messages';

import { WORKOUT_STEP_TYPE } from '@openathlete/shared';

/** Short step type names, as the builder rows and the player show them */
export function stepTypeLabel(type: WORKOUT_STEP_TYPE): string {
  switch (type) {
    case WORKOUT_STEP_TYPE.WARMUP:
      return m.builder_type_warmup();
    case WORKOUT_STEP_TYPE.INTERVAL_ACTIVE:
      return m.builder_type_active();
    case WORKOUT_STEP_TYPE.INTERVAL_REST:
      return m.builder_type_rest();
    case WORKOUT_STEP_TYPE.COOLDOWN:
      return m.builder_type_cooldown();
    case WORKOUT_STEP_TYPE.FREE:
      return m.builder_type_free();
    case WORKOUT_STEP_TYPE.REPEAT:
      return m.builder_type_repeat();
    default:
      return m.builder_type_steady();
  }
}
