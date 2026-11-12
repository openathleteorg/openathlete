import { describe, expect, it } from 'vitest';

import {
  WORKOUT_DURATION_TYPE as D,
  WORKOUT_REPEAT_KIND as K,
} from '@openathlete/shared';

import {
  type StrengthState,
  type UBlock,
  blocksFromSteps,
  exerciseFrom,
  firstSet,
  groupFrom,
  groupWithNext,
  moveBlock,
  stepsFromBlocks,
  strengthReducer,
  ungroup,
  withIds,
} from './strength-state';
import type { ExerciseInfo } from './use-exercises';

const info = (
  ref: string,
  name: string,
  extra: Partial<ExerciseInfo> = {},
): ExerciseInfo => ({
  ref,
  name,
  bodyPart: null,
  equipment: null,
  target: null,
  secondary: [],
  frames: null,
  mediaUrl: null,
  steps: [],
  custom: null,
  ...extra,
});
const squat = info('c:squat', 'Squat');
const plank = info('c:plank', 'Gainage planche');
const pullUp = info('c:pull-up', 'Tractions');

const exerciseBlock = (i: ExerciseInfo): UBlock =>
  withIds([{ kind: 'exercise', exercise: exerciseFrom(i) }])[0];

describe('strength builder state', () => {
  it('starts an exercise at 3 x 10 reps, or 30" for a hold', () => {
    expect(exerciseFrom(squat).sets).toHaveLength(3);
    expect(firstSet(squat)).toMatchObject({
      work: { type: D.REPS, value: 10 },
      rest: 90,
    });
    expect(firstSet(plank)).toMatchObject({
      work: { type: D.TIME, value: 30 },
      rest: 60,
    });
    expect(
      firstSet(
        info('u:1', 'Mine', {
          custom: {
            defaultDurationType: D.TIME,
            defaultDurationValue: 40,
          } as never,
        }),
      ),
    ).toMatchObject({ work: { type: D.TIME, value: 40 } });
  });

  it('groups two exercises into a superset with a round per set, and back', () => {
    const blocks = [exerciseBlock(squat), exerciseBlock(pullUp)];
    const grouped = groupWithNext(blocks, 0);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({
      kind: 'group',
      group: K.SUPERSET,
      rounds: 3,
      roundRest: 90,
      exercises: [{ name: 'Squat' }, { name: 'Tractions' }],
    });
    const apart = ungroup(grouped, 0);
    expect(apart.map((block) => block.kind)).toEqual(['exercise', 'exercise']);
    expect(apart[0].kind === 'exercise' && apart[0].exercise.sets).toHaveLength(
      3,
    );
  });

  it('adds an exercise to a group next to it', () => {
    const group = withIds([groupFrom(K.CIRCUIT, [squat, pullUp])])[0];
    const grouped = groupWithNext([group, exerciseBlock(plank)], 0);
    expect(
      grouped[0].kind === 'group' && grouped[0].exercises.map((e) => e.name),
    ).toEqual(['Squat', 'Tractions', 'Gainage planche']);
    expect(grouped[0]).toMatchObject({ group: K.CIRCUIT });
  });

  it('gives each group kind its usual timing', () => {
    expect(groupFrom(K.EMOM, [squat])).toMatchObject({
      rounds: 10,
      intervalSeconds: 60,
    });
    expect(groupFrom(K.AMRAP, [squat])).toMatchObject({ timeCapSeconds: 600 });
    expect(groupFrom(K.TABATA, [squat])).toMatchObject({
      rounds: 8,
      roundRest: 10,
      exercises: [{ sets: [{ work: { type: D.TIME, value: 20 } }] }],
    });
  });

  it('keeps blocks through their steps', () => {
    const blocks = [
      exerciseBlock(squat),
      withIds([groupFrom(K.EMOM, [pullUp])])[0],
    ];
    const again = blocksFromSteps(stepsFromBlocks(blocks));
    expect(again.map(({ uid: _uid, ...block }) => block)).toEqual(
      blocks.map(({ uid: _uid, ...block }) => block),
    );
  });

  it('moves blocks and undoes changes', () => {
    const blocks = [exerciseBlock(squat), exerciseBlock(pullUp)];
    const moved = moveBlock(blocks, 0, 1);
    expect(moved.map((b) => b.kind === 'exercise' && b.exercise.name)).toEqual([
      'Tractions',
      'Squat',
    ]);
    let state: StrengthState = { blocks, past: [], future: [] };
    state = strengthReducer(state, { type: 'set', blocks: moved });
    state = strengthReducer(state, { type: 'undo' });
    expect(state.blocks).toBe(blocks);
    state = strengthReducer(state, { type: 'redo' });
    expect(state.blocks).toBe(moved);
  });
});
