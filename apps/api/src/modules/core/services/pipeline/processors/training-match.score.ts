import {
  DurationStep,
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  calculateWorkoutDistance,
  calculateWorkoutDuration,
} from '@openathlete/shared';

/** Weights of the match score's criteria, out of 100 */
const SPORT_WEIGHT = 40;
const DURATION_WEIGHT = 30;
const DISTANCE_WEIGHT = 30;

/** Credit for a sport of the same family, e.g. a trail run for a run */
const RELATED_SPORT_CREDIT = 0.75;

/**
 * Sports an athlete does one session of in another form: a planned run done
 * on a trail or a treadmill is still that run
 */
const SPORT_FAMILIES: readonly (readonly SPORT_TYPE[])[] = [
  [SPORT_TYPE.RUNNING, SPORT_TYPE.TRAIL_RUNNING, SPORT_TYPE.VIRTUAL_RUN],
  [
    SPORT_TYPE.CYCLING,
    SPORT_TYPE.GRAVEL_RIDE,
    SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
    SPORT_TYPE.VIRTUAL_RIDE,
    SPORT_TYPE.E_BIKE_RIDE,
    SPORT_TYPE.E_MOUNTAIN_BIKE_RIDE,
  ],
  [SPORT_TYPE.ROWING, SPORT_TYPE.VIRTUAL_ROW],
  [SPORT_TYPE.NORDIC_SKI, SPORT_TYPE.BACKCOUNTRY_SKI, SPORT_TYPE.ROLLER_SKI],
  [SPORT_TYPE.WALK, SPORT_TYPE.HIKING],
  [SPORT_TYPE.STRENGTH, SPORT_TYPE.WEIGHT_TRAINING],
];

/** Within a minute, a planned duration is the workout's own total */
const SAME_DURATION_TOLERANCE_S = 60;
/** Within 5% (and at least 100 m), a planned distance is the workout's own */
const SAME_DISTANCE_TOLERANCE_RATIO = 0.05;
const SAME_DISTANCE_TOLERANCE_M = 100;

/** Step lengths the workout totals count; the others last as long as the athlete wants */
const MEASURED_DURATION_TYPES: readonly string[] = [
  WORKOUT_DURATION_TYPE.TIME,
  WORKOUT_DURATION_TYPE.DISTANCE,
];

export type MatchMetrics = Record<string, { value: number }>;

export type MatchActivity = {
  sport: string;
  distance: number;
  movingTime: number;
};

export type MatchTraining = {
  sport: string;
  goalDistance: number | null;
  goalDuration: number | null;
  workout?: { steps?: readonly DurationStep[] | null } | null;
};

/**
 * A planned duration or distance. A minimum when it only counts the
 * workout's measured steps: lap-button, open, heart-rate or calorie steps
 * add an unknown length, so doing more is no sign of another session.
 */
export type PlannedLength = { value: number; minimum: boolean };

/** Credit (0-1) for the activity's sport against the session's */
export function sportCredit(activitySport: string, trainingSport: string) {
  if (activitySport === trainingSport) return 1;
  const related = SPORT_FAMILIES.some(
    (family) =>
      family.includes(activitySport as SPORT_TYPE) &&
      family.includes(trainingSport as SPORT_TYPE),
  );
  return related ? RELATED_SPORT_CREDIT : 0;
}

/** Whether a step lasts until the athlete moves on, not a set time or distance */
export function isOpenEndedStep(step: DurationStep): boolean {
  if (step.stepType === WORKOUT_STEP_TYPE.REPEAT) {
    return (step.repeatBlock?.childSteps ?? []).some(isOpenEndedStep);
  }
  return !(
    MEASURED_DURATION_TYPES.includes(step.durationType ?? '') &&
    (step.durationValue ?? 0) > 0
  );
}

/**
 * The session's planned duration and distance, each marked as a minimum
 * when it is no more than the total of a workout with open-ended steps.
 * A coach who counts the open parts sets a larger figure, a real target.
 */
export function plannedLengths(
  training: MatchTraining,
  metrics: MatchMetrics = {},
): { duration: PlannedLength | null; distance: PlannedLength | null } {
  const steps = training.workout?.steps ?? [];
  const openEnded = steps.some(isOpenEndedStep);
  const sport = training.sport as SPORT_TYPE;

  const planned = (
    goal: number | null,
    stepsTotal: () => number | null,
    tolerance: (total: number) => number,
  ): PlannedLength | null => {
    if (goal === null || goal <= 0) return null;
    if (!openEnded) return { value: goal, minimum: false };
    const total = stepsTotal();
    return {
      value: goal,
      minimum: total !== null && goal < total + tolerance(total),
    };
  };

  return {
    duration: planned(
      training.goalDuration,
      () => calculateWorkoutDuration({ steps }, metrics, sport),
      () => SAME_DURATION_TOLERANCE_S,
    ),
    distance: planned(
      training.goalDistance,
      () => calculateWorkoutDistance({ steps }, metrics, sport),
      (total) =>
        Math.max(
          total * SAME_DISTANCE_TOLERANCE_RATIO,
          SAME_DISTANCE_TOLERANCE_M,
        ),
    ),
  };
}

/** Credit (0-1) for how close the done length is to the planned one */
export function lengthCredit(actual: number, planned: PlannedLength) {
  if (planned.minimum && actual >= planned.value) return 1;
  if (actual <= 0) return 0;
  return Math.min(actual / planned.value, planned.value / actual);
}

/**
 * Match score (0-100) between an activity and a planned session
 *
 * Criteria:
 * - Sport: 40% weight (same family: 75% of it)
 * - Duration: 30% weight, if the session plans one
 * - Distance: 30% weight, if the session plans one
 *
 * Criteria the session does not plan are left out of the total.
 */
export function calculateMatchScore(
  activity: MatchActivity,
  training: MatchTraining,
  metrics: MatchMetrics = {},
): number {
  const { duration, distance } = plannedLengths(training, metrics);

  let totalWeight = SPORT_WEIGHT;
  let achievedScore =
    sportCredit(activity.sport, training.sport) * SPORT_WEIGHT;

  if (duration) {
    totalWeight += DURATION_WEIGHT;
    achievedScore +=
      lengthCredit(activity.movingTime, duration) * DURATION_WEIGHT;
  }

  if (distance) {
    totalWeight += DISTANCE_WEIGHT;
    achievedScore +=
      lengthCredit(activity.distance, distance) * DISTANCE_WEIGHT;
  }

  return Math.round((achievedScore / totalWeight) * 100);
}
