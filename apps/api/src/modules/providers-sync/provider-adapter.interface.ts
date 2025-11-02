import type { NormalizedWorkout } from '@openathlete/shared/src/types/workout-normalized';

export type Provider = 'garmin' | 'suunto' | 'coros';

export interface UpsertPlannedWorkoutInput {
  athleteId: number;
  date: string; // YYYY-MM-DD (UTC-date only)
  normalized: NormalizedWorkout;
  previousExternalId?: string;
}

export interface UpsertPlannedWorkoutResult {
  externalId: string;
}

export interface ProviderAdapter {
  getProvider(): Provider;
  upsertPlannedWorkout(
    input: UpsertPlannedWorkoutInput,
  ): Promise<UpsertPlannedWorkoutResult>;
}
