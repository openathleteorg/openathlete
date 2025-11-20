import {
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  WORKOUT_TARGET_UNIT,
} from '@openathlete/shared';
import type { NormalizedWorkoutStep } from '@openathlete/shared';

export function mapSportToGarmin(sport: SPORT_TYPE): string {
  switch (sport) {
    case SPORT_TYPE.RUNNING:
    case SPORT_TYPE.TRAIL_RUNNING:
    case SPORT_TYPE.VIRTUAL_RUN:
      return 'RUNNING';
    case SPORT_TYPE.CYCLING:
    case SPORT_TYPE.E_BIKE_RIDE:
    case SPORT_TYPE.E_MOUNTAIN_BIKE_RIDE:
    case SPORT_TYPE.GRAVEL_RIDE:
    case SPORT_TYPE.MOUNTAIN_BIKE_RIDE:
    case SPORT_TYPE.VIRTUAL_RIDE:
    case SPORT_TYPE.HANDCYCLE:
      return 'CYCLING';
    case SPORT_TYPE.SWIMMING:
      return 'LAP_SWIMMING';
    case SPORT_TYPE.WEIGHT_TRAINING:
    case SPORT_TYPE.STRENGTH:
      return 'STRENGTH_TRAINING';
    case SPORT_TYPE.HIGH_INTENSITY_INTERVAL_TRAINING:
    case SPORT_TYPE.CROSSFIT:
      return 'CARDIO_TRAINING';
    case SPORT_TYPE.YOGA:
      return 'YOGA';
    case SPORT_TYPE.PILATES:
      return 'PILATES';
    default:
      return 'GENERIC';
  }
}

export function mapStepTypeToGarminIntensity(
  stepType: string,
  sport: SPORT_TYPE,
): string {
  switch (stepType) {
    case WORKOUT_STEP_TYPE.WARMUP:
      return 'WARMUP';
    case WORKOUT_STEP_TYPE.COOLDOWN:
      return 'COOLDOWN';
    case WORKOUT_STEP_TYPE.INTERVAL_REST:
      return sport === SPORT_TYPE.SWIMMING ? 'REST' : 'RECOVERY';
    case WORKOUT_STEP_TYPE.INTERVAL_ACTIVE:
      return 'INTERVAL';
    case WORKOUT_STEP_TYPE.STEADY:
    case WORKOUT_STEP_TYPE.FREE:
      return 'ACTIVE';
    default:
      return 'ACTIVE';
  }
}

export function mapDurationTypeToGarmin(
  durationType: string,
  __: SPORT_TYPE,
  _: string,
): string {
  switch (durationType) {
    case WORKOUT_DURATION_TYPE.TIME:
      return 'TIME';
    case WORKOUT_DURATION_TYPE.DISTANCE:
      return 'DISTANCE';
    case WORKOUT_DURATION_TYPE.CALORIES:
      return 'CALORIES';
    case WORKOUT_DURATION_TYPE.HR_BELOW:
      return 'HR_LESS_THAN';
    case WORKOUT_DURATION_TYPE.HR_ABOVE:
      return 'HR_GREATER_THAN';
    case WORKOUT_DURATION_TYPE.OPEN:
      return 'OPEN';
    case WORKOUT_DURATION_TYPE.REPS:
      return 'REPS';
    case WORKOUT_DURATION_TYPE.LAP_BUTTON:
      return 'OPEN';
    default:
      return 'OPEN';
  }
}

export function mapTargetTypeToGarmin(
  targetType: string,
  sport: SPORT_TYPE,
): string | null {
  if (sport === SPORT_TYPE.SWIMMING) {
    return null;
  }

  switch (targetType) {
    case WORKOUT_TARGET_TYPE.OPEN:
      return 'OPEN';
    case WORKOUT_TARGET_TYPE.PACE:
      return 'PACE';
    case WORKOUT_TARGET_TYPE.HEARTRATE:
      return 'HEART_RATE';
    case WORKOUT_TARGET_TYPE.POWER:
      return 'POWER';
    case WORKOUT_TARGET_TYPE.CADENCE:
      return 'CADENCE';
    case WORKOUT_TARGET_TYPE.ZONE:
      return 'HEART_RATE';
    default:
      return 'OPEN';
  }
}

export function convertPaceToMetersPerSecond(paceMinPerKm: number): number {
  return 1000 / (paceMinPerKm * 60);
}

export function convertSpeedToMetersPerSecond(speedKmPerH: number): number {
  return (speedKmPerH * 1000) / 3600;
}

export function mapTargetValue(
  target: NormalizedWorkoutStep['targets'][0],
  sport: SPORT_TYPE,
): {
  targetValue: number | null;
  targetValueLow: number | null;
  targetValueHigh: number | null;
  targetValueType: string | null;
} {
  if (!target || target.targetType === WORKOUT_TARGET_TYPE.OPEN) {
    return {
      targetValue: null,
      targetValueLow: null,
      targetValueHigh: null,
      targetValueType: null,
    };
  }

  const garminTargetType = mapTargetTypeToGarmin(target.targetType, sport);
  if (!garminTargetType || garminTargetType === 'OPEN') {
    return {
      targetValue: null,
      targetValueLow: null,
      targetValueHigh: null,
      targetValueType: null,
    };
  }

  let targetValue: number | null = target.targetValue ?? null;
  let targetValueLow: number | null = target.targetMin ?? null;
  let targetValueHigh: number | null = target.targetMax ?? null;
  let targetValueType: string | null = null;

  if (target.targetType === WORKOUT_TARGET_TYPE.PACE) {
    if (target.unit === WORKOUT_TARGET_UNIT.MIN_PER_KM && targetValue) {
      targetValue = convertPaceToMetersPerSecond(targetValue);
    }
    if (target.unit === WORKOUT_TARGET_UNIT.MIN_PER_KM && targetValueLow) {
      targetValueLow = convertPaceToMetersPerSecond(targetValueLow);
    }
    if (target.unit === WORKOUT_TARGET_UNIT.MIN_PER_KM && targetValueHigh) {
      targetValueHigh = convertPaceToMetersPerSecond(targetValueHigh);
    }
  } else if (target.targetType === WORKOUT_TARGET_TYPE.HEARTRATE) {
    if (target.unit === WORKOUT_TARGET_UNIT.PERCENT_MAX_HR) {
      targetValueType = 'PERCENT';
    }
  } else if (target.targetType === WORKOUT_TARGET_TYPE.POWER) {
    if (target.unit === WORKOUT_TARGET_UNIT.PERCENT_FTP) {
      targetValueType = 'PERCENT';
    }
  }

  if (target.targetType === WORKOUT_TARGET_TYPE.ZONE) {
    return {
      targetValue: targetValue,
      targetValueLow: null,
      targetValueHigh: null,
      targetValueType: null,
    };
  }

  return {
    targetValue: targetValueLow && targetValueHigh ? null : targetValue,
    targetValueLow,
    targetValueHigh,
    targetValueType,
  };
}
