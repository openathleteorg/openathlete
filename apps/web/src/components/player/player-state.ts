import type {
  CompleteStrengthSessionDto,
  Moment,
  StrengthLogSet,
  WorkMoment,
} from '@openathlete/shared';
import {
  WORKOUT_DURATION_TYPE,
  WORKOUT_REPEAT_KIND,
} from '@openathlete/shared';

/**
 * The session player as a pure state machine: what is running, since when,
 * what was done. The screen renders it and feeds it the time; nothing here
 * reads a clock, so every rule is tested with chosen times.
 */

export type PlayerPhase = 'ready' | 'running' | 'paused' | 'finished';

export interface AmrapProgress {
  /** Index in the round of the exercise under way */
  position: number;
  rounds: number;
}

export interface PlayerState {
  moments: Moment[];
  index: number;
  phase: PlayerPhase;
  /** ms: when the session started, and the time paused since */
  startedAt: number | null;
  pausedAt: number | null;
  pausedMs: number;
  finishedAt: number | null;
  /** ms: when the moment under way started, pauses shifted out */
  momentStartedAt: number | null;
  /** ms: start of the EMOM round under way */
  windowStartedAt: number | null;
  /** Seconds added to or taken from a rest (by key) */
  restAdjust: Record<string, number>;
  log: Record<string, StrengthLogSet>;
  amrap: Record<string, AmrapProgress>;
}

export type PlayerAction =
  | { type: 'start'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  /** The set is done, as the athlete says it went */
  | { type: 'done'; now: number; reps?: number | null; load?: number | null }
  | { type: 'skip'; now: number }
  | { type: 'back'; now: number }
  | { type: 'adjustRest'; seconds: number; now: number }
  | { type: 'finish'; now: number };

export function initialPlayer(moments: Moment[]): PlayerState {
  return {
    moments,
    index: 0,
    phase: 'ready',
    startedAt: null,
    pausedAt: null,
    pausedMs: 0,
    finishedAt: null,
    momentStartedAt: null,
    windowStartedAt: null,
    restAdjust: {},
    log: {},
    amrap: {},
  };
}

export const current = (state: PlayerState): Moment | undefined =>
  state.moments[state.index];

/** The length of a timed moment in seconds; null for one the athlete ends */
export function momentSeconds(
  state: PlayerState,
  index = state.index,
): number | null {
  const moment = state.moments[index];
  if (!moment) return null;
  if (moment.kind === 'amrap') return moment.seconds;
  if (moment.kind === 'rest') {
    const adjust = state.restAdjust[moment.key] ?? 0;
    if (
      moment.untilWindow !== null &&
      state.windowStartedAt !== null &&
      state.momentStartedAt !== null
    ) {
      // An EMOM rests what is left of its minute, from when the round began
      const used = (state.momentStartedAt - state.windowStartedAt) / 1000;
      return Math.max(0, moment.untilWindow - used + adjust);
    }
    return Math.max(0, moment.seconds + adjust);
  }
  return moment.work.type === WORKOUT_DURATION_TYPE.TIME
    ? moment.work.value
    : null;
}

/** Seconds since the moment under way began */
export function momentElapsed(state: PlayerState, now: number): number {
  if (state.momentStartedAt === null) return 0;
  const until =
    state.phase === 'paused' && state.pausedAt !== null ? state.pausedAt : now;
  return Math.max(0, (until - state.momentStartedAt) / 1000);
}

/** Seconds left of a timed moment; null for one the athlete ends */
export function momentRemaining(
  state: PlayerState,
  now: number,
): number | null {
  const length = momentSeconds(state);
  return length === null
    ? null
    : Math.max(0, length - momentElapsed(state, now));
}

/** Seconds of training, pauses left out */
export function sessionElapsed(state: PlayerState, now: number): number {
  if (state.startedAt === null) return 0;
  const end =
    state.finishedAt ??
    (state.phase === 'paused' && state.pausedAt !== null
      ? state.pausedAt
      : now);
  return Math.max(0, (end - state.startedAt - state.pausedMs) / 1000);
}

function startsEmomRound(moments: Moment[], index: number): boolean {
  const moment = moments[index];
  if (moment?.kind !== 'work' || moment.group !== WORKOUT_REPEAT_KIND.EMOM)
    return false;
  const previous = moments[index - 1];
  return (
    !previous || previous.kind === 'rest' || previous.block !== moment.block
  );
}

function enter(state: PlayerState, index: number, now: number): PlayerState {
  if (index >= state.moments.length) {
    return {
      ...state,
      index: state.moments.length,
      phase: 'finished',
      finishedAt: now,
      momentStartedAt: null,
    };
  }
  return {
    ...state,
    index,
    momentStartedAt: now,
    windowStartedAt: startsEmomRound(state.moments, index)
      ? now
      : state.windowStartedAt,
  };
}

function logWork(
  state: PlayerState,
  moment: WorkMoment,
  entry: Partial<StrengthLogSet>,
): Record<string, StrengthLogSet> {
  const planned = moment.work.type === 'open' ? null : moment.work;
  return {
    ...state.log,
    [moment.key]: {
      key: moment.key,
      exerciseRef: moment.exerciseRef as StrengthLogSet['exerciseRef'],
      name: moment.name,
      reps: planned?.type === WORKOUT_DURATION_TYPE.REPS ? planned.value : null,
      seconds:
        planned?.type === WORKOUT_DURATION_TYPE.TIME ? planned.value : null,
      load: moment.load,
      skipped: false,
      ...entry,
    },
  };
}

/** Leaves the moment under way, writing what was done of it */
function leave(
  state: PlayerState,
  now: number,
  skipped: boolean,
  action?: { reps?: number | null; load?: number | null },
): PlayerState {
  const moment = current(state);
  if (!moment) return state;
  let next = state;
  if (moment.kind === 'work') {
    const held = Math.round(momentElapsed(state, now));
    next = {
      ...next,
      log: logWork(state, moment, {
        skipped,
        ...(action?.reps !== undefined && { reps: action.reps }),
        ...(action?.load !== undefined && { load: action.load }),
        // A hold stopped early lasted what it lasted
        ...(moment.work.type === WORKOUT_DURATION_TYPE.TIME &&
          !skipped &&
          held < moment.work.value && { seconds: held }),
      }),
    };
  }
  return enter(next, state.index + 1, now);
}

export function playerReducer(
  state: PlayerState,
  action: PlayerAction,
): PlayerState {
  switch (action.type) {
    case 'start': {
      if (state.phase !== 'ready' || state.moments.length === 0) return state;
      return enter(
        { ...state, phase: 'running', startedAt: action.now },
        0,
        action.now,
      );
    }
    case 'pause':
      if (state.phase !== 'running') return state;
      return { ...state, phase: 'paused', pausedAt: action.now };
    case 'resume': {
      if (state.phase !== 'paused' || state.pausedAt === null) return state;
      const paused = action.now - state.pausedAt;
      const shift = (ms: number | null) => (ms === null ? null : ms + paused);
      return {
        ...state,
        phase: 'running',
        pausedAt: null,
        pausedMs: state.pausedMs + paused,
        momentStartedAt: shift(state.momentStartedAt),
        windowStartedAt: shift(state.windowStartedAt),
      };
    }
    case 'tick': {
      if (state.phase !== 'running') return state;
      const remaining = momentRemaining(state, action.now);
      if (remaining === null || remaining > 0) return state;
      const moment = current(state)!;
      if (moment.kind === 'amrap') {
        // Time is up: the rounds done are what counts
        return enter(state, state.index + 1, action.now);
      }
      // A timed moment ends at its time, as it should have
      const ended =
        (state.momentStartedAt ?? action.now) +
        (momentSeconds(state) ?? 0) * 1000;
      return leave(state, ended, false);
    }
    case 'done': {
      if (state.phase !== 'running') return state;
      const moment = current(state);
      if (moment?.kind === 'amrap') {
        const progress = state.amrap[moment.key] ?? { position: 0, rounds: 0 };
        const position = progress.position + 1;
        const lap = position >= moment.round.length;
        return {
          ...state,
          amrap: {
            ...state.amrap,
            [moment.key]: {
              position: lap ? 0 : position,
              rounds: progress.rounds + (lap ? 1 : 0),
            },
          },
        };
      }
      return leave(state, action.now, false, action);
    }
    case 'skip':
      if (state.phase !== 'running' && state.phase !== 'paused') return state;
      return leave(state, action.now, true);
    case 'back': {
      if (state.phase !== 'running' && state.phase !== 'paused') return state;
      // Back to the last effort, past the rest before it
      let index = state.index - 1;
      while (index > 0 && state.moments[index].kind === 'rest') index -= 1;
      if (index < 0) return enter(state, state.index, action.now);
      const { [state.moments[index].key]: _undone, ...log } = state.log;
      return enter(
        { ...state, log, phase: 'running', pausedAt: null },
        index,
        action.now,
      );
    }
    case 'adjustRest': {
      const moment = current(state);
      if (moment?.kind !== 'rest') return state;
      return {
        ...state,
        restAdjust: {
          ...state.restAdjust,
          [moment.key]: (state.restAdjust[moment.key] ?? 0) + action.seconds,
        },
      };
    }
    case 'finish':
      if (state.phase === 'finished' || state.phase === 'ready') return state;
      return {
        ...state,
        phase: 'finished',
        finishedAt: state.pausedAt ?? action.now,
      };
  }
}

/** What was done, as the API records it */
export function sessionResult(
  state: PlayerState,
  rpe: number | null,
  comment: string,
): CompleteStrengthSessionDto {
  const sets = state.moments
    .flatMap((moment) => (moment.kind === 'work' ? [moment] : []))
    .map(
      (moment) =>
        state.log[moment.key] ?? {
          key: moment.key,
          exerciseRef: moment.exerciseRef as StrengthLogSet['exerciseRef'],
          name: moment.name,
          reps: null,
          seconds: null,
          load: null,
          skipped: true,
        },
    );
  const amrapRounds = Object.fromEntries(
    Object.entries(state.amrap).map(([key, progress]) => [
      key,
      progress.rounds,
    ]),
  );
  return {
    startedAt: new Date(state.startedAt ?? Date.now()),
    durationSeconds: Math.max(
      1,
      Math.round(sessionElapsed(state, state.finishedAt ?? Date.now())),
    ),
    rpe,
    comment: comment.trim() || undefined,
    log: { version: 1, sets, amrapRounds },
  };
}

/** Sets done and the weight moved, for the end of the session */
export function sessionTotals(state: PlayerState) {
  const done = Object.values(state.log).filter((set) => !set.skipped);
  return {
    sets: done.length,
    reps: done.reduce((sum, set) => sum + (set.reps ?? 0), 0),
    volume: Math.round(
      done.reduce((sum, set) => sum + (set.reps ?? 0) * (set.load ?? 0), 0),
    ),
  };
}
