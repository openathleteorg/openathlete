import { m } from '@/paraglide/messages';

import { PLAN_LEVEL } from '@openathlete/shared';

/** The select's value for a plan without a level */
export const NO_LEVEL = 'NONE';

export function planLevelLabel(level: PLAN_LEVEL): string {
  return {
    [PLAN_LEVEL.BEGINNER]: m.training_plans_level_beginner(),
    [PLAN_LEVEL.INTERMEDIATE]: m.training_plans_level_intermediate(),
    [PLAN_LEVEL.ADVANCED]: m.training_plans_level_advanced(),
  }[level];
}
