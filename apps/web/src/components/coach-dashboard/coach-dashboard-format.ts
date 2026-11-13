import { formatMetricValue } from '@/components/metrics/metric-stats';
import { m } from '@/paraglide/messages';
import { metricTypeLabelMap } from '@/utils/label-map/core/metric-type.label-map';

import { CoachDashboardColumn, METRIC_TYPE } from '@openathlete/shared';
import { CoachAlertDto } from '@openathlete/shared';

/** One line a coach reads at a glance. */
export function alertText(alert: CoachAlertDto): string {
  switch (alert.type) {
    case 'pain':
      return m.coach_alert_pain({
        location: alert.location,
        score: Number(alert.painScore.toFixed(1)),
      });
    case 'inactive':
      return alert.days === null
        ? m.coach_alert_never_active()
        : m.coach_alert_inactive({ days: alert.days });
    case 'threshold': {
      const type = alert.metricType as METRIC_TYPE;
      const metric = metricTypeLabelMap[type] ?? alert.metricType;
      const value = formatMetricValue(type, alert.value);
      return alert.max !== null && alert.value > alert.max
        ? m.coach_alert_threshold_above({
            metric,
            value,
            bound: formatMetricValue(type, alert.max),
          })
        : m.coach_alert_threshold_below({
            metric,
            value,
            bound: formatMetricValue(type, alert.min ?? alert.value),
          });
    }
  }
}

export function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatMeters(meters: number): string {
  if (!meters) return '0 km';
  const km = meters / 1000;
  return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
}

/** The title of a dashboard column */
export function columnLabel(column: CoachDashboardColumn): string {
  switch (column) {
    case 'sessions':
      return m.coach_column_sessions();
    case 'volume':
      return m.coach_column_volume();
    case 'distance':
      return m.coach_column_distance();
    case 'form':
      return m.coach_column_form();
    case 'rpe':
      return m.coach_column_rpe();
    case 'lastActivity':
      return m.last_activity();
    default:
      return metricTypeLabelMap[column as METRIC_TYPE] ?? column;
  }
}

// Same thresholds as the API's training status (training-formulas.constants)
const TSB_OVERREACHING = -10;
const TSB_DETRAINING = 25;

/** How fresh the athlete is: tired, ready, or losing fitness. */
export function formTone(tsb: number): 'tired' | 'ready' | 'detraining' {
  if (tsb < TSB_OVERREACHING) return 'tired';
  if (tsb > TSB_DETRAINING) return 'detraining';
  return 'ready';
}
