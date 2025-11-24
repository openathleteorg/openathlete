import { WorkoutStepTarget } from '../types';

/**
 * Format pace from seconds to min:sec
 * @param seconds - Pace in seconds per km
 * @returns Formatted pace (e.g., "4:30")
 */
function formatPace(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60; // avoids cases like 5:60
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format a workout target for display
 * @param target - Target object with type, unit, and values
 * @param sport - Optional sport to determine zone type
 * @returns Human-readable formatted target
 */
export function formatTarget(target: WorkoutStepTarget): string {
  const { targetType, targetMin, targetMax, targetValue } = target;

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

  // Range target (min-max)
  if (
    targetMin !== null &&
    targetMin !== undefined &&
    targetMax !== null &&
    targetMax !== undefined
  ) {
    switch (targetType) {
      case 'PACE': {
        return `${formatPace(targetMin * 60)} - ${formatPace(targetMax * 60)} min/km`;
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
    switch (targetType) {
      case 'WEIGHT':
        return `${targetValue} kg`;

      case 'PACE': {
        return `${formatPace(targetValue * 60)} min/km`;
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
