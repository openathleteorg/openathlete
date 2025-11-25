import { WORKOUT_TARGET_TYPE } from '../types/misc';
import { METRIC_TYPE } from '../types/misc/core/metric-type.enum';

export const targetMetricMap: Record<WORKOUT_TARGET_TYPE, METRIC_TYPE[]> = {
  [WORKOUT_TARGET_TYPE.HEARTRATE]: [
    METRIC_TYPE.HR_MAX,
    METRIC_TYPE.HR_REST,
    METRIC_TYPE.HR_RESERVE,
  ],
  [WORKOUT_TARGET_TYPE.PACE]: [
    METRIC_TYPE.VMA,
    METRIC_TYPE.CRITICAL_POWER_RUNNING,
  ],
  [WORKOUT_TARGET_TYPE.POWER]: [
    METRIC_TYPE.FTP_RUNNING,
    METRIC_TYPE.FTP_CYCLING,
    METRIC_TYPE.CRITICAL_POWER_CYCLING,
  ],
  [WORKOUT_TARGET_TYPE.CADENCE]: [],
  [WORKOUT_TARGET_TYPE.RPE]: [],
  [WORKOUT_TARGET_TYPE.WEIGHT]: [],
  [WORKOUT_TARGET_TYPE.ZONE]: [],
  [WORKOUT_TARGET_TYPE.OPEN]: [],
};

export function getCompatibleMetrics(
  targetType: WORKOUT_TARGET_TYPE,
): METRIC_TYPE[] {
  return targetMetricMap[targetType] || [];
}

export function isMetricCompatibleWithTarget(
  metricType: METRIC_TYPE,
  targetType: WORKOUT_TARGET_TYPE,
): boolean {
  const compatibleMetrics = getCompatibleMetrics(targetType);
  return compatibleMetrics.includes(metricType);
}
