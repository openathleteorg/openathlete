import { TrainingZone } from '../entities';
import { UnitSystem, WorkoutStepTargetDto } from '../types';
import { formatSpeed, formatSpeedUnit } from './numeric-stats.formatter';
import { getTargetIntensity } from './target-intensity';
import { localSpeedUnit, toUnitWeight } from './units';

/**
 * Format a workout target for display
 * @param target - Target object with type, unit, and values
 * @param getMetricLabel - Optional function to get metric label (for i18n)
 * @param metrics - Optional record of metric types to their values for calculating absolute values
 * @param trainingZones - The zones of the athlete the workout belongs to
 * @param unknownZoneLabel - Shown for a zone id that is not one of them
 * @param unitSystem - User display unit system (defaults to metric)
 * @returns Human-readable formatted target
 */
export function formatTarget(
  target: WorkoutStepTargetDto,
  getMetricLabel?: (metricType: string) => string,
  metrics?: Record<string, { value: number } | number>,
  trainingZones?: TrainingZone[],
  unknownZoneLabel?: string,
  unitSystem: UnitSystem = 'METRIC',
): string {
  const { targetType, targetMin, targetMax, targetValue, metricType } = target;
  const paceUnit = localSpeedUnit('min/km', unitSystem);
  const paceUnitLabel = formatSpeedUnit(paceUnit);
  const formatWeight = (kg: number) => toUnitWeight(kg, unitSystem);

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

  if (
    targetType === 'ZONE' &&
    targetValue !== null &&
    targetValue !== undefined
  ) {
    const zone = trainingZones?.find((z) => z.trainingZoneId === targetValue);
    if (zone) {
      return zone.name;
    }
    // The raw id means nothing to a reader
    return unknownZoneLabel ?? `Zone ${targetValue}`;
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
      // Get absolute values if metrics are provided
      const absoluteValues = getTargetIntensity(target, metrics);
      const percentageStr = `${formatPercent(targetMin)} - ${formatPercent(targetMax)} de ${metricName}`;

      // Format absolute values based on target type
      if (
        absoluteValues.min !== null &&
        absoluteValues.max !== null &&
        metrics
      ) {
        let absoluteStr = '';
        switch (targetType) {
          case 'PACE':
            absoluteStr = `${formatSpeed(absoluteValues.min, paceUnit)} - ${formatSpeed(absoluteValues.max, paceUnit)} ${paceUnitLabel}`;
            break;
          case 'HEARTRATE':
            absoluteStr = `${Math.round(absoluteValues.min)} - ${Math.round(absoluteValues.max)} bpm`;
            break;
          case 'POWER':
            absoluteStr = `${Math.round(absoluteValues.min)} - ${Math.round(absoluteValues.max)} W`;
            break;
          case 'CADENCE':
            absoluteStr = `${Math.round(absoluteValues.min)} - ${Math.round(absoluteValues.max)} rpm`;
            break;
          default:
            absoluteStr = `${absoluteValues.min} - ${absoluteValues.max}`;
        }
        return `${percentageStr} - ${absoluteStr}`;
      }

      return percentageStr;
    }

    switch (targetType) {
      case 'PACE': {
        if (targetMin === null || targetMax === null) {
          return 'Open';
        }
        return `${formatSpeed(targetMin, paceUnit)} - ${formatSpeed(targetMax, paceUnit)}`;
      }

      case 'HEARTRATE':
        return `${targetMin} - ${targetMax} bpm`;

      case 'POWER':
        return `${targetMin} - ${targetMax} W`;

      case 'CADENCE':
        return `${targetMin} - ${targetMax} rpm`;

      case 'RPE':
        return `RPE ${targetMin} - ${targetMax}`;

      case 'WEIGHT': {
        const minW = formatWeight(targetMin);
        const maxW = formatWeight(targetMax);
        return `${minW.value} - ${maxW.value} ${maxW.unit}`;
      }

      default:
        return `${targetMin} - ${targetMax}`;
    }
  }

  // Single value target
  if (targetValue !== null && targetValue !== undefined) {
    if (isPercentage && metricName) {
      // Get absolute value if metrics are provided
      const absoluteValues = getTargetIntensity(target, metrics);
      const percentageStr = `${formatPercent(targetValue)} de ${metricName}`;

      // Format absolute value based on target type
      if (absoluteValues.value !== null && metrics) {
        let absoluteStr = '';
        switch (targetType) {
          case 'PACE':
            absoluteStr = `${formatSpeed(absoluteValues.value, paceUnit)}`;
            break;
          case 'HEARTRATE':
            absoluteStr = `${Math.round(absoluteValues.value)} bpm`;
            break;
          case 'POWER':
            absoluteStr = `${Math.round(absoluteValues.value)} W`;
            break;
          case 'CADENCE':
            absoluteStr = `${Math.round(absoluteValues.value)} rpm`;
            break;
          default:
            absoluteStr = `${absoluteValues.value}`;
        }
        return `${percentageStr} - ${absoluteStr}`;
      }

      return percentageStr;
    }

    switch (targetType) {
      case 'WEIGHT': {
        const w = formatWeight(targetValue);
        return `${w.value} ${w.unit}`;
      }

      case 'PACE': {
        if (targetValue === null) {
          return 'Open';
        }
        return `${formatSpeed(targetValue, paceUnit)} ${paceUnitLabel}`;
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
