import type {
  CreateWorkoutStepDto,
  StrengthBlock,
  StrengthExercise,
  StrengthGroupKind,
  StrengthSet,
} from '@openathlete/shared';
import {
  WORKOUT_DURATION_TYPE,
  WORKOUT_REPEAT_KIND,
  strengthBlocks,
  strengthSteps,
} from '@openathlete/shared';

import type { ExerciseInfo } from './use-exercises';

/**
 * What the strength builder edits: blocks with ids, and the history undo
 * walks back. Every change is a pure function of the blocks, tested apart.
 */

export type UBlock = StrengthBlock & { uid: string };

export interface StrengthState {
  blocks: UBlock[];
  past: UBlock[][];
  future: UBlock[][];
}

let counter = 0;
const uid = () => {
  counter += 1;
  return `b${Date.now().toString(36)}${counter.toString(36)}`;
};

export const withIds = (blocks: StrengthBlock[]): UBlock[] =>
  blocks.map((block) => ({ ...block, uid: uid() }) as UBlock);

export const blocksFromSteps = (steps: CreateWorkoutStepDto[]) =>
  withIds(strengthBlocks(steps));

export const stepsFromBlocks = (blocks: UBlock[]) =>
  strengthSteps(
    blocks.map(({ uid: _uid, ...block }) => block as StrengthBlock),
  );

const HOLD =
  /plank|gainage|planche|hold|isometr|wall sit|chaise|plancha|plancia|prancha|hollow|superman/i;

/** A first set for an exercise: its own default, else 10 reps, or a 30" hold */
export function firstSet(info: ExerciseInfo): StrengthSet {
  const custom = info.custom;
  if (
    custom?.defaultDurationType === WORKOUT_DURATION_TYPE.TIME ||
    (!custom && HOLD.test(info.name))
  ) {
    return {
      work: {
        type: WORKOUT_DURATION_TYPE.TIME,
        value: custom?.defaultDurationValue ?? 30,
      },
      load: null,
      rpe: null,
      rest: 60,
    };
  }
  return {
    work: {
      type: WORKOUT_DURATION_TYPE.REPS,
      value: custom?.defaultDurationValue ?? 10,
    },
    load: null,
    rpe: null,
    rest: 90,
  };
}

export function exerciseFrom(
  info: ExerciseInfo,
  sets?: StrengthSet[],
): StrengthExercise {
  const set = firstSet(info);
  return {
    exerciseRef: info.ref,
    name: info.name,
    sets: sets ?? [
      set,
      { ...set, work: { ...set.work } },
      { ...set, work: { ...set.work } },
    ],
    tempo: null,
    side: null,
    notes: null,
  };
}

/** A new group of these exercises, with the usual timing of its kind */
export function groupFrom(
  kind: StrengthGroupKind,
  infos: ExerciseInfo[],
): StrengthBlock {
  const one = (info: ExerciseInfo, set: Partial<StrengthSet>) =>
    exerciseFrom(info, [{ ...firstSet(info), rest: null, ...set }]);
  switch (kind) {
    case WORKOUT_REPEAT_KIND.EMOM:
      return {
        kind: 'group',
        group: kind,
        name: null,
        rounds: 10,
        intervalSeconds: 60,
        timeCapSeconds: null,
        roundRest: null,
        exercises: infos.map((info) => one(info, {})),
      };
    case WORKOUT_REPEAT_KIND.AMRAP:
      return {
        kind: 'group',
        group: kind,
        name: null,
        rounds: 1,
        intervalSeconds: null,
        timeCapSeconds: 600,
        roundRest: null,
        exercises: infos.map((info) => one(info, {})),
      };
    case WORKOUT_REPEAT_KIND.TABATA:
      return {
        kind: 'group',
        group: kind,
        name: null,
        rounds: 8,
        intervalSeconds: null,
        timeCapSeconds: null,
        roundRest: 10,
        exercises: infos.map((info) =>
          one(info, {
            work: { type: WORKOUT_DURATION_TYPE.TIME, value: 20 },
            rest: 10,
          }),
        ),
      };
    case WORKOUT_REPEAT_KIND.CIRCUIT:
      return {
        kind: 'group',
        group: kind,
        name: null,
        rounds: 3,
        intervalSeconds: null,
        timeCapSeconds: null,
        roundRest: 120,
        exercises: infos.map((info) => one(info, { rest: 15 })),
      };
    default:
      return {
        kind: 'group',
        group: WORKOUT_REPEAT_KIND.SUPERSET,
        name: null,
        rounds: 3,
        intervalSeconds: null,
        timeCapSeconds: null,
        roundRest: 90,
        exercises: infos.map((info) => one(info, {})),
      };
  }
}

/** Exercises side by side become a superset, a round per set */
export function groupWithNext(blocks: UBlock[], index: number): UBlock[] {
  const first = blocks[index];
  const second = blocks[index + 1];
  if (!first || !second || first.kind === 'step' || second.kind === 'step')
    return blocks;
  const members = (block: UBlock): StrengthExercise[] =>
    block.kind === 'exercise'
      ? [block.exercise]
      : block.kind === 'group'
        ? block.exercises
        : [];
  const rounds = Math.max(
    first.kind === 'group' ? first.rounds : first.exercise.sets.length,
    second.kind === 'group' ? second.rounds : second.exercise.sets.length,
  );
  const exercises = [...members(first), ...members(second)].map((exercise) => ({
    ...exercise,
    sets: [{ ...exercise.sets[0], rest: null }],
  }));
  const rest =
    first.kind === 'group'
      ? first.roundRest
      : (first.exercise.sets[0]?.rest ?? 90);
  const group: UBlock = {
    uid: first.uid,
    kind: 'group',
    group: first.kind === 'group' ? first.group : WORKOUT_REPEAT_KIND.SUPERSET,
    name: first.kind === 'group' ? first.name : null,
    rounds,
    intervalSeconds: first.kind === 'group' ? first.intervalSeconds : null,
    timeCapSeconds: first.kind === 'group' ? first.timeCapSeconds : null,
    roundRest: rest,
    exercises,
  };
  return [...blocks.slice(0, index), group, ...blocks.slice(index + 2)];
}

/** A group falls apart into its exercises, each with the group's rounds as sets */
export function ungroup(blocks: UBlock[], index: number): UBlock[] {
  const block = blocks[index];
  if (!block || block.kind !== 'group') return blocks;
  const parts: UBlock[] = block.exercises.map((exercise) => {
    const set = exercise.sets[0];
    const rest = set?.rest ?? block.roundRest;
    return {
      uid: uid(),
      kind: 'exercise',
      exercise: {
        ...exercise,
        sets: Array.from({ length: Math.max(1, block.rounds) }, () => ({
          ...set,
          work: { ...set.work },
          rest,
        })),
      },
    };
  });
  return [...blocks.slice(0, index), ...parts, ...blocks.slice(index + 1)];
}

export function moveBlock(
  blocks: UBlock[],
  index: number,
  delta: -1 | 1,
): UBlock[] {
  const target = index + delta;
  if (target < 0 || target >= blocks.length) return blocks;
  const next = [...blocks];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function duplicateBlock(blocks: UBlock[], index: number): UBlock[] {
  const block = blocks[index];
  if (!block) return blocks;
  const copy = { ...(JSON.parse(JSON.stringify(block)) as UBlock), uid: uid() };
  return [...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)];
}

export type StrengthAction =
  | { type: 'set'; blocks: UBlock[] }
  | { type: 'reset'; steps: CreateWorkoutStepDto[] }
  | { type: 'undo' }
  | { type: 'redo' };

const HISTORY = 100;

export function strengthReducer(
  state: StrengthState,
  action: StrengthAction,
): StrengthState {
  switch (action.type) {
    case 'set':
      if (action.blocks === state.blocks) return state;
      return {
        blocks: action.blocks,
        past: [...state.past, state.blocks].slice(-HISTORY),
        future: [],
      };
    case 'reset':
      return { blocks: blocksFromSteps(action.steps), past: [], future: [] };
    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        blocks: previous,
        past: state.past.slice(0, -1),
        future: [state.blocks, ...state.future],
      };
    }
    case 'redo': {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return {
        blocks: next,
        past: [...state.past, state.blocks],
        future: rest,
      };
    }
  }
}
