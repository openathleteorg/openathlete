import { Prisma, SportType } from '@openathlete/database';
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
  relatedTraining: {
    include: {
      event: {
        select: {
          name: true,
          startDate: true,
        },
      },
      workout: {
        include: {
          steps: {
            include: {
              targets: true,
              repeatBlock: {
                include: {
                  childSteps: {
                    include: {
                      targets: true,
                    },
                    orderBy: {
                      orderIndex: 'asc' as const,
                    },
                  },
                },
              },
            },
            orderBy: {
              orderIndex: 'asc' as const,
            },
          },
        },
      },
    },
  },
  trainingLoadEntries: {
    where: {
      calculationId: 0, // Will be replaced in query
    },
    take: 1,
  },
  event: {
    select: {
      startDate: true,
    },
  },
} as const;

type ActivityWithFewShotIncludes = Prisma.EventActivityGetPayload<{
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

interface ZoneSummary {
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
  trainingZoneId: number;
  type: string;
  name: string;
  index: number;
  values: Array<{
    min: number;
    max: number;
    sports: SportType[] | null;
  }>;
};

export function buildTrainingZonesContext(
  zones: Awaited<ReturnType<typeof fetchAthleteZones>>,
  sport: SportType,
): { summary: string; zoneLookup: Map<number, ZoneSummary> } {
  const relevantZones: ZoneWithFilteredValues[] = [];

  zones.forEach((zone) => {
    const valuesForSport = zone.values
      .filter((value) => isValueRelevantForSport(value.sports, sport))
      .map((value) => ({
        min: value.min,
        max: value.max,
        sports: (value.sports as SportType[] | null | undefined) ?? null,
      }));

    if (!valuesForSport.length) {
      return;
    }

    relevantZones.push({
      trainingZoneId: zone.trainingZoneId,
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
    zoneLookup.set(zone.trainingZoneId, {
      id: zone.trainingZoneId,
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
        goalDistance?: number | null;
        goalDuration?: number | null;
        goalElevationGain?: number | null;
        goalRpe?: number | null;
      }
    | null
    | undefined,
) {
  if (!training) {
    return 'No explicit goal metrics provided.';
  }

  const parts: string[] = [];
  if (typeof training.goalDistance === 'number') {
    parts.push(`Distance: ${(training.goalDistance / 1000).toFixed(1)} km`);
  }
  if (typeof training.goalDuration === 'number') {
    const minutes = Math.round(training.goalDuration / 60);
    parts.push(`Duration: ${minutes} min`);
  }
  if (typeof training.goalElevationGain === 'number') {
    parts.push(`Elevation Gain: ${Math.round(training.goalElevationGain)} m`);
  }
  if (typeof training.goalRpe === 'number') {
    parts.push(`Target RPE: ${training.goalRpe}`);
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
    step.repeatBlock.childSteps.forEach((child: WorkoutStepDto) => {
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
    | readonly SportType[]
    | readonly string[]
    | (SportType | string)[]
    | null
    | undefined,
  targetSport: SportType,
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
  currentSport: SportType,
  limit = 3,
): Promise<
  Array<{
    training: {
      name: string;
      sport: SportType;
      description: string;
      goalDistance: number | null;
      goalDuration: number | null;
      goalElevationGain: number | null;
      goalRpe: number | null;
      workout: WorkoutDto | null;
    };
    actualTrimp: number;
    activityDate: Date;
  }>
> {
  // Find TRIMP calculation for this athlete
  const trimpCalculation = await prisma.trainingLoadCalculation.findUnique({
    where: {
      athleteId_type: {
        athleteId: athleteId,
        type: 'TRIMP',
      },
    },
  });

  if (!trimpCalculation) {
    return [];
  }

  // Find activities linked to trainings that have TRIMP entries
  const activities = (await prisma.eventActivity.findMany({
    where: {
      AND: [
        {
          relatedTraining: {
            isNot: null,
          },
        },
        {
          relatedTraining: {
            sport: currentSport, // Filter by same sport
          },
        },
        {
          relatedTraining: {
            event: {
              athleteId: athleteId,
            },
          },
        },
        {
          trainingLoadEntries: {
            some: {
              calculationId: trimpCalculation.trainingLoadCalculationId,
            },
          },
        },
      ],
    },
    include: {
      relatedTraining: {
        include: {
          event: {
            select: {
              name: true,
              startDate: true,
            },
          },
          workout: {
            include: {
              steps: {
                include: {
                  targets: true,
                  repeatBlock: {
                    include: {
                      childSteps: {
                        include: {
                          targets: true,
                        },
                        orderBy: {
                          orderIndex: 'asc' as const,
                        },
                      },
                    },
                  },
                },
                orderBy: {
                  orderIndex: 'asc' as const,
                },
              },
            },
          },
        },
      },
      trainingLoadEntries: {
        where: {
          calculationId: trimpCalculation.trainingLoadCalculationId,
        },
        take: 1,
      },
      event: {
        select: {
          startDate: true,
        },
      },
    },
    orderBy: {
      event: {
        startDate: 'desc',
      },
    },
    take: limit,
  })) as ActivityWithFewShotIncludes[];

  return activities
    .filter((activity) => {
      return (
        activity.relatedTraining &&
        activity.trainingLoadEntries &&
        activity.trainingLoadEntries.length > 0 &&
        activity.trainingLoadEntries[0]?.value !== null &&
        activity.trainingLoadEntries[0]?.value !== undefined
      );
    })
    .map((activity) => {
      const training = activity.relatedTraining!;
      const trimpEntry = activity.trainingLoadEntries![0]!;

      return {
        training: {
          name: training.event.name,
          sport: training.sport,
          description: training.description,
          goalDistance: training.goalDistance,
          goalDuration: training.goalDuration,
          goalElevationGain: training.goalElevationGain,
          goalRpe: training.goalRpe,
          workout: training.workout
            ? mapPrismaWorkoutToDto(training.workout)
            : null,
        },
        actualTrimp: trimpEntry.value,
        activityDate: activity.event.startDate,
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
