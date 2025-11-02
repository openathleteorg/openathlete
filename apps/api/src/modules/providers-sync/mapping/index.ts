import type { NormalizedWorkout } from '@openathlete/shared/src/types/workout-normalized';

export interface ProviderPlannedWorkoutPayload {
  // Generic shape; concrete adapters will serialize as needed
  date: string; // YYYY-MM-DD
  title?: string | null;
  description?: string | null;
  steps: Array<{
    type: string;
    durationType: string;
    durationValue?: number | null;
    target?: {
      type: string;
      min?: number | null;
      max?: number | null;
      value?: number | null;
      zone?: number | null;
      unit?: string | null;
    } | null;
  }>;
}

export type ProviderMapper = (
  date: string,
  workout: NormalizedWorkout,
) => ProviderPlannedWorkoutPayload;

export { mapToGarmin } from './garmin.mapper';
export { mapToSuunto } from './suunto.mapper';
export { mapToCoros } from './coros.mapper';
