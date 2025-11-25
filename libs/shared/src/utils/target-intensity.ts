import type { WorkoutStepTargetDto } from '../types/dtos/core/workout.dto';
import { METRIC_TYPE } from '../types/misc/core/metric-type.enum';
import { kmhToSpeedMs } from './workout.utils';

const DEFAULT_METRIC_VALUES: Record<string, number> = {
  [METRIC_TYPE.VMA]: 15.0, // km/h - average VMA (~4:00 min/km pace)
  [METRIC_TYPE.FTP_RUNNING]: 275, // W - average running FTP
  [METRIC_TYPE.FTP_CYCLING]: 225, // W - average cycling FTP
  [METRIC_TYPE.CRITICAL_POWER_RUNNING]: 275, // W - same as FTP_RUNNING
  [METRIC_TYPE.CRITICAL_POWER_CYCLING]: 225, // W - same as FTP_CYCLING
  [METRIC_TYPE.HR_MAX]: 190, // bpm - average max heart rate
  [METRIC_TYPE.HR_REST]: 60, // bpm - average resting heart rate
  [METRIC_TYPE.HR_RESERVE]: 130, // bpm - average HR reserve (HR_MAX - HR_REST)
};

/**
 * Get the absolute intensity value for a target, converting from percentage if metricType is set
 * @param target - The workout step target
 * @param metrics - Record of metric types to their values
 * @param sport - Optional sport type (for sport-specific metrics like FTP_RUNNING vs FTP_CYCLING)
 * @returns The absolute intensity value, or null if cannot be determined
 */
export function getTargetIntensity(
  target: WorkoutStepTargetDto,
  metrics: Record<string, { value: number } | number> | undefined,
): {
  value: number | null;
  min: number | null;
  max: number | null;
} {
  if (!target || target.targetType === 'OPEN') {
    return { value: null, min: null, max: null };
  }

  // Helper to get metric value with fallback to defaults
  const getMetricValue = (
    metricType: string | null | undefined,
  ): number | null => {
    if (!metricType) return null;

    // Try to get from provided metrics
    if (metrics) {
      const metric = metrics[metricType];
      if (metric !== undefined && metric !== null) {
        return typeof metric === 'number' ? metric : metric.value;
      }
    }

    // Fallback to default value if available
    const defaultValue = DEFAULT_METRIC_VALUES[metricType];
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    return null;
  };

  // Helper to convert percentage (0-1) to absolute value
  const convertToAbsolute = (
    percentage: number | null | undefined,
    metricType: string | null | undefined,
  ): number | null => {
    if (percentage === null || percentage === undefined) return null;
    if (!metricType) return percentage;

    const metricValue = getMetricValue(metricType);
    if (metricValue === null) return null;

    return percentage * metricValue;
  };

  const { targetValue, targetMin, targetMax, metricType } = target;

  // Convert values from percentage to absolute if metricType is set
  const absoluteValue = metricType
    ? convertToAbsolute(targetValue, metricType)
    : (targetValue ?? null);

  const absoluteMin = metricType
    ? convertToAbsolute(targetMin, metricType)
    : (targetMin ?? null);

  const absoluteMax = metricType
    ? convertToAbsolute(targetMax, metricType)
    : (targetMax ?? null);

  // Special handling for PACE: if metricType is VMA, convert from km/h to m/s
  const convertKmHToMs = (value: number | null | undefined): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return kmhToSpeedMs(value);
  };

  if (target.targetType === 'PACE' && metricType === METRIC_TYPE.VMA) {
    return {
      value: convertKmHToMs(absoluteValue),
      min: convertKmHToMs(absoluteMin),
      max: convertKmHToMs(absoluteMax),
    };
  }

  return {
    value: absoluteValue,
    min: absoluteMin,
    max: absoluteMax,
  };
}
