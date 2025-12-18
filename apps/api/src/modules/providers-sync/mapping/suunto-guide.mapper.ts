import type {
  WorkoutDto,
  WorkoutStepDto,
  WorkoutStepTargetDto,
} from '@openathlete/shared';
import {
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  getTargetIntensity,
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
 * Resolve target values to absolute values using getTargetIntensity.
 */
function resolveTargetValues(
  target: WorkoutStepTargetDto | undefined,
  metrics?: Record<string, { value: number } | number>,
): { value: number | null; min: number | null; max: number | null } {
  if (!target) {
    return { value: null, min: null, max: null };
  }

  return getTargetIntensity(
    {
      targetType: target.targetType,
      targetValue: target.targetValue ?? null,
      targetMin: target.targetMin ?? null,
      targetMax: target.targetMax ?? null,
      metricType: target.metricType ?? null,
    },
    metrics,
  );
}

/**
 * Map target to Suunto target field
 */
function mapTargetToSuuntoField(
  target: WorkoutStepTargetDto | undefined,
  sport: SPORT_TYPE,
  metrics?: Record<string, { value: number } | number>,
): SuuntoField | null {
  if (!target || target.targetType === WORKOUT_TARGET_TYPE.OPEN) {
    return null;
  }

  const targetValues = resolveTargetValues(target, metrics);

  switch (target.targetType) {
    case WORKOUT_TARGET_TYPE.HEARTRATE:
    case WORKOUT_TARGET_TYPE.ZONE: {
      const field: SuuntoTargetHeartRateField = {
        type: 'targetHeartRate',
        title: 'Target HR',
      };

      const isValidHr = (v: number): boolean => v >= 30 && v <= 250;

      if (targetValues.min !== null && targetValues.max !== null) {
        const rawMin = Math.round(targetValues.min);
        const rawMax = Math.round(targetValues.max);
        if (isValidHr(rawMin) && isValidHr(rawMax)) {
          field.min = Math.min(rawMin, rawMax);
          field.max = Math.max(rawMin, rawMax);
        } else {
          return null;
        }
      } else if (targetValues.value !== null) {
        const value = Math.round(targetValues.value);
        if (isValidHr(value)) {
          field.value = value;
        } else {
          return null;
        }
      } else {
        return null;
      }

      return field;
    }

    case WORKOUT_TARGET_TYPE.PACE: {
      const field: SuuntoTargetPaceField = {
        type: 'targetPace',
        title: 'Target Pace',
      };

      const isValidPace = (v: number): boolean => v >= 1 && v <= 7;

      if (targetValues.min !== null && targetValues.max !== null) {
        if (isValidPace(targetValues.min) && isValidPace(targetValues.max)) {
          const paceMin = Math.min(targetValues.min, targetValues.max);
          const paceMax = Math.max(targetValues.min, targetValues.max);
          field.min = paceMin;
          field.max = paceMax;
        } else {
          return null;
        }
      } else if (targetValues.value !== null) {
        if (isValidPace(targetValues.value)) {
          field.value = targetValues.value;
        } else {
          return null;
        }
      } else {
        return null;
      }

      return field;
    }

    case WORKOUT_TARGET_TYPE.POWER: {
      const field: SuuntoTargetPowerField = {
        type: 'targetPower',
        title: 'Target Power',
      };

      const isValidPower = (v: number): boolean => v >= 50 && v <= 1000;

      if (targetValues.min !== null && targetValues.max !== null) {
        if (isValidPower(targetValues.min) && isValidPower(targetValues.max)) {
          field.min = Math.min(targetValues.min, targetValues.max);
          field.max = Math.max(targetValues.min, targetValues.max);
        } else {
          return null;
        }
      } else if (targetValues.value !== null) {
        if (isValidPower(targetValues.value)) {
          field.value = targetValues.value;
        } else {
          return null;
        }
      } else {
        return null;
      }

      return field;
    }

    case WORKOUT_TARGET_TYPE.CADENCE: {
      const field: SuuntoTargetCadenceField = {
        type: 'targetCadence',
        title: 'Target Cad',
      };

      const isValidCadence = (rpm: number): boolean => rpm >= 60 && rpm <= 200;

      if (targetValues.min !== null && targetValues.max !== null) {
        if (
          isValidCadence(targetValues.min) &&
          isValidCadence(targetValues.max)
        ) {
          const cadMin = Math.min(targetValues.min, targetValues.max) / 60;
          const cadMax = Math.max(targetValues.min, targetValues.max) / 60;
          field.min = cadMin;
          field.max = cadMax;
        } else {
          return null;
        }
      } else if (targetValues.value !== null) {
        if (isValidCadence(targetValues.value)) {
          field.value = targetValues.value / 60;
        } else {
          return null;
        }
      } else {
        return null;
      }

      return field;
    }

    case WORKOUT_TARGET_TYPE.RPE:
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
  step: WorkoutStepDto,
): SuuntoFieldsStep['transitions'] {
  const transitions: SuuntoFieldsStep['transitions'] = [];

  switch (step.durationType) {
    case WORKOUT_DURATION_TYPE.TIME:
      if (step.durationValue) {
        transitions.push({
          condition: {
            type: 'or',
            conditions: [
              { type: 'stepDuration', value: step.durationValue },
              { type: 'manualLap' },
            ],
          },
        });
      }
      break;

    case WORKOUT_DURATION_TYPE.DISTANCE:
      if (step.durationValue) {
        transitions.push({
          condition: {
            type: 'or',
            conditions: [
              { type: 'stepDistance', value: step.durationValue },
              { type: 'manualLap' },
            ],
          },
        });
      }
      break;

    case WORKOUT_DURATION_TYPE.LAP_BUTTON:
    case WORKOUT_DURATION_TYPE.OPEN:
      transitions.push({ condition: { type: 'manualLap' } });
      break;

    default:
      transitions.push({ condition: { type: 'manualLap' } });
      break;
  }

  return transitions.length > 0 ? transitions : undefined;
}

/**
 * Map step to Suunto fields based on sport and targets
 */
function mapStepToFields(
  step: WorkoutStepDto,
  sport: SPORT_TYPE,
  metrics?: Record<string, { value: number } | number>,
): SuuntoField[] {
  const fields: SuuntoField[] = [];

  const targetField = step.targets?.[0]
    ? mapTargetToSuuntoField(step.targets[0], sport, metrics)
    : null;

  if (targetField) {
    fields.push(targetField);
  }

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

  // Add countdown field
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
    fields.push({ type: 'distance', window: 'step', title: 'Dist' });
  } else if (isCycling) {
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
    fields.push({ type: 'distance', window: 'step', title: 'Dist' });
  } else {
    if (!targetField || targetField.type !== 'targetHeartRate') {
      fields.push({
        type: 'heartRate',
        window: 'manualLap',
        aggregate: 'average',
        title: 'HR',
      });
    }
    fields.push({ type: 'distance', window: 'step', title: 'Dist' });
    fields.push({ type: 'duration', window: 'step', title: 'Time' });
  }

  // Add step notes/name as text
  const stepText = step.notes || step.name;
  if (stepText && fields.length < 5) {
    fields.push({ type: 'text', value: truncateText(stepText, 54) });
  }

  return fields.slice(0, 5);
}

/**
 * Map WorkoutStepDto to Suunto FieldsStep
 */
function mapStepToSuuntoFieldsStep(
  step: WorkoutStepDto,
  sport: SPORT_TYPE,
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

  // Add notification for key step types
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
 * Map WorkoutDto to Suunto Guide
 *
 * This function preserves the repeat structure from the WorkoutDto,
 * mapping repeat blocks to Suunto's native RepeatStep type.
 */
export function mapWorkoutDtoToSuuntoGuide(
  workout: WorkoutDto,
  sport: SPORT_TYPE,
  title: string | null,
  description: string | null,
  date: string, // YYYY-MM-DD
  workoutId: number,
  metrics?: Record<string, { value: number } | number>,
): SuuntoGuide {
  const activityIds = mapSportToSuuntoActivityIds(sport);
  const workoutName = truncateText(title || 'Workout', 60);
  const desc = truncateText(description || title || 'Workout', 256);
  const shortDescription = truncateText(title || 'Workout', 23);
  const richText = description ? truncateText(description, 100000) : undefined;

  // Sort steps by orderIndex
  const sortedSteps = [...(workout.steps || [])].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  );

  const steps: SuuntoStep[] = [];

  for (const step of sortedSteps) {
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
      // Map to Suunto RepeatStep
      const childSteps = [...(step.repeatBlock.childSteps || [])].sort(
        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
      );

      const repeatStep: SuuntoRepeatStep = {
        type: 'repeat',
        times: step.repeatBlock.repetitions || 1,
        steps: childSteps.map((child) =>
          mapStepToSuuntoFieldsStep(child, sport, metrics),
        ),
      };

      steps.push(repeatStep);
    } else {
      // Map to Suunto FieldsStep
      steps.push(mapStepToSuuntoFieldsStep(step, sport, metrics));
    }
  }

  const guide: SuuntoGuide = {
    type: 'sequence',
    name: workoutName,
    description: desc,
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
