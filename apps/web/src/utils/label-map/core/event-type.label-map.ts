import { m } from '@/paraglide/messages';

import { EVENT_TYPE } from '@openathlete/shared';

export const eventTypeLabelMap: Record<EVENT_TYPE, string> = {
  [EVENT_TYPE.TRAINING]: m.training(),
  [EVENT_TYPE.COMPETITION]: m.competition(),
  [EVENT_TYPE.NOTE]: m.note(),
  [EVENT_TYPE.ACTIVITY]: m.activity(),
  [EVENT_TYPE.QUESTIONNAIRE]: m.questionnaire(),
};
