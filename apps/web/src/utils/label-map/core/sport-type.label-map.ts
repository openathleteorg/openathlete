import { m } from '@/paraglide/messages';

import { SPORT_TYPE } from '@openathlete/shared';

export const sportTypeLabelMap: Record<SPORT_TYPE, string> = {
  [SPORT_TYPE.RUNNING]: m.sport_running(),
  [SPORT_TYPE.CYCLING]: m.cycling(),
  [SPORT_TYPE.SWIMMING]: m.swimming(),
  [SPORT_TYPE.TRAIL_RUNNING]: m.sport_trail_running(),
  [SPORT_TYPE.HIKING]: m.sport_hiking(),
  [SPORT_TYPE.ROCK_CLIMBING]: m.sport_rock_climbing(),
  [SPORT_TYPE.STRENGTH]: m.sport_strength(),
  [SPORT_TYPE.CROSSFIT]: m.sport_crossfit(),
  [SPORT_TYPE.YOGA]: m.sport_yoga(),
  [SPORT_TYPE.OTHER]: m.sport_other(),
};
