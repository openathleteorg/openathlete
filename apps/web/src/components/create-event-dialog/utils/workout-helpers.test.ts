import { describe, expect, it } from 'vitest';

import {
  type CreateWorkoutStepDto,
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  defaultSpeedForSport,
} from '@openathlete/shared';

import { calculateWorkoutDurationFromSteps } from './workout-helpers';

const step = (
  stepType: WORKOUT_STEP_TYPE,
  durationType: WORKOUT_DURATION_TYPE,
  durationValue: number,
): CreateWorkoutStepDto => ({
  stepType,
  durationType,
  durationValue,
  targets: [],
});

const lengths = (count: number, stepType = WORKOUT_STEP_TYPE.INTERVAL_ACTIVE) =>
  step(stepType, WORKOUT_DURATION_TYPE.DISTANCE, count * 25);

// "15' riscaldamento @z2 / ripeti per 4 volte: (8 vasche @z2 + 1 vasca @z3
// 1 vasca @z4 + 1' fermo) / 5' @z2 defaticamento / in totale 45'"
const ITALIAN_SWIM: CreateWorkoutStepDto[] = [
  step(WORKOUT_STEP_TYPE.WARMUP, WORKOUT_DURATION_TYPE.TIME, 15 * 60),
  {
    ...step(WORKOUT_STEP_TYPE.REPEAT, WORKOUT_DURATION_TYPE.OPEN, 0),
    durationValue: null,
    repeatBlock: {
      repetitions: 4,
      childSteps: [
        lengths(8),
        lengths(1),
        lengths(1),
        step(WORKOUT_STEP_TYPE.INTERVAL_REST, WORKOUT_DURATION_TYPE.TIME, 60),
      ],
    },
  },
  step(WORKOUT_STEP_TYPE.COOLDOWN, WORKOUT_DURATION_TYPE.TIME, 5 * 60),
];

describe('calculateWorkoutDurationFromSteps', () => {
  it('estimates pool lengths at a swim pace, near the stated total', () => {
    const seconds = calculateWorkoutDurationFromSteps(
      ITALIAN_SWIM,
      {},
      SPORT_TYPE.SWIMMING,
    );
    // 20' timed, 4 x (250 m + 1' rest): about 41'
    expect(seconds).not.toBeNull();
    expect(seconds! / 60).toBeGreaterThan(38);
    expect(seconds! / 60).toBeLessThan(48);
  });

  it('swims slower than it runs and runs slower than it rides', () => {
    const swim = defaultSpeedForSport(SPORT_TYPE.SWIMMING);
    const run = defaultSpeedForSport(SPORT_TYPE.RUNNING);
    const ride = defaultSpeedForSport(SPORT_TYPE.CYCLING);
    expect(swim).toBeCloseTo(0.95);
    expect(run).toBeCloseTo(3.33);
    expect(ride).toBeGreaterThan(8);
    // 100 m of swimming at about 1:45
    expect(100 / swim).toBeCloseTo(105, 0);
  });

  it('keeps the running pace without a sport', () => {
    const tenK = [lengths(400)];
    expect(calculateWorkoutDurationFromSteps(tenK)).toBeCloseTo(10000 / 3.33);
    expect(defaultSpeedForSport(null)).toBe(defaultSpeedForSport(undefined));
  });

  it('prefers a pace target to the sport default', () => {
    const paced: CreateWorkoutStepDto = {
      ...lengths(4),
      targets: [
        {
          targetType: WORKOUT_TARGET_TYPE.PACE,
          targetValue: 1.25,
          targetMin: null,
          targetMax: null,
          metricType: null,
        },
      ],
    };
    expect(
      calculateWorkoutDurationFromSteps([paced], {}, SPORT_TYPE.SWIMMING),
    ).toBeCloseTo(100 / 1.25);
  });
});
