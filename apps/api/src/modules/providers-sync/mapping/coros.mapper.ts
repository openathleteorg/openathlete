import type { NormalizedWorkout } from '@openathlete/shared/src/types/workout-normalized';

import type { ProviderMapper, ProviderPlannedWorkoutPayload } from './index';

// Coros supports structured intervals; similar simplification as others

function simplifyStep(
  step: NormalizedWorkout['steps'][number],
): ProviderPlannedWorkoutPayload['steps'][number] {
  const base = {
    type: step.stepType,
    durationType: step.durationType,
    durationValue: step.durationValue ?? null,
  } as ProviderPlannedWorkoutPayload['steps'][number];

  const t = step.targets?.[0];
  if (!t || t.targetType === 'OPEN') {
    return { ...base, target: null };
  }

  return {
    ...base,
    target: {
      type: t.targetType,
      min: t.targetMin ?? null,
      max: t.targetMax ?? null,
      value: t.targetValue ?? null,
      zone: t.targetType === 'ZONE' ? (t.targetValue ?? null) : null,
      unit: t.unit ?? null,
    },
  };
}

export const mapToCoros: ProviderMapper = (
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
