import { describe, expect, it } from 'vitest';

import {
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '@openathlete/shared';

import type { ZonesByType } from '../workout/workout-profile';
import {
  type BuilderAction,
  builderReducer,
  initialState,
} from './builder-state';
import { defaultStep } from './step-defaults';

function zones(count: number): ZonesByType {
  const list = Array.from({ length: count }, (_, index) => ({
    id: 100 + index,
    index,
    name: `Z${index + 1}`,
    color: '#000',
  })) as unknown as ZonesByType[TRAINING_ZONE_TYPE];
  return {
    [TRAINING_ZONE_TYPE.HEARTRATE]: list,
    [TRAINING_ZONE_TYPE.POWER]: [],
    [TRAINING_ZONE_TYPE.PACE]: [],
  };
}

const run = (count = 5) => ({
  sport: SPORT_TYPE.RUNNING,
  zonesByType: zones(count),
  zoneType: TRAINING_ZONE_TYPE.HEARTRATE,
});

describe('defaultStep', () => {
  it('gives an effort a few minutes in Z4', () => {
    const step = defaultStep(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, run());
    expect(step.durationType).toBe(WORKOUT_DURATION_TYPE.TIME);
    expect(step.durationValue).toBe(180);
    expect(step.targets).toEqual([
      { targetType: WORKOUT_TARGET_TYPE.ZONE, targetValue: 103 },
    ]);
  });

  it('takes the top zone of an athlete with fewer zones', () => {
    const step = defaultStep(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, run(3));
    expect(step.targets?.[0].targetValue).toBe(102);
  });

  it('leaves the target open without zones', () => {
    expect(defaultStep(WORKOUT_STEP_TYPE.WARMUP, run(0)).targets).toEqual([]);
  });

  it('counts swims in metres, rests in seconds', () => {
    const swim = { ...run(), sport: SPORT_TYPE.SWIMMING };
    expect(defaultStep(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, swim)).toMatchObject({
      durationType: WORKOUT_DURATION_TYPE.DISTANCE,
      durationValue: 100,
    });
    expect(defaultStep(WORKOUT_STEP_TYPE.INTERVAL_REST, swim)).toMatchObject({
      durationType: WORKOUT_DURATION_TYPE.TIME,
      durationValue: 20,
    });
  });

  it('fills a repeat with an effort and its recovery', () => {
    const repeat = defaultStep(WORKOUT_STEP_TYPE.REPEAT, run());
    expect(repeat.repeatBlock?.repetitions).toBe(4);
    expect(repeat.repeatBlock?.childSteps.map((s) => s.stepType)).toEqual([
      WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
      WORKOUT_STEP_TYPE.INTERVAL_REST,
    ]);
  });

  it('keeps a steady step chosen from the bar steady, wherever it lands', () => {
    const steady = defaultStep(WORKOUT_STEP_TYPE.STEADY, run());
    const effort = defaultStep(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, run());
    const build = (explicit: boolean) =>
      (
        [
          { type: 'insert', steps: [steady], explicit },
          { type: 'insert', steps: [effort, effort] },
        ] satisfies BuilderAction[]
      ).reduce(builderReducer, initialState());
    expect(build(true).steps[0].stepType).toBe(WORKOUT_STEP_TYPE.STEADY);
    // Typed without a type word, its place decides: first is the warm-up
    expect(build(false).steps[0].stepType).toBe(WORKOUT_STEP_TYPE.WARMUP);
  });
});
