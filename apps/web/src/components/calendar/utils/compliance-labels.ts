import { m } from '@/paraglide/messages';

import { Compliance, ShownComplianceStatus } from './compliance';

export const complianceLabel: Record<ShownComplianceStatus, () => string> = {
  complete: m.calendar_compliance_complete,
  partial: m.calendar_compliance_partial,
  off: m.calendar_compliance_off,
  missed: m.calendar_compliance_missed,
};

export function complianceRatioLabel({ ratio, metric }: Compliance) {
  if (ratio === undefined || !metric) return null;
  const percent = Math.round(ratio * 100);
  return metric === 'duration'
    ? m.calendar_compliance_ratio_duration({ percent })
    : m.calendar_compliance_ratio_distance({ percent });
}
