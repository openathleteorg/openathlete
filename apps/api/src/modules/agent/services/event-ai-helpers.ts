import { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';

import { athlete_metric, training_zone_type } from '@openathlete/database';
import {
  METRIC_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  WorkoutStepDto,
  trainingEventSchema,
} from '@openathlete/shared';

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

type TargetWithUnit = {
  targetType?: string | null;
  targetMin?: number | null;
  targetMax?: number | null;
  targetValue?: number | null;
  metricType?: string | null;
};

type StepWithTargets = {
  targets?: TargetWithUnit[];
  repeatBlock?: {
    childSteps?: StepWithTargets[];
  } | null;
};

type WorkoutWithSteps =
  | {
      steps?: StepWithTargets[];
    }
  | null
  | undefined;

const METERS_PER_KILOMETER = 1000;
const SECONDS_PER_MINUTE = 60;

const convertMinPerKmToMs = (
  value: number | null | undefined,
): number | null | undefined => {
  if (value === null || value === undefined) {
    return value;
  }
  if (!Number.isFinite(value) || value <= 0) {
    return value;
  }
  return METERS_PER_KILOMETER / (value * SECONDS_PER_MINUTE);
};

const convertMsToMinPerKm = (
  value: number | null | undefined,
): number | null | undefined => {
  if (value === null || value === undefined) {
    return value;
  }
  if (!Number.isFinite(value) || value <= 0) {
    return value;
  }
  return METERS_PER_KILOMETER / (value * SECONDS_PER_MINUTE);
};

const shouldConvertPaceTarget = (target: TargetWithUnit | null | undefined) => {
  return (
    !!target &&
    target.targetType === WORKOUT_TARGET_TYPE.PACE &&
    !target.metricType
  );
};

const convertStepTargets = (
  step: StepWithTargets,
  converter: (value: number | null | undefined) => number | null | undefined,
): StepWithTargets => {
  if (step.targets) {
    step.targets = step.targets.map((target) => {
      if (shouldConvertPaceTarget(target)) {
        return {
          ...target,
          targetMin: converter(target?.targetMin ?? null),
          targetMax: converter(target?.targetMax ?? null),
          targetValue: converter(target?.targetValue ?? null),
        };
      }
      return target;
    });
  }

  if (step.repeatBlock?.childSteps) {
    step.repeatBlock.childSteps = step.repeatBlock.childSteps.map((child) =>
      convertStepTargets(child, converter),
    );
  }

  return step;
};

export function convertWorkoutPaceTargetsToMs(
  workout: WorkoutWithSteps,
): WorkoutWithSteps {
  if (!workout?.steps) {
    return workout;
  }

  workout.steps = workout.steps.map((step) =>
    convertStepTargets(step, convertMinPerKmToMs),
  );
  return workout;
}

export function convertWorkoutPaceTargetsToMinPerKm(
  workout: WorkoutWithSteps,
): WorkoutWithSteps {
  if (!workout?.steps) {
    return workout;
  }

  workout.steps = workout.steps.map((step) =>
    convertStepTargets(step, convertMsToMinPerKm),
  );
  return workout;
}

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
): Promise<athlete_metric[]> {
  return await prismaService.athlete_metric.findMany({
    where: { athlete_id: athleteId },
    orderBy: { date: 'desc' },
  });
}

/**
 * Group metrics by type and get latest value for each
 */
export function getLatestMetrics(
  metrics: athlete_metric[],
): Record<METRIC_TYPE, number> {
  const latest = metrics.reduce(
    (acc, metric) => {
      if (acc[metric.type] === undefined) {
        acc[metric.type] = metric.value;
      }
      return acc;
    },
    {} as Record<METRIC_TYPE, number>,
  );

  const defaults: Partial<Record<METRIC_TYPE, number>> = {
    [METRIC_TYPE.HR_REST]: 60,
    [METRIC_TYPE.HR_MAX]: 195,
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
export function formatZonesByType(
  zones: Zone[],
): Record<training_zone_type, Zone[]> {
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
export function buildZonesContext(
  zonesByType: Record<training_zone_type, Zone[]>,
): string {
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
  latestMetrics: Record<METRIC_TYPE, number>,
): string {
  if (Object.keys(latestMetrics).length === 0) {
    return 'No metrics available';
  }

  const metricsList = Object.entries(latestMetrics)
    .map(([type, value]) => `  ${type}: ${value}`)
    .join('\n');

  return `${metricsList}

IMPORTANT: You can use these metrics with metricType in targets:
- For PACE targets: Use VMA or CRITICAL_POWER_RUNNING (if available)
- For HEARTRATE targets: Use HR_MAX, HR_REST, or HR_RESERVE (if available)
- For POWER targets: Use FTP_RUNNING, FTP_CYCLING, or CRITICAL_POWER_CYCLING (if available)
- When using metricType, store target values as 0-1 (e.g., 0.8 for 80% of the metric)`;
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
 * Validate that repeat blocks are not nested (max depth of 1)
 * Throws an error if nested repeat blocks are found
 */
export function validateNoNestedRepeatBlocks(
  workout: { steps: WorkoutStepDto[] } | null | undefined,
): void {
  if (!workout?.steps) {
    return;
  }

  const checkStep = (step: WorkoutStepDto, depth = 0): void => {
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
      if (depth > 0) {
        throw new Error(
          'Repeat blocks cannot be nested. A repeat block cannot contain another repeat block (max depth of 1).',
        );
      }

      // Check child steps - they should not contain repeat blocks
      if (step.repeatBlock.childSteps) {
        step.repeatBlock.childSteps.forEach((childStep) => {
          if (
            childStep.stepType === WORKOUT_STEP_TYPE.REPEAT &&
            childStep.repeatBlock
          ) {
            throw new Error(
              'Repeat blocks cannot be nested. A repeat block cannot contain another repeat block (max depth of 1).',
            );
          }
        });
      }
    }
  };

  workout.steps.forEach((step) => checkStep(step));
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
- For specific values: Use PACE (expressed in min/km, e.g., 4.2 = 4:12 min/km), HEARTRATE (bpm), POWER (watts), CADENCE (rpm/spm), or RPE (1-10)
- When using zones, reference them by their ID (the training_zone_id number shown in the context)
- Example: For a tempo run in HEARTRATE zones, use ZONE target with targetValue set to the tempo zone ID (e.g., if tempo zone has ID 42, use targetValue: 42)
- When metrics are available (FTP, VMA, etc.), you can use metricType to set targets as percentages of metrics
- For ZONE targets: targetValue should be the zone ID (training_zone_id), no unit needed
- IMPORTANT: Match the zone type to the target context (HEARTRATE zones for heartrate targets, POWER zones for power targets, PACE zones for pace targets)
- For other targets: specify targetMin/targetMax for ranges, or targetValue for single values, with appropriate unit

METRIC-BASED TARGETS (using metricType):
- When using metricType, store target values as percentages in 0-1 range (e.g., 0.8 for 80%, 0.85 for 85%)
- Available metric types for each target type:
  * PACE: VMA, CRITICAL_POWER_RUNNING
  * HEARTRATE: HR_MAX, HR_REST, HR_RESERVE
  * POWER: FTP_RUNNING, FTP_CYCLING, CRITICAL_POWER_CYCLING
- Examples:
  * "80% of VMA" pace: { targetType: "PACE", targetValue: 0.8, metricType: "VMA" }
  * "85% of HR_MAX" heartrate: { targetType: "HEARTRATE", targetValue: 0.85, metricType: "HR_MAX" }
  * "90% of FTP" power: { targetType: "POWER", targetValue: 0.9, metricType: "FTP_CYCLING" }
  * Range example "80-90% of VMA": { targetType: "PACE", targetMin: 0.8, targetMax: 0.9, metricType: "VMA" }
- CRITICAL: When metricType is set, target values MUST be in 0-1 range (not absolute values)`;
}

/**
 * Retry a function with exponential backoff
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelayMs - Base delay in milliseconds for exponential backoff (default: 1000)
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff: delay = baseDelayMs * 2^attempt
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed, throw the last error
  throw lastError;
}
