import { describe, expect, it } from 'vitest';

import {
  WORKOUT_DURATION_TYPE as D,
  WORKOUT_REPEAT_KIND as K,
  WORKOUT_STEP_TYPE as S,
} from '../../types/misc';
import { type StrengthBlock, type StrengthSet, strengthSteps } from './blocks';
import { type Moment, nextWork, sessionTimeline } from './timeline';

const reps = (value: number, rest: number | null): StrengthSet => ({
  work: { type: D.REPS, value },
  load: null,
  rpe: null,
  rest,
});
const ex = (ref: string, sets: StrengthSet[]) => ({
  exerciseRef: ref,
  name: ref,
  sets,
  tempo: null,
  side: null,
  notes: null,
});
const timeline = (blocks: StrengthBlock[]) =>
  sessionTimeline(strengthSteps(blocks));
const describeMoments = (moments: Moment[]) =>
  moments.map((moment) =>
    moment.kind === 'work'
      ? `${moment.name} ${moment.set}/${moment.sets}`
      : moment.kind === 'rest'
        ? `rest ${moment.seconds}${moment.untilWindow ? ' window' : ''}`
        : `amrap ${moment.seconds} [${moment.round.map((w) => w.name).join(',')}]`,
  );

describe('sessionTimeline', () => {
  it('writes out sets and their rests, without a rest at the end', () => {
    const moments = timeline([
      {
        kind: 'exercise',
        exercise: ex('squat', [reps(5, 120), reps(5, 120), reps(5, 120)]),
      },
      { kind: 'exercise', exercise: ex('row', [reps(10, 60), reps(8, 60)]) },
    ]);
    expect(describeMoments(moments)).toEqual([
      'squat 1/3',
      'rest 120',
      'squat 2/3',
      'rest 120',
      'squat 3/3',
      'rest 120',
      'row 1/2',
      'rest 60',
      'row 2/2',
    ]);
  });

  it('goes round a superset, resting between rounds', () => {
    const moments = timeline([
      {
        kind: 'group',
        group: K.SUPERSET,
        name: null,
        rounds: 2,
        intervalSeconds: null,
        timeCapSeconds: null,
        roundRest: 90,
        exercises: [ex('pull-up', [reps(8, 10)]), ex('dip', [reps(12, null)])],
      },
    ]);
    expect(describeMoments(moments)).toEqual([
      'pull-up 1/2',
      'rest 10',
      'dip 1/2',
      'rest 90',
      'pull-up 2/2',
      'rest 10',
      'dip 2/2',
    ]);
    expect(moments[0]).toMatchObject({
      round: 1,
      rounds: 2,
      group: K.SUPERSET,
    });
  });

  it('rests to the next minute of an EMOM', () => {
    const moments = timeline([
      {
        kind: 'group',
        group: K.EMOM,
        name: null,
        rounds: 3,
        intervalSeconds: 60,
        timeCapSeconds: null,
        roundRest: null,
        exercises: [ex('swing', [reps(15, null)])],
      },
    ]);
    expect(describeMoments(moments)).toEqual([
      'swing 1/3',
      'rest 60 window',
      'swing 2/3',
      'rest 60 window',
      'swing 3/3',
    ]);
  });

  it('gives an AMRAP as one moment that loops its round', () => {
    const moments = timeline([
      {
        kind: 'group',
        group: K.AMRAP,
        name: null,
        rounds: 1,
        intervalSeconds: null,
        timeCapSeconds: 600,
        roundRest: null,
        exercises: [
          ex('burpee', [reps(10, null)]),
          ex('squat', [reps(20, null)]),
        ],
      },
    ]);
    expect(describeMoments(moments)).toEqual(['amrap 600 [burpee,squat]']);
  });

  it('plays other steps, timed or open', () => {
    const moments = sessionTimeline([
      {
        stepType: S.WARMUP,
        name: 'Rower',
        durationType: D.TIME,
        durationValue: 300,
        targets: [],
      },
      {
        stepType: S.FREE,
        name: 'Stretching',
        durationType: D.LAP_BUTTON,
        targets: [],
      },
    ]);
    expect(moments).toMatchObject([
      {
        kind: 'work',
        name: 'Rower',
        work: { type: D.TIME, value: 300 },
        stepType: S.WARMUP,
      },
      { kind: 'work', name: 'Stretching', work: { type: 'open' } },
    ]);
  });

  it('gives every moment its own key', () => {
    const moments = timeline([
      { kind: 'exercise', exercise: ex('squat', [reps(5, 60), reps(5, 60)]) },
      { kind: 'exercise', exercise: ex('squat', [reps(5, 60)]) },
    ]);
    const keys = moments.map((moment) => moment.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('finds what comes next, past the rests', () => {
    const moments = timeline([
      { kind: 'exercise', exercise: ex('squat', [reps(5, 60), reps(5, 60)]) },
    ]);
    expect(nextWork(moments, 0)).toMatchObject({ name: 'squat', set: 2 });
    expect(nextWork(moments, 2)).toBeNull();
  });
});
