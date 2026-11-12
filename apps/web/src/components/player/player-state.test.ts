import { describe, expect, it } from 'vitest';

import type { StrengthBlock, StrengthSet } from '@openathlete/shared';
import {
  WORKOUT_DURATION_TYPE as D,
  WORKOUT_REPEAT_KIND as K,
  sessionTimeline,
  strengthSteps,
} from '@openathlete/shared';

import {
  type PlayerAction,
  type PlayerState,
  current,
  initialPlayer,
  momentRemaining,
  playerReducer,
  sessionElapsed,
  sessionResult,
  sessionTotals,
} from './player-state';

const reps = (
  value: number,
  rest: number | null,
  load: number | null = null,
): StrengthSet => ({
  work: { type: D.REPS, value },
  load,
  rpe: null,
  rest,
});
const hold = (seconds: number, rest: number | null): StrengthSet => ({
  work: { type: D.TIME, value: seconds },
  load: null,
  rpe: null,
  rest,
});
const ex = (ref: string, sets: StrengthSet[]) => ({
  exerciseRef: `c:${ref}`,
  name: ref,
  sets,
  tempo: null,
  side: null,
  notes: null,
});
const player = (blocks: StrengthBlock[]) =>
  initialPlayer(sessionTimeline(strengthSteps(blocks)));
const run = (state: PlayerState, ...actions: PlayerAction[]) =>
  actions.reduce(playerReducer, state);
const at = (s: number) => s * 1000;
const where = (state: PlayerState) => {
  const moment = current(state);
  if (!moment) return state.phase;
  return moment.kind === 'work' ? `${moment.name} ${moment.set}` : moment.kind;
};

describe('session player', () => {
  const squat = player([
    {
      kind: 'exercise',
      exercise: ex('squat', [reps(5, 90, 80), reps(5, 90, 80)]),
    },
    { kind: 'exercise', exercise: ex('plank', [hold(30, null)]) },
  ]);

  it('waits for the athlete on reps, then rests on the clock', () => {
    let state = run(squat, { type: 'start', now: at(0) });
    expect(where(state)).toBe('squat 1');
    expect(momentRemaining(state, at(20))).toBeNull();
    state = run(state, { type: 'tick', now: at(60) });
    expect(where(state)).toBe('squat 1');

    state = run(state, { type: 'done', now: at(30), reps: 5, load: 82.5 });
    expect(where(state)).toBe('rest');
    expect(momentRemaining(state, at(60))).toBe(60);
    state = run(state, { type: 'tick', now: at(119) });
    expect(where(state)).toBe('rest');
    state = run(state, { type: 'tick', now: at(121) });
    expect(where(state)).toBe('squat 2');
    expect(state.momentStartedAt).toBe(at(120));
    expect(state.log['b0.s0']).toMatchObject({
      reps: 5,
      load: 82.5,
      skipped: false,
    });
  });

  it('moves the rest by 15 seconds either way', () => {
    let state = run(squat, { type: 'start', now: 0 }, { type: 'done', now: 0 });
    state = run(
      state,
      { type: 'adjustRest', seconds: 15, now: 0 },
      { type: 'adjustRest', seconds: 15, now: 0 },
    );
    expect(momentRemaining(state, 0)).toBe(120);
    state = run(state, { type: 'adjustRest', seconds: -200, now: 0 });
    expect(momentRemaining(state, 0)).toBe(0);
  });

  it('ends a hold on the clock, or when the athlete stops it', () => {
    let state = run(squat, { type: 'start', now: 0 });
    state = run(
      state,
      { type: 'done', now: 0 },
      { type: 'skip', now: 0 },
      { type: 'done', now: 0 },
      { type: 'skip', now: 0 },
    );
    expect(where(state)).toBe('plank 1');
    const timed = run(state, { type: 'tick', now: at(31) });
    expect(timed.phase).toBe('finished');
    expect(timed.log['b1.s0']).toMatchObject({ seconds: 30, skipped: false });
    const stopped = run(state, { type: 'done', now: at(22) });
    expect(stopped.log['b1.s0']).toMatchObject({ seconds: 22 });
  });

  it('stops the clocks while paused', () => {
    let state = run(
      squat,
      { type: 'start', now: 0 },
      { type: 'done', now: at(10) },
    );
    state = run(state, { type: 'pause', now: at(40) });
    expect(momentRemaining(state, at(500))).toBe(60);
    state = run(state, { type: 'tick', now: at(500) });
    expect(where(state)).toBe('rest');
    state = run(state, { type: 'resume', now: at(100) });
    expect(momentRemaining(state, at(100))).toBe(60);
    expect(sessionElapsed(state, at(100))).toBe(40);
  });

  it('goes back to the last effort, past its rest, and forgets it', () => {
    let state = run(
      squat,
      { type: 'start', now: 0 },
      { type: 'done', now: 0, reps: 3 },
    );
    expect(where(state)).toBe('rest');
    state = run(state, { type: 'back', now: at(5) });
    expect(where(state)).toBe('squat 1');
    expect(state.log['b0.s0']).toBeUndefined();
  });

  it('rests to the next minute in an EMOM', () => {
    let state = run(
      player([
        {
          kind: 'group',
          group: K.EMOM,
          name: null,
          rounds: 2,
          intervalSeconds: 60,
          timeCapSeconds: null,
          roundRest: null,
          exercises: [ex('swing', [reps(15, null)])],
        },
      ]),
      { type: 'start', now: 0 },
    );
    state = run(state, { type: 'done', now: at(25) });
    expect(where(state)).toBe('rest');
    expect(momentRemaining(state, at(25))).toBe(35);
    state = run(state, { type: 'tick', now: at(60) });
    expect(where(state)).toBe('swing 2');
    expect(state.windowStartedAt).toBe(at(60));
  });

  it('counts AMRAP rounds until time is up', () => {
    let state = run(
      player([
        {
          kind: 'group',
          group: K.AMRAP,
          name: null,
          rounds: 1,
          intervalSeconds: null,
          timeCapSeconds: 300,
          roundRest: null,
          exercises: [
            ex('burpee', [reps(10, null)]),
            ex('squat', [reps(20, null)]),
          ],
        },
      ]),
      { type: 'start', now: 0 },
    );
    for (let i = 0; i < 5; i += 1)
      state = run(state, { type: 'done', now: at(i * 40) });
    expect(state.amrap.b0).toEqual({ position: 1, rounds: 2 });
    state = run(state, { type: 'tick', now: at(301) });
    expect(state.phase).toBe('finished');
    expect(sessionResult(state, 8, '').log.amrapRounds).toEqual({ b0: 2 });
  });

  it('reports what was done, skipped sets included', () => {
    const state = run(
      squat,
      { type: 'start', now: at(0) },
      { type: 'done', now: at(30), reps: 5, load: 80 },
      { type: 'skip', now: at(40) },
      { type: 'done', now: at(70), reps: 4, load: 80 },
      { type: 'pause', now: at(80) },
      { type: 'finish', now: at(200) },
    );
    expect(state.phase).toBe('finished');
    const result = sessionResult(state, 7, '  Dur  ');
    expect(result).toMatchObject({
      durationSeconds: 80,
      rpe: 7,
      comment: 'Dur',
    });
    expect(result.log.sets.map((set) => [set.reps, set.skipped])).toEqual([
      [5, false],
      [4, false],
      [null, true],
    ]);
    expect(sessionTotals(state)).toEqual({ sets: 2, reps: 9, volume: 720 });
  });

  it('does nothing before the start or after the end', () => {
    expect(run(squat, { type: 'done', now: 0 })).toBe(squat);
    expect(run(initialPlayer([]), { type: 'start', now: 0 }).phase).toBe(
      'ready',
    );
  });
});
