import type {
  CreateWorkoutStepDto,
  CreateWorkoutStepTarget,
} from '../../types/dtos/core/workout.dto';
import {
  EXERCISE_SIDE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_REPEAT_KIND,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '../../types/misc';
import { SECONDS_PER_REP } from '../workout.utils';

/**
 * A strength session as coaches write it: exercises with a table of sets,
 * and groups done in a row (superset, circuit, EMOM, AMRAP, Tabata).
 * Stored as plain workout steps, so devices and older apps still read it:
 *
 * - an exercise of identical sets is a repeat of [exercise, rest];
 * - sets that differ (a pyramid) follow each other, [exercise, rest] each;
 * - a group is a repeat of its exercises, each with its rest, then the
 *   rest between rounds.
 *
 * `strengthBlocks` reads steps into blocks, `strengthSteps` writes them
 * back, and the round trip keeps everything.
 */

export type SetWork = {
  type:
    | WORKOUT_DURATION_TYPE.REPS
    | WORKOUT_DURATION_TYPE.TIME
    | WORKOUT_DURATION_TYPE.DISTANCE;
  /** Reps, seconds or metres */
  value: number;
};

export interface StrengthSet {
  work: SetWork;
  /** kg */
  load: number | null;
  rpe: number | null;
  /** Seconds of rest after the set; null for none */
  rest: number | null;
}

export interface StrengthExercise {
  exerciseRef: string | null;
  name: string;
  sets: StrengthSet[];
  tempo: string | null;
  side: EXERCISE_SIDE | null;
  notes: string | null;
}

export type StrengthGroupKind = Exclude<
  WORKOUT_REPEAT_KIND,
  WORKOUT_REPEAT_KIND.REPEAT
>;

export type StrengthBlock =
  | { kind: 'exercise'; exercise: StrengthExercise }
  | {
      kind: 'group';
      group: StrengthGroupKind;
      name: string | null;
      rounds: number;
      /** EMOM: a round starts every this many seconds */
      intervalSeconds: number | null;
      /** AMRAP: the time the rounds fit in */
      timeCapSeconds: number | null;
      /** Seconds of rest after each round */
      roundRest: number | null;
      /** One set each per round; `rest` is the rest before the next one */
      exercises: StrengthExercise[];
    }
  /** Anything else: a warm-up jog, a mobility step */
  | { kind: 'step'; step: CreateWorkoutStepDto };

const WORK_TYPES = new Set<string>([
  WORKOUT_DURATION_TYPE.REPS,
  WORKOUT_DURATION_TYPE.TIME,
  WORKOUT_DURATION_TYPE.DISTANCE,
]);

export function isExerciseStep(step: CreateWorkoutStepDto): boolean {
  return (
    !!step.exerciseRef &&
    step.stepType !== WORKOUT_STEP_TYPE.REPEAT &&
    WORK_TYPES.has(step.durationType ?? '')
  );
}

function isRestStep(step: CreateWorkoutStepDto | undefined): boolean {
  return (
    !!step &&
    !step.exerciseRef &&
    step.stepType === WORKOUT_STEP_TYPE.INTERVAL_REST &&
    step.durationType === WORKOUT_DURATION_TYPE.TIME &&
    !(step.targets ?? []).length
  );
}

function targetValue(
  step: CreateWorkoutStepDto,
  type: WORKOUT_TARGET_TYPE,
): number | null {
  const target = (step.targets ?? []).find((t) => t.targetType === type);
  return target?.targetValue ?? target?.targetMin ?? null;
}

function setOf(step: CreateWorkoutStepDto, rest: number | null): StrengthSet {
  return {
    work: {
      type: step.durationType as SetWork['type'],
      value: step.durationValue ?? 0,
    },
    load: targetValue(step, WORKOUT_TARGET_TYPE.WEIGHT),
    rpe: targetValue(step, WORKOUT_TARGET_TYPE.RPE),
    rest,
  };
}

function exerciseOf(
  step: CreateWorkoutStepDto,
  sets: StrengthSet[],
): StrengthExercise {
  return {
    exerciseRef: step.exerciseRef ?? null,
    name: step.name ?? '',
    sets,
    tempo: step.tempo ?? null,
    side: step.side ?? null,
    notes: step.notes ?? null,
  };
}

function sameExercise(a: StrengthExercise, b: StrengthExercise): boolean {
  return (
    a.exerciseRef === b.exerciseRef &&
    a.name === b.name &&
    a.tempo === b.tempo &&
    a.side === b.side &&
    a.notes === b.notes
  );
}

export function sameSet(a: StrengthSet, b: StrengthSet): boolean {
  return (
    a.work.type === b.work.type &&
    a.work.value === b.work.value &&
    a.load === b.load &&
    a.rpe === b.rpe &&
    a.rest === b.rest
  );
}

export function strengthBlocks(steps: CreateWorkoutStepDto[]): StrengthBlock[] {
  const blocks: StrengthBlock[] = [];
  const last = () => blocks[blocks.length - 1];

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    const children = step.repeatBlock?.childSteps ?? [];

    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock) {
      const exercises = children.filter(isExerciseStep);
      const kind = step.repeatBlock.kind ?? WORKOUT_REPEAT_KIND.REPEAT;
      const onlyRests = children.every(
        (child) => isExerciseStep(child) || isRestStep(child),
      );
      // Sets of one exercise: [exercise] or [exercise, rest]
      if (
        kind === WORKOUT_REPEAT_KIND.REPEAT &&
        exercises.length === 1 &&
        isExerciseStep(children[0]) &&
        children.length <= 2 &&
        onlyRests
      ) {
        const rest = isRestStep(children[1])
          ? (children[1].durationValue ?? null)
          : null;
        const set = setOf(children[0], rest);
        blocks.push({
          kind: 'exercise',
          exercise: exerciseOf(
            children[0],
            Array.from({ length: step.repeatBlock.repetitions }, () => ({
              ...set,
              work: { ...set.work },
            })),
          ),
        });
        continue;
      }
      if (exercises.length > 0 && onlyRests && isExerciseStep(children[0])) {
        const members: StrengthExercise[] = [];
        let roundRest: number | null = null;
        children.forEach((child, index) => {
          if (isExerciseStep(child)) {
            members.push(exerciseOf(child, [setOf(child, null)]));
            return;
          }
          const seconds = child.durationValue ?? null;
          if (index === children.length - 1) roundRest = seconds;
          else members[members.length - 1].sets[0].rest = seconds;
        });
        blocks.push({
          kind: 'group',
          group:
            kind === WORKOUT_REPEAT_KIND.REPEAT
              ? WORKOUT_REPEAT_KIND.SUPERSET
              : (kind as StrengthGroupKind),
          name: step.name ?? null,
          rounds: step.repeatBlock.repetitions,
          intervalSeconds: step.repeatBlock.intervalSeconds ?? null,
          timeCapSeconds: step.repeatBlock.timeCapSeconds ?? null,
          roundRest,
          exercises: members,
        });
        continue;
      }
      blocks.push({ kind: 'step', step });
      continue;
    }

    if (isExerciseStep(step)) {
      const next = steps[i + 1];
      const rest = isRestStep(next) ? (next.durationValue ?? null) : null;
      if (rest !== null) i += 1;
      const exercise = exerciseOf(step, [setOf(step, rest)]);
      const previous = last();
      // A pyramid: the sets of one exercise written one after the other
      if (
        previous?.kind === 'exercise' &&
        sameExercise(previous.exercise, exercise)
      ) {
        previous.exercise.sets.push(exercise.sets[0]);
      } else {
        blocks.push({ kind: 'exercise', exercise });
      }
      continue;
    }

    blocks.push({ kind: 'step', step });
  }
  return blocks;
}

function exerciseStep(
  exercise: StrengthExercise,
  set: StrengthSet,
): CreateWorkoutStepDto {
  const targets: CreateWorkoutStepTarget[] = [];
  if (set.load !== null) {
    targets.push({
      targetType: WORKOUT_TARGET_TYPE.WEIGHT,
      targetValue: set.load,
    });
  }
  if (set.rpe !== null) {
    targets.push({ targetType: WORKOUT_TARGET_TYPE.RPE, targetValue: set.rpe });
  }
  return {
    stepType: WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
    name: exercise.name,
    durationType: set.work.type,
    durationValue: set.work.value,
    notes: exercise.notes,
    exerciseRef: exercise.exerciseRef,
    tempo: exercise.tempo,
    side: exercise.side,
    targets,
  };
}

export function restStep(seconds: number): CreateWorkoutStepDto {
  return {
    stepType: WORKOUT_STEP_TYPE.INTERVAL_REST,
    name: null,
    durationType: WORKOUT_DURATION_TYPE.TIME,
    durationValue: seconds,
    notes: null,
    targets: [],
  };
}

const withRest = (steps: CreateWorkoutStepDto[], rest: number | null) =>
  rest ? [...steps, restStep(rest)] : steps;

const MAX_REPETITIONS = 99;

export function strengthSteps(blocks: StrengthBlock[]): CreateWorkoutStepDto[] {
  return blocks.flatMap((block): CreateWorkoutStepDto[] => {
    if (block.kind === 'step') return [block.step];
    if (block.kind === 'exercise') {
      const { exercise } = block;
      const [first] = exercise.sets;
      if (!first) return [];
      const identical =
        exercise.sets.length > 1 &&
        exercise.sets.length <= MAX_REPETITIONS &&
        exercise.sets.every((set) => sameSet(set, first));
      if (identical) {
        return [
          {
            stepType: WORKOUT_STEP_TYPE.REPEAT,
            name: null,
            durationType: WORKOUT_DURATION_TYPE.OPEN,
            durationValue: null,
            targets: [],
            repeatBlock: {
              repetitions: exercise.sets.length,
              kind: WORKOUT_REPEAT_KIND.REPEAT,
              childSteps: withRest([exerciseStep(exercise, first)], first.rest),
            },
          },
        ];
      }
      return exercise.sets.flatMap((set) =>
        withRest([exerciseStep(exercise, set)], set.rest),
      );
    }
    const children = block.exercises.flatMap((exercise, index) => {
      const set = exercise.sets[0];
      if (!set) return [];
      const last = index === block.exercises.length - 1;
      return withRest([exerciseStep(exercise, set)], last ? null : set.rest);
    });
    if (children.length === 0) return [];
    return [
      {
        stepType: WORKOUT_STEP_TYPE.REPEAT,
        name: block.name,
        durationType: WORKOUT_DURATION_TYPE.OPEN,
        durationValue: null,
        targets: [],
        repeatBlock: {
          repetitions: Math.max(1, Math.min(MAX_REPETITIONS, block.rounds)),
          kind: block.group,
          intervalSeconds: block.intervalSeconds,
          timeCapSeconds: block.timeCapSeconds,
          childSteps: withRest(children, block.roundRest),
        },
      },
    ];
  });
}

export function setSeconds(set: StrengthSet): number {
  const work =
    set.work.type === WORKOUT_DURATION_TYPE.REPS
      ? set.work.value * SECONDS_PER_REP
      : set.work.type === WORKOUT_DURATION_TYPE.TIME
        ? set.work.value
        : set.work.value / 2; // metres at a walk with a load
  return work + (set.rest ?? 0);
}

/** The session length the blocks give, in seconds */
export function strengthSeconds(blocks: StrengthBlock[]): number {
  return blocks.reduce((total, block) => {
    if (block.kind === 'exercise') {
      return (
        total +
        block.exercise.sets.reduce((sum, set) => sum + setSeconds(set), 0)
      );
    }
    if (block.kind === 'group') {
      if (block.group === WORKOUT_REPEAT_KIND.AMRAP && block.timeCapSeconds) {
        return total + block.timeCapSeconds;
      }
      if (block.group === WORKOUT_REPEAT_KIND.EMOM && block.intervalSeconds) {
        return total + block.intervalSeconds * block.rounds;
      }
      const round = block.exercises.reduce(
        (sum, exercise) =>
          sum + (exercise.sets[0] ? setSeconds(exercise.sets[0]) : 0),
        0,
      );
      return total + block.rounds * (round + (block.roundRest ?? 0));
    }
    const step = block.step;
    return (
      total +
      (step.durationType === WORKOUT_DURATION_TYPE.TIME
        ? (step.durationValue ?? 0)
        : 0)
    );
  }, 0);
}
