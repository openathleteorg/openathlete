import {
  WorkoutDto,
  WorkoutStepDto,
  WorkoutStepTargetDto,
} from '../types/dtos/core/workout.dto';
import {
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '../types/misc';
import { METRIC_TYPE } from '../types/misc/core/metric-type.enum';

// ============================================================================
// Workout Calculations
// ============================================================================

/**
 * Default speed in m/s when no pace target is available
 * ~5:00 min/km = 3.33 m/s (easy running pace)
 */
const DEFAULT_SPEED_MS = 3.33;

/**
 * Default metric values for average athletes when metrics are not available
 */
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
 * Get metric value with fallback to defaults
 */
function getMetricValue(
  metricType: string | null | undefined,
  metrics?: Record<string, { value: number } | number>,
): number | null {
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
}

/**
 * Extract speed in m/s from a pace target
 * This is a simplified version that avoids circular dependency with target-intensity.ts
 */
function extractPaceSpeed(
  target: WorkoutStepTargetDto,
  metrics?: Record<string, { value: number } | number>,
): number | null {
  const { targetValue, targetMin, targetMax, metricType } = target;

  // If metricType is set, convert percentage to absolute value
  if (metricType) {
    const metricValue = getMetricValue(metricType, metrics);
    if (metricValue === null) return null;

    // Convert percentage to absolute value
    let absoluteValue: number | null = null;
    if (targetValue !== null && targetValue !== undefined) {
      absoluteValue = targetValue * metricValue;
    } else if (
      targetMin !== null &&
      targetMin !== undefined &&
      targetMax !== null &&
      targetMax !== undefined
    ) {
      absoluteValue = ((targetMin + targetMax) / 2) * metricValue;
    } else if (targetMin !== null && targetMin !== undefined) {
      absoluteValue = targetMin * metricValue;
    } else if (targetMax !== null && targetMax !== undefined) {
      absoluteValue = targetMax * metricValue;
    }

    // Special handling for VMA: convert from km/h to m/s
    if (metricType === METRIC_TYPE.VMA && absoluteValue !== null) {
      return kmhToSpeedMs(absoluteValue);
    }

    // For other metrics, assume value is already in m/s
    return absoluteValue;
  }

  // No metricType: value is already in m/s
  if (targetValue !== null && targetValue !== undefined) {
    return targetValue;
  }
  if (
    targetMin !== null &&
    targetMin !== undefined &&
    targetMax !== null &&
    targetMax !== undefined
  ) {
    return (targetMin + targetMax) / 2;
  }
  if (targetMin !== null && targetMin !== undefined) {
    return targetMin;
  }
  if (targetMax !== null && targetMax !== undefined) {
    return targetMax;
  }

  return null;
}

/**
 * Estimate step duration from distance using pace targets
 * @param step - Workout step with durationType === DISTANCE
 * @param metrics - Optional athlete metrics for target intensity calculation
 * @returns Estimated duration in seconds, or null if cannot estimate
 */
export function estimateStepDurationFromDistance(
  step: WorkoutStepDto,
  metrics?: Record<string, { value: number } | number>,
): number | null {
  if (
    step.durationType !== WORKOUT_DURATION_TYPE.DISTANCE ||
    !step.durationValue
  ) {
    return null;
  }

  const distanceMeters = step.durationValue;
  let speedMs: number | null = null;

  // Try to find a PACE target
  const paceTarget = step.targets?.find(
    (target: WorkoutStepTargetDto) =>
      target.targetType === WORKOUT_TARGET_TYPE.PACE,
  );

  if (paceTarget) {
    speedMs = extractPaceSpeed(paceTarget, metrics);
  }

  // If no pace target found or speed couldn't be determined, use default
  if (speedMs === null || speedMs <= 0) {
    speedMs = DEFAULT_SPEED_MS;
  }

  // Calculate duration: time = distance / speed
  return distanceMeters / speedMs;
}

/**
 * Calculate total duration in seconds for a workout
 * Counts both TIME-based steps and estimates DISTANCE-based steps using pace targets
 * @param workout - Workout to calculate duration for
 * @param metrics - Optional athlete metrics for estimating distance-based durations
 * @returns Total duration in seconds, or null if no calculable steps
 */
export function calculateWorkoutDuration(
  workout: WorkoutDto,
  metrics?: Record<string, { value: number } | number>,
): number | null {
  if (!workout.steps || workout.steps.length === 0) {
    return null;
  }

  let totalSeconds = 0;
  let hasCalculableDuration = false;

  const calculateStepDuration = (step: WorkoutStepDto): number | null => {
    // TIME-based steps: use durationValue directly
    if (
      step.durationType === WORKOUT_DURATION_TYPE.TIME &&
      step.durationValue
    ) {
      hasCalculableDuration = true;
      return step.durationValue;
    }

    // DISTANCE-based steps: estimate using pace targets
    if (step.durationType === WORKOUT_DURATION_TYPE.DISTANCE) {
      const estimatedDuration = estimateStepDurationFromDistance(step, metrics);
      if (estimatedDuration !== null) {
        hasCalculableDuration = true;
        return estimatedDuration;
      }
    }

    return null;
  };

  for (const step of workout.steps) {
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
      // Calculate duration of child steps and multiply by repetitions
      let repeatDuration = 0;
      let hasRepeatDuration = false;
      for (const childStep of step.repeatBlock.childSteps || []) {
        const childDuration = calculateStepDuration(childStep);
        if (childDuration !== null) {
          repeatDuration += childDuration;
          hasRepeatDuration = true;
        }
      }
      if (hasRepeatDuration) {
        totalSeconds += repeatDuration * step.repeatBlock.repetitions;
        hasCalculableDuration = true;
      }
    } else {
      const stepDuration = calculateStepDuration(step);
      if (stepDuration !== null) {
        totalSeconds += stepDuration;
      }
    }
  }

  return hasCalculableDuration ? totalSeconds : null;
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
        } else {
          // Validate that child steps do not contain repeat blocks (max depth of 1)
          step.repeatBlock.childSteps.forEach((childStep: WorkoutStepDto) => {
            if (
              childStep.stepType === WORKOUT_STEP_TYPE.REPEAT &&
              childStep.repeatBlock
            ) {
              errors.push({
                field: 'repeatBlock',
                message:
                  'Repeat blocks cannot be nested. A repeat block cannot contain another repeat block (max depth of 1).',
                stepIndex: index,
              });
            }
          });
        }
      }
    }

    if (step.targets && step.targets.length > 0) {
      step.targets.forEach(
        (target: WorkoutStepTargetDto, targetIndex: number) => {
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
        },
      );
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
