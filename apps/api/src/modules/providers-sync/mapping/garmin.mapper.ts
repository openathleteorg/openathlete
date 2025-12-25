import type {
  NormalizedWorkout,
  NormalizedWorkoutStep,
  NormalizedWorkoutStepTarget,
  WorkoutDto,
} from '@openathlete/shared';
import { SPORT_TYPE, WORKOUT_STEP_TYPE } from '@openathlete/shared';

import {
  mapDurationTypeToGarmin,
  mapSportToGarmin,
  mapStepTypeToGarminIntensity,
  mapTargetTypeToGarmin,
  mapTargetValue,
} from './garmin-helpers';
import type {
  GarminSegment,
  GarminStep,
  GarminWorkout,
  GarminWorkoutRepeatStep,
  GarminWorkoutStep,
} from './garmin.types';
import type { ProviderPlannedWorkoutPayload } from './index';

const WORKOUT_PROVIDER = 'OpenAthlete';
const WORKOUT_SOURCE_ID = 'openathlete';

function truncateDescription(
  description: string | null,
  maxLength: number,
): string {
  if (!description) return '';
  return description.length > maxLength
    ? description.substring(0, maxLength)
    : description;
}

function mapNormalizedStepToGarmin(
  step: NormalizedWorkoutStep,
  stepOrder: number,
  sport: SPORT_TYPE,
  metrics?: Record<string, { value: number } | number>,
): GarminWorkoutStep {
  const intensity = mapStepTypeToGarminIntensity(step.stepType, sport);
  const durationType = mapDurationTypeToGarmin(
    step.durationType,
    sport,
    intensity,
  );
  const primaryTarget = step.targets?.[0];
  const targetMapping = primaryTarget
    ? mapTargetValue(primaryTarget, sport, metrics)
    : {
        targetValue: null,
        targetValueLow: null,
        targetValueHigh: null,
        targetValueType: null,
      };

  const garminTargetType = primaryTarget
    ? mapTargetTypeToGarmin(primaryTarget.targetType, sport)
    : null;

  return {
    type: 'WorkoutStep',
    stepOrder,
    intensity,
    description: truncateDescription(step.notes ?? step.name ?? null, 512),
    durationType,
    durationValue: step.durationValue ?? null,
    durationValueType: null,
    targetType: garminTargetType,
    targetValue: targetMapping.targetValue,
    targetValueLow: targetMapping.targetValueLow,
    targetValueHigh: targetMapping.targetValueHigh,
    targetValueType: targetMapping.targetValueType,
    secondaryTargetType: null,
    secondaryTargetValue: null,
    secondaryTargetValueLow: null,
    secondaryTargetValueHigh: null,
    secondaryTargetValueType: null,
    strokeType: null,
    drillType: null,
    equipmentType: null,
    exerciseCategory: null,
    weightValue: null,
    weightDisplayUnit: null,
  };
}

export function mapWorkoutDtoToGarmin(
  ownerId: number | null,
  workout: WorkoutDto,
  sport: SPORT_TYPE,
  title: string | null = null,
  description: string | null = null,
  metrics?: Record<string, { value: number } | number>,
): GarminWorkout {
  const garminSport = mapSportToGarmin(sport);
  const isSwimming = sport === SPORT_TYPE.SWIMMING;
  const workoutName = title || 'Workout';
  const workoutDescription = truncateDescription(description, 1024);

  const steps: GarminStep[] = [];
  let stepOrder = 1;

  for (const step of workout.steps || []) {
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
      const repeatSteps: GarminWorkoutStep[] = [];
      let repeatStepOrder = stepOrder;

      for (const childStep of step.repeatBlock.childSteps || []) {
        const normalizedChild: NormalizedWorkoutStep = {
          orderIndex: repeatStepOrder,
          stepType: childStep.stepType,
          name: childStep.name ?? null,
          notes: childStep.notes ?? null,
          durationType: childStep.durationType,
          durationValue: childStep.durationValue ?? null,
          durationTarget: childStep.durationTarget ?? null,
          targets: (childStep.targets || []).map(
            (t: NormalizedWorkoutStepTarget) => ({
              targetType: t.targetType,
              targetMin: t.targetMin ?? null,
              targetMax: t.targetMax ?? null,
              targetValue: t.targetValue ?? null,
              metricType: t.metricType ?? null,
            }),
          ),
        };

        repeatSteps.push(
          mapNormalizedStepToGarmin(
            normalizedChild,
            repeatStepOrder,
            sport,
            metrics,
          ),
        );
        repeatStepOrder += 1;
      }

      const repeatStep: GarminWorkoutRepeatStep = {
        type: 'WorkoutRepeatStep',
        stepOrder,
        repeatType: 'REPEAT_UNTIL_STEPS_CMPLT',
        repeatValue: step.repeatBlock.repetitions,
        skipLastRestStep: isSwimming,
        steps: repeatSteps,
      };

      steps.push(repeatStep);
      stepOrder = repeatStepOrder;
    } else {
      const normalizedStep: NormalizedWorkoutStep = {
        orderIndex: stepOrder,
        stepType: step.stepType,
        name: step.name ?? null,
        notes: step.notes ?? null,
        durationType: step.durationType,
        durationValue: step.durationValue ?? null,
        durationTarget: step.durationTarget ?? null,
        targets: (step.targets || []).map((t: NormalizedWorkoutStepTarget) => ({
          targetType: t.targetType,
          targetMin: t.targetMin ?? null,
          targetMax: t.targetMax ?? null,
          targetValue: t.targetValue ?? null,
          metricType: t.metricType ?? null,
        })),
      };

      steps.push(
        mapNormalizedStepToGarmin(normalizedStep, stepOrder, sport, metrics),
      );
      stepOrder += 1;
    }
  }

  const segment: GarminSegment = {
    segmentOrder: 1,
    sport: garminSport,
    poolLength: isSwimming ? null : null,
    poolLengthUnit: isSwimming ? null : null,
    steps: steps as GarminWorkoutStep[],
  };

  const workoutPayload: GarminWorkout = {
    workoutName,
    description: workoutDescription,
    sport: garminSport,
    poolLength: isSwimming ? null : null,
    poolLengthUnit: isSwimming ? null : null,
    workoutProvider: WORKOUT_PROVIDER,
    workoutSourceId: WORKOUT_SOURCE_ID,
    isSessionTransitionEnabled: false,
    segments: [segment],
  };

  if (typeof ownerId === 'number') {
    workoutPayload.ownerId = ownerId;
  }

  return workoutPayload;
}

export function mapToGarmin(
  date: string,
  workout: NormalizedWorkout,
): ProviderPlannedWorkoutPayload {
  return {
    date,
    title: workout.title ?? null,
    description: workout.description ?? null,
    steps: (workout.steps || []).map((step) => ({
      type: step.stepType,
      durationType: step.durationType,
      durationValue: step.durationValue ?? null,
      target: step.targets?.[0]
        ? {
            type: step.targets[0].targetType,
            min: step.targets[0].targetMin ?? null,
            max: step.targets[0].targetMax ?? null,
            value: step.targets[0].targetValue ?? null,
            zone:
              step.targets[0].targetType === 'ZONE'
                ? (step.targets[0].targetValue ?? null)
                : null,
          }
        : null,
    })),
  };
}
