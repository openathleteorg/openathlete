import { Injectable } from '@nestjs/common';

import { trainingEventSchema } from '@openathlete/shared';

import { eventGenerationAgent } from 'src/mastra/agents';
import { TrainingLoadService } from 'src/modules/core/services/training-load.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  type TrainingEventSchema,
  buildMetricsContext,
  buildWorkoutTargetsInstructions,
  buildZonesContext,
  convertWorkoutPaceTargetsToMs,
  createRuntimeContext,
  createZoneIdMap,
  fetchAthleteMetrics,
  fetchAthleteZones,
  formatZonesByType,
  getLatestMetrics,
  validateNoNestedRepeatBlocks,
  validateWorkoutZoneTargets,
  withRetry,
} from './event-ai-helpers';

@Injectable()
export class EventGenerationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly trainingLoadService: TrainingLoadService,
  ) {}

  async generateTrainingEvent(
    prompt: string,
    date: Date,
    athleteId: number,
  ): Promise<TrainingEventSchema> {
    const zones = await fetchAthleteZones(this.prismaService, athleteId);
    const metrics = await fetchAthleteMetrics(this.prismaService, athleteId);
    const latestMetrics = getLatestMetrics(metrics);
    const zonesByType = formatZonesByType(zones);
    const zonesContext = buildZonesContext(zonesByType);
    const metricsContext = buildMetricsContext(latestMetrics);

    const fullPrompt = `

Generate a training event based on this request: ${prompt}

ATHLETE CONTEXT:
${zonesContext ? `TRAINING ZONES:\n${zonesContext}` : 'No training zones configured'}
${metricsContext ? `\nLATEST METRICS:\n${metricsContext}` : '\nNo metrics available'}

CRITICAL REQUIREMENTS:
- Return a complete training event with workout structure
- For intervals (e.g., "10x 30s/30s"), create ONE REPEAT step with repeatBlock
- Use proper step types: WARMUP, STEADY, INTERVAL_ACTIVE, INTERVAL_REST, COOLDOWN, REPEAT
- Set appropriate startDate and endDate based on the event date

${buildWorkoutTargetsInstructions()}`;

    const runtimeContext = createRuntimeContext(
      this.prismaService,
      athleteId,
      this.trainingLoadService,
    );

    const zoneIdMap = createZoneIdMap(zones);

    const response = await withRetry(async () => {
      const result = await eventGenerationAgent.generate(fullPrompt, {
        runtimeContext,
        structuredOutput: {
          schema: trainingEventSchema,
        },
      });

      if (!result.object) {
        throw new Error(
          'Failed to generate event: no structured output received',
        );
      }

      // Validate the generated event - if validation fails, retry
      if (result.object.workout) {
        validateNoNestedRepeatBlocks(result.object.workout);
        validateWorkoutZoneTargets(result.object.workout, zoneIdMap, zones);
        convertWorkoutPaceTargetsToMs(result.object.workout);
      }

      return result;
    });

    if (!response.object) {
      throw new Error(
        'Failed to generate event: no structured output received',
      );
    }

    return response.object;
  }
}
