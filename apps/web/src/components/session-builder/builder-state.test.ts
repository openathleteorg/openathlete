import { describe, expect, it } from 'vitest';

import type { CreateWorkoutStepDto } from '@openathlete/shared';
import {
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  parseWorkoutText,
} from '@openathlete/shared';

import {
  type BuilderAction,
  type BuilderState,
  type BuilderStep,
  builderReducer,
  initialState,
  withoutUids,
} from './builder-state';

const steps = (text: string): CreateWorkoutStepDto[] =>
  parseWorkoutText(text, { sport: SPORT_TYPE.RUNNING }).steps;

/** The tree as "600" for a 10' step and [2, [...]] for a repeat */
function shape(list: BuilderStep[]): unknown[] {
  return list.map((step) =>
    step.repeatBlock
      ? [step.repeatBlock.repetitions, shape(step.repeatBlock.childSteps)]
      : step.durationValue,
  );
}

function run(state: BuilderState, ...actions: BuilderAction[]) {
  return actions.reduce(builderReducer, state);
}

// 10', then 3 x (60" / 30"), then 5'
const session = () => initialState(steps('- 10m\n- 3x(60s / 30s)\n- 5m'));
const uid = (state: BuilderState, path: number[]) => {
  let list = state.steps;
  let step = list[path[0]];
  for (const index of path.slice(1)) {
    list = step.repeatBlock!.childSteps;
    step = list[index];
  }
  return step.uid;
};

describe('builderReducer', () => {
  it('inserts at the end, or after a step at its level', () => {
    const start = session();
    const added = run(start, { type: 'insert', steps: steps('- 2m') });
    expect(shape(added.steps)).toEqual([600, [3, [60, 30]], 300, 120]);
    expect(added.selected).toBe(added.steps[3].uid);

    const inside = run(start, {
      type: 'insert',
      steps: steps('- 2m'),
      after: uid(start, [1, 0]),
    });
    expect(shape(inside.steps)).toEqual([600, [3, [60, 120, 30]], 300]);
  });

  it('puts an inserted repeat after the repeat it was asked inside', () => {
    const start = session();
    const next = run(start, {
      type: 'insert',
      steps: steps('- 2x(1m / 1m)'),
      after: uid(start, [1, 1]),
    });
    expect(shape(next.steps)).toEqual([600, [3, [60, 30]], [2, [60, 60]], 300]);
  });

  it('flattens a repeat inserted into a repeat', () => {
    const start = session();
    const next = run(start, {
      type: 'insert',
      steps: steps('- 2x(15s / 15s)'),
      into: uid(start, [1]),
    });
    expect(shape(next.steps)).toEqual([600, [3, [60, 30, 15, 15]], 300]);
  });

  it('updates one step, wherever it is', () => {
    const start = session();
    const next = run(start, {
      type: 'update',
      uid: uid(start, [1, 1]),
      patch: { durationValue: 45 },
    });
    expect(shape(next.steps)).toEqual([600, [3, [60, 45]], 300]);
    expect(next.steps[1].repeatBlock!.childSteps[1].uid).toBe(
      uid(start, [1, 1]),
    );
  });

  it('removes a step, and a repeat left empty', () => {
    const start = run(session(), { type: 'select', uid: null });
    const once = run(start, { type: 'remove', uid: uid(start, [1, 0]) });
    expect(shape(once.steps)).toEqual([600, [3, [30]], 300]);
    const twice = run(once, { type: 'remove', uid: uid(once, [1, 0]) });
    expect(shape(twice.steps)).toEqual([600, 300]);
  });

  it('selects the next step when the selected one goes', () => {
    const start = session();
    const selected = run(start, { type: 'select', uid: uid(start, [0]) });
    const next = run(selected, { type: 'remove', uid: uid(start, [0]) });
    expect(next.selected).toBe(uid(start, [1]));
  });

  it('duplicates a step or a whole repeat, with new ids', () => {
    const start = session();
    const step = run(start, { type: 'duplicate', uid: uid(start, [1, 0]) });
    expect(shape(step.steps)).toEqual([600, [3, [60, 60, 30]], 300]);
    const repeat = run(start, { type: 'duplicate', uid: uid(start, [1]) });
    expect(shape(repeat.steps)).toEqual([
      600,
      [3, [60, 30]],
      [3, [60, 30]],
      300,
    ]);
    const ids = repeat.steps.flatMap((s) => [
      s.uid,
      ...(s.repeatBlock?.childSteps.map((c) => c.uid) ?? []),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('moves a step into the repeat it meets, and out at its edge', () => {
    const start = session();
    const warmup = uid(start, [0]);
    const entered = run(start, { type: 'move', uid: warmup, delta: 1 });
    expect(shape(entered.steps)).toEqual([[3, [600, 60, 30]], 300]);
    const swapped = run(entered, { type: 'move', uid: warmup, delta: 1 });
    expect(shape(swapped.steps)).toEqual([[3, [60, 600, 30]], 300]);
    const back = run(entered, { type: 'move', uid: warmup, delta: -1 });
    expect(shape(back.steps)).toEqual([600, [3, [60, 30]], 300]);

    const cooldown = uid(start, [2]);
    const up = run(start, { type: 'move', uid: cooldown, delta: -1 });
    expect(shape(up.steps)).toEqual([600, [3, [60, 30, 300]]]);
  });

  it('moves repeats past each other, never into one another', () => {
    const start = initialState(steps('- 2x(1m / 1m)\n- 3x(2m / 2m)'));
    const next = run(start, { type: 'move', uid: uid(start, [0]), delta: 1 });
    expect(shape(next.steps)).toEqual([
      [3, [120, 120]],
      [2, [60, 60]],
    ]);
  });

  it('does nothing past the ends', () => {
    const start = session();
    expect(run(start, { type: 'move', uid: uid(start, [0]), delta: -1 })).toBe(
      start,
    );
  });

  it('drops a step anywhere, refusing a repeat in a repeat', () => {
    const start = session();
    const dropped = run(start, {
      type: 'moveTo',
      uid: uid(start, [2]),
      parent: uid(start, [1]),
      index: 0,
    });
    expect(shape(dropped.steps)).toEqual([600, [3, [300, 60, 30]]]);
    const refused = run(start, {
      type: 'moveTo',
      uid: uid(start, [1]),
      parent: uid(start, [1]),
      index: 0,
    });
    expect(refused).toBe(start);
  });

  it('wraps a step into a repeat and unwraps it', () => {
    const start = session();
    const wrapped = run(start, {
      type: 'wrap',
      uid: uid(start, [0]),
      repetitions: 4,
    });
    expect(shape(wrapped.steps)).toEqual([[4, [600]], [3, [60, 30]], 300]);
    expect(wrapped.steps[0].stepType).toBe(WORKOUT_STEP_TYPE.REPEAT);
    const unwrapped = run(wrapped, {
      type: 'unwrap',
      uid: wrapped.steps[0].uid,
    });
    expect(shape(unwrapped.steps)).toEqual(shape(start.steps));
  });

  it('undoes and redoes every change, keeping the steps it had', () => {
    const start = session();
    const changed = run(
      start,
      { type: 'remove', uid: uid(start, [0]) },
      { type: 'insert', steps: steps('- 1m') },
    );
    const undone = run(changed, { type: 'undo' }, { type: 'undo' });
    expect(undone.steps).toBe(start.steps);
    const redone = run(undone, { type: 'redo' });
    expect(shape(redone.steps)).toEqual([[3, [60, 30]], 300]);
    // A new change forgets what could be redone
    const branched = run(undone, { type: 'remove', uid: uid(start, [2]) });
    expect(branched.future).toEqual([]);
  });

  it('makes typed steps the warm-up and cool-down once efforts come', () => {
    const typed = (state: BuilderState) => state.steps.map((s) => s.stepType);
    let state = initialState();
    state = run(state, { type: 'insert', steps: steps('- 15m') });
    expect(typed(state)).toEqual([WORKOUT_STEP_TYPE.STEADY]);
    state = run(state, { type: 'insert', steps: steps('- 6x(1m / 1m)') });
    expect(typed(state)).toEqual([
      WORKOUT_STEP_TYPE.WARMUP,
      WORKOUT_STEP_TYPE.REPEAT,
    ]);
    state = run(state, { type: 'insert', steps: steps('- 10m') });
    expect(typed(state)).toEqual([
      WORKOUT_STEP_TYPE.WARMUP,
      WORKOUT_STEP_TYPE.REPEAT,
      WORKOUT_STEP_TYPE.COOLDOWN,
    ]);
    // A type chosen by hand stays
    state = run(state, {
      type: 'update',
      uid: state.steps[0].uid,
      patch: { stepType: WORKOUT_STEP_TYPE.STEADY },
    });
    state = run(state, { type: 'insert', steps: steps('- 5m') });
    expect(typed(state)[0]).toBe(WORKOUT_STEP_TYPE.STEADY);
    expect(typed(state)[2]).toBe(WORKOUT_STEP_TYPE.STEADY);
    expect(typed(state)[3]).toBe(WORKOUT_STEP_TYPE.COOLDOWN);
  });

  it('keeps selecting out of the history', () => {
    const start = session();
    const next = run(start, { type: 'select', uid: uid(start, [0]) });
    expect(next.past).toHaveLength(0);
  });

  it('gives back the steps without the builder ids', () => {
    const start = session();
    const plain = withoutUids(start.steps);
    expect(JSON.stringify(plain)).not.toContain('"uid"');
    expect(plain[1].repeatBlock?.childSteps[0]).toMatchObject({
      durationType: WORKOUT_DURATION_TYPE.TIME,
      durationValue: 60,
    });
  });
});
