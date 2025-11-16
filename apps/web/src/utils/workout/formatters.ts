import { m } from '@/paraglide/messages';

import type {
  WorkoutDto,
  WorkoutDurationType,
  WorkoutStepTarget,
  WorkoutStepType,
  WorkoutTargetType,
} from '@openathlete/shared';
import { calculateWorkoutDuration as sharedCalculateWorkoutDuration } from '@openathlete/shared';

/**
 * Format duration value based on duration type
 * @param durationType - Type of duration (TIME, DISTANCE, REPS, etc.)
 * @param durationValue - Numeric value to format
 * @returns Human-readable formatted duration
 */
export function formatDuration(
  durationType: WorkoutDurationType,
  durationValue?: number | null,
): string {
  if (!durationValue) {
    if (durationType === 'OPEN') return m.workout_duration_open();
    if (durationType === 'LAP_BUTTON') return m.workout_duration_lap_button();
    return '-';
  }

  switch (durationType) {
    case 'TIME': {
      const totalSeconds = Math.round(durationValue);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hours > 0) {
        return seconds > 0
          ? `${hours}h ${minutes}min ${seconds}s`
          : minutes > 0
            ? `${hours}h ${minutes}min`
            : `${hours}h`;
      }
      if (minutes > 0) {
        return seconds > 0
          ? `${minutes}:${seconds.toString().padStart(2, '0')}`
          : `${minutes} min`;
      }
      return `${seconds}s`;
    }

    case 'DISTANCE': {
      if (durationValue >= 1000) {
        const km = durationValue / 1000;
        return km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`;
      }
      return `${durationValue} m`;
    }

    case 'CALORIES':
      return `${durationValue} kcal`;

    case 'REPS':
      return `${durationValue} reps`;

    case 'HR_BELOW':
      return `< ${durationValue} bpm`;

    case 'HR_ABOVE':
      return `> ${durationValue} bpm`;

    case 'LAP_BUTTON':
      return 'Lap button';

    case 'OPEN':
      return 'Open';

    default:
      return `${durationValue}`;
  }
}

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
  const { targetType, unit, targetMin, targetMax, targetValue } = target;

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
        const minSecPerKm = targetMin > 0 ? 1000 / targetMin : 0;
        const maxSecPerKm = targetMax > 0 ? 1000 / targetMax : 0;
        return `${formatPace(minSecPerKm)} - ${formatPace(maxSecPerKm)} /km`;
      }

      case 'HEARTRATE':
        return unit === 'PERCENT_MAX_HR'
          ? `${targetMin} - ${targetMax}% max HR`
          : `${targetMin} - ${targetMax} bpm`;

      case 'POWER':
        return unit === 'PERCENT_FTP'
          ? `${targetMin} - ${targetMax}% FTP`
          : `${targetMin} - ${targetMax} W`;

      case 'CADENCE':
        return `${targetMin} - ${targetMax} ${unit?.toLowerCase() || 'rpm'}`;

      case 'RPE':
        return `RPE ${targetMin} - ${targetMax}`;

      case 'WEIGHT':
        return `${targetMin} - ${targetMax} ${unit?.toLowerCase() || 'kg'}`;

      default:
        return `${targetMin} - ${targetMax} ${unit?.toLowerCase() || ''}`;
    }
  }

  // Single value target
  if (targetValue !== null && targetValue !== undefined) {
    switch (targetType) {
      case 'WEIGHT':
        return `${targetValue} ${unit?.toLowerCase() || 'kg'}`;

      case 'PACE': {
        const secPerKm = targetValue > 0 ? 1000 / targetValue : 0;
        return `${formatPace(secPerKm)} /km`;
      }

      case 'HEARTRATE':
        return unit === 'PERCENT_MAX_HR'
          ? `${targetValue}% max HR`
          : `${targetValue} bpm`;

      case 'POWER':
        return unit === 'PERCENT_FTP'
          ? `${targetValue}% FTP`
          : `${targetValue} W`;

      case 'CADENCE':
        return `${targetValue} ${unit?.toLowerCase() || 'rpm'}`;

      case 'RPE':
        return `RPE ${targetValue}`;

      default:
        return `${targetValue} ${unit?.toLowerCase() || ''}`;
    }
  }

  return 'Open';
}

/**
 * Get a short, human-readable label for a step type
 * @param stepType - Type of step
 * @returns Short label (not i18n, use translation keys for display)
 */
export function getStepTypeLabel(stepType: WorkoutStepType): string {
  const labels: Record<WorkoutStepType, string> = {
    WARMUP: m.step_form_type_warmup(),
    COOLDOWN: m.step_form_type_cooldown(),
    INTERVAL_ACTIVE: m.step_form_type_interval_active(),
    INTERVAL_REST: m.step_form_type_interval_rest(),
    STEADY: m.step_form_type_steady(),
    REPEAT: m.step_form_type_repeat(),
    FREE: m.step_form_type_free(),
  };
  return labels[stepType] || stepType;
}

/**
 * Get color class for step type (Tailwind)
 * @param stepType - Type of step
 * @returns Tailwind color classes
 */
export function getStepTypeColor(stepType: WorkoutStepType): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<
    WorkoutStepType,
    { bg: string; text: string; border: string }
  > = {
    WARMUP: {
      bg: 'bg-orange-50 dark:bg-orange-950',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
    },
    COOLDOWN: {
      bg: 'bg-purple-50 dark:bg-purple-950',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
    },
    INTERVAL_ACTIVE: {
      bg: 'bg-red-50 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
    },
    INTERVAL_REST: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
    },
    STEADY: {
      bg: 'bg-green-50 dark:bg-green-950',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
    },
    REPEAT: {
      bg: 'bg-violet-50 dark:bg-violet-950',
      text: 'text-violet-700 dark:text-violet-300',
      border: 'border-violet-200 dark:border-violet-800',
    },
    FREE: {
      bg: 'bg-gray-50 dark:bg-gray-900',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700',
    },
  };
  return colors[stepType] || colors.FREE;
}

/**
 * Calculate estimated total duration for a workout
 * Only counts TIME-based durations (ignores distance, calories, etc.)
 * @param workout - Workout object
 * @returns Total duration in seconds
 */
export const calculateWorkoutDuration = (workout: WorkoutDto): number =>
  sharedCalculateWorkoutDuration(workout) ?? 0;

/**
 * Get target type label
 * @param targetType - Target type
 * @returns Human-readable label
 */
export function getTargetTypeLabel(targetType: WorkoutTargetType): string {
  const labels: Record<WorkoutTargetType, string> = {
    OPEN: m.workout_target_open(),
    PACE: m.workout_target_pace(),
    HEARTRATE: m.workout_target_heartrate(),
    POWER: m.workout_target_power(),
    CADENCE: m.workout_target_cadence(),
    RPE: m.workout_target_rpe(),
    WEIGHT: m.workout_target_weight(),
    ZONE: m.workout_target_zone(),
  };
  return labels[targetType] || targetType;
}
