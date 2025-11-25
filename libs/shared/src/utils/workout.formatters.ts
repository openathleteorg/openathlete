import { WorkoutStepTarget } from '../types';
import { formatSpeed } from './numeric-stats.formatter';

/**
 * Format a workout target for display
 * @param target - Target object with type, unit, and values
 * @param sport - Optional sport to determine zone type
 * @param getMetricLabel - Optional function to get metric label (for i18n)
 * @returns Human-readable formatted target
 */
export function formatTarget(
  target: WorkoutStepTarget,
  getMetricLabel?: (metricType: string) => string,
): string {
  const { targetType, targetMin, targetMax, targetValue, metricType } = target;

  // Helper to format percentage
  const formatPercent = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  // Helper to get metric label
  const getMetricName = (metric: string | null | undefined): string => {
    if (!metric) return '';
    return getMetricLabel ? getMetricLabel(metric) : metric;
  };

  // Open target (no specific goal)
  if (targetType === 'OPEN') {
    return 'Open';
  }

  // ZONE target (single value) - zone name should be resolved in component
  // This function will be called with zone name already resolved in TargetBadge
  if (
    targetType === 'ZONE' &&
    targetValue !== null &&
    targetValue !== undefined
  ) {
    // Fallback: if zone name not provided, show ID
    return `Zone ${targetValue}`;
  }

  // If metricType is set, values are percentages (0-1)
  const isPercentage = !!metricType;
  const metricName = getMetricName(metricType);

  // Range target (min-max)
  if (
    targetMin !== null &&
    targetMin !== undefined &&
    targetMax !== null &&
    targetMax !== undefined
  ) {
    if (isPercentage && metricName) {
      return `${formatPercent(targetMin)} - ${formatPercent(targetMax)} de ${metricName}`;
    }

    switch (targetType) {
      case 'PACE': {
        if (targetMin === null || targetMax === null) {
          return 'Open';
        }
        return `${formatSpeed(targetMin)} - ${formatSpeed(targetMax)}`;
      }

      case 'HEARTRATE':
        return `${targetMin} - ${targetMax} bpm`;

      case 'POWER':
        return `${targetMin} - ${targetMax} W`;

      case 'CADENCE':
        return `${targetMin} - ${targetMax} rpm`;

      case 'RPE':
        return `RPE ${targetMin} - ${targetMax}`;

      case 'WEIGHT':
        return `${targetMin} - ${targetMax} kg`;

      default:
        return `${targetMin} - ${targetMax}`;
    }
  }

  // Single value target
  if (targetValue !== null && targetValue !== undefined) {
    if (isPercentage && metricName) {
      return `${formatPercent(targetValue)} de ${metricName}`;
    }

    switch (targetType) {
      case 'WEIGHT':
        return `${targetValue} kg`;

      case 'PACE': {
        if (targetValue === null) {
          return 'Open';
        }
        return `${formatSpeed(targetValue)} min/km`;
      }

      case 'HEARTRATE':
        return `${targetValue} bpm`;

      case 'POWER':
        return `${targetValue} W`;

      case 'CADENCE':
        return `${targetValue} rpm`;

      case 'RPE':
        return `RPE ${targetValue}`;

      default:
        return `${targetValue}`;
    }
  }

  return 'Open';
}
