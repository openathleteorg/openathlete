import type { NormalizedWorkout } from '@openathlete/shared/src/types/workout-normalized';
import type { ProviderPlannedWorkoutPayload, ProviderMapper } from './index';

// Garmin supports structured workouts with range/single targets for HR/Power/Pace
// Graceful degradation: when unsupported, emit OPEN step with notes

function simplifyStep(step: NormalizedWorkout['steps'][number]): ProviderPlannedWorkoutPayload['steps'][number] {
  const base = {
    type: step.stepType,
    durationType: step.durationType,
    durationValue: step.durationValue ?? null,
  } as ProviderPlannedWorkoutPayload['steps'][number];

  const t = step.targets?.[0];
  if (!t || t.targetType === 'OPEN') {
    return { ...base, target: null };
  }

  const target = {
    type: t.targetType,
    min: t.targetMin ?? null,
    max: t.targetMax ?? null,
    value: t.targetValue ?? null,
    zone: t.targetType === 'ZONE' ? t.targetValue ?? null : null,
    unit: t.unit ?? null,
  };

  return { ...base, target };
}

export const mapToGarmin: ProviderMapper = (
  date: string,
  workout: NormalizedWorkout,
): ProviderPlannedWorkoutPayload => {
  return {
    date,
    title: workout.title ?? null,
    description: workout.description ?? null,
    steps: (workout.steps || []).map(simplifyStep),
  };
};


