import type { WorkoutStepTargetDto } from '../types/dtos/core/workout.dto';
import { WORKOUT_TARGET_TYPE } from '../types/misc';
import { METRIC_TYPE } from '../types/misc/core/metric-type.enum';
import { kmhToSpeedMs } from './workout.utils';

/**
 * Default metric values used as fallback when athlete metrics are not available.
 * These represent population averages.
 */
export const DEFAULT_METRIC_VALUES: Record<string, number> = {
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
 * Default metric type to use for percentage-based targets when metricType is not specified.
 * Maps target type to the metric that should be used as reference.
 */
const DEFAULT_METRIC_FOR_TARGET: Partial<Record<WORKOUT_TARGET_TYPE, string>> =
  {
    [WORKOUT_TARGET_TYPE.HEARTRATE]: METRIC_TYPE.HR_MAX,
    [WORKOUT_TARGET_TYPE.ZONE]: METRIC_TYPE.HR_MAX,
    [WORKOUT_TARGET_TYPE.PACE]: METRIC_TYPE.VMA,
    [WORKOUT_TARGET_TYPE.POWER]: METRIC_TYPE.FTP_CYCLING,
  };

/**
 * Check if a value looks like a percentage (0-2 range, allowing for >100% intensities)
 */
function looksLikePercentage(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && value > 0 && value <= 2;
}

/**
 * Get the absolute intensity value for a target, converting from percentage if needed.
 *
 * This function handles three scenarios:
 * 1. metricType is specified: multiply percentage values by the metric reference value
 * 2. Values look like percentages (0-2 range) and have a default metric: apply default metric
 * 3. Values are already absolute: return as-is
 *
 * @param target - The workout step target
 * @param metrics - Record of metric types to their values (from athlete data)
 * @returns The absolute intensity value, or null if cannot be determined
 */
export function getTargetIntensity(
  target: Pick<
    WorkoutStepTargetDto,
    'targetType' | 'targetValue' | 'targetMin' | 'targetMax' | 'metricType'
  >,
  metrics: Record<string, { value: number } | number> | undefined,
): {
  value: number | null;
  min: number | null;
  max: number | null;
} {
  if (!target || target.targetType === 'OPEN') {
    return { value: null, min: null, max: null };
  }

  const { targetValue, targetMin, targetMax, metricType, targetType } = target;

  // Helper to get metric value with fallback to defaults
  const getMetricValue = (type: string | null | undefined): number | null => {
    if (!type) return null;

    // Try to get from provided metrics first
    if (metrics) {
      const metric = metrics[type];
      if (metric !== undefined && metric !== null) {
        return typeof metric === 'number' ? metric : metric.value;
      }
    }

    // Fallback to default value if available
    const defaultValue = DEFAULT_METRIC_VALUES[type];
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    return null;
  };

  // Determine which metric to use for conversion
  let effectiveMetricType = metricType;

  // If no metricType specified but values look like percentages,
  // use the default metric for this target type
  if (!effectiveMetricType) {
    const hasPercentageValues =
      looksLikePercentage(targetValue) ||
      looksLikePercentage(targetMin) ||
      looksLikePercentage(targetMax);

    if (hasPercentageValues) {
      effectiveMetricType =
        DEFAULT_METRIC_FOR_TARGET[targetType as WORKOUT_TARGET_TYPE] ?? null;
    }
  }

  // Helper to convert percentage (0-1) to absolute value
  const convertToAbsolute = (
    percentage: number | null | undefined,
    metric: string | null | undefined,
  ): number | null => {
    if (percentage === null || percentage === undefined) return null;
    if (!metric) return percentage;

    const metricValue = getMetricValue(metric);
    if (metricValue === null) return percentage; // Return raw value if no metric found

    return percentage * metricValue;
  };

  // Convert values from percentage to absolute
  const absoluteValue = convertToAbsolute(targetValue, effectiveMetricType);
  const absoluteMin = convertToAbsolute(targetMin, effectiveMetricType);
  const absoluteMax = convertToAbsolute(targetMax, effectiveMetricType);

  // Special handling for PACE: if metricType is VMA, convert from km/h to m/s
  const convertKmHToMs = (value: number | null | undefined): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    return kmhToSpeedMs(value);
  };

  if (targetType === 'PACE' && effectiveMetricType === METRIC_TYPE.VMA) {
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
