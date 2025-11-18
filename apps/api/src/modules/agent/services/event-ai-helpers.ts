import { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';

import { WorkoutStepDto, trainingEventSchema } from '@openathlete/shared';

import { TrainingLoadService } from 'src/modules/core/services/training-load.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

export type TrainingEventSchema = z.infer<typeof trainingEventSchema>;

// Types for zones and metrics
type Zone = {
  training_zone_id: number;
  type: string;
  index: number;
  name: string;
  description: string;
  values: Array<{
    min: number;
    max: number;
    sports: string[];
  }>;
};

type Metric = {
  type: string;
  value: number;
  date: Date;
};

/**
 * Fetch athlete's training zones
 */
export async function fetchAthleteZones(
  prismaService: PrismaService,
  athleteId: number,
): Promise<Zone[]> {
  return await prismaService.training_zone.findMany({
    where: { athlete_id: athleteId },
    include: { values: true },
    orderBy: { index: 'asc' },
  });
}

/**
 * Fetch athlete's latest metrics
 */
export async function fetchAthleteMetrics(
  prismaService: PrismaService,
  athleteId: number,
): Promise<Metric[]> {
  return await prismaService.athlete_metric.findMany({
    where: { athlete_id: athleteId },
    orderBy: { date: 'desc' },
  });
}

/**
 * Group metrics by type and get latest value for each
 */
export function getLatestMetrics(metrics: Metric[]): Record<string, number> {
  const latest = metrics.reduce(
    (acc, metric) => {
      if (acc[metric.type] === undefined) {
        acc[metric.type] = metric.value;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const defaults: Record<string, number> = {
    HR_REST: 60,
    HR_MAX: 195,
  };

  Object.entries(defaults).forEach(([key, value]) => {
    if (latest[key] === undefined || latest[key] === null) {
      latest[key] = value;
    }
  });

  return latest;
}

/**
 * Format zones by type for prompt context
 */
export function formatZonesByType(zones: Zone[]): Record<string, Zone[]> {
  return zones.reduce(
    (acc, zone) => {
      if (!acc[zone.type]) {
        acc[zone.type] = [];
      }
      acc[zone.type].push({
        training_zone_id: zone.training_zone_id,
        type: zone.type,
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
    {} as Record<string, Zone[]>,
  );
}

/**
 * Build zones context string for prompt
 */
export function buildZonesContext(zonesByType: Record<string, Zone[]>): string {
  return Object.entries(zonesByType)
    .map(
      ([type, zoneList]) => `
${type} Zones:
${zoneList
  .map(
    (zone) =>
      `  Zone ID ${zone.training_zone_id} (display: Zone ${zone.index + 1}): ${zone.name} - ${zone.description}
    Values: ${zone.values.map((v) => `${v.min}-${v.max} (sports: ${v.sports.join(', ')})`).join(', ')}
    IMPORTANT: Use zone ID ${zone.training_zone_id} for ZONE targets of type ${type}`,
  )
  .join('\n')}`,
    )
    .join('\n');
}

/**
 * Build metrics context string for prompt
 */
export function buildMetricsContext(
  latestMetrics: Record<string, number>,
): string {
  return Object.entries(latestMetrics)
    .map(([type, value]) => `  ${type}: ${value}`)
    .join('\n');
}

/**
 * Create zone ID map for validation
 */
export function createZoneIdMap(
  zones: Zone[],
): Map<number, { type: string; id: number }> {
  const zoneIdMap = new Map<number, { type: string; id: number }>();
  zones.forEach((zone) => {
    zoneIdMap.set(zone.training_zone_id, {
      type: zone.type,
      id: zone.training_zone_id,
    });
  });
  return zoneIdMap;
}

/**
 * Validate and fix zone target value
 */
export function validateZoneTarget(
  target: { targetType: string; targetValue?: number | null },
  zoneIdMap: Map<number, { type: string; id: number }>,
  zones: Zone[],
): { target: typeof target | null; fixed: boolean } {
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
        return { target, fixed: true };
      } else {
        return { target: null, fixed: false };
      }
    }
  }
  return { target, fixed: false };
}

/**
 * Validate and fix zone targets in a step
 */
export function validateStepZoneTargets(
  step: {
    targets?: Array<{
      targetType: string;
      targetValue?: number | null;
    }>;
    repeatBlock?: {
      childSteps?: Array<{
        targets?: Array<{
          targetType: string;
          targetValue?: number | null;
        }>;
      }>;
    };
  },
  zoneIdMap: Map<number, { type: string; id: number }>,
  zones: Zone[],
): typeof step {
  // Validate main step targets
  if (step.targets) {
    step.targets = step.targets
      .map((target) => {
        const result = validateZoneTarget(target, zoneIdMap, zones);
        return result.target;
      })
      .filter((t) => t !== null) as typeof step.targets;
  }

  // Validate repeatBlock childSteps targets
  if (step.repeatBlock?.childSteps) {
    step.repeatBlock.childSteps = step.repeatBlock.childSteps.map(
      (childStep) => {
        if (childStep.targets) {
          childStep.targets = childStep.targets
            .map((target) => {
              const result = validateZoneTarget(target, zoneIdMap, zones);
              return result.target;
            })
            .filter((t) => t !== null) as typeof childStep.targets;
        }
        return childStep;
      },
    );
  }

  return step;
}

/**
 * Validate and fix zone targets in workout steps
 */
export function validateWorkoutZoneTargets(
  workout: { steps: WorkoutStepDto[] } | null | undefined,
  zoneIdMap: Map<number, { type: string; id: number }>,
  zones: Zone[],
): typeof workout {
  if (workout?.steps) {
    workout.steps = workout.steps.map((step) =>
      validateStepZoneTargets(step, zoneIdMap, zones),
    );
  }
  return workout;
}

/**
 * Create runtime context for AI agents
 */
export function createRuntimeContext(
  prismaService: PrismaService,
  athleteId: number,
  trainingLoadService: TrainingLoadService,
  existingEvent?: Event,
): RuntimeContext {
  const runtimeContext = new RuntimeContext();
  runtimeContext.set('prisma', prismaService);
  runtimeContext.set('athleteId', athleteId);
  runtimeContext.set('trainingLoadService', trainingLoadService);
  runtimeContext.set('currentDate', new Date().toISOString());
  if (existingEvent) {
    runtimeContext.set('existingEvent', existingEvent);
  }
  return runtimeContext;
}

/**
 * Build workout targets instructions for prompt
 */
export function buildWorkoutTargetsInstructions(): string {
  return `WORKOUT TARGETS:
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
}
