import type {
  CreateWorkoutStepDto,
  CreateWorkoutStepTarget,
} from '../../types/dtos/core/workout.dto';
import { WORKOUT_STEP_TYPE, WORKOUT_TARGET_TYPE } from '../../types/misc';
import { METRIC_TYPE } from '../../types/misc/core/metric-type.enum';
import type { WorkoutTextZone } from './types';

/**
 * The step type a text line gets when it does not say it: the parser
 * assigns it, and the serializer writes a type word only where it differs,
 * so a text reads back to the same steps.
 *
 * - In a repeat, the first step is the effort; a later one that is easier
 *   (no target, zone 1-2, a low percentage, or easier than the first) is
 *   the recovery.
 * - At the top, around at least one repeat or among three steps or more,
 *   the first step is the warm-up and the last the cool-down.
 * - Anything else is steady.
 */

const EASY_ZONE_INDEX = 1;
const EASY_PERCENT = 0.7;
const EASY_HR_PERCENT = 0.75;
const EASY_RPE = 3;

function midpoint(target: CreateWorkoutStepTarget): number | null {
  if (target.targetValue !== null && target.targetValue !== undefined) {
    return target.targetValue;
  }
  if (
    target.targetMin !== null &&
    target.targetMin !== undefined &&
    target.targetMax !== null &&
    target.targetMax !== undefined
  ) {
    return (target.targetMin + target.targetMax) / 2;
  }
  return null;
}

function isEasyTarget(
  target: CreateWorkoutStepTarget,
  zones: WorkoutTextZone[],
): boolean {
  const value = midpoint(target);
  if (value === null) return false;
  switch (target.targetType) {
    case WORKOUT_TARGET_TYPE.ZONE: {
      const zone = zones.find((z) => z.trainingZoneId === value);
      return !!zone && zone.index <= EASY_ZONE_INDEX;
    }
    case WORKOUT_TARGET_TYPE.RPE:
      return value <= EASY_RPE;
    default:
      if (!target.metricType) return false;
      return (
        value <=
        (target.metricType === METRIC_TYPE.HR_MAX
          ? EASY_HR_PERCENT
          : EASY_PERCENT)
      );
  }
}

/** Whether `step` is clearly easier than `reference`, on a target they share */
function isEasierThan(
  step: CreateWorkoutStepDto,
  reference: CreateWorkoutStepDto,
  zones: WorkoutTextZone[],
): boolean {
  for (const target of step.targets ?? []) {
    const same = (reference.targets ?? []).find(
      (other) =>
        other.targetType === target.targetType &&
        (other.metricType ?? null) === (target.metricType ?? null),
    );
    if (!same) continue;
    const a = midpoint(target);
    const b = midpoint(same);
    if (a === null || b === null) continue;
    if (target.targetType === WORKOUT_TARGET_TYPE.ZONE) {
      const za = zones.find((z) => z.trainingZoneId === a);
      const zb = zones.find((z) => z.trainingZoneId === b);
      if (za && zb && za.type === zb.type) return za.index < zb.index;
      continue;
    }
    return a < b;
  }
  return false;
}

export function inferChildType(
  step: CreateWorkoutStepDto,
  index: number,
  siblings: CreateWorkoutStepDto[],
  zones: WorkoutTextZone[],
): WORKOUT_STEP_TYPE {
  if (index === 0) return WORKOUT_STEP_TYPE.INTERVAL_ACTIVE;
  const targets = step.targets ?? [];
  if (
    targets.length === 0 ||
    targets.some((target) => isEasyTarget(target, zones)) ||
    isEasierThan(step, siblings[0], zones)
  ) {
    return WORKOUT_STEP_TYPE.INTERVAL_REST;
  }
  return WORKOUT_STEP_TYPE.INTERVAL_ACTIVE;
}

export function inferTopLevelType(
  index: number,
  steps: CreateWorkoutStepDto[],
): WORKOUT_STEP_TYPE {
  const framed =
    steps.length >= 3 ||
    (steps.length === 2 &&
      steps.some((step) => step.stepType === WORKOUT_STEP_TYPE.REPEAT));
  if (framed && index === 0) return WORKOUT_STEP_TYPE.WARMUP;
  if (framed && index === steps.length - 1) return WORKOUT_STEP_TYPE.COOLDOWN;
  return WORKOUT_STEP_TYPE.STEADY;
}
