import type { NormalizedWorkout } from '@openathlete/shared';

export type Provider = 'garmin' | 'suunto' | 'coros';

export interface UpsertPlannedWorkoutInput {
  athleteId: number;
  workoutId: number;
  date: string; // YYYY-MM-DD (UTC-date only)
  normalized: NormalizedWorkout;
  previousExternalId?: string;
  previousScheduleId?: string;
}

export interface UpsertPlannedWorkoutResult {
  externalId: string;
  scheduleId?: string;
}

export interface DeletePlannedWorkoutInput {
  athleteId: number;
  externalId?: string | null;
  scheduleId?: string | null;
  date?: string; // YYYY-MM-DD
}

export interface ProviderAdapter {
  getProvider(): Provider;
  upsertPlannedWorkout(
    input: UpsertPlannedWorkoutInput,
  ): Promise<UpsertPlannedWorkoutResult>;
  deletePlannedWorkout?(input: DeletePlannedWorkoutInput): Promise<void>;
}
