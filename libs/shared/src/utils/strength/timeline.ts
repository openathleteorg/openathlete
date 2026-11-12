import type { CreateWorkoutStepDto } from '../../types/dtos/core/workout.dto';
import {
  type EXERCISE_SIDE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_REPEAT_KIND,
  type WORKOUT_STEP_TYPE,
} from '../../types/misc';
import {
  type StrengthBlock,
  type StrengthExercise,
  type StrengthSet,
  strengthBlocks,
} from './blocks';

/**
 * The session as the player runs it: one moment after the other, each set
 * and each rest, repeats written out. What the athlete does now, what
 * comes next, and where they are in the session.
 */

export interface WorkMoment {
  kind: 'work';
  /** Stable within the session: the set log keys on it */
  key: string;
  block: number;
  exerciseRef: string | null;
  name: string;
  /** Reps, seconds, metres; or a step that ends on the lap button */
  work:
    | {
        type:
          | WORKOUT_DURATION_TYPE.REPS
          | WORKOUT_DURATION_TYPE.TIME
          | WORKOUT_DURATION_TYPE.DISTANCE;
        value: number;
      }
    | { type: 'open' };
  load: number | null;
  rpe: number | null;
  tempo: string | null;
  side: EXERCISE_SIDE | null;
  notes: string | null;
  /** Set number and count of this exercise, from 1 */
  set: number;
  sets: number;
  /** Round number and count of a group, from 1 */
  round: number | null;
  rounds: number | null;
  group: WORKOUT_REPEAT_KIND | null;
  /** A step of another kind than an exercise (warm-up jog...) */
  stepType: WORKOUT_STEP_TYPE | null;
}

export interface RestMoment {
  kind: 'rest';
  key: string;
  block: number;
  /** Seconds of rest; for an EMOM, the rest of the minute */
  seconds: number;
  /** EMOM: rest until this many seconds after the round started */
  untilWindow: number | null;
}

export interface AmrapMoment {
  kind: 'amrap';
  key: string;
  block: number;
  name: string | null;
  /** Seconds the rounds fit in */
  seconds: number;
  /** One round: the athlete goes around until time is up */
  round: WorkMoment[];
}

export type Moment = WorkMoment | RestMoment | AmrapMoment;

function work(
  key: string,
  block: number,
  exercise: StrengthExercise,
  set: StrengthSet,
  position: Pick<WorkMoment, 'set' | 'sets' | 'round' | 'rounds' | 'group'>,
): WorkMoment {
  return {
    kind: 'work',
    key,
    block,
    exerciseRef: exercise.exerciseRef,
    name: exercise.name,
    work: { type: set.work.type, value: set.work.value },
    load: set.load,
    rpe: set.rpe,
    tempo: exercise.tempo,
    side: exercise.side,
    notes: exercise.notes,
    stepType: null,
    ...position,
  };
}

function rest(
  key: string,
  block: number,
  seconds: number | null,
): RestMoment[] {
  return seconds && seconds > 0
    ? [{ kind: 'rest', key, block, seconds, untilWindow: null }]
    : [];
}

function stepMoments(
  step: CreateWorkoutStepDto,
  block: number,
  prefix: string,
): Moment[] {
  if (step.repeatBlock) {
    const moments: Moment[] = [];
    const reps = step.repeatBlock.repetitions;
    for (let round = 0; round < reps; round += 1) {
      step.repeatBlock.childSteps.forEach((child, index) => {
        moments.push(
          ...stepMoments(child, block, `${prefix}.${round}.${index}`),
        );
      });
    }
    return moments;
  }
  const value = step.durationValue ?? 0;
  const timed =
    step.durationType === WORKOUT_DURATION_TYPE.TIME ||
    step.durationType === WORKOUT_DURATION_TYPE.REPS ||
    step.durationType === WORKOUT_DURATION_TYPE.DISTANCE;
  return [
    {
      kind: 'work',
      key: prefix,
      block,
      exerciseRef: step.exerciseRef ?? null,
      name: step.name ?? '',
      work:
        timed && value > 0
          ? {
              type: step.durationType as
                | WORKOUT_DURATION_TYPE.REPS
                | WORKOUT_DURATION_TYPE.TIME
                | WORKOUT_DURATION_TYPE.DISTANCE,
              value,
            }
          : { type: 'open' },
      load: null,
      rpe: null,
      tempo: step.tempo ?? null,
      side: step.side ?? null,
      notes: step.notes ?? null,
      set: 1,
      sets: 1,
      round: null,
      rounds: null,
      group: null,
      stepType: step.stepType,
    },
  ];
}

function blockMoments(block: StrengthBlock, index: number): Moment[] {
  const key = `b${index}`;
  if (block.kind === 'step') return stepMoments(block.step, index, key);

  if (block.kind === 'exercise') {
    const { exercise } = block;
    return exercise.sets.flatMap((set, setIndex) => [
      work(`${key}.s${setIndex}`, index, exercise, set, {
        set: setIndex + 1,
        sets: exercise.sets.length,
        round: null,
        rounds: null,
        group: null,
      }),
      ...rest(`${key}.s${setIndex}.r`, index, set.rest),
    ]);
  }

  const roundOf = (round: number | null, rounds: number | null) =>
    block.exercises.flatMap((exercise, position) => {
      const set = exercise.sets[0];
      if (!set) return [];
      const last = position === block.exercises.length - 1;
      return [
        work(`${key}.r${round ?? 0}.e${position}`, index, exercise, set, {
          set: round ?? 1,
          sets: rounds ?? 1,
          round,
          rounds,
          group: block.group,
        }),
        ...(last
          ? []
          : rest(`${key}.r${round ?? 0}.e${position}.r`, index, set.rest)),
      ];
    });

  if (block.group === WORKOUT_REPEAT_KIND.AMRAP) {
    return [
      {
        kind: 'amrap',
        key,
        block: index,
        name: block.name,
        seconds: block.timeCapSeconds ?? 600,
        round: roundOf(null, null).filter(
          (moment): moment is WorkMoment => moment.kind === 'work',
        ),
      },
    ];
  }

  const moments: Moment[] = [];
  for (let round = 1; round <= block.rounds; round += 1) {
    moments.push(...roundOf(round, block.rounds));
    if (block.group === WORKOUT_REPEAT_KIND.EMOM && block.intervalSeconds) {
      moments.push({
        kind: 'rest',
        key: `${key}.r${round}.w`,
        block: index,
        seconds: block.intervalSeconds,
        untilWindow: block.intervalSeconds,
      });
    } else {
      moments.push(...rest(`${key}.r${round}.r`, index, block.roundRest));
    }
  }
  return moments;
}

export function sessionTimeline(steps: CreateWorkoutStepDto[]): Moment[] {
  const moments = strengthBlocks(steps).flatMap(blockMoments);
  // Nothing to rest for after the last effort
  while (moments.length && moments[moments.length - 1].kind === 'rest') {
    moments.pop();
  }
  return moments;
}

/** The next moment with something to do, for the "next up" preview */
export function nextWork(
  moments: Moment[],
  from: number,
): WorkMoment | AmrapMoment | null {
  for (let i = from + 1; i < moments.length; i += 1) {
    const moment = moments[i];
    if (moment.kind !== 'rest') return moment;
  }
  return null;
}
