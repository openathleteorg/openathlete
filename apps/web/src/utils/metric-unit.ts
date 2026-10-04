import { m } from '@/paraglide/messages';

import { METRIC_TYPE, metricUnitMap } from '@openathlete/shared';

/** Translate display units without changing stored values or API units. */
export function getMetricUnit(type: METRIC_TYPE): string {
  const unit = metricUnitMap[type];
  switch (unit) {
    case 'bpm':
      return m.bpm();
    case 'steps':
      return m.unit_steps();
    case 'floors':
      return m.unit_floors();
    case 'years':
      return m.unit_years();
    case 'breaths/min':
      return m.unit_breaths_per_minute();
    case 'pts':
      return m.unit_points();
    default:
      return unit;
  }
}
