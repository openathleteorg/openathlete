import type { CreateWorkoutStepDto } from '@openathlete/shared';
import {
  WORKOUT_DURATION_TYPE,
  WORKOUT_REPEAT_KIND,
  WORKOUT_STEP_TYPE,
  inferTopLevelType,
} from '@openathlete/shared';

/**
 * What the session builder edits: the workout steps, each with a stable id
 * for React and the selection, and the history undo walks back.
 *
 * Repeats hold steps but no other repeat, as watches take them: moving a
 * step down past a repeat enters it, moving it past the repeat's end leaves.
 */

export type BuilderStep = Omit<CreateWorkoutStepDto, 'repeatBlock'> & {
  uid: string;
  /**
   * The type follows the step's place: typed without one, a first step
   * becomes the warm-up once efforts follow it. Choosing a type stops it.
   */
  autoType?: boolean;
  repeatBlock?:
    | (Omit<NonNullable<CreateWorkoutStepDto['repeatBlock']>, 'childSteps'> & {
        childSteps: BuilderStep[];
      })
    | null;
};

export interface BuilderState {
  steps: BuilderStep[];
  selected: string | null;
  past: BuilderStep[][];
  future: BuilderStep[][];
}

const HISTORY_LIMIT = 100;

let counter = 0;
export function newUid(): string {
  counter += 1;
  return `s${Date.now().toString(36)}${counter.toString(36)}`;
}

export function withUids(steps: CreateWorkoutStepDto[]): BuilderStep[] {
  return steps.map((step) => ({
    ...step,
    uid: newUid(),
    repeatBlock: step.repeatBlock
      ? {
          ...step.repeatBlock,
          childSteps: withUids(step.repeatBlock.childSteps ?? []),
        }
      : step.repeatBlock,
  }));
}

export function withoutUids(steps: BuilderStep[]): CreateWorkoutStepDto[] {
  return steps.map(({ uid: _uid, autoType: _auto, ...step }) => ({
    ...step,
    repeatBlock: step.repeatBlock
      ? {
          ...step.repeatBlock,
          childSteps: withoutUids(step.repeatBlock.childSteps),
        }
      : step.repeatBlock,
  }));
}

export function isRepeat(step: CreateWorkoutStepDto | BuilderStep): boolean {
  return step.stepType === WORKOUT_STEP_TYPE.REPEAT && !!step.repeatBlock;
}

export interface StepLocation {
  /** uid of the repeat holding the step, null at the top */
  parent: string | null;
  index: number;
  step: BuilderStep;
}

export function locate(steps: BuilderStep[], uid: string): StepLocation | null {
  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    if (step.uid === uid) return { parent: null, index: i, step };
    const children = step.repeatBlock?.childSteps ?? [];
    const j = children.findIndex((child) => child.uid === uid);
    if (j >= 0) return { parent: step.uid, index: j, step: children[j] };
  }
  return null;
}

function siblingsOf(steps: BuilderStep[], parent: string | null) {
  if (parent === null) return steps;
  return steps.find((step) => step.uid === parent)?.repeatBlock?.childSteps;
}

/** A copy of `steps` with the list at `parent` replaced */
function replaceList(
  steps: BuilderStep[],
  parent: string | null,
  update: (list: BuilderStep[]) => BuilderStep[],
): BuilderStep[] {
  if (parent === null) return update(steps);
  return steps.map((step) =>
    step.uid === parent && step.repeatBlock
      ? {
          ...step,
          repeatBlock: {
            ...step.repeatBlock,
            childSteps: update(step.repeatBlock.childSteps),
          },
        }
      : step,
  );
}

/** Copies with new uids, as pasting or duplicating needs */
function cloneStep(step: BuilderStep): BuilderStep {
  return withUids(withoutUids([step]))[0];
}

export type BuilderAction =
  | { type: 'reset'; steps: CreateWorkoutStepDto[] }
  | { type: 'replace'; steps: CreateWorkoutStepDto[] }
  | {
      type: 'insert';
      steps: CreateWorkoutStepDto[];
      /** After this step, at its level; at the end when unset */
      after?: string | null;
      /** Inside this repeat, at its end */
      into?: string;
    }
  | { type: 'update'; uid: string; patch: Partial<CreateWorkoutStepDto> }
  | { type: 'remove'; uid: string }
  | { type: 'duplicate'; uid: string }
  | { type: 'move'; uid: string; delta: -1 | 1 }
  | { type: 'moveTo'; uid: string; parent: string | null; index: number }
  | { type: 'wrap'; uid: string; repetitions?: number }
  | { type: 'unwrap'; uid: string }
  | { type: 'select'; uid: string | null }
  | { type: 'undo' }
  | { type: 'redo' };

export function initialState(steps: CreateWorkoutStepDto[] = []): BuilderState {
  return { steps: withUids(steps), selected: null, past: [], future: [] };
}

/** Steps whose type follows their place get the one it gives now */
function reframe(steps: BuilderStep[]): BuilderStep[] {
  let changed = false;
  const next = steps.map((step, index) => {
    if (!step.autoType || isRepeat(step)) return step;
    const stepType = inferTopLevelType(index, steps);
    if (stepType === step.stepType) return step;
    changed = true;
    return { ...step, stepType };
  });
  return changed ? next : steps;
}

function commit(
  state: BuilderState,
  input: BuilderStep[],
  selected: string | null = state.selected,
): BuilderState {
  if (input === state.steps) return { ...state, selected };
  const steps = reframe(input);
  return {
    steps,
    selected,
    past: [...state.past, state.steps].slice(-HISTORY_LIMIT),
    future: [],
  };
}

function move(state: BuilderState, uid: string, delta: -1 | 1): BuilderState {
  const where = locate(state.steps, uid);
  if (!where) return state;
  const { parent, index, step } = where;
  const list = siblingsOf(state.steps, parent) ?? [];
  const target = index + delta;

  // Leaving a repeat at its edge: next to it, outside
  if (parent !== null && (target < 0 || target >= list.length)) {
    const outer = state.steps.findIndex((s) => s.uid === parent);
    const without = replaceList(state.steps, parent, (l) =>
      l.filter((s) => s.uid !== uid),
    );
    const at = delta < 0 ? outer : outer + 1;
    return commit(state, [...without.slice(0, at), step, ...without.slice(at)]);
  }
  if (target < 0 || target >= list.length) return state;

  // Entering the repeat met on the way, unless the step is a repeat
  const neighbour = list[target];
  if (parent === null && isRepeat(neighbour) && !isRepeat(step)) {
    const without = state.steps.filter((s) => s.uid !== uid);
    return commit(
      state,
      replaceList(without, neighbour.uid, (children) =>
        delta < 0 ? [...children, step] : [step, ...children],
      ),
    );
  }
  return commit(
    state,
    replaceList(state.steps, parent, (l) => {
      const next = [...l];
      next[index] = l[target];
      next[target] = l[index];
      return next;
    }),
  );
}

export function builderReducer(
  state: BuilderState,
  action: BuilderAction,
): BuilderState {
  switch (action.type) {
    case 'reset':
      return initialState(action.steps);
    case 'replace':
      return commit(state, withUids(action.steps), null);
    case 'insert': {
      // A step typed without a type word reads as steady: its place decides
      const added = withUids(action.steps).map((step) =>
        step.stepType === WORKOUT_STEP_TYPE.STEADY
          ? { ...step, autoType: true }
          : step,
      );
      if (added.length === 0) return state;
      const last = added[added.length - 1].uid;
      if (action.into) {
        // A repeat inside a repeat would not reach the watch
        const flat = added.flatMap((step) =>
          isRepeat(step) ? (step.repeatBlock?.childSteps ?? []) : [step],
        );
        return commit(
          state,
          replaceList(state.steps, action.into, (list) => [...list, ...flat]),
          flat[flat.length - 1]?.uid ?? state.selected,
        );
      }
      const anchor = action.after ? locate(state.steps, action.after) : null;
      if (!anchor) return commit(state, [...state.steps, ...added], last);
      const fitsInside = anchor.parent !== null && !added.some(isRepeat);
      if (fitsInside) {
        return commit(
          state,
          replaceList(state.steps, anchor.parent, (list) => [
            ...list.slice(0, anchor.index + 1),
            ...added,
            ...list.slice(anchor.index + 1),
          ]),
          last,
        );
      }
      const top =
        anchor.parent === null
          ? anchor.index
          : state.steps.findIndex((step) => step.uid === anchor.parent);
      return commit(
        state,
        [
          ...state.steps.slice(0, top + 1),
          ...added,
          ...state.steps.slice(top + 1),
        ],
        last,
      );
    }
    case 'update': {
      const where = locate(state.steps, action.uid);
      if (!where) return state;
      return commit(
        state,
        replaceList(state.steps, where.parent, (list) =>
          list.map((step) =>
            step.uid === action.uid
              ? ({
                  ...step,
                  ...action.patch,
                  uid: step.uid,
                  autoType: action.patch.stepType ? false : step.autoType,
                } as BuilderStep)
              : step,
          ),
        ),
      );
    }
    case 'remove': {
      const where = locate(state.steps, action.uid);
      if (!where) return state;
      let steps = replaceList(state.steps, where.parent, (list) =>
        list.filter((step) => step.uid !== action.uid),
      );
      // A repeat left empty has nothing to repeat
      if (where.parent !== null) {
        steps = steps.filter(
          (step) =>
            step.uid !== where.parent ||
            (step.repeatBlock?.childSteps.length ?? 0) > 0,
        );
      }
      const list = siblingsOf(steps, where.parent) ?? [];
      const next =
        list[Math.min(where.index, list.length - 1)]?.uid ??
        (where.parent && steps.some((s) => s.uid === where.parent)
          ? where.parent
          : null);
      return commit(
        state,
        steps,
        state.selected === action.uid ? next : state.selected,
      );
    }
    case 'duplicate': {
      const where = locate(state.steps, action.uid);
      if (!where) return state;
      const copy = cloneStep(where.step);
      return commit(
        state,
        replaceList(state.steps, where.parent, (list) => [
          ...list.slice(0, where.index + 1),
          copy,
          ...list.slice(where.index + 1),
        ]),
        copy.uid,
      );
    }
    case 'move':
      return move(state, action.uid, action.delta);
    case 'moveTo': {
      const where = locate(state.steps, action.uid);
      if (!where) return state;
      if (action.parent !== null && isRepeat(where.step)) return state;
      if (action.parent === action.uid) return state;
      const without = replaceList(state.steps, where.parent, (list) =>
        list.filter((step) => step.uid !== action.uid),
      );
      const target = siblingsOf(without, action.parent);
      if (!target) return state;
      const index = Math.max(0, Math.min(action.index, target.length));
      let steps = replaceList(without, action.parent, (list) => [
        ...list.slice(0, index),
        where.step,
        ...list.slice(index),
      ]);
      if (where.parent !== null && where.parent !== action.parent) {
        steps = steps.filter(
          (step) =>
            step.uid !== where.parent ||
            (step.repeatBlock?.childSteps.length ?? 0) > 0,
        );
      }
      return commit(state, steps);
    }
    case 'wrap': {
      const where = locate(state.steps, action.uid);
      if (!where || where.parent !== null || isRepeat(where.step)) return state;
      const repeat: BuilderStep = {
        uid: newUid(),
        stepType: WORKOUT_STEP_TYPE.REPEAT,
        name: null,
        durationType: WORKOUT_DURATION_TYPE.OPEN,
        durationValue: null,
        targets: [],
        repeatBlock: {
          repetitions: action.repetitions ?? 2,
          kind: WORKOUT_REPEAT_KIND.REPEAT,
          childSteps: [where.step],
        },
      };
      const steps = [...state.steps];
      steps[where.index] = repeat;
      return commit(state, steps, repeat.uid);
    }
    case 'unwrap': {
      const index = state.steps.findIndex((step) => step.uid === action.uid);
      const repeat = state.steps[index];
      if (!repeat || !isRepeat(repeat)) return state;
      const children = repeat.repeatBlock?.childSteps ?? [];
      return commit(
        state,
        [
          ...state.steps.slice(0, index),
          ...children,
          ...state.steps.slice(index + 1),
        ],
        children[0]?.uid ?? null,
      );
    }
    case 'select':
      return { ...state, selected: action.uid };
    case 'undo': {
      const previous = state.past[state.past.length - 1];
      if (!previous) return state;
      return {
        steps: previous,
        selected: locate(previous, state.selected ?? '')
          ? state.selected
          : null,
        past: state.past.slice(0, -1),
        future: [state.steps, ...state.future],
      };
    }
    case 'redo': {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return {
        steps: next,
        selected: locate(next, state.selected ?? '') ? state.selected : null,
        past: [...state.past, state.steps],
        future: rest,
      };
    }
  }
}
