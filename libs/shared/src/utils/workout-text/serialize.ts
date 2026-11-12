import type {
  CreateWorkoutStepDto,
  CreateWorkoutStepTarget,
} from '../../types/dtos/core/workout.dto';
import {
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '../../types/misc';
import type { SPORT_TYPE } from '../../types/misc/core/sport-type.enum';
import { getSportConfig } from '../sport-config';
import { inferChildType, inferTopLevelType } from './infer';
import { defaultZoneType, isReservedWord } from './parse';
import { MINUTES_BELOW } from './tokens';
import type { WorkoutTextSerializeOptions, WorkoutTextZone } from './types';
import {
  ZONE_TYPE_SUFFIX,
  defaultPercentBase,
  isSwimmingSport,
  metricPercentBase,
  stepTypeFromLabel,
  stepTypeLabel,
} from './vocabulary';

/**
 * Writes steps as workout text, the inverse of parseWorkoutText: the text
 * reads back to the same steps.
 */

function trimNumber(value: number, digits = 2): string {
  return String(Math.round(value * 10 ** digits) / 10 ** digits);
}

export function formatTextDuration(seconds: number): string {
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    if (secs > 0)
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return minutes > 0
      ? `${hours}h${String(minutes).padStart(2, '0')}`
      : `${hours}h`;
  }
  if (minutes === 0) return `${secs}s`;
  if (secs === 0)
    return minutes < MINUTES_BELOW ? `${minutes}m` : `${minutes}min`;
  return `${minutes}m${String(secs).padStart(2, '0')}`;
}

export function formatTextDistance(meters: number, sport: SPORT_TYPE): string {
  if (meters >= 1000 && !isSwimmingSport(sport))
    return `${trimNumber(meters / 1000, 3)}km`;
  if (isSwimmingSport(sport) || meters >= MINUTES_BELOW)
    return `${trimNumber(meters)}m`;
  return `${trimNumber(meters)}mtr`;
}

function formatDuration(step: CreateWorkoutStepDto, sport: SPORT_TYPE): string {
  const value = step.durationValue ?? 0;
  switch (step.durationType) {
    case WORKOUT_DURATION_TYPE.TIME:
      return formatTextDuration(value);
    case WORKOUT_DURATION_TYPE.DISTANCE:
      return formatTextDistance(value, sport);
    case WORKOUT_DURATION_TYPE.LAP_BUTTON:
      return 'lap';
    case WORKOUT_DURATION_TYPE.HR_BELOW:
      return `hr<${trimNumber(value, 0)}`;
    case WORKOUT_DURATION_TYPE.HR_ABOVE:
      return `hr>${trimNumber(value, 0)}`;
    case WORKOUT_DURATION_TYPE.CALORIES:
      return `${trimNumber(value, 0)}kcal`;
    case WORKOUT_DURATION_TYPE.REPS:
      return `${trimNumber(value, 0)}reps`;
    default:
      return 'open';
  }
}

function pace(speed: number, perMeters: number): string {
  const seconds = Math.round(perMeters / speed);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function bounds(
  target: CreateWorkoutStepTarget,
): [number, number | null] | null {
  if (target.targetValue !== null && target.targetValue !== undefined) {
    return [target.targetValue, null];
  }
  if (
    target.targetMin !== null &&
    target.targetMin !== undefined &&
    target.targetMax !== null &&
    target.targetMax !== undefined
  ) {
    return [target.targetMin, target.targetMax];
  }
  return null;
}

function formatTarget(
  target: CreateWorkoutStepTarget,
  sport: SPORT_TYPE,
  zones: WorkoutTextZone[],
): string | null {
  const values = bounds(target);
  if (!values) return null;
  const [low, high] = values;
  const join = (format: (value: number) => string, suffix: string) =>
    high === null
      ? `${format(low)}${suffix}`
      : `${format(low)}-${format(high)}${suffix}`;

  if (target.metricType) {
    const base = metricPercentBase(target.metricType);
    if (!base) return null;
    const suffix = base === defaultPercentBase(sport) ? '' : ` ${base}`;
    return `${join((value) => trimNumber(value * 100, 1), '%')}${suffix}`;
  }
  switch (target.targetType) {
    case WORKOUT_TARGET_TYPE.ZONE: {
      const zone = zones.find((z) => z.trainingZoneId === low);
      if (!zone) return null;
      const suffix =
        zone.type === defaultZoneType(sport, zones)
          ? ''
          : ` ${ZONE_TYPE_SUFFIX[zone.type]}`;
      return `Z${zone.index + 1}${suffix}`;
    }
    case WORKOUT_TARGET_TYPE.PACE: {
      const unit = getSportConfig(sport)?.speedUnit;
      if (unit === 'km/h')
        return join((value) => trimNumber(value * 3.6, 1), 'km/h');
      const per = unit === 'min/100m' ? 100 : unit === 'min/500m' ? 500 : 1000;
      const label = per === 1000 ? 'km' : `${per}m`;
      // Faster pace first reads as the range runners write: 3:20-3:30/km
      const ordered = high === null ? [low] : [high, low];
      return `${ordered.map((value) => pace(value, per)).join('-')}/${label}`;
    }
    case WORKOUT_TARGET_TYPE.HEARTRATE:
      return join((value) => trimNumber(value, 0), 'bpm');
    case WORKOUT_TARGET_TYPE.POWER:
      return join((value) => trimNumber(value, 0), 'w');
    case WORKOUT_TARGET_TYPE.CADENCE:
      return join((value) => trimNumber(value, 0), 'rpm');
    case WORKOUT_TARGET_TYPE.RPE:
      return `RPE${join((value) => trimNumber(value, 1), '')}`;
    case WORKOUT_TARGET_TYPE.WEIGHT:
      return join((value) => trimNumber(value, 1), 'kg');
    default:
      return null;
  }
}

const INTENSITY_WORD: Partial<Record<WORKOUT_STEP_TYPE, string>> = {
  [WORKOUT_STEP_TYPE.WARMUP]: 'warmup',
  [WORKOUT_STEP_TYPE.COOLDOWN]: 'cooldown',
  [WORKOUT_STEP_TYPE.INTERVAL_ACTIVE]: 'active',
  [WORKOUT_STEP_TYPE.INTERVAL_REST]: 'rest',
  [WORKOUT_STEP_TYPE.STEADY]: 'steady',
  [WORKOUT_STEP_TYPE.FREE]: 'free',
};

function needsQuotes(name: string, sport: SPORT_TYPE): boolean {
  return (
    /["#(),;+]|\s\/\s/.test(name) ||
    name.split(/\s+/).some((word) => isReservedWord(word, sport))
  );
}

function formatStep(
  step: CreateWorkoutStepDto,
  inferred: WORKOUT_STEP_TYPE,
  options: Required<Pick<WorkoutTextSerializeOptions, 'locale'>> &
    WorkoutTextSerializeOptions,
): string {
  const { sport, zones = [], locale } = options;
  const type = step.stepType as Exclude<
    WORKOUT_STEP_TYPE,
    WORKOUT_STEP_TYPE.REPEAT
  >;
  const parts: string[] = [];
  const name = step.name?.replace(/\s+/g, ' ').trim() || null;
  let intensity: string | null = null;
  if (name) {
    parts.push(
      needsQuotes(name, sport) ? `"${name.replace(/"/g, "'")}"` : name,
    );
    const fromLabel = stepTypeFromLabel(name);
    if ((fromLabel ?? inferred) !== type)
      intensity = INTENSITY_WORD[type] ?? null;
  } else if (type !== inferred) {
    parts.push(stepTypeLabel(type, locale));
  }
  parts.push(formatDuration(step, sport));
  for (const target of step.targets ?? []) {
    const text = formatTarget(target, sport, zones);
    if (text) parts.push(text);
  }
  if (intensity) parts.push(`intensity=${intensity}`);
  const notes = step.notes?.replace(/\s+/g, ' ').trim();
  if (notes) parts.push(`# ${notes}`);
  return `- ${parts.join(' ')}`;
}

/** One step as the line the parser reads back, with `- ` left out */
export function serializeStepLine(
  step: CreateWorkoutStepDto,
  options: WorkoutTextSerializeOptions,
): string {
  const settings = { ...options, locale: options.locale ?? 'en' };
  return formatStep(step, step.stepType, settings).replace(/^- /, '');
}

export function serializeWorkoutText(
  steps: CreateWorkoutStepDto[],
  options: WorkoutTextSerializeOptions,
): string {
  const settings = { ...options, locale: options.locale ?? 'en' };
  const zones = options.zones ?? [];
  const blocks: string[][] = [];
  let loose: string[] = [];

  steps.forEach((step, index) => {
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
      if (loose.length) blocks.push(loose);
      loose = [];
      const children = step.repeatBlock.childSteps ?? [];
      const name = step.name?.replace(/\s+/g, ' ').trim();
      const header = `${name ? `${name.replace(/\d+\s*[x×]$/i, '').trim()} ` : ''}${step.repeatBlock.repetitions}x`;
      blocks.push([
        header,
        ...children.map((child, childIndex) =>
          formatStep(
            child,
            inferChildType(child, childIndex, children, zones),
            settings,
          ),
        ),
      ]);
      return;
    }
    loose.push(formatStep(step, inferTopLevelType(index, steps), settings));
  });
  if (loose.length) blocks.push(loose);
  return blocks.map((block) => block.join('\n')).join('\n\n');
}
