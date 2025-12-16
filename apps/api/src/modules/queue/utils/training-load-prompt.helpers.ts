import { Prisma, sport_type } from '@openathlete/database';
import {
  TrainingZone,
  type WorkoutDto,
  type WorkoutStepDto,
  type WorkoutStepTargetDto,
  formatTarget,
  mapPrismaWorkoutToDto,
} from '@openathlete/shared';

import { fetchAthleteZones } from '../../agent/services/event-ai-helpers';
import { PrismaService } from '../../prisma/services/prisma.service';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FEW_SHOT_INCLUDES = {
  related_training: {
    include: {
      event: {
        select: {
          name: true,
          start_date: true,
        },
      },
      workout: {
        include: {
          steps: {
            include: {
              targets: true,
              repeat_block: {
                include: {
                  child_steps: {
                    include: {
                      targets: true,
                    },
                    orderBy: {
                      order_index: 'asc' as const,
                    },
                  },
                },
              },
            },
            orderBy: {
              order_index: 'asc' as const,
            },
          },
        },
      },
    },
  },
  training_load_entries: {
    where: {
      calculation_id: 0, // Will be replaced in query
    },
    take: 1,
  },
  event: {
    select: {
      start_date: true,
    },
  },
} as const;

type ActivityWithFewShotIncludes = Prisma.event_activityGetPayload<{
  include: typeof FEW_SHOT_INCLUDES;
}>;

const METRIC_LABELS: Record<string, string> = {
  HR_MAX: 'Max HR',
  HR_REST: 'Resting HR',
  HR_RESERVE: 'HR Reserve',
  VO2MAX: 'VO₂max',
  FTP_RUNNING: 'Running FTP',
  FTP_CYCLING: 'Cycling FTP',
  VMA: 'VMA',
  WEIGHT: 'Weight',
};

const METRIC_UNITS: Record<string, string> = {
  HR_MAX: 'bpm',
  HR_REST: 'bpm',
  HR_RESERVE: 'bpm',
  VO2MAX: 'ml/kg/min',
  FTP_RUNNING: 'w',
  FTP_CYCLING: 'w',
  VMA: 'km/h',
  WEIGHT: 'kg',
};

export interface ZoneSummary {
  id: number;
  label: string;
  range: string;
  type: string;
}

export function buildAthleteMetricsSummary(
  metrics: Record<string, number>,
): string {
  const parts = Object.entries(metrics)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(
      ([key, value]) =>
        `${formatMetricLabel(key)} = ${formatMetricValue(key, value)}`,
    );

  return parts.length > 0
    ? parts.join(' | ')
    : 'No up-to-date athlete metrics provided.';
}

type ZoneWithFilteredValues = {
  training_zone_id: number;
  type: string;
  name: string;
  index: number;
  values: Array<{
    min: number;
    max: number;
    sports: sport_type[] | null;
  }>;
};

export function buildTrainingZonesContext(
  zones: Awaited<ReturnType<typeof fetchAthleteZones>>,
  sport: sport_type,
): { summary: string; zoneLookup: Map<number, ZoneSummary> } {
  const relevantZones: ZoneWithFilteredValues[] = [];

  zones.forEach((zone) => {
    const valuesForSport = zone.values
      .filter((value) => isValueRelevantForSport(value.sports, sport))
      .map((value) => ({
        min: value.min,
        max: value.max,
        sports: (value.sports as sport_type[] | null | undefined) ?? null,
      }));

    if (!valuesForSport.length) {
      return;
    }

    relevantZones.push({
      training_zone_id: zone.training_zone_id,
      type: zone.type,
      name: zone.name,
      index: zone.index,
      values: valuesForSport,
    });
  });

  const zoneLookup = new Map<number, ZoneSummary>();

  const summaryLines = relevantZones.map((zone) => {
    const unit = inferZoneUnit(zone.type);
    const valueRanges = zone.values
      .map((value) => {
        const range = `${value.min}-${value.max}${
          unit ? ` ${unit}` : ''
        }`.trim();
        return range;
      })
      .join(', ');

    const label = `Z${zone.index + 1} ${zone.name}`;
    zoneLookup.set(zone.training_zone_id, {
      id: zone.training_zone_id,
      label,
      range: valueRanges,
      type: zone.type,
    });

    return `${zone.type} ${label}: ${valueRanges}`;
  });

  return {
    summary: summaryLines.length
      ? summaryLines.join('\n')
      : `No training zones configured for ${sport}.`,
    zoneLookup,
  };
}

export function formatGoalSummary(
  training:
    | {
        goal_distance?: number | null;
        goal_duration?: number | null;
        goal_elevation_gain?: number | null;
        goal_rpe?: number | null;
      }
    | null
    | undefined,
) {
  if (!training) {
    return 'No explicit goal metrics provided.';
  }

  const parts: string[] = [];
  if (typeof training.goal_distance === 'number') {
    parts.push(`Distance: ${(training.goal_distance / 1000).toFixed(1)} km`);
  }
  if (typeof training.goal_duration === 'number') {
    const minutes = Math.round(training.goal_duration / 60);
    parts.push(`Duration: ${minutes} min`);
  }
  if (typeof training.goal_elevation_gain === 'number') {
    parts.push(`Elevation Gain: ${Math.round(training.goal_elevation_gain)} m`);
  }
  if (typeof training.goal_rpe === 'number') {
    parts.push(`Target RPE: ${training.goal_rpe}`);
  }

  return parts.length ? parts.join(' | ') : 'No numeric goals specified.';
}

export function describeWorkoutStructure(
  workout: WorkoutDto | null,
  zoneLookup: Map<number, ZoneSummary>,
  trainingZones: TrainingZone[],
): string {
  if (!workout?.steps?.length) {
    return 'No structured workout.';
  }

  const lines = workout.steps.map((step) =>
    describeStep(step, zoneLookup, 0, trainingZones),
  );

  return lines.join('\n');
}

function describeStep(
  step: WorkoutStepDto,
  zoneLookup: Map<number, ZoneSummary>,
  depth: number,
  trainingZones: TrainingZone[],
): string {
  const indent = '  '.repeat(depth);
  const parts: string[] = [
    `${indent}- [${formatStepType(step.stepType)}]`.trim(),
  ];

  const duration = formatDuration(step);
  if (duration) {
    parts.push(duration);
  }

  const targets = describeTargets(
    step.targets || [],
    zoneLookup,
    trainingZones || [],
  );
  if (targets) {
    parts.push(`Targets: ${targets}`);
  }

  if (step.notes) {
    parts.push(`Notes: ${step.notes}`);
  }

  const lines = [parts.join(' | ')];

  if (step.repeatBlock?.childSteps?.length) {
    const repeatLabel = `Repeat x${step.repeatBlock.repetitions}`;
    lines.push(`${indent}  <${repeatLabel} START>`.trim());
    step.repeatBlock.childSteps.forEach((child) => {
      lines.push(describeStep(child, zoneLookup, depth + 1, trainingZones));
    });
    lines.push(`${indent}  <${repeatLabel} END>`.trim());
  }

  return lines.join('\n');
}

function describeTargets(
  targets: WorkoutStepTargetDto[],
  zoneLookup: Map<number, ZoneSummary>,
  trainingZones: TrainingZone[],
): string | undefined {
  if (!targets.length) {
    return undefined;
  }

  const targetTexts = targets
    .map((target) => describeTarget(target, zoneLookup, trainingZones))
    .filter((text): text is string => Boolean(text));

  return targetTexts.length ? targetTexts.join('; ') : undefined;
}

function describeTarget(
  target: WorkoutStepTargetDto,
  zoneLookup: Map<number, ZoneSummary>,
  trainingZones: TrainingZone[],
): string | undefined {
  if (target.targetType === 'ZONE' && target.targetValue) {
    const zoneInfo = zoneLookup.get(target.targetValue);
    if (zoneInfo) {
      return `${zoneInfo.label} (${zoneInfo.range})`;
    }
  }

  // Format target with metric label if metricType is set
  const formattedRange = formatTarget(
    target,
    (metricType) => {
      return METRIC_LABELS[metricType] || metricType.replace(/_/g, ' ');
    },
    undefined,
    trainingZones,
  );
  if (formattedRange) {
    return `${target.targetType}: ${formattedRange}`;
  }

  return undefined;
}

function formatDuration(step: WorkoutStepDto): string | undefined {
  if (!step.durationType) {
    return undefined;
  }

  switch (step.durationType) {
    case 'TIME':
      return step.durationValue
        ? `${formatSeconds(step.durationValue)}`
        : 'Time: open';
    case 'DISTANCE':
      return step.durationValue
        ? `${formatDistance(step.durationValue)}`
        : 'Distance: open';
    case 'REPS':
      return step.durationValue ? `${step.durationValue} reps` : undefined;
    case 'CALORIES':
      return step.durationValue ? `${step.durationValue} kcal` : undefined;
    case 'OPEN':
      return 'Open duration';
    default:
      return undefined;
  }
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    const minutes = seconds / 60;
    return `${round(minutes)} min`;
  }
  const hours = seconds / 3600;
  return `${round(hours, 1)} h`;
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }
  return `${round(distanceMeters / 1000, 2)} km`;
}

function formatMetricLabel(metricKey: string): string {
  return METRIC_LABELS[metricKey] ?? metricKey.replace(/_/g, ' ').toLowerCase();
}

function formatMetricValue(metricKey: string, value: number): string {
  const unit = METRIC_UNITS[metricKey];
  if (!unit) {
    return `${round(value)}`;
  }
  return `${round(value)} ${unit}`;
}

function inferZoneUnit(type: string): string {
  switch (type) {
    case 'HEARTRATE':
      return 'bpm';
    case 'POWER':
      return 'w';
    case 'PACE':
      return 'm/s';
    default:
      return '';
  }
}

function isValueRelevantForSport(
  sports:
    | readonly sport_type[]
    | readonly string[]
    | (sport_type | string)[]
    | null
    | undefined,
  targetSport: sport_type,
): boolean {
  if (!sports || sports.length === 0) {
    return true;
  }
  return sports.includes(targetSport);
}

function formatStepType(stepType: string): string {
  return stepType.replace(/_/g, ' ');
}

function round(value: number, precision = 0): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * Fetch past activities linked to trainings with their actual TRIMP values
 * Used for few-shot prompting to improve TRIMP estimation accuracy
 */
export async function fetchFewShotExamples(
  prisma: PrismaService,
  athleteId: number,
  currentSport: sport_type,
  limit = 3,
): Promise<
  Array<{
    training: {
      name: string;
      sport: sport_type;
      description: string;
      goal_distance: number | null;
      goal_duration: number | null;
      goal_elevation_gain: number | null;
      goal_rpe: number | null;
      workout: WorkoutDto | null;
    };
    actualTrimp: number;
    activityDate: Date;
  }>
> {
  // Find TRIMP calculation for this athlete
  const trimpCalculation = await prisma.training_load_calculation.findUnique({
    where: {
      athlete_id_type: {
        athlete_id: athleteId,
        type: 'TRIMP',
      },
    },
  });

  if (!trimpCalculation) {
    return [];
  }

  // Find activities linked to trainings that have TRIMP entries
  const activities = (await prisma.event_activity.findMany({
    where: {
      AND: [
        {
          related_training: {
            isNot: null,
          },
        },
        {
          related_training: {
            sport: currentSport, // Filter by same sport
          },
        },
        {
          related_training: {
            event: {
              athlete_id: athleteId,
            },
          },
        },
        {
          training_load_entries: {
            some: {
              calculation_id: trimpCalculation.training_load_calculation_id,
            },
          },
        },
      ],
    },
    include: {
      related_training: {
        include: {
          event: {
            select: {
              name: true,
              start_date: true,
            },
          },
          workout: {
            include: {
              steps: {
                include: {
                  targets: true,
                  repeat_block: {
                    include: {
                      child_steps: {
                        include: {
                          targets: true,
                        },
                        orderBy: {
                          order_index: 'asc' as const,
                        },
                      },
                    },
                  },
                },
                orderBy: {
                  order_index: 'asc' as const,
                },
              },
            },
          },
        },
      },
      training_load_entries: {
        where: {
          calculation_id: trimpCalculation.training_load_calculation_id,
        },
        take: 1,
      },
      event: {
        select: {
          start_date: true,
        },
      },
    },
    orderBy: {
      event: {
        start_date: 'desc',
      },
    },
    take: limit,
  })) as ActivityWithFewShotIncludes[];

  return activities
    .filter((activity) => {
      return (
        activity.related_training &&
        activity.training_load_entries &&
        activity.training_load_entries.length > 0 &&
        activity.training_load_entries[0]?.value !== null &&
        activity.training_load_entries[0]?.value !== undefined
      );
    })
    .map((activity) => {
      const training = activity.related_training!;
      const trimpEntry = activity.training_load_entries![0]!;

      return {
        training: {
          name: training.event.name,
          sport: training.sport,
          description: training.description,
          goal_distance: training.goal_distance,
          goal_duration: training.goal_duration,
          goal_elevation_gain: training.goal_elevation_gain,
          goal_rpe: training.goal_rpe,
          workout: training.workout
            ? mapPrismaWorkoutToDto(training.workout)
            : null,
        },
        actualTrimp: trimpEntry.value,
        activityDate: activity.event.start_date,
      };
    });
}

/**
 * Format few-shot examples for the prompt
 */
export function formatFewShotExamples(
  examples: Awaited<ReturnType<typeof fetchFewShotExamples>>,
  zoneLookup: Map<number, ZoneSummary>,
  trainingZones: TrainingZone[],
): string {
  if (examples.length === 0) {
    return '';
  }

  const exampleSections = examples.map((example, index) => {
    const goalSummary = formatGoalSummary(example.training);
    const workoutStructure = describeWorkoutStructure(
      example.training.workout,
      zoneLookup,
      trainingZones,
    );

    return [
      `EXAMPLE ${index + 1}:`,
      `Session: ${example.training.name}`,
      `Sport: ${example.training.sport}`,
      `Date: ${example.activityDate.toISOString().split('T')[0]}`,
      `Goals: ${goalSummary}`,
      `Description: ${example.training.description || 'None'}`,
      `Workout Structure:`,
      workoutStructure,
      `\nACTUAL TRIMP RESULT: ${example.actualTrimp.toFixed(2)}`,
      '',
    ].join('\n');
  });

  return [
    '=== FEW-SHOT EXAMPLES (Past similar sessions with actual TRIMP results) ===',
    '',
    ...exampleSections,
    '=== END OF EXAMPLES ===',
    '',
  ].join('\n');
}
