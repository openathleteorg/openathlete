import { SportType } from '@openathlete/database';
import type {
  NormalizedWorkout,
  NormalizedWorkoutStepTarget,
  WorkoutDto,
  WorkoutStepDto,
} from '@openathlete/shared';
import { WORKOUT_STEP_TYPE } from '@openathlete/shared';

import { GARMIN_EXERCISES } from './garmin-exercises';
import {
  GarminMetrics,
  GarminZone,
  mapDurationToGarmin,
  mapSportToGarmin,
  mapStepTypeToGarminIntensity,
  mapTargetToGarmin,
} from './garmin-helpers';
import type {
  GarminStep,
  GarminWorkout,
  GarminWorkoutRepeatStep,
  GarminWorkoutStep,
} from './garmin.types';
import type { ProviderPlannedWorkoutPayload } from './index';

/** Garmin's exercise for a catalog exercise; custom ones go without */
export function garminExercise(exerciseRef: string | null | undefined): {
  exerciseCategory: string | null;
  exerciseName: string | null;
} {
  const found = exerciseRef?.startsWith('c:')
    ? GARMIN_EXERCISES[exerciseRef.slice(2)]
    : undefined;
  return {
    exerciseCategory: found?.[0] ?? null,
    exerciseName: found?.[1] ?? null,
  };
}

// Shown to the user in Garmin Connect; 20 characters at most
const WORKOUT_PROVIDER = 'OpenAthlete';
const WORKOUT_SOURCE_ID = 'OpenAthlete';

/** Garmin sports whose steps take an exercise */
const EXERCISE_SPORTS = new Set([
  'STRENGTH_TRAINING',
  'CARDIO_TRAINING',
  'HIIT',
  'PILATES',
  'YOGA',
]);

/** Garmin limits: 100 steps per sport, repeats counted */
export const GARMIN_MAX_STEPS = 100;

export interface GarminMappingContext {
  metrics?: GarminMetrics;
  zones?: GarminZone[];
}

function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) : text;
}

function mapStep(
  step: WorkoutStepDto,
  stepOrder: number,
  sport: SportType,
  context: GarminMappingContext,
): GarminWorkoutStep {
  const intensity = mapStepTypeToGarminIntensity(step.stepType, sport);
  const duration = mapDurationToGarmin(
    step.durationType,
    step.durationValue,
    sport,
    intensity,
  );
  const targets = (step.targets ?? []) as NormalizedWorkoutStepTarget[];
  const mapped = targets.map((target) =>
    mapTargetToGarmin(target, sport, context.metrics, context.zones),
  );
  // The first target the watch can follow; weights and notes from any
  const primary = mapped.find(
    (target) => target.targetType || target.secondaryTargetType,
  );
  const weightValue =
    mapped.find((target) => target.weightValue !== null)?.weightValue ?? null;

  const description = [
    step.notes || step.name,
    duration.note,
    ...mapped.map((target) => target.note),
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    type: 'WorkoutStep',
    stepOrder,
    intensity,
    description: truncate(description, 512),
    durationType: duration.durationType,
    durationValue: duration.durationValue,
    durationValueType: duration.durationValueType,
    targetType: primary?.targetType ?? null,
    targetValue: null,
    targetValueLow: primary?.targetValueLow ?? null,
    targetValueHigh: primary?.targetValueHigh ?? null,
    targetValueType: primary?.targetValueType ?? null,
    secondaryTargetType: primary?.secondaryTargetType ?? null,
    secondaryTargetValue: null,
    secondaryTargetValueLow: primary?.secondaryTargetValueLow ?? null,
    secondaryTargetValueHigh: primary?.secondaryTargetValueHigh ?? null,
    secondaryTargetValueType: null,
    strokeType: null,
    drillType: null,
    equipmentType: null,
    // Exercises only exist in workouts of the sports that have them
    ...(EXERCISE_SPORTS.has(mapSportToGarmin(sport))
      ? garminExercise(step.exerciseRef)
      : { exerciseCategory: null, exerciseName: null }),
    weightValue,
    weightDisplayUnit: weightValue !== null ? 'KILOGRAM' : null,
  };
}

export function mapWorkoutDtoToGarmin(
  workout: WorkoutDto,
  sport: SportType,
  title: string | null = null,
  description: string | null = null,
  context: GarminMappingContext = {},
): GarminWorkout {
  const garminSport = mapSportToGarmin(sport);
  const isSwimming = garminSport === 'LAP_SWIMMING';

  const steps: GarminStep[] = [];
  let stepOrder = 1;

  for (const step of (workout.steps ?? []) as WorkoutStepDto[]) {
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT) {
      const children = (step.repeatBlock?.childSteps ?? []) as WorkoutStepDto[];
      if (children.length === 0) continue;

      const repeatOrder = stepOrder;
      stepOrder += 1;
      const repeatSteps = children.map((child) =>
        mapStep(child, stepOrder++, sport, context),
      );
      const repeat: GarminWorkoutRepeatStep = {
        type: 'WorkoutRepeatStep',
        stepOrder: repeatOrder,
        repeatType: 'REPEAT_UNTIL_STEPS_CMPLT',
        repeatValue: step.repeatBlock?.repetitions ?? 1,
        skipLastRestStep: isSwimming,
        steps: repeatSteps,
      };
      steps.push(repeat);
    } else {
      steps.push(mapStep(step, stepOrder++, sport, context));
    }
  }

  // Send-off times and pace targets need a pool unit; the pool length stays
  // unspecified, so the workout runs in any pool
  const usesSwimPace =
    isSwimming &&
    steps
      .flatMap((step) =>
        step.type === 'WorkoutRepeatStep' ? step.steps : [step],
      )
      .some((step) => step.secondaryTargetType === 'PACE_ZONE');
  const poolLengthUnit = usesSwimPace ? 'METER' : null;

  return {
    workoutName: truncate(title || 'Workout', 100),
    description: truncate(description, 1024),
    sport: garminSport,
    poolLength: null,
    poolLengthUnit,
    workoutProvider: WORKOUT_PROVIDER,
    workoutSourceId: WORKOUT_SOURCE_ID,
    isSessionTransitionEnabled: false,
    segments: [
      {
        segmentOrder: 1,
        sport: garminSport,
        poolLength: null,
        poolLengthUnit,
        steps,
      },
    ],
  };
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
