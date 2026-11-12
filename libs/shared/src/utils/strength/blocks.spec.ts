import { describe, expect, it } from 'vitest';

import {
  WORKOUT_DURATION_TYPE as D,
  EXERCISE_SIDE,
  WORKOUT_REPEAT_KIND as K,
  WORKOUT_STEP_TYPE as S,
  WORKOUT_TARGET_TYPE as T,
} from '../../types/misc';
import {
  type StrengthBlock,
  type StrengthExercise,
  type StrengthSet,
  strengthBlocks,
  strengthSeconds,
  strengthSteps,
} from './blocks';

const set = (
  reps: number,
  rest: number | null = 90,
  load: number | null = null,
  rpe: number | null = null,
): StrengthSet => ({ work: { type: D.REPS, value: reps }, load, rpe, rest });

const exercise = (
  ref: string,
  sets: StrengthSet[],
  extra: Partial<StrengthExercise> = {},
): StrengthExercise => ({
  exerciseRef: ref,
  name: ref.slice(2),
  sets,
  tempo: null,
  side: null,
  notes: null,
  ...extra,
});

const roundTrip = (blocks: StrengthBlock[]) => {
  const steps = strengthSteps(blocks);
  expect(strengthBlocks(steps)).toEqual(blocks);
  return steps;
};

describe('strength blocks', () => {
  it('stores identical sets as a repeat of the exercise and its rest', () => {
    const steps = roundTrip([
      {
        kind: 'exercise',
        exercise: exercise(
          'c:back-squat',
          [set(5, 120, 80), set(5, 120, 80), set(5, 120, 80)],
          {
            tempo: '3-1-1-0',
          },
        ),
      },
    ]);
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({
      stepType: S.REPEAT,
      repeatBlock: {
        repetitions: 3,
        kind: K.REPEAT,
        childSteps: [
          {
            stepType: S.INTERVAL_ACTIVE,
            exerciseRef: 'c:back-squat',
            name: 'back-squat',
            durationType: D.REPS,
            durationValue: 5,
            tempo: '3-1-1-0',
            targets: [{ targetType: T.WEIGHT, targetValue: 80 }],
          },
          {
            stepType: S.INTERVAL_REST,
            durationType: D.TIME,
            durationValue: 120,
          },
        ],
      },
    });
  });

  it('writes a pyramid set by set', () => {
    const steps = roundTrip([
      {
        kind: 'exercise',
        exercise: exercise('c:bench-press', [
          set(10, 90, 60),
          set(8, 90, 65),
          set(6, null, 70, 9),
        ]),
      },
    ]);
    expect(steps.map((step) => step.durationValue)).toEqual([10, 90, 8, 90, 6]);
  });

  it('keeps one set without a repeat', () => {
    const steps = roundTrip([
      {
        kind: 'exercise',
        exercise: exercise('c:plank', [
          {
            work: { type: D.TIME, value: 60 },
            load: null,
            rpe: null,
            rest: null,
          },
        ]),
      },
    ]);
    expect(steps).toEqual([
      expect.objectContaining({
        durationType: D.TIME,
        durationValue: 60,
        exerciseRef: 'c:plank',
      }),
    ]);
  });

  it('separates two exercises in a row', () => {
    roundTrip([
      { kind: 'exercise', exercise: exercise('c:squat', [set(10), set(10)]) },
      {
        kind: 'exercise',
        exercise: exercise('c:lunge', [set(12, 60)], {
          side: EXERCISE_SIDE.EACH,
        }),
      },
    ]);
  });

  it('stores a superset as rounds of its exercises and the round rest', () => {
    const steps = roundTrip([
      {
        kind: 'group',
        group: K.SUPERSET,
        name: null,
        rounds: 4,
        intervalSeconds: null,
        timeCapSeconds: null,
        roundRest: 120,
        exercises: [
          exercise('c:pull-up', [set(8, 15)]),
          exercise('c:push-up', [set(15, null)]),
        ],
      },
    ]);
    expect(
      steps[0].repeatBlock?.childSteps.map((step) => step.durationValue),
    ).toEqual([8, 15, 15, 120]);
  });

  it('stores EMOM, AMRAP and Tabata with their timing', () => {
    roundTrip([
      {
        kind: 'group',
        group: K.EMOM,
        name: 'EMOM 10',
        rounds: 10,
        intervalSeconds: 60,
        timeCapSeconds: null,
        roundRest: null,
        exercises: [exercise('c:kettlebell-swing', [set(15, null)])],
      },
      {
        kind: 'group',
        group: K.AMRAP,
        name: null,
        rounds: 1,
        intervalSeconds: null,
        timeCapSeconds: 720,
        roundRest: null,
        exercises: [
          exercise('c:burpee', [set(10, null)]),
          exercise('c:air-squat', [set(20, null)]),
        ],
      },
      {
        kind: 'group',
        group: K.TABATA,
        name: null,
        rounds: 8,
        intervalSeconds: null,
        timeCapSeconds: null,
        roundRest: 10,
        exercises: [
          exercise('c:mountain-climber', [
            {
              work: { type: D.TIME, value: 20 },
              load: null,
              rpe: null,
              rest: null,
            },
          ]),
        ],
      },
    ]);
  });

  it('keeps other steps as they are, between exercises', () => {
    const warmup = {
      stepType: S.WARMUP,
      name: 'Rameur',
      durationType: D.TIME,
      durationValue: 600,
      notes: null,
      targets: [],
    };
    const steps = roundTrip([
      { kind: 'step', step: warmup },
      {
        kind: 'exercise',
        exercise: exercise('c:deadlift', [set(5, 180, 100)]),
      },
    ]);
    expect(steps[0]).toBe(warmup);
  });

  it('reads a plain repeat of endurance steps as a step', () => {
    const steps = [
      {
        stepType: S.REPEAT,
        durationType: D.OPEN,
        targets: [],
        repeatBlock: {
          repetitions: 5,
          childSteps: [
            {
              stepType: S.INTERVAL_ACTIVE,
              durationType: D.TIME,
              durationValue: 60,
              targets: [],
            },
            {
              stepType: S.INTERVAL_REST,
              durationType: D.TIME,
              durationValue: 60,
              targets: [],
            },
          ],
        },
      },
    ];
    expect(strengthBlocks(steps)).toEqual([{ kind: 'step', step: steps[0] }]);
  });

  it('estimates the session length', () => {
    const blocks: StrengthBlock[] = [
      // 3 x (10 reps at 3 s + 60 s): 270 s
      {
        kind: 'exercise',
        exercise: exercise('c:row', [set(10, 60), set(10, 60), set(10, 60)]),
      },
      {
        kind: 'group',
        group: K.EMOM,
        name: null,
        rounds: 10,
        intervalSeconds: 60,
        timeCapSeconds: null,
        roundRest: null,
        exercises: [exercise('c:swing', [set(15, null)])],
      },
    ];
    expect(strengthSeconds(blocks)).toBe(270 + 600);
  });
});

describe('strength session length in the shared estimate', () => {
  it('counts reps, rests, EMOM minutes and AMRAP caps', async () => {
    const { calculateWorkoutDuration } = await import('../workout.utils');
    const steps = strengthSteps([
      {
        kind: 'exercise',
        exercise: exercise('c:row', [set(10, 60), set(10, 60)]),
      },
      {
        kind: 'group',
        group: K.EMOM,
        name: null,
        rounds: 5,
        intervalSeconds: 60,
        timeCapSeconds: null,
        roundRest: null,
        exercises: [exercise('c:swing', [set(15, null)])],
      },
      {
        kind: 'group',
        group: K.AMRAP,
        name: null,
        rounds: 1,
        intervalSeconds: null,
        timeCapSeconds: 600,
        roundRest: null,
        exercises: [exercise('c:burpee', [set(10, null)])],
      },
    ]);
    // 2 x (30 + 60) + 300 + 600
    expect(calculateWorkoutDuration({ steps })).toBe(1080);
  });
});
