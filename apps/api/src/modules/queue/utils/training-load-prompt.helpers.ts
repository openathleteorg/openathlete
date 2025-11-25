import { sport_type } from '@openathlete/database';
import {
  type WorkoutDto,
  type WorkoutStepDto,
  type WorkoutStepTarget,
  formatTarget,
} from '@openathlete/shared';

import { fetchAthleteZones } from '../../agent/services/event-ai-helpers';

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
): string {
  if (!workout?.steps?.length) {
    return 'No structured workout.';
  }

  const lines = workout.steps.map((step) => describeStep(step, zoneLookup, 0));

  return lines.join('\n');
}

function describeStep(
  step: WorkoutStepDto,
  zoneLookup: Map<number, ZoneSummary>,
  depth: number,
): string {
  const indent = '  '.repeat(depth);
  const parts: string[] = [
    `${indent}- [${formatStepType(step.stepType)}]`.trim(),
  ];

  const duration = formatDuration(step);
  if (duration) {
    parts.push(duration);
  }

  const targets = describeTargets(step.targets || [], zoneLookup);
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
      lines.push(describeStep(child, zoneLookup, depth + 1));
    });
    lines.push(`${indent}  <${repeatLabel} END>`.trim());
  }

  return lines.join('\n');
}

function describeTargets(
  targets: WorkoutStepTarget[],
  zoneLookup: Map<number, ZoneSummary>,
): string | undefined {
  if (!targets.length) {
    return undefined;
  }

  const targetTexts = targets
    .map((target) => describeTarget(target, zoneLookup))
    .filter((text): text is string => Boolean(text));

  return targetTexts.length ? targetTexts.join('; ') : undefined;
}

function describeTarget(
  target: WorkoutStepTarget,
  zoneLookup: Map<number, ZoneSummary>,
): string | undefined {
  if (target.targetType === 'ZONE' && target.targetValue) {
    const zoneInfo = zoneLookup.get(target.targetValue);
    if (zoneInfo) {
      return `${zoneInfo.label} (${zoneInfo.range})`;
    }
  }

  // Format target with metric label if metricType is set
  const formattedRange = formatTarget(target, (metricType) => {
    return METRIC_LABELS[metricType] || metricType.replace(/_/g, ' ');
  });
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
