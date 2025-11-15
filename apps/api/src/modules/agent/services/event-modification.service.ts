import { Injectable } from '@nestjs/common';

import { eventModificationAgent } from 'src/mastra/agents';
import { TrainingLoadService } from 'src/modules/core/services/training-load.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  type TrainingEventSchema,
  buildMetricsContext,
  buildWorkoutTargetsInstructions,
  buildZonesContext,
  createRuntimeContext,
  createZoneIdMap,
  fetchAthleteMetrics,
  fetchAthleteZones,
  formatZonesByType,
  getLatestMetrics,
  trainingEventSchema,
  validateWorkoutZoneTargets,
} from './event-ai-helpers';

@Injectable()
export class EventModificationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly trainingLoadService: TrainingLoadService,
  ) {}

  async modifyTrainingEvent(
    prompt: string,
    athleteId: number,
    eventData: any,
  ): Promise<TrainingEventSchema> {
    // Use provided event data (always use the current state from frontend)
    const existingEventContext = {
      name: eventData.name,
      description: eventData.description || '',
      sport: eventData.sport,
      startDate:
        eventData.startDate instanceof Date
          ? eventData.startDate.toISOString()
          : eventData.startDate,
      endDate:
        eventData.endDate instanceof Date
          ? eventData.endDate.toISOString()
          : eventData.endDate,
      goalDuration: eventData.goalDuration || undefined,
      goalDistance: (eventData as any).goalDistance || undefined,
      goalElevationGain: (eventData as any).goalElevationGain || undefined,
      goalRpe: (eventData as any).goalRpe || undefined,
      workout: eventData.workout
        ? {
            steps: eventData.workout.steps.map((step: any) => {
              const baseStep = {
                stepType: step.stepType,
                name: step.name || undefined,
                durationType: step.durationType || undefined,
                durationValue: step.durationValue || undefined,
                notes: step.notes || undefined,
                targets: (step.targets || []).map((target: any) => {
                  // Handle both formats: legacy { targetType: value } or new { targetType, targetValue, ... }
                  if (typeof target === 'object' && target !== null) {
                    // If it's already in the new format, use it as is
                    if (target.targetType) {
                      return {
                        targetType: target.targetType,
                        targetMin: target.targetMin ?? undefined,
                        targetMax: target.targetMax ?? undefined,
                        targetValue: target.targetValue ?? undefined,
                        unit: target.unit ?? undefined,
                      };
                    }
                    // Legacy format: { targetType: value }
                    const entries = Object.entries(target);
                    if (entries.length > 0) {
                      return {
                        targetType: entries[0][0],
                        targetValue: entries[0][1] as number,
                      };
                    }
                  }
                  return {};
                }),
              };

              if (step.repeatBlock) {
                return {
                  ...baseStep,
                  repeatBlock: {
                    repetitions: step.repeatBlock.repetitions,
                    childSteps: step.repeatBlock.childSteps.map(
                      (childStep: any) => ({
                        stepType: childStep.stepType,
                        name: childStep.name || undefined,
                        durationType: childStep.durationType || undefined,
                        durationValue: childStep.durationValue || undefined,
                        notes: childStep.notes || undefined,
                        targets: (childStep.targets || []).map(
                          (target: any) => {
                            // Handle both formats: legacy { targetType: value } or new { targetType, targetValue, ... }
                            if (typeof target === 'object' && target !== null) {
                              // If it's already in the new format, use it as is
                              if (target.targetType) {
                                return {
                                  targetType: target.targetType,
                                  targetMin: target.targetMin ?? undefined,
                                  targetMax: target.targetMax ?? undefined,
                                  targetValue: target.targetValue ?? undefined,
                                  unit: target.unit ?? undefined,
                                };
                              }
                              // Legacy format: { targetType: value }
                              const entries = Object.entries(target);
                              if (entries.length > 0) {
                                return {
                                  targetType: entries[0][0],
                                  targetValue: entries[0][1] as number,
                                };
                              }
                            }
                            return {};
                          },
                        ),
                      }),
                    ),
                  },
                };
              }

              return baseStep;
            }),
          }
        : null,
    };

    // Fetch athlete's training zones and metrics
    const zones = await fetchAthleteZones(this.prismaService, athleteId);
    const metrics = await fetchAthleteMetrics(this.prismaService, athleteId);
    const latestMetrics = getLatestMetrics(metrics);
    const zonesByType = formatZonesByType(zones);
    const zonesContext = buildZonesContext(zonesByType);
    const metricsContext = buildMetricsContext(latestMetrics);

    const fullPrompt = `
You are modifying an existing training event. This is a COMPLETE UPDATE - you must return the FULL, COMPLETE event with ALL workout steps.

MODIFICATION REQUEST: ${prompt}

CURRENT EVENT (to be modified):
${JSON.stringify(existingEventContext, null, 2)}

ATHLETE CONTEXT:
${zonesContext ? `TRAINING ZONES:\n${zonesContext}` : 'No training zones configured'}
${metricsContext ? `\nLATEST METRICS:\n${metricsContext}` : '\nNo metrics available'}

CRITICAL REQUIREMENTS FOR THE UPDATE:
1. Return the COMPLETE, FULL training event - this is an UPDATE operation, not a partial modification
2. Include ALL workout steps in the response - do not truncate or omit any steps
3. If the modification request mentions specific changes, apply them while keeping the rest intact
4. If the modification request is general, return the complete event with all steps
5. For intervals (e.g., "10x 30s/30s"), create ONE REPEAT step with repeatBlock containing childSteps
6. Use proper step types: WARMUP, STEADY, INTERVAL_ACTIVE, INTERVAL_REST, COOLDOWN, REPEAT
7. Include ALL steps from the current workout unless explicitly asked to remove them
8. Maintain the event's startDate and endDate unless explicitly changed
9. Return the workout.steps array with ALL steps - never truncate the array

${buildWorkoutTargetsInstructions()}
- Preserve existing targets unless the modification request explicitly changes them

IMPORTANT: This is a FULL UPDATE. Return the complete event structure with all fields and all workout steps.`;

    const runtimeContext = createRuntimeContext(
      this.prismaService,
      athleteId,
      this.trainingLoadService,
      existingEventContext,
    );

    const response = await eventModificationAgent.generate(fullPrompt, {
      runtimeContext,
      structuredOutput: {
        schema: trainingEventSchema as any, // Type assertion needed for complex nested schemas
      },
    });

    if (!response.object) {
      throw new Error('Failed to modify event: no structured output received');
    }

    // Validate and fix zone targets
    const zoneIdMap = createZoneIdMap(zones);
    if (response.object.workout) {
      validateWorkoutZoneTargets(response.object.workout, zoneIdMap, zones);
    }

    // Log for debugging - check if all steps are present
    if (response.object.workout?.steps) {
      console.log(
        `[EventModification] Received ${response.object.workout.steps.length} steps`,
      );
      response.object.workout.steps.forEach((step, index) => {
        console.log(
          `  Step ${index + 1}: ${step.stepType}${step.repeatBlock ? ` (REPEAT with ${step.repeatBlock.childSteps.length} childSteps)` : ''}`,
        );
      });
    }

    // Steps are already filtered by the schema transform
    return response.object;
  }
}
