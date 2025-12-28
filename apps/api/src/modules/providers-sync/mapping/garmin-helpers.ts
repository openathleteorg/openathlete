import { SportType } from '@openathlete/database';
import {
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  getTargetIntensity,
} from '@openathlete/shared';
import type { NormalizedWorkoutStep } from '@openathlete/shared';

export function mapSportToGarmin(sport: SportType): string {
  switch (sport) {
    case SportType.RUNNING:
    case SportType.TRAIL_RUNNING:
    case SportType.VIRTUAL_RUN:
      return 'RUNNING';
    case SportType.CYCLING:
    case SportType.E_BIKE_RIDE:
    case SportType.E_MOUNTAIN_BIKE_RIDE:
    case SportType.GRAVEL_RIDE:
    case SportType.MOUNTAIN_BIKE_RIDE:
    case SportType.VIRTUAL_RIDE:
    case SportType.HANDCYCLE:
      return 'CYCLING';
    case SportType.SWIMMING:
      return 'LAP_SWIMMING';
    case SportType.WEIGHT_TRAINING:
    case SportType.STRENGTH:
      return 'STRENGTH_TRAINING';
    case SportType.HIGH_INTENSITY_INTERVAL_TRAINING:
    case SportType.CROSSFIT:
      return 'CARDIO_TRAINING';
    case SportType.YOGA:
      return 'YOGA';
    case SportType.PILATES:
      return 'PILATES';
    case SportType.TRIATHLON:
    case SportType.DUATHLON:
    case SportType.AQUATHLON:
    case SportType.AQUABIKE:
      return 'GENERIC';
    default:
      return 'GENERIC';
  }
}

export function mapStepTypeToGarminIntensity(
  stepType: string,
  sport: SportType,
): string {
  switch (stepType) {
    case WORKOUT_STEP_TYPE.WARMUP:
      return 'WARMUP';
    case WORKOUT_STEP_TYPE.COOLDOWN:
      return 'COOLDOWN';
    case WORKOUT_STEP_TYPE.INTERVAL_REST:
      return sport === SportType.SWIMMING ? 'REST' : 'RECOVERY';
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
  __: SportType,
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
  sport: SportType,
): string | null {
  if (sport === SportType.SWIMMING) {
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

export function convertSpeedToMetersPerSecond(speedKmPerH: number): number {
  return (speedKmPerH * 1000) / 3600;
}

function resolveMetricValue(
  metrics: Record<string, { value: number } | number> | undefined,
  metricType?: string | null,
): number | null {
  if (!metricType || !metrics) {
    return null;
  }

  const metric = metrics[metricType];
  if (metric === null || metric === undefined) {
    return null;
  }

  return typeof metric === 'number' ? metric : metric.value;
}

function convertFractionToPercent(
  value: number | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value * 100;
}

export function mapTargetValue(
  target: NormalizedWorkoutStep['targets'][0],
  sport: SportType,
  metrics?: Record<string, { value: number } | number>,
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

  const targetWithMetric = target as NormalizedWorkoutStep['targets'][0] & {
    metricType?: string | null;
  };

  const metricValue = resolveMetricValue(metrics, targetWithMetric.metricType);
  const hasMetricReference = Boolean(targetWithMetric.metricType);
  const hasMetricValue = hasMetricReference && metricValue !== null;

  if (hasMetricReference && !hasMetricValue) {
    if (
      target.targetType !== WORKOUT_TARGET_TYPE.HEARTRATE &&
      target.targetType !== WORKOUT_TARGET_TYPE.POWER
    ) {
      throw new Error(
        `Missing metric ${targetWithMetric.metricType} required for ${target.targetType} Garmin target`,
      );
    }

    const percentValue = convertFractionToPercent(targetWithMetric.targetValue);
    const percentLow = convertFractionToPercent(targetWithMetric.targetMin);
    const percentHigh = convertFractionToPercent(targetWithMetric.targetMax);
    const hasRange =
      percentLow !== null &&
      percentLow !== undefined &&
      percentHigh !== null &&
      percentHigh !== undefined;

    return {
      targetValue: hasRange ? null : percentValue,
      targetValueLow: percentLow,
      targetValueHigh: percentHigh,
      targetValueType: 'PERCENT',
    };
  }

  const intensityValues = getTargetIntensity(
    {
      targetType: targetWithMetric.targetType,
      targetValue: targetWithMetric.targetValue ?? null,
      targetMin: targetWithMetric.targetMin ?? null,
      targetMax: targetWithMetric.targetMax ?? null,
      metricType: targetWithMetric.metricType ?? null,
    },
    metrics,
  );

  const targetValue: number | null = intensityValues.value;
  const targetValueLow: number | null = intensityValues.min;
  const targetValueHigh: number | null = intensityValues.max;
  const targetValueType: string | null = null;

  if (target.targetType === WORKOUT_TARGET_TYPE.ZONE) {
    return {
      targetValue,
      targetValueLow: null,
      targetValueHigh: null,
      targetValueType: null,
    };
  }

  const hasRange =
    targetValueLow !== null &&
    targetValueLow !== undefined &&
    targetValueHigh !== null &&
    targetValueHigh !== undefined;

  return {
    targetValue: hasRange ? null : targetValue,
    targetValueLow: targetValueLow ?? null,
    targetValueHigh: targetValueHigh ?? null,
    targetValueType,
  };
}
