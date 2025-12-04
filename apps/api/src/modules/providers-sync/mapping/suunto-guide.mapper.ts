import type {
  NormalizedWorkout,
  NormalizedWorkoutStep,
} from '@openathlete/shared';
import {
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '@openathlete/shared';

import type {
  SuuntoField,
  SuuntoFieldsStep,
  SuuntoGuide,
  SuuntoRepeatStep,
  SuuntoStep,
  SuuntoTargetCadenceField,
  SuuntoTargetHeartRateField,
  SuuntoTargetPaceField,
  SuuntoTargetPowerField,
} from './suunto-guide.types';
import { mapSportToSuuntoActivityIds, truncateText } from './suunto-helpers';

const GUIDE_OWNER = 'OpenAthlete';
const GUIDE_URL = 'https://openathlete.org';

/**
 * Get target value from metrics if metricType is specified
 */
function getTargetValue(
  target: NormalizedWorkoutStep['targets'][0],
  metrics?: Record<string, { value: number } | number>,
): { value: number | null; min: number | null; max: number | null } {
  if (!target) {
    return { value: null, min: null, max: null };
  }

  // If metricType is specified, target values are percentages (0-1)
  if (target.metricType && metrics) {
    const metric = metrics[target.metricType];
    const metricValue = typeof metric === 'number' ? metric : metric?.value;

    if (
      metricValue !== null &&
      metricValue !== undefined &&
      typeof metricValue === 'number'
    ) {
      const value = target.targetValue
        ? target.targetValue * metricValue
        : null;
      const min = target.targetMin ? target.targetMin * metricValue : null;
      const max = target.targetMax ? target.targetMax * metricValue : null;
      return { value, min, max };
    }
  }

  // Otherwise, values are absolute
  return {
    value: target.targetValue ?? null,
    min: target.targetMin ?? null,
    max: target.targetMax ?? null,
  };
}

/**
 * Map target to Suunto target field
 */
function mapTargetToSuuntoField(
  target: NormalizedWorkoutStep['targets'][0],
  sport: SPORT_TYPE,
  metrics?: Record<string, { value: number } | number>,
): SuuntoField | null {
  if (!target || target.targetType === WORKOUT_TARGET_TYPE.OPEN) {
    return null;
  }

  const targetValues = getTargetValue(target, metrics);

  switch (target.targetType) {
    case WORKOUT_TARGET_TYPE.HEARTRATE:
    case WORKOUT_TARGET_TYPE.ZONE: {
      // For ZONE, we need to resolve to actual HR values
      // For now, we'll use the targetValue as HR if available
      const field: SuuntoTargetHeartRateField = {
        type: 'targetHeartRate',
        title: 'Target HR',
      };

      if (targetValues.min !== null && targetValues.max !== null) {
        field.min = Math.round(targetValues.min);
        field.max = Math.round(targetValues.max);
      } else if (targetValues.value !== null) {
        field.value = Math.round(targetValues.value);
      }

      return field;
    }

    case WORKOUT_TARGET_TYPE.PACE: {
      const field: SuuntoTargetPaceField = {
        type: 'targetPace',
        title: 'Target Pace',
      };

      // Pace is stored in m/s, Suunto expects m/s
      if (targetValues.min !== null && targetValues.max !== null) {
        field.min = targetValues.min;
        field.max = targetValues.max;
      } else if (targetValues.value !== null) {
        field.value = targetValues.value;
      }

      return field;
    }

    case WORKOUT_TARGET_TYPE.POWER: {
      const field: SuuntoTargetPowerField = {
        type: 'targetPower',
        title: 'Target Power',
      };

      if (targetValues.min !== null && targetValues.max !== null) {
        field.min = targetValues.min;
        field.max = targetValues.max;
      } else if (targetValues.value !== null) {
        field.value = targetValues.value;
      }

      return field;
    }

    case WORKOUT_TARGET_TYPE.CADENCE: {
      const field: SuuntoTargetCadenceField = {
        type: 'targetCadence',
        title: 'Target Cad',
      };

      // Cadence is in RPM, Suunto expects Hertz (RPM / 60)
      if (targetValues.min !== null && targetValues.max !== null) {
        field.min = targetValues.min / 60;
        field.max = targetValues.max / 60;
      } else if (targetValues.value !== null) {
        field.value = targetValues.value / 60;
      }

      return field;
    }

    case WORKOUT_TARGET_TYPE.RPE:
      // RPE not directly supported, convert to text guidance
      return {
        type: 'text',
        value: `RPE: ${targetValues.value ?? targetValues.min ?? '?'}-${targetValues.max ?? '?'}`,
      };

    default:
      return null;
  }
}

/**
 * Map duration type to Suunto transition condition
 */
function mapDurationToCondition(
  step: NormalizedWorkoutStep,
): SuuntoFieldsStep['transitions'] {
  const transitions: SuuntoFieldsStep['transitions'] = [];

  switch (step.durationType) {
    case WORKOUT_DURATION_TYPE.TIME:
      if (step.durationValue) {
        transitions.push({
          condition: {
            type: 'stepDuration',
            value: step.durationValue,
          },
        });
      }
      break;

    case WORKOUT_DURATION_TYPE.DISTANCE:
      if (step.durationValue) {
        transitions.push({
          condition: {
            type: 'stepDistance',
            value: step.durationValue,
          },
        });
      }
      break;

    case WORKOUT_DURATION_TYPE.LAP_BUTTON:
      transitions.push({
        condition: {
          type: 'manualLap',
        },
      });
      break;

    case WORKOUT_DURATION_TYPE.OPEN:
      // No transition, step continues until next step
      break;

    default:
      // Other duration types not directly supported
      break;
  }

  return transitions.length > 0 ? transitions : undefined;
}

/**
 * Map step to Suunto fields based on sport and targets
 */
function mapStepToFields(
  step: NormalizedWorkoutStep,
  sport: SPORT_TYPE,
  metrics?: Record<string, { value: number } | number>,
): SuuntoField[] {
  const fields: SuuntoField[] = [];

  // Add target field if available
  const targetField = step.targets?.[0]
    ? mapTargetToSuuntoField(step.targets[0], sport, metrics)
    : null;

  if (targetField) {
    fields.push(targetField);
  }

  // Add relevant metrics based on sport and step type
  const isRunning = [
    SPORT_TYPE.RUNNING,
    SPORT_TYPE.TRAIL_RUNNING,
    SPORT_TYPE.VIRTUAL_RUN,
  ].includes(sport);
  const isCycling = [
    SPORT_TYPE.CYCLING,
    SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
    SPORT_TYPE.GRAVEL_RIDE,
    SPORT_TYPE.E_BIKE_RIDE,
    SPORT_TYPE.E_MOUNTAIN_BIKE_RIDE,
    SPORT_TYPE.VIRTUAL_RIDE,
  ].includes(sport);
  const isSwimming = sport === SPORT_TYPE.SWIMMING;

  // Add countdown field based on duration type
  if (step.durationType === WORKOUT_DURATION_TYPE.TIME && step.durationValue) {
    fields.push({
      type: 'stepDurationCountdown',
      value: step.durationValue,
      title: 'Remaining',
    });
  } else if (
    step.durationType === WORKOUT_DURATION_TYPE.DISTANCE &&
    step.durationValue
  ) {
    fields.push({
      type: 'stepDistanceCountdown',
      value: step.durationValue,
      title: 'Remaining',
    });
  }

  // Add sport-specific fields
  if (isRunning) {
    // For running: pace, heart rate, distance, duration
    if (!targetField || targetField.type !== 'targetPace') {
      fields.push({
        type: 'pace',
        window: 'manualLap',
        aggregate: 'average',
        title: 'Pace',
      });
    }
    fields.push({
      type: 'heartRate',
      window: 'manualLap',
      aggregate: 'average',
      title: 'HR',
    });
    fields.push({
      type: 'distance',
      window: 'step',
      title: 'Dist',
    });
  } else if (isCycling) {
    // For cycling: power, speed, heart rate, cadence
    if (!targetField || targetField.type !== 'targetPower') {
      fields.push({
        type: 'power',
        window: 'manualLap',
        aggregate: 'average',
        title: 'Power',
      });
    }
    fields.push({
      type: 'speed',
      window: 'manualLap',
      aggregate: 'average',
      title: 'Speed',
    });
    fields.push({
      type: 'heartRate',
      window: 'manualLap',
      aggregate: 'average',
      title: 'HR',
    });
    if (!targetField || targetField.type !== 'targetCadence') {
      fields.push({
        type: 'cadence',
        window: 'manualLap',
        aggregate: 'average',
        title: 'Cad',
      });
    }
  } else if (isSwimming) {
    // For swimming: pace, stroke rate, distance
    if (!targetField || targetField.type !== 'targetPace') {
      fields.push({
        type: 'pace',
        window: 'manualLap',
        aggregate: 'average',
        title: 'Pace',
      });
    }
    fields.push({
      type: 'strokeRate',
      window: 'manualLap',
      aggregate: 'average',
      title: 'Rate',
    });
    fields.push({
      type: 'distance',
      window: 'step',
      title: 'Dist',
    });
  } else {
    // Generic: heart rate, distance, duration
    if (!targetField || targetField.type !== 'targetHeartRate') {
      fields.push({
        type: 'heartRate',
        window: 'manualLap',
        aggregate: 'average',
        title: 'HR',
      });
    }
    fields.push({
      type: 'distance',
      window: 'step',
      title: 'Dist',
    });
    fields.push({
      type: 'duration',
      window: 'step',
      title: 'Time',
    });
  }

  // Add step notes/name as text if available
  const stepText = step.notes || step.name;
  if (stepText && fields.length < 5) {
    // Only add text if we have room (max 5 fields recommended)
    fields.push({
      type: 'text',
      value: truncateText(stepText, 54),
    });
  }

  // Limit to 5 fields (recommended max for watch display)
  return fields.slice(0, 5);
}

/**
 * Map normalized step to Suunto FieldsStep
 */
function mapStepToSuuntoFieldsStep(
  step: NormalizedWorkoutStep,
  sport: SPORT_TYPE,
  stepIndex: number,
  metrics?: Record<string, { value: number } | number>,
): SuuntoFieldsStep {
  const fields = mapStepToFields(step, sport, metrics);
  const transitions = mapDurationToCondition(step);

  const stepTitle = truncateText(step.name || step.notes, 13);

  const suuntoStep: SuuntoFieldsStep = {
    type: 'fields',
    fields,
    ...(stepTitle && { title: stepTitle }),
    ...(transitions && transitions.length > 0 && { transitions }),
  };

  // Add notification for interval steps
  if (
    step.stepType === WORKOUT_STEP_TYPE.INTERVAL_ACTIVE ||
    step.stepType === WORKOUT_STEP_TYPE.WARMUP ||
    step.stepType === WORKOUT_STEP_TYPE.COOLDOWN
  ) {
    const notificationText = step.name || step.notes || stepTitle;
    if (notificationText) {
      suuntoStep.notification = {
        title: truncateText(stepTitle || 'Step', 13),
        text: truncateText(notificationText, 54),
      };
    }
  }

  return suuntoStep;
}

/**
 * Map normalized workout to Suunto Guide
 */
export function mapWorkoutToSuuntoGuide(
  workout: NormalizedWorkout,
  date: string, // YYYY-MM-DD
  workoutId: number,
  metrics?: Record<string, { value: number } | number>,
): SuuntoGuide {
  const activityIds = mapSportToSuuntoActivityIds(workout.sport);
  const workoutName = truncateText(workout.title || 'Workout', 60);
  // Description is required (min 1 char), use workout name if description is empty
  const description = truncateText(
    workout.description || workout.title || 'Workout',
    256,
  );
  const shortDescription = truncateText(workout.title || 'Workout', 23);
  const richText = workout.description
    ? truncateText(workout.description, 100000)
    : undefined;

  // Map steps
  const steps: SuuntoStep[] = [];
  let currentRepeat: SuuntoRepeatStep | null = null;
  let repeatSteps: SuuntoFieldsStep[] = [];

  for (let i = 0; i < workout.steps.length; i += 1) {
    const step = workout.steps[i];
    const suuntoFieldsStep = mapStepToSuuntoFieldsStep(
      step,
      workout.sport,
      i,
      metrics,
    );

    // Handle repeat blocks
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT) {
      // Start a new repeat block
      if (currentRepeat) {
        // Finish previous repeat
        currentRepeat.steps = repeatSteps;
        steps.push(currentRepeat);
        currentRepeat = null;
        repeatSteps = [];
      }

      // Find the next steps that belong to this repeat
      // Note: In normalized format, repeats are already flattened
      // So we'll treat consecutive similar steps as a repeat group
      // For now, we'll create individual steps
      steps.push(suuntoFieldsStep);
    } else {
      // Check if we should group consecutive interval steps into a repeat
      const isInterval =
        step.stepType === WORKOUT_STEP_TYPE.INTERVAL_ACTIVE ||
        step.stepType === WORKOUT_STEP_TYPE.INTERVAL_REST;

      if (isInterval && !currentRepeat) {
        // Start a repeat block
        currentRepeat = {
          type: 'repeat',
          times: 1, // Will be determined by counting steps
          steps: [],
        };
      }

      if (currentRepeat) {
        repeatSteps.push(suuntoFieldsStep);
        // Check if next step is also an interval
        const nextStep = workout.steps[i + 1];
        if (
          !nextStep ||
          (nextStep.stepType !== WORKOUT_STEP_TYPE.INTERVAL_ACTIVE &&
            nextStep.stepType !== WORKOUT_STEP_TYPE.INTERVAL_REST)
        ) {
          // End of interval block, finalize repeat
          // Count work intervals
          const workIntervals = repeatSteps.filter((s) =>
            s.fields.some((f) => f.type !== 'text'),
          ).length;
          currentRepeat.times = Math.max(1, Math.floor(workIntervals / 2));
          currentRepeat.steps = repeatSteps;
          steps.push(currentRepeat);
          currentRepeat = null;
          repeatSteps = [];
        }
      } else {
        steps.push(suuntoFieldsStep);
      }
    }
  }

  // Finalize any remaining repeat
  if (currentRepeat) {
    const workIntervals = repeatSteps.filter((s) =>
      s.fields.some((f) => f.type !== 'text'),
    ).length;
    currentRepeat.times = Math.max(1, Math.floor(workIntervals / 2));
    currentRepeat.steps = repeatSteps;
    steps.push(currentRepeat);
  }

  const guide: SuuntoGuide = {
    type: 'sequence',
    name: workoutName,
    description,
    ...(richText && { richText }),
    shortDescription,
    owner: GUIDE_OWNER,
    url: GUIDE_URL,
    ...(activityIds.length > 0 && { activities: activityIds }),
    usage: 'workout',
    localDate: date,
    externalId: workoutId.toString(),
    steps,
  };

  return guide;
}
