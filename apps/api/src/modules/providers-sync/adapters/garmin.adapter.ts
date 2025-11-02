import { Injectable, Logger } from '@nestjs/common';

import type {
  ProviderAdapter,
  UpsertPlannedWorkoutInput,
  UpsertPlannedWorkoutResult,
} from '../provider-adapter.interface';

@Injectable()
export class GarminAdapter implements ProviderAdapter {
  private readonly logger = new Logger(GarminAdapter.name);

  getProvider(): 'garmin' {
    return 'garmin';
  }

  async upsertPlannedWorkout(
    input: UpsertPlannedWorkoutInput,
  ): Promise<UpsertPlannedWorkoutResult> {
    this.logger.debug(
      `[MOCK] Upserting workout for athlete ${input.athleteId} on ${input.date}`,
    );

    // Mock implementation: generate a stable external ID based on inputs
    // In real implementation, this would call Garmin Training API
    const externalId = `garmin_${input.athleteId}_${input.date}_${Date.now()}`;

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.debug(`[MOCK] Generated external ID: ${externalId}`);

    return { externalId };
  }
}
