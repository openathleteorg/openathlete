import { m } from '@/paraglide/messages';

import { RECORD_TYPE } from '@openathlete/shared';

export const recordTypeLabelMap: Record<RECORD_TYPE, string> = {
  [RECORD_TYPE.SPEED]: m.speed(),
  [RECORD_TYPE.POWER]: m.power(),
  [RECORD_TYPE.HEARTRATE]: m.heart_rate(),
  [RECORD_TYPE.ELEVATION_GAIN]: m.elevation_gain(),
  [RECORD_TYPE.ELEVATION_LOSS]: m.elevation_loss(),
  [RECORD_TYPE.CADENCE]: m.cadence(),
  [RECORD_TYPE.VERTICAL_SPEED]: m.records_vertical_speed(),
};
