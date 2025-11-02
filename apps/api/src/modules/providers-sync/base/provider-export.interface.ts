import type { NormalizedWorkout } from '@openathlete/shared';

/**
 * Interface for providers that support workout export
 * Already implemented in ProviderAdapter, but keeping for consistency
 */
export interface ProviderExportCapability {
  /**
   * Export a workout to the provider
   */
  upsertPlannedWorkout(input: {
    athleteId: number;
    date: string; // YYYY-MM-DD
    normalized: NormalizedWorkout;
    previousExternalId?: string;
  }): Promise<{ externalId: string }>;
}

