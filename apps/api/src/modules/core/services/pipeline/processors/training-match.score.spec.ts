import {
  DurationStep,
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
} from '@openathlete/shared';

import { TRAINING_MATCH_THRESHOLD } from '../constants';
import {
  calculateMatchScore,
  isOpenEndedStep,
  plannedLengths,
  sportCredit,
} from './training-match.score';

const lap = (stepType: WORKOUT_STEP_TYPE): DurationStep => ({
  stepType,
  durationType: WORKOUT_DURATION_TYPE.LAP_BUTTON,
  durationValue: null,
});

const repeat = (
  repetitions: number,
  childSteps: DurationStep[],
): DurationStep => ({
  stepType: WORKOUT_STEP_TYPE.REPEAT,
  durationType: WORKOUT_DURATION_TYPE.OPEN,
  durationValue: null,
  repeatBlock: { repetitions, childSteps },
});

/** 6 × (400 m, 60 s rest): 6 × (120 s at the easy running speed + 60 s) */
const intervals = repeat(6, [
  {
    stepType: WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
    durationType: WORKOUT_DURATION_TYPE.DISTANCE,
    durationValue: 400,
  },
  {
    stepType: WORKOUT_STEP_TYPE.INTERVAL_REST,
    durationType: WORKOUT_DURATION_TYPE.TIME,
    durationValue: 60,
  },
]);
const INTERVALS_SECONDS = 1081; // 6 × (400 m / 3.33 m/s + 60 s)

/** Warm-up and cool-down end when the athlete presses lap */
const lapWorkout = {
  steps: [
    lap(WORKOUT_STEP_TYPE.WARMUP),
    intervals,
    lap(WORKOUT_STEP_TYPE.COOLDOWN),
  ],
};

/** The 50 min, 9 km the athlete really ran, warm-up and cool-down included */
const run = { sport: SPORT_TYPE.RUNNING, movingTime: 3000, distance: 9000 };

describe('sportCredit', () => {
  it('gives full credit to the same sport, part to its family, none to others', () => {
    expect(sportCredit(SPORT_TYPE.RUNNING, SPORT_TYPE.RUNNING)).toBe(1);
    expect(sportCredit(SPORT_TYPE.TRAIL_RUNNING, SPORT_TYPE.RUNNING)).toBe(
      0.75,
    );
    expect(sportCredit(SPORT_TYPE.VIRTUAL_RIDE, SPORT_TYPE.CYCLING)).toBe(0.75);
    expect(sportCredit(SPORT_TYPE.CYCLING, SPORT_TYPE.RUNNING)).toBe(0);
  });
});

describe('isOpenEndedStep', () => {
  it('finds steps without a set time or distance, in repeats too', () => {
    expect(isOpenEndedStep(lap(WORKOUT_STEP_TYPE.WARMUP))).toBe(true);
    expect(
      isOpenEndedStep({
        stepType: WORKOUT_STEP_TYPE.STEADY,
        durationType: WORKOUT_DURATION_TYPE.TIME,
        durationValue: null,
      }),
    ).toBe(true);
    expect(
      isOpenEndedStep(repeat(4, [lap(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE)])),
    ).toBe(true);
    expect(isOpenEndedStep(intervals)).toBe(false);
  });
});

describe('plannedLengths', () => {
  it('reads the workout total of a session with lap steps as a minimum', () => {
    const { duration } = plannedLengths({
      sport: SPORT_TYPE.RUNNING,
      goalDuration: INTERVALS_SECONDS,
      goalDistance: null,
      workout: lapWorkout,
    });
    expect(duration).toEqual({ value: INTERVALS_SECONDS, minimum: true });
  });

  it('keeps a duration the coach set above the workout total as a target', () => {
    const { duration } = plannedLengths({
      sport: SPORT_TYPE.RUNNING,
      goalDuration: 3600,
      goalDistance: null,
      workout: lapWorkout,
    });
    expect(duration).toEqual({ value: 3600, minimum: false });
  });

  it('keeps the totals of a workout without open-ended steps as targets', () => {
    const { duration } = plannedLengths({
      sport: SPORT_TYPE.RUNNING,
      goalDuration: INTERVALS_SECONDS,
      goalDistance: null,
      workout: { steps: [intervals] },
    });
    expect(duration).toEqual({ value: INTERVALS_SECONDS, minimum: false });
  });
});

describe('calculateMatchScore', () => {
  const lapSession = {
    sport: SPORT_TYPE.RUNNING,
    goalDuration: INTERVALS_SECONDS,
    goalDistance: null,
    workout: lapWorkout,
  };

  it('matches a run to an interval session whose warm-up and cool-down end on lap', () => {
    // Without the workout, its total reads as the whole session: no match
    expect(
      calculateMatchScore(run, { ...lapSession, workout: null }),
    ).toBeLessThan(TRAINING_MATCH_THRESHOLD);
    expect(calculateMatchScore(run, lapSession)).toBe(100);
  });

  it('still scores a run shorter than the minimum lower', () => {
    const short = { ...run, movingTime: INTERVALS_SECONDS / 2 };
    expect(calculateMatchScore(short, lapSession)).toBe(
      Math.round(((40 + 0.5 * 30) / 70) * 100),
    );
  });

  it('scores a duration the coach set by hand as a target', () => {
    const session = { ...lapSession, goalDuration: 1500 };
    expect(calculateMatchScore(run, session)).toBeLessThan(100);
  });

  it('matches a related sport, below the same sport', () => {
    const session = {
      sport: SPORT_TYPE.RUNNING,
      goalDuration: 3000,
      goalDistance: 9000,
    };
    const trail = { ...run, sport: SPORT_TYPE.TRAIL_RUNNING };
    const ride = { ...run, sport: SPORT_TYPE.VIRTUAL_RIDE };
    expect(calculateMatchScore(run, session)).toBe(100);
    expect(calculateMatchScore(trail, session)).toBe(90);
    expect(calculateMatchScore(trail, session)).toBeGreaterThanOrEqual(
      TRAINING_MATCH_THRESHOLD,
    );
    expect(calculateMatchScore(ride, session)).toBeLessThan(
      TRAINING_MATCH_THRESHOLD,
    );
  });

  it('scores a session with neither duration nor distance on its sport alone', () => {
    const session = {
      sport: SPORT_TYPE.RUNNING,
      goalDuration: null,
      goalDistance: null,
    };
    expect(calculateMatchScore(run, session)).toBe(100);
    expect(
      calculateMatchScore({ ...run, sport: SPORT_TYPE.TRAIL_RUNNING }, session),
    ).toBe(75);
    expect(
      calculateMatchScore({ ...run, sport: SPORT_TYPE.SWIMMING }, session),
    ).toBe(0);
  });
});
