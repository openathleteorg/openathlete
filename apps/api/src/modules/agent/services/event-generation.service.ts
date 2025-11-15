import { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';

import { Injectable } from '@nestjs/common';

import {
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  WORKOUT_TARGET_UNIT,
} from '@openathlete/shared';

import { eventGenerationAgent } from 'src/mastra/agents';
import { TrainingLoadService } from 'src/modules/core/services/training-load.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const trainingEventSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  sport: z.nativeEnum(SPORT_TYPE),
  startDate: z.string().describe('ISO date string'),
  endDate: z.string().describe('ISO date string'),
  goalDuration: z.number().optional(),
  workout: z.object({
    steps: z
      .array(
        z.union([
          z.object({
            stepType: z.nativeEnum(WORKOUT_STEP_TYPE),
            name: z.string().optional(),
            durationType: z.nativeEnum(WORKOUT_DURATION_TYPE).optional(),
            durationValue: z.number().optional(),
            notes: z.string().optional(),
            targets: z
              .array(
                z.object({
                  targetType: z.nativeEnum(WORKOUT_TARGET_TYPE),
                  targetMin: z.number().nullable().optional(),
                  targetMax: z.number().nullable().optional(),
                  targetValue: z.number().nullable().optional(),
                  unit: z.nativeEnum(WORKOUT_TARGET_UNIT).nullable().optional(),
                }),
              )
              .optional()
              .default([]),
            // For REPEAT steps: nested structure with max 1 depth
            repeatBlock: z
              .object({
                repetitions: z.number().min(1).max(99),
                childSteps: z.array(
                  z.object({
                    stepType: z.nativeEnum(WORKOUT_STEP_TYPE),
                    name: z.string().optional(),
                    durationType: z
                      .nativeEnum(WORKOUT_DURATION_TYPE)
                      .optional(),
                    durationValue: z.number().optional(),
                    notes: z.string().optional(),
                    targets: z
                      .array(
                        z.object({
                          targetType: z.nativeEnum(WORKOUT_TARGET_TYPE),
                          targetMin: z.number().nullable().optional(),
                          targetMax: z.number().nullable().optional(),
                          targetValue: z.number().nullable().optional(),
                          unit: z
                            .nativeEnum(WORKOUT_TARGET_UNIT)
                            .nullable()
                            .optional(),
                        }),
                      )
                      .optional()
                      .default([]),
                  }),
                ),
              })
              .optional(),
          }),
          z.string(), // Allow strings temporarily, will be filtered out
        ]),
      )
      .transform((steps) =>
        steps.filter(
          (step): step is Exclude<typeof step, string> =>
            typeof step === 'object' && step !== null && 'stepType' in step,
        ),
      ),
  }),
});

type TrainingEventSchema = z.infer<typeof trainingEventSchema>;

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
    // Fetch athlete's training zones
    const zones = await this.prismaService.training_zone.findMany({
      where: { athlete_id: athleteId },
      include: { values: true },
      orderBy: { index: 'asc' },
    });

    // Fetch athlete's latest metrics
    const metrics = await this.prismaService.athlete_metric.findMany({
      where: { athlete_id: athleteId },
      orderBy: { date: 'desc' },
    });

    // Group metrics by type and get latest
    const latestMetrics = metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.type]) {
          acc[metric.type] = metric.value;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    // Format zones for prompt
    const zonesByType = zones.reduce(
      (acc, zone) => {
        if (!acc[zone.type]) {
          acc[zone.type] = [];
        }
        acc[zone.type].push({
          id: zone.training_zone_id,
          index: zone.index,
          name: zone.name,
          description: zone.description,
          values: zone.values.map((v) => ({
            min: v.min,
            max: v.max,
            sports: v.sports,
          })),
        });
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Build zones context
    const zonesContext = Object.entries(zonesByType)
      .map(
        ([type, zoneList]) => `
${type} Zones:
${zoneList
  .map(
    (zone) =>
      `  Zone ID ${zone.id} (display: Zone ${zone.index + 1}): ${zone.name} - ${zone.description}
    Values: ${zone.values.map((v) => `${v.min}-${v.max} (sports: ${v.sports.join(', ')})`).join(', ')}
    IMPORTANT: Use zone ID ${zone.id} for ZONE targets of type ${type}`,
  )
  .join('\n')}`,
      )
      .join('\n');

    // Build metrics context
    const metricsContext = Object.entries(latestMetrics)
      .map(([type, value]) => `  ${type}: ${value}`)
      .join('\n');

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

WORKOUT TARGETS:
- Each workout step can have targets to specify intensity/pace/power/heartrate/etc.
- Use targets to make workouts more specific and actionable
- For ZONE targets: Use the zone ID (training_zone_id) from the zones listed above. Zones are athlete-specific and vary in number.
- Prefer ZONE targets when the intensity is subjective (e.g., "easy pace", "tempo", "threshold") as zones are more flexible
- For specific values: Use PACE (min/km or m/s), HEARTRATE (bpm), POWER (watts), CADENCE (rpm/spm), or RPE (1-10)
- When using zones, reference them by their ID (the training_zone_id number shown in the context)
- Example: For a tempo run in HEARTRATE zones, use ZONE target with targetValue set to the tempo zone ID (e.g., if tempo zone has ID 42, use targetValue: 42)
- When metrics are available (FTP, VMA, etc.), use them to calculate appropriate target values
- For ZONE targets: targetValue should be the zone ID (training_zone_id), no unit needed
- IMPORTANT: Match the zone type to the target context (HEARTRATE zones for heartrate targets, POWER zones for power targets, PACE zones for pace targets)
- For other targets: specify targetMin/targetMax for ranges, or targetValue for single values, with appropriate unit`;

    const runtimeContext = new RuntimeContext();
    runtimeContext.set('prisma', this.prismaService);
    runtimeContext.set('athleteId', athleteId);
    runtimeContext.set('trainingLoadService', this.trainingLoadService);
    runtimeContext.set('currentDate', new Date().toISOString());

    const response = await eventGenerationAgent.generate(fullPrompt, {
      runtimeContext,
      structuredOutput: {
        schema: trainingEventSchema as any, // Type assertion needed for complex nested schemas
      },
    });

    if (!response.object) {
      throw new Error(
        'Failed to generate event: no structured output received',
      );
    }

    // Map zone IDs in targets to ensure they're valid
    const zoneIdMap = new Map<number, { type: string; id: number }>();
    zones.forEach((zone) => {
      zoneIdMap.set(zone.training_zone_id, {
        type: zone.type,
        id: zone.training_zone_id,
      });
    });

    // Validate and map zone targets
    if (response.object.workout?.steps) {
      response.object.workout.steps = response.object.workout.steps.map(
        (step) => {
          if (step.targets) {
            step.targets = step.targets
              .map((target) => {
                if (target.targetType === 'ZONE' && target.targetValue) {
                  const zoneId = target.targetValue;
                  // Validate zone ID exists
                  if (!zoneIdMap.has(zoneId)) {
                    // Try to find a zone by index if ID doesn't exist (fallback)
                    const zoneByIndex = zones.find(
                      (z) => z.index === zoneId || z.index === zoneId - 1,
                    );
                    if (zoneByIndex) {
                      target.targetValue = zoneByIndex.training_zone_id;
                    } else {
                      // Remove invalid zone target
                      console.warn(
                        `Invalid zone ID ${zoneId} in target, removing`,
                      );
                      return null;
                    }
                  }
                }
                return target;
              })
              .filter((t) => t !== null) as typeof step.targets;
          }

          // Handle repeatBlock childSteps
          if (step.repeatBlock?.childSteps) {
            step.repeatBlock.childSteps = step.repeatBlock.childSteps.map(
              (childStep) => {
                if (childStep.targets) {
                  childStep.targets = childStep.targets
                    .map((target) => {
                      if (target.targetType === 'ZONE' && target.targetValue) {
                        const zoneId = target.targetValue;
                        // Validate zone ID exists
                        if (!zoneIdMap.has(zoneId)) {
                          // Try to find a zone by index if ID doesn't exist (fallback)
                          const zoneByIndex = zones.find(
                            (z) => z.index === zoneId || z.index === zoneId - 1,
                          );
                          if (zoneByIndex) {
                            target.targetValue = zoneByIndex.training_zone_id;
                          } else {
                            // Remove invalid zone target
                            console.warn(
                              `Invalid zone ID ${zoneId} in childStep target, removing`,
                            );
                            return null;
                          }
                        }
                      }
                      return target;
                    })
                    .filter((t) => t !== null) as typeof childStep.targets;
                }
                return childStep;
              },
            );
          }

          return step;
        },
      );
    }

    // Steps are already filtered by the schema transform
    return response.object;
  }
}
