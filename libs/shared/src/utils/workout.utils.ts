import {
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WorkoutDto,
  WorkoutStepDto,
  WorkoutStepTarget,
} from '../types/dtos/core/workout.dto';

// ============================================================================
// Workout Calculations
// ============================================================================

/**
 * Calculate total duration in seconds for a workout
 * Only counts TIME-based steps
 */
export function calculateWorkoutDuration(workout: WorkoutDto): number | null {
  if (!workout.steps || workout.steps.length === 0) {
    return null;
  }

  let totalSeconds = 0;
  let hasTimeDuration = false;

  const calculateStepDuration = (step: WorkoutStepDto): number => {
    if (
      step.durationType === WORKOUT_DURATION_TYPE.TIME &&
      step.durationValue
    ) {
      hasTimeDuration = true;
      return step.durationValue;
    }
    return 0;
  };

  for (const step of workout.steps) {
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
      // Calculate duration of child steps and multiply by repetitions
      let repeatDuration = 0;
      for (const childStep of step.repeatBlock.childSteps || []) {
        repeatDuration += calculateStepDuration(childStep);
      }
      totalSeconds += repeatDuration * step.repeatBlock.repetitions;
    } else {
      totalSeconds += calculateStepDuration(step);
    }
  }

  return hasTimeDuration ? totalSeconds : null;
}

/**
 * Calculate total distance in meters for a workout
 * Only counts DISTANCE-based steps
 */
export function calculateWorkoutDistance(workout: WorkoutDto): number | null {
  if (!workout.steps || workout.steps.length === 0) {
    return null;
  }

  let totalMeters = 0;
  let hasDistanceDuration = false;

  const calculateStepDistance = (step: WorkoutStepDto): number => {
    if (
      step.durationType === WORKOUT_DURATION_TYPE.DISTANCE &&
      step.durationValue
    ) {
      hasDistanceDuration = true;
      return step.durationValue;
    }
    return 0;
  };

  for (const step of workout.steps) {
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
      // Calculate distance of child steps and multiply by repetitions
      let repeatDistance = 0;
      for (const childStep of step.repeatBlock.childSteps || []) {
        repeatDistance += calculateStepDistance(childStep);
      }
      totalMeters += repeatDistance * step.repeatBlock.repetitions;
    } else {
      totalMeters += calculateStepDistance(step);
    }
  }

  return hasDistanceDuration ? totalMeters : null;
}

/**
 * Count total number of steps (including child steps in repeat blocks)
 */
export function countWorkoutSteps(workout: WorkoutDto): number {
  if (!workout.steps || workout.steps.length === 0) {
    return 0;
  }

  let count = 0;

  const countStep = (step: WorkoutStepDto): void => {
    count++;
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
      for (const childStep of step.repeatBlock.childSteps || []) {
        countStep(childStep);
      }
    }
  };

  for (const step of workout.steps) {
    countStep(step);
  }

  return count;
}

// ============================================================================
// Workout Validation
// ============================================================================

export interface WorkoutValidationError {
  field: string;
  message: string;
  stepIndex?: number;
  targetIndex?: number;
}

export interface WorkoutValidationResult {
  valid: boolean;
  errors: WorkoutValidationError[];
}

/**
 * Validate workout structure and data consistency
 */
export function validateWorkoutStructure(
  workout: WorkoutDto,
): WorkoutValidationResult {
  const errors: WorkoutValidationError[] = [];

  // Check basic fields (name and description removed)

  // Check steps
  if (!workout.steps || workout.steps.length === 0) {
    errors.push({ field: 'steps', message: 'At least one step is required' });
    return { valid: false, errors };
  }

  // Validate each step
  const orderIndices = new Set<number>();

  workout.steps.forEach((step: WorkoutStepDto, index: number) => {
    // Check order_index uniqueness
    if (orderIndices.has(step.orderIndex)) {
      errors.push({
        field: 'orderIndex',
        message: `Duplicate order index ${step.orderIndex}`,
        stepIndex: index,
      });
    }
    orderIndices.add(step.orderIndex);

    // Validate duration
    if (
      step.durationType !== WORKOUT_DURATION_TYPE.OPEN &&
      step.durationType !== WORKOUT_DURATION_TYPE.LAP_BUTTON &&
      !step.durationValue
    ) {
      errors.push({
        field: 'durationValue',
        message: `Duration value is required for duration type ${step.durationType}`,
        stepIndex: index,
      });
    }

    // Validate repeat block
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT) {
      if (!step.repeatBlock) {
        errors.push({
          field: 'repeatBlock',
          message: 'Repeat block is required for REPEAT step type',
          stepIndex: index,
        });
      } else {
        if (
          step.repeatBlock.repetitions < 1 ||
          step.repeatBlock.repetitions > 99
        ) {
          errors.push({
            field: 'repetitions',
            message: 'Repetitions must be between 1 and 99',
            stepIndex: index,
          });
        }

        if (
          !step.repeatBlock.childSteps ||
          step.repeatBlock.childSteps.length === 0
        ) {
          errors.push({
            field: 'childSteps',
            message: 'Repeat block must contain at least one child step',
            stepIndex: index,
          });
        }
      }
    }

    if (step.targets && step.targets.length > 0) {
      step.targets.forEach((target: WorkoutStepTarget, targetIndex: number) => {
        if (
          target.targetMin !== null &&
          target.targetMin !== undefined &&
          target.targetMax !== null &&
          target.targetMax !== undefined
        ) {
          if (target.targetMin >= target.targetMax) {
            errors.push({
              field: 'targetRange',
              message: 'Target min must be less than target max',
              stepIndex: index,
              targetIndex,
            });
          }
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Unit Conversions
// ============================================================================

/**
 * Convert pace (min/km) to speed (m/s)
 */
export function paceToSpeed(paceMinPerKm: number): number {
  return 1000 / (paceMinPerKm * 60);
}

/**
 * Convert speed (m/s) to pace (min/km)
 */
export function speedToPace(speedMs: number): number {
  return 1000 / (speedMs * 60);
}

/**
 * Convert speed (m/s) to km/h
 */
export function speedMsToKmh(speedMs: number): number {
  return speedMs * 3.6;
}

/**
 * Convert km/h to speed (m/s)
 */
export function kmhToSpeedMs(kmh: number): number {
  return kmh / 3.6;
}

/**
 * Format duration in seconds to HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format distance in meters
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
