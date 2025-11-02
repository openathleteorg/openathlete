import { Injectable, Logger } from '@nestjs/common';

import type {
  ProviderAdapter,
  UpsertPlannedWorkoutInput,
  UpsertPlannedWorkoutResult,
} from '../provider-adapter.interface';

@Injectable()
export class CorosAdapter implements ProviderAdapter {
  private readonly logger = new Logger(CorosAdapter.name);

  getProvider(): 'coros' {
    return 'coros';
  }

  async upsertPlannedWorkout(
    input: UpsertPlannedWorkoutInput,
  ): Promise<UpsertPlannedWorkoutResult> {
    this.logger.debug(
      `[MOCK] Upserting workout for athlete ${input.athleteId} on ${input.date}`,
    );

    // Mock implementation: generate a stable external ID based on inputs
    // In real implementation, this would call Coros API
    const externalId = `coros_${input.athleteId}_${input.date}_${Date.now()}`;

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    this.logger.debug(`[MOCK] Generated external ID: ${externalId}`);

    return { externalId };
  }
}
