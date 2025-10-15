import { m } from '@/paraglide/messages';

import type {
  WorkoutDto,
  WorkoutDurationType,
  WorkoutStepDto,
  WorkoutStepTarget,
  WorkoutStepType,
  WorkoutTargetType,
} from '@openathlete/shared';

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
    if (durationType === 'OPEN') return 'Open';
    if (durationType === 'LAP_BUTTON') return 'Lap button';
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
export function formatPace(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format a workout target for display
 * @param target - Target object with type, unit, and values
 * @returns Human-readable formatted target
 */
export function formatTarget(target: WorkoutStepTarget): string {
  const { targetType, unit, targetMin, targetMax, targetValue, targetZone } =
    target;

  // Zone-based target
  if (targetZone !== null && targetZone !== undefined) {
    return `Zone ${targetZone}`;
  }

  // Open target (no specific goal)
  if (targetType === 'OPEN') {
    return 'Open';
  }

  // Range target (min-max)
  if (
    targetMin !== null &&
    targetMin !== undefined &&
    targetMax !== null &&
    targetMax !== undefined
  ) {
    switch (targetType) {
      case 'PACE':
        return `${formatPace(targetMin)} - ${formatPace(targetMax)} /km`;

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

      case 'SPEED':
        return `${targetMin} - ${targetMax} ${unit === 'KM_PER_H' ? 'km/h' : 'm/s'}`;

      default:
        return `${targetMin} - ${targetMax} ${unit?.toLowerCase() || ''}`;
    }
  }

  // Single value target
  if (targetValue !== null && targetValue !== undefined) {
    switch (targetType) {
      case 'WEIGHT':
        return `${targetValue} ${unit?.toLowerCase() || 'kg'}`;

      case 'REPS_TARGET':
        return `${targetValue} reps`;

      case 'PACE':
        return `${formatPace(targetValue)} /km`;

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

      case 'SPEED':
        return `${targetValue} ${unit === 'KM_PER_H' ? 'km/h' : 'm/s'}`;

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
export function calculateWorkoutDuration(workout: WorkoutDto): number {
  let totalSeconds = 0;

  const processStep = (step: WorkoutStepDto, repetitions = 1) => {
    if (step.durationType === 'TIME' && step.durationValue) {
      totalSeconds += step.durationValue * repetitions;
    }

    // Process repeat block child steps
    if (step.repeatBlock && step.repeatBlock.childSteps) {
      const reps = step.repeatBlock.repetitions;
      step.repeatBlock.childSteps.forEach((childStep: WorkoutStepDto) => {
        processStep(childStep, reps);
      });
    }
  };

  workout.steps.forEach((step: WorkoutStepDto) => processStep(step));

  return totalSeconds;
}

/**
 * Calculate total distance for a workout
 * Only counts DISTANCE-based durations
 * @param workout - Workout object
 * @returns Total distance in meters
 */
export function calculateWorkoutDistance(workout: WorkoutDto): number {
  let totalMeters = 0;

  const processStep = (step: WorkoutStepDto, repetitions = 1) => {
    if (step.durationType === 'DISTANCE' && step.durationValue) {
      totalMeters += step.durationValue * repetitions;
    }

    // Process repeat block child steps
    if (step.repeatBlock && step.repeatBlock.childSteps) {
      const reps = step.repeatBlock.repetitions;
      step.repeatBlock.childSteps.forEach((childStep: WorkoutStepDto) => {
        processStep(childStep, reps);
      });
    }
  };

  workout.steps.forEach((step: WorkoutStepDto) => processStep(step));

  return totalMeters;
}

/**
 * Get a summary string for a workout
 * @param workout - Workout object
 * @returns Summary string (e.g., "5 steps, ~45 min, 12 km")
 */
export function getWorkoutSummary(workout: WorkoutDto): string {
  const stepCount = workout.steps.length;
  const repeatCount = workout.steps.filter(
    (s: WorkoutStepDto) => s.stepType === 'REPEAT',
  ).length;

  const duration = calculateWorkoutDuration(workout);
  const distance = calculateWorkoutDistance(workout);

  const parts: string[] = [];

  // Steps
  if (stepCount > 0) {
    parts.push(`${stepCount} step${stepCount > 1 ? 's' : ''}`);
  }

  // Repeats
  if (repeatCount > 0) {
    parts.push(`${repeatCount} repeat${repeatCount > 1 ? 's' : ''}`);
  }

  // Duration
  if (duration > 0) {
    const minutes = Math.round(duration / 60);
    parts.push(`~${minutes} min`);
  }

  // Distance
  if (distance > 0) {
    const km = distance / 1000;
    parts.push(km % 1 === 0 ? `${km} km` : `${km.toFixed(1)} km`);
  }

  return parts.join(', ') || 'Empty workout';
}

/**
 * Get target type label
 * @param targetType - Target type
 * @returns Human-readable label
 */
export function getTargetTypeLabel(targetType: WorkoutTargetType): string {
  const labels: Record<WorkoutTargetType, string> = {
    OPEN: 'Open',
    PACE: 'Pace',
    SPEED: 'Speed',
    HEARTRATE: 'Heart Rate',
    POWER: 'Power',
    CADENCE: 'Cadence',
    RPE: 'RPE',
    WEIGHT: 'Weight',
    REPS_TARGET: 'Reps Target',
  };
  return labels[targetType] || targetType;
}
