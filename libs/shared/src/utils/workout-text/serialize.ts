import type { UnitSystem } from '../../types/dtos/core/unit-system.dto';
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
import {
  KG_TO_LB,
  METERS_PER_MILE,
  MS_TO_MPH,
  roundImperialDistance,
} from '../units';
import { inferChildType, inferTopLevelType } from './infer';
import { defaultZoneType, isReservedWord } from './parse';
import { MINUTES_BELOW, parseTarget } from './tokens';
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

/** What the parser rounds speeds (m/s) and loads (kg) to */
const SPEED_PRECISION = 1e-4;
const WEIGHT_PRECISION = 0.01;

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

export function formatTextDistance(
  meters: number,
  sport: SPORT_TYPE,
  unitSystem: UnitSystem = 'METRIC',
): string {
  if (unitSystem === 'IMPERIAL') {
    const imperial = roundImperialDistance(meters, isSwimmingSport(sport));
    if (imperial) return `${imperial.value}${imperial.unit}`;
  }
  if (meters >= 1000 && !isSwimmingSport(sport))
    return `${trimNumber(meters / 1000, 3)}km`;
  if (isSwimmingSport(sport) || meters >= MINUTES_BELOW)
    return `${trimNumber(meters)}m`;
  return `${trimNumber(meters)}mtr`;
}

function formatDuration(
  step: CreateWorkoutStepDto,
  sport: SPORT_TYPE,
  unitSystem: UnitSystem = 'METRIC',
): string {
  const value = step.durationValue ?? 0;
  switch (step.durationType) {
    case WORKOUT_DURATION_TYPE.TIME:
      return formatTextDuration(value);
    case WORKOUT_DURATION_TYPE.DISTANCE:
      return formatTextDistance(value, sport, unitSystem);
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

/**
 * Whether a target written in imperial units reads back to the values it was
 * written from, to the precision the parser keeps. The editor reads every
 * line again on each key: a target that does not stays in metric units, or
 * an untouched 5:00/km would be saved as 8:03/mi, a little slower.
 */
function readsBack(
  text: string,
  [low, high]: [number, number | null],
  precision: number,
): boolean {
  const result = parseTarget(text, undefined);
  if (result?.parsed.kind !== 'target') return false;
  const { targetValue, targetMin, targetMax } = result.parsed.target;
  const read =
    targetValue !== null && targetValue !== undefined
      ? [targetValue]
      : [targetMin ?? NaN, targetMax ?? NaN];
  const wanted =
    high === null ? [low] : [Math.min(low, high), Math.max(low, high)];
  return (
    read.length === wanted.length &&
    // Half a step: a value the parser rounded reads back within it
    read.every(
      (value, index) => Math.abs(value - wanted[index]) <= precision / 2,
    )
  );
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
  unitSystem: UnitSystem = 'METRIC',
): string | null {
  const values = bounds(target);
  if (!values) return null;
  const [low, high] = values;
  const imperial = unitSystem === 'IMPERIAL';
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
      if (unit === 'km/h') {
        const mph = join((value) => trimNumber(value * MS_TO_MPH, 1), 'mph');
        if (imperial && readsBack(mph, values, SPEED_PRECISION)) return mph;
        return join((value) => trimNumber(value * 3.6, 1), 'km/h');
      }
      // Faster pace first reads as the range runners write: 3:20-3:30/km
      const ordered = high === null ? [low] : [high, low];
      const paces = (per: number, label: string) =>
        `${ordered.map((value) => pace(value, per)).join('-')}/${label}`;
      if (unit === 'min/100m') return paces(100, '100m');
      if (unit === 'min/500m') return paces(500, '500m');
      const perMile = paces(METERS_PER_MILE, 'mi');
      if (imperial && readsBack(perMile, values, SPEED_PRECISION))
        return perMile;
      return paces(1000, 'km');
    }
    case WORKOUT_TARGET_TYPE.HEARTRATE:
      return join((value) => trimNumber(value, 0), 'bpm');
    case WORKOUT_TARGET_TYPE.POWER:
      return join((value) => trimNumber(value, 0), 'w');
    case WORKOUT_TARGET_TYPE.CADENCE:
      return join((value) => trimNumber(value, 0), 'rpm');
    case WORKOUT_TARGET_TYPE.RPE:
      return `RPE${join((value) => trimNumber(value, 1), '')}`;
    case WORKOUT_TARGET_TYPE.WEIGHT: {
      const pounds = join((value) => trimNumber(value * KG_TO_LB, 1), 'lb');
      if (imperial && readsBack(pounds, values, WEIGHT_PRECISION))
        return pounds;
      return join((value) => trimNumber(value, 1), 'kg');
    }
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
  const { sport, zones = [], locale, unitSystem = 'METRIC' } = options;
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
  parts.push(formatDuration(step, sport, unitSystem));
  for (const target of step.targets ?? []) {
    const text = formatTarget(target, sport, zones, unitSystem);
    if (text) parts.push(text);
  }
  if (intensity) parts.push(`intensity=${intensity}`);
  const notes = step.notes?.replace(/\s+/g, ' ').trim();
  if (notes) parts.push(`# ${notes}`);
  return `- ${parts.join(' ')}`;
}

/**
 * A repeat's name without the count it may end with ("Main set 5x"), which
 * the header writes again. Scanned by hand: the equivalent regex,
 * /\d+\s*[x×]$/, backtracks quadratically on a long run of digits.
 */
function withoutRepeatCount(name: string): string {
  let end = name.length - 1;
  if (end < 0 || !/[x×]/i.test(name[end])) return name.trim();
  end--;
  while (end >= 0 && /\s/.test(name[end])) end--;
  let start = end;
  while (start >= 0 && name[start] >= '0' && name[start] <= '9') start--;
  if (start === end) return name.trim();
  return name.slice(0, start + 1).trim();
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
      const label = name ? withoutRepeatCount(name) : '';
      const header = `${label ? `${label} ` : ''}${step.repeatBlock.repetitions}x`;
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
