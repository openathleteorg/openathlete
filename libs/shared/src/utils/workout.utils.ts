import {
  WorkoutDto,
  WorkoutStepDto,
  WorkoutStepTargetDto,
} from '../types/dtos/core/workout.dto';
import {
  TRAINING_ZONE_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '../types/misc';
import { METRIC_TYPE } from '../types/misc/core/metric-type.enum';
import { SPORT_TYPE } from '../types/misc/core/sport-type.enum';
import { getSportConfig } from './sport-config';

export interface StepZoneLike {
  trainingZoneId: number;
  type?: string;
  index?: number;
  min?: number;
  max?: number;
  values?: { min: number; max: number; sports?: string[] }[];
}

// ============================================================================
// Workout Calculations
// ============================================================================

/**
 * Speed in m/s when a distance step has no pace target: an easy pace for
 * the sport. A swim at running pace would last a third of its real time.
 */
const DEFAULT_SPEED_MS = 3.33; // ~5:00 min/km, easy running

const SWIM_SPEED_MS = 0.95; // ~1:45 /100 m
const ROAD_BIKE_SPEED_MS = 8.3; // ~30 km/h
const OFF_ROAD_BIKE_SPEED_MS = 5.5; // ~20 km/h
const PADDLE_SPEED_MS = 2.5; // ~9 km/h
const SKI_SPEED_MS = 4.2; // ~15 km/h
const ROW_SPEED_MS = 3.9; // ~2:08 /500 m

const DEFAULT_SPEED_BY_SPORT: Partial<Record<SPORT_TYPE, number>> = {
  [SPORT_TYPE.SWIMMING]: SWIM_SPEED_MS,
  [SPORT_TYPE.RUNNING]: DEFAULT_SPEED_MS,
  [SPORT_TYPE.VIRTUAL_RUN]: DEFAULT_SPEED_MS,
  [SPORT_TYPE.TRAIL_RUNNING]: 2.8, // ~6:00 min/km
  [SPORT_TYPE.CYCLING]: ROAD_BIKE_SPEED_MS,
  [SPORT_TYPE.VIRTUAL_RIDE]: ROAD_BIKE_SPEED_MS,
  [SPORT_TYPE.E_BIKE_RIDE]: ROAD_BIKE_SPEED_MS,
  [SPORT_TYPE.VELOMOBILE]: ROAD_BIKE_SPEED_MS,
  [SPORT_TYPE.GRAVEL_RIDE]: 7, // ~25 km/h
  [SPORT_TYPE.MOUNTAIN_BIKE_RIDE]: OFF_ROAD_BIKE_SPEED_MS,
  [SPORT_TYPE.E_MOUNTAIN_BIKE_RIDE]: OFF_ROAD_BIKE_SPEED_MS,
  [SPORT_TYPE.HANDCYCLE]: OFF_ROAD_BIKE_SPEED_MS,
  [SPORT_TYPE.WALK]: 1.4, // ~5 km/h
  [SPORT_TYPE.HIKING]: 1.2,
  [SPORT_TYPE.SNOWSHOE]: 1.1,
  [SPORT_TYPE.ROWING]: ROW_SPEED_MS,
  [SPORT_TYPE.VIRTUAL_ROW]: ROW_SPEED_MS,
  [SPORT_TYPE.CANOEING]: PADDLE_SPEED_MS,
  [SPORT_TYPE.KAYAKING]: PADDLE_SPEED_MS,
  [SPORT_TYPE.STAND_UP_PADDLING]: 1.8,
  [SPORT_TYPE.NORDIC_SKI]: SKI_SPEED_MS,
  [SPORT_TYPE.ROLLER_SKI]: SKI_SPEED_MS,
  [SPORT_TYPE.INLINE_SKATE]: OFF_ROAD_BIKE_SPEED_MS,
};

/** The easy speed (m/s) a distance step of this sport is estimated at */
export function defaultSpeedForSport(sport?: SPORT_TYPE | null): number {
  return (sport && DEFAULT_SPEED_BY_SPORT[sport]) || DEFAULT_SPEED_MS;
}

/**
 * What the duration estimate reads of a workout: stored steps, the steps
 * of a form and those of an AI answer all fit
 */
type DurationTarget = Pick<
  WorkoutStepTargetDto,
  'targetValue' | 'targetMin' | 'targetMax'
> & { targetType: string; metricType?: string | null };

export type DurationStep = {
  stepType: string;
  durationType?: string | null;
  durationValue?: number | null;
  targets?: readonly DurationTarget[] | null;
  repeatBlock?: {
    repetitions: number;
    childSteps?: readonly DurationStep[] | null;
  } | null;
};

/**
 * Default physiological metrics and intensity clamps used when estimating
 * speed from relative targets (%VMA, %HRmax, %HRR, %FTP, RPE) if the athlete
 * has not recorded their own metrics or pace zones.
 */
const DEFAULT_VMA_KMH = 15; // Recreational runner MAS (~4:00 min/km pace)
const DEFAULT_FTP_RUNNING_W = 275; // Average running functional threshold power (W)
const DEFAULT_FTP_CYCLING_W = 225; // Average cycling functional threshold power (W)
const DEFAULT_HR_MAX_BPM = 190; // Average adult max heart rate (bpm)
const DEFAULT_HR_REST_BPM = 60; // Average adult resting heart rate (bpm)
const DEFAULT_HR_RESERVE_BPM = DEFAULT_HR_MAX_BPM - DEFAULT_HR_REST_BPM; // Karvonen HR reserve (130 bpm)

/**
 * Speed scaling bounds when converting power or RPE ratios into speed when
 * no sport-specific pace zones are configured:
 * - MIN_INTENSITY_SPEED_RATIO (0.45): easy recovery floor (~45% of threshold)
 * - MAX_POWER_SPEED_RATIO (1.3): anaerobic power ceiling (130% FTP speed)
 * - RPE_BASE_SPEED_RATIO (0.55) + RPE_RANGE_SPEED_RATIO (0.6): maps RPE 1–10 onto ~0.6x–1.15x default speed
 */
const MIN_INTENSITY_SPEED_RATIO = 0.45;
const MAX_POWER_SPEED_RATIO = 1.3;
const MIN_RPE_SPEED_RATIO = 0.6;
const MAX_RPE_SPEED_RATIO = 1.25;
const RPE_BASE_SPEED_RATIO = 0.55;
const RPE_RANGE_SPEED_RATIO = 0.6;
const MAX_RATIO_THRESHOLD = 2; // Target values <= 2 (e.g. 0.85) are ratios (85%) rather than raw bpm/watts

const CYCLING_SPORTS = new Set<SPORT_TYPE>([
  SPORT_TYPE.CYCLING,
  SPORT_TYPE.VIRTUAL_RIDE,
  SPORT_TYPE.GRAVEL_RIDE,
  SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
  SPORT_TYPE.E_BIKE_RIDE,
  SPORT_TYPE.E_MOUNTAIN_BIKE_RIDE,
  SPORT_TYPE.VELOMOBILE,
  SPORT_TYPE.HANDCYCLE,
]);

/**
 * Default metric values for average athletes when metrics are not available
 */
const DEFAULT_METRIC_VALUES: Record<string, number> = {
  [METRIC_TYPE.VMA]: DEFAULT_VMA_KMH,
  [METRIC_TYPE.FTP_RUNNING]: DEFAULT_FTP_RUNNING_W,
  [METRIC_TYPE.FTP_CYCLING]: DEFAULT_FTP_CYCLING_W,
  [METRIC_TYPE.CRITICAL_POWER_RUNNING]: DEFAULT_FTP_RUNNING_W,
  [METRIC_TYPE.CRITICAL_POWER_CYCLING]: DEFAULT_FTP_CYCLING_W,
  [METRIC_TYPE.HR_MAX]: DEFAULT_HR_MAX_BPM,
  [METRIC_TYPE.HR_REST]: DEFAULT_HR_REST_BPM,
  [METRIC_TYPE.HR_RESERVE]: DEFAULT_HR_RESERVE_BPM,
};

/**
 * Get metric value with fallback to defaults
 */
function getMetricValue(
  metricType: string | null | undefined,
  metrics?: Record<string, { value: number } | number>,
): number | null {
  if (!metricType) return null;

  // Try to get from provided metrics
  if (metrics) {
    const metric = metrics[metricType];
    if (metric !== undefined && metric !== null) {
      return typeof metric === 'number' ? metric : metric.value;
    }
  }

  // Fallback to default value if available
  const defaultValue = DEFAULT_METRIC_VALUES[metricType];
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  return null;
}

/**
 * Extract speed in m/s from a pace target
 * This is a simplified version that avoids circular dependency with target-intensity.ts
 */
function extractPaceSpeed(
  target: DurationTarget,
  metrics?: Record<string, { value: number } | number>,
): number | null {
  const { targetValue, targetMin, targetMax, metricType } = target;

  // If metricType is set, convert percentage to absolute value
  if (metricType) {
    const metricValue = getMetricValue(metricType, metrics);
    if (metricValue === null) return null;

    // Convert percentage to absolute value
    let absoluteValue: number | null = null;
    if (targetValue !== null && targetValue !== undefined) {
      absoluteValue = targetValue * metricValue;
    } else if (
      targetMin !== null &&
      targetMin !== undefined &&
      targetMax !== null &&
      targetMax !== undefined
    ) {
      absoluteValue = ((targetMin + targetMax) / 2) * metricValue;
    } else if (targetMin !== null && targetMin !== undefined) {
      absoluteValue = targetMin * metricValue;
    } else if (targetMax !== null && targetMax !== undefined) {
      absoluteValue = targetMax * metricValue;
    }

    // Special handling for VMA: convert from km/h to m/s
    if (metricType === METRIC_TYPE.VMA && absoluteValue !== null) {
      return kmhToSpeedMs(absoluteValue);
    }

    // For other metrics, assume value is already in m/s
    return absoluteValue;
  }

  // No metricType: value is already in m/s
  if (targetValue !== null && targetValue !== undefined) {
    return targetValue;
  }
  if (
    targetMin !== null &&
    targetMin !== undefined &&
    targetMax !== null &&
    targetMax !== undefined
  ) {
    return (targetMin + targetMax) / 2;
  }
  if (targetMin !== null && targetMin !== undefined) {
    return targetMin;
  }
  if (targetMax !== null && targetMax !== undefined) {
    return targetMax;
  }

  return null;
}

function resolveTargetMidpoint(target: DurationTarget): number | null {
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
  return target.targetMin ?? target.targetMax ?? null;
}

function getZoneBoundsForSport(
  zone: StepZoneLike,
  sport?: SPORT_TYPE | null,
): { min: number; max: number } | null {
  if (zone.values && zone.values.length > 0) {
    const matched = zone.values.filter(
      (value) => !sport || !value.sports || value.sports.includes(sport),
    );
    if (matched.length === 0) return null;
    return { min: matched[0].min, max: matched[0].max };
  }
  if (zone.min !== undefined && zone.max !== undefined) {
    return { min: zone.min, max: zone.max };
  }
  return null;
}

function speedFromZone(
  zone: StepZoneLike,
  trainingZones?: StepZoneLike[],
  sport?: SPORT_TYPE | null,
): number | null {
  if (!getZoneBoundsForSport(zone, sport)) return null;

  const paceZone =
    zone.type === TRAINING_ZONE_TYPE.PACE
      ? zone
      : trainingZones?.find(
          (z) =>
            z.type === TRAINING_ZONE_TYPE.PACE &&
            z.index === zone.index &&
            getZoneBoundsForSport(z, sport) !== null,
        );
  const paceBounds = paceZone ? getZoneBoundsForSport(paceZone, sport) : null;
  if (paceBounds && paceBounds.min > 0 && paceBounds.max > 0) {
    return paceToSpeed((paceBounds.min + paceBounds.max) / 2);
  }

  return null;
}

function extractStepSpeed(
  step: Pick<DurationStep, 'targets'>,
  metrics?: Record<string, { value: number } | number>,
  sport?: SPORT_TYPE | null,
  trainingZones?: StepZoneLike[],
): number {
  const paceTarget = step.targets?.find(
    (target) => target.targetType === WORKOUT_TARGET_TYPE.PACE,
  );
  if (paceTarget) {
    const speed = extractPaceSpeed(paceTarget, metrics);
    if (speed !== null && speed > 0) return speed;
  }

  const zoneTarget = step.targets?.find(
    (target) => target.targetType === WORKOUT_TARGET_TYPE.ZONE,
  );
  const zone = trainingZones?.find(
    (z) => z.trainingZoneId === zoneTarget?.targetValue,
  );
  if (zone) {
    const speed = speedFromZone(zone, trainingZones, sport);
    if (speed !== null && speed > 0) return speed;
  }

  const hrTarget = step.targets?.find(
    (target) => target.targetType === WORKOUT_TARGET_TYPE.HEARTRATE,
  );
  if (hrTarget) {
    const raw = resolveTargetMidpoint(hrTarget);
    if (raw !== null && raw > 0) {
      const hrMax =
        getMetricValue(METRIC_TYPE.HR_MAX, metrics) ?? DEFAULT_HR_MAX_BPM;
      const hrRest =
        getMetricValue(METRIC_TYPE.HR_REST, metrics) ?? DEFAULT_HR_REST_BPM;
      const hrBpm =
        hrTarget.metricType === METRIC_TYPE.HR_RESERVE
          ? hrRest +
            raw *
              (getMetricValue(METRIC_TYPE.HR_RESERVE, metrics) ??
                hrMax - hrRest)
          : hrTarget.metricType || raw <= MAX_RATIO_THRESHOLD
            ? raw * hrMax
            : raw;

      const matchedHrZone = trainingZones?.find((z) => {
        if (z.type !== TRAINING_ZONE_TYPE.HEARTRATE) return false;
        const b = getZoneBoundsForSport(z, sport);
        return b ? hrBpm >= b.min && hrBpm <= b.max : false;
      });
      if (matchedHrZone) {
        const speed = speedFromZone(matchedHrZone, trainingZones, sport);
        if (speed !== null && speed > 0) return speed;
      }
    }
  }

  const powerTarget = step.targets?.find(
    (target) => target.targetType === WORKOUT_TARGET_TYPE.POWER,
  );
  if (powerTarget) {
    const raw = resolveTargetMidpoint(powerTarget);
    if (raw !== null && raw > 0) {
      const isCycling = Boolean(sport && CYCLING_SPORTS.has(sport));
      const ftpKey =
        powerTarget.metricType ||
        (isCycling ? METRIC_TYPE.FTP_CYCLING : METRIC_TYPE.FTP_RUNNING);
      const defaultFtp = isCycling
        ? DEFAULT_FTP_CYCLING_W
        : DEFAULT_FTP_RUNNING_W;
      const ftp = getMetricValue(ftpKey, metrics) ?? defaultFtp;
      const powerW =
        powerTarget.metricType || raw <= MAX_RATIO_THRESHOLD ? raw * ftp : raw;

      const matchedPowerZone = trainingZones?.find((z) => {
        if (z.type !== TRAINING_ZONE_TYPE.POWER) return false;
        const b = getZoneBoundsForSport(z, sport);
        return b ? powerW >= b.min && powerW <= b.max : false;
      });
      if (matchedPowerZone) {
        const speed = speedFromZone(matchedPowerZone, trainingZones, sport);
        if (speed !== null && speed > 0) return speed;
      }

      if (ftp > 0 && powerW > 0) {
        return (
          defaultSpeedForSport(sport) *
          Math.min(
            MAX_POWER_SPEED_RATIO,
            Math.max(MIN_INTENSITY_SPEED_RATIO, powerW / ftp),
          )
        );
      }
    }
  }

  const rpeTarget = step.targets?.find(
    (target) => target.targetType === WORKOUT_TARGET_TYPE.RPE,
  );
  if (rpeTarget) {
    const rpe = resolveTargetMidpoint(rpeTarget);
    if (rpe !== null && rpe > 0) {
      const level = Math.min(4, Math.max(0, Math.ceil(rpe / 2) - 1));
      const paceZones = trainingZones
        ?.filter(
          (z) =>
            z.type === TRAINING_ZONE_TYPE.PACE &&
            getZoneBoundsForSport(z, sport) !== null,
        )
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      const matchedZone =
        paceZones?.[level] ??
        paceZones?.find((z) => z.index === level || z.index === level + 1);
      if (matchedZone) {
        const speed = speedFromZone(matchedZone, trainingZones, sport);
        if (speed !== null && speed > 0) return speed;
      }
      return (
        defaultSpeedForSport(sport) *
        Math.min(
          MAX_RPE_SPEED_RATIO,
          Math.max(
            MIN_RPE_SPEED_RATIO,
            RPE_BASE_SPEED_RATIO + (rpe / 10) * RPE_RANGE_SPEED_RATIO,
          ),
        )
      );
    }
  }

  // Fallback when no target is set: use the athlete's Zone 1-2 pace for this sport if configured
  if (trainingZones && trainingZones.length > 0) {
    const sortedPaceZones = trainingZones
      .filter(
        (z) =>
          z.type === TRAINING_ZONE_TYPE.PACE &&
          getZoneBoundsForSport(z, sport) !== null,
      )
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    if (sortedPaceZones.length > 0) {
      const z1Speed = speedFromZone(sortedPaceZones[0], trainingZones, sport);
      const z2Speed =
        sortedPaceZones.length > 1
          ? speedFromZone(sortedPaceZones[1], trainingZones, sport)
          : null;
      if (z1Speed && z2Speed) return (z1Speed + z2Speed) / 2;
      if (z1Speed) return z1Speed;
    }
  }

  return defaultSpeedForSport(sport);
}

/**
 * Estimate step duration from distance using pace targets
 * @param step - Workout step with durationType === DISTANCE
 * @param metrics - Optional athlete metrics for target intensity calculation
 * @param sport - The session's sport, for the speed without a pace target
 * @param trainingZones - Optional athlete training zones
 * @returns Estimated duration in seconds, or null if cannot estimate
 */
export function estimateStepDurationFromDistance(
  step: DurationStep,
  metrics?: Record<string, { value: number } | number>,
  sport?: SPORT_TYPE | null,
  trainingZones?: StepZoneLike[],
): number | null {
  if (
    step.durationType !== WORKOUT_DURATION_TYPE.DISTANCE ||
    !step.durationValue
  ) {
    return null;
  }

  return (
    step.durationValue / extractStepSpeed(step, metrics, sport, trainingZones)
  );
}

/**
 * Estimate step distance in meters from duration using pace/zone targets or default speed
 * @param step - Workout step with durationType === TIME
 * @param metrics - Optional athlete metrics for target intensity calculation
 * @param sport - The session's sport, for the speed without a pace target
 * @param trainingZones - Optional athlete training zones
 * @returns Estimated distance in meters, or null if cannot estimate
 */
export function estimateStepDistanceFromDuration(
  step: Pick<DurationStep, 'durationType' | 'durationValue' | 'targets'>,
  metrics?: Record<string, { value: number } | number>,
  sport?: SPORT_TYPE | null,
  trainingZones?: StepZoneLike[],
): number | null {
  if (
    step.durationType !== WORKOUT_DURATION_TYPE.TIME ||
    !step.durationValue ||
    step.durationValue <= 0
  ) {
    return null;
  }

  if (sport && !getSportConfig(sport)?.showDistance) {
    return null;
  }

  return (
    step.durationValue * extractStepSpeed(step, metrics, sport, trainingZones)
  );
}

/**
 * Calculate total duration in seconds for a workout
 * Counts both TIME-based steps and estimates DISTANCE-based steps using pace targets
 * @param workout - Workout to calculate duration for
 * @param metrics - Optional athlete metrics for estimating distance-based durations
 * @param sport - The session's sport, for distance steps without a pace target
 * @returns Total duration in seconds, or null if no calculable steps
 */
export function calculateWorkoutDuration(
  workout: { steps?: readonly DurationStep[] | null },
  metrics?: Record<string, { value: number } | number>,
  sport?: SPORT_TYPE | null,
): number | null {
  if (!workout.steps || workout.steps.length === 0) {
    return null;
  }

  let totalSeconds = 0;
  let hasCalculableDuration = false;

  const calculateStepDuration = (step: DurationStep): number | null => {
    // TIME-based steps: use durationValue directly
    if (
      step.durationType === WORKOUT_DURATION_TYPE.TIME &&
      step.durationValue
    ) {
      hasCalculableDuration = true;
      return step.durationValue;
    }

    // DISTANCE-based steps: estimate using pace targets
    if (step.durationType === WORKOUT_DURATION_TYPE.DISTANCE) {
      const estimatedDuration = estimateStepDurationFromDistance(
        step,
        metrics,
        sport,
      );
      if (estimatedDuration !== null) {
        hasCalculableDuration = true;
        return estimatedDuration;
      }
    }

    return null;
  };

  for (const step of workout.steps) {
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
      // Calculate duration of child steps and multiply by repetitions
      let repeatDuration = 0;
      let hasRepeatDuration = false;
      for (const childStep of step.repeatBlock.childSteps || []) {
        const childDuration = calculateStepDuration(childStep);
        if (childDuration !== null) {
          repeatDuration += childDuration;
          hasRepeatDuration = true;
        }
      }
      if (hasRepeatDuration) {
        totalSeconds += repeatDuration * step.repeatBlock.repetitions;
        hasCalculableDuration = true;
      }
    } else {
      const stepDuration = calculateStepDuration(step);
      if (stepDuration !== null) {
        totalSeconds += stepDuration;
      }
    }
  }

  return hasCalculableDuration ? totalSeconds : null;
}

/** Within a minute, a planned duration is the workout's own total */
const SAME_DURATION_TOLERANCE_S = 60;

/**
 * Whether a session's planned duration was set on purpose rather than taken
 * from its workout: the coach's figure must then survive a change of steps.
 * @param goalDuration - The planned duration, in seconds
 * @param workoutDuration - The workout's computed total, in seconds
 */
export function isDurationSetByHand(
  goalDuration: number | null | undefined,
  workoutDuration: number | null | undefined,
): boolean {
  if (goalDuration === null || goalDuration === undefined) return false;
  if (workoutDuration === null || workoutDuration === undefined) return true;
  return Math.abs(goalDuration - workoutDuration) >= SAME_DURATION_TOLERANCE_S;
}

/**
 * Calculate total distance in meters for a workout
 * Counts both DISTANCE-based steps and estimates TIME-based steps using targets
 */
export function calculateWorkoutDistance(
  workout: { steps?: readonly DurationStep[] | null },
  metrics?: Record<string, { value: number } | number>,
  sport?: SPORT_TYPE | null,
  trainingZones?: StepZoneLike[],
): number | null {
  if (!workout.steps || workout.steps.length === 0) {
    return null;
  }

  let totalMeters = 0;
  let hasDistanceDuration = false;

  const calculateStepDistance = (step: DurationStep): number => {
    if (
      step.durationType === WORKOUT_DURATION_TYPE.DISTANCE &&
      step.durationValue
    ) {
      hasDistanceDuration = true;
      return step.durationValue;
    }
    if (step.durationType === WORKOUT_DURATION_TYPE.TIME) {
      const estimated = estimateStepDistanceFromDuration(
        step,
        metrics,
        sport,
        trainingZones,
      );
      if (estimated !== null) {
        hasDistanceDuration = true;
        return estimated;
      }
    }
    return 0;
  };

  for (const step of workout.steps) {
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
      // Calculate distance of child steps and multiply by repetitions
      let repeatDistance = 0;
      for (const childStep of step.repeatBlock.childSteps || []) {
        repeatDistance += calculateStepDistance(childStep);
      }
      totalMeters += repeatDistance * step.repeatBlock.repetitions;
    } else {
      totalMeters += calculateStepDistance(step);
    }
  }

  return hasDistanceDuration ? totalMeters : null;
}

/**
 * Count total number of steps (including child steps in repeat blocks)
 */
export function countWorkoutSteps(workout: WorkoutDto): number {
  if (!workout.steps || workout.steps.length === 0) {
    return 0;
  }

  let count = 0;

  const countStep = (step: WorkoutStepDto): void => {
    count++;
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
      for (const childStep of step.repeatBlock.childSteps || []) {
        countStep(childStep);
      }
    }
  };

  for (const step of workout.steps) {
    countStep(step);
  }

  return count;
}

// ============================================================================
// Workout Validation
// ============================================================================

export interface WorkoutValidationError {
  field: string;
  message: string;
  stepIndex?: number;
  targetIndex?: number;
}

export interface WorkoutValidationResult {
  valid: boolean;
  errors: WorkoutValidationError[];
}

/**
 * Validate workout structure and data consistency
 */
export function validateWorkoutStructure(
  workout: WorkoutDto,
): WorkoutValidationResult {
  const errors: WorkoutValidationError[] = [];

  // Check basic fields (name and description removed)

  // Check steps
  if (!workout.steps || workout.steps.length === 0) {
    errors.push({ field: 'steps', message: 'At least one step is required' });
    return { valid: false, errors };
  }

  // Validate each step
  const orderIndices = new Set<number>();

  workout.steps.forEach((step: WorkoutStepDto, index: number) => {
    // Check order_index uniqueness
    if (orderIndices.has(step.orderIndex)) {
      errors.push({
        field: 'orderIndex',
        message: `Duplicate order index ${step.orderIndex}`,
        stepIndex: index,
      });
    }
    orderIndices.add(step.orderIndex);

    // Validate duration
    if (
      step.durationType !== WORKOUT_DURATION_TYPE.OPEN &&
      step.durationType !== WORKOUT_DURATION_TYPE.LAP_BUTTON &&
      !step.durationValue
    ) {
      errors.push({
        field: 'durationValue',
        message: `Duration value is required for duration type ${step.durationType}`,
        stepIndex: index,
      });
    }

    // Validate repeat block
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT) {
      if (!step.repeatBlock) {
        errors.push({
          field: 'repeatBlock',
          message: 'Repeat block is required for REPEAT step type',
          stepIndex: index,
        });
      } else {
        if (
          step.repeatBlock.repetitions < 1 ||
          step.repeatBlock.repetitions > 99
        ) {
          errors.push({
            field: 'repetitions',
            message: 'Repetitions must be between 1 and 99',
            stepIndex: index,
          });
        }

        if (
          !step.repeatBlock.childSteps ||
          step.repeatBlock.childSteps.length === 0
        ) {
          errors.push({
            field: 'childSteps',
            message: 'Repeat block must contain at least one child step',
            stepIndex: index,
          });
        } else {
          // Validate that child steps do not contain repeat blocks (max depth of 1)
          step.repeatBlock.childSteps.forEach((childStep: WorkoutStepDto) => {
            if (
              childStep.stepType === WORKOUT_STEP_TYPE.REPEAT &&
              childStep.repeatBlock
            ) {
              errors.push({
                field: 'repeatBlock',
                message:
                  'Repeat blocks cannot be nested. A repeat block cannot contain another repeat block (max depth of 1).',
                stepIndex: index,
              });
            }
          });
        }
      }
    }

    if (step.targets && step.targets.length > 0) {
      step.targets.forEach(
        (target: WorkoutStepTargetDto, targetIndex: number) => {
          if (
            target.targetMin !== null &&
            target.targetMin !== undefined &&
            target.targetMax !== null &&
            target.targetMax !== undefined
          ) {
            if (target.targetMin >= target.targetMax) {
              errors.push({
                field: 'targetRange',
                message: 'Target min must be less than target max',
                stepIndex: index,
                targetIndex,
              });
            }
          }
        },
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Unit Conversions
// ============================================================================

/**
 * Convert pace (min/km) to speed (m/s)
 */
export function paceToSpeed(paceMinPerKm: number): number {
  return 1000 / (paceMinPerKm * 60);
}

/**
 * Convert speed (m/s) to pace (min/km)
 */
export function speedToPace(speedMs: number): number {
  return 1000 / (speedMs * 60);
}

/**
 * Convert speed (m/s) to km/h
 */
export function speedMsToKmh(speedMs: number): number {
  return speedMs * 3.6;
}

/**
 * Convert km/h to speed (m/s)
 */
export function kmhToSpeedMs(kmh: number): number {
  return kmh / 3.6;
}

/**
 * Format duration in seconds to HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format distance in meters
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
