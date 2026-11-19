import { m } from '@/paraglide/messages';
import { useMemo, useState } from 'react';

import { QUESTIONNAIRE_STATUS } from '@openathlete/shared';

export const PERIODS = [28, 91, 182, 365] as const;
export type Period = (typeof PERIODS)[number];

export const periodLabel = (days: Period) =>
  ({
    28: m.questionnaire_period_4_weeks(),
    91: m.questionnaire_period_3_months(),
    182: m.questionnaire_period_6_months(),
    365: m.questionnaire_period_12_months(),
  })[days];

/**
 * The span read: the last weeks or months up to the end of today, as ISO
 * instants stable for the day so the query key does not change each render.
 */
export function usePeriod(initial: Period = 91) {
  const [days, setDays] = useState<Period>(initial);
  const span = useMemo(() => {
    const to = new Date();
    to.setHours(24, 0, 0, 0);
    const from = new Date(to);
    from.setDate(from.getDate() - days);
    return {
      from,
      to,
      query: { from: from.toISOString(), to: to.toISOString() },
    };
  }, [days]);
  return { days, setDays, ...span };
}

export function statusLabel(status: QUESTIONNAIRE_STATUS) {
  switch (status) {
    case QUESTIONNAIRE_STATUS.ANSWERED:
      return m.questionnaire_answered();
    case QUESTIONNAIRE_STATUS.OPEN:
      return m.questionnaire_waiting();
    case QUESTIONNAIRE_STATUS.MISSED:
      return m.questionnaire_unanswered();
    case QUESTIONNAIRE_STATUS.UPCOMING:
      return m.questionnaire_upcoming();
  }
}
