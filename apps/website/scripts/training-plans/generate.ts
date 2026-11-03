/**
 * Writes the running plans in src/lib/training-plans/plans/running from a
 * periodisation model and the texts in ./texts.ts, one file per language.
 *
 *   pnpm exec tsx scripts/training-plans/generate.ts          # write every plan
 *   pnpm exec tsx scripts/training-plans/generate.ts --check  # summary only
 *
 * Targets: easy runs and intervals are fractions of VMA (`metricType: 'VMA'`,
 * 0.95 = 95%), which the app turns into the athlete's own paces. Goal-pace
 * blocks and the race are absolute PACE targets in m/s, the unit of every
 * pace target in the app and the watch exports.
 */
/* eslint-disable no-console -- command-line report */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CYCLE_PHASE,
  type CreateWorkoutStepDto,
  type CreateWorkoutStepTarget,
  type SEOPlanData,
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  seoPlanDataSchema,
} from '@openathlete/shared';

import {
  RACE_METRES,
  RUNNING_PLAN_SPECS,
  type RunningDistance,
  type RunningPlanSpec,
  goalSpeedKmh,
  referenceVma,
} from '../../src/lib/training-plans/specs';
import {
  type DescParts,
  PLAN_LOCALES,
  type PhaseKey,
  type PlanLocale,
  type PlanTexts,
  type SessionKind,
  type StepKey,
  TEXTS,
  type WeekKind,
  goalPaceSessionName,
} from './texts';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PLANS_DIR = join(
  HERE,
  '../../src/lib/training-plans/plans/running',
);

// ---------------------------------------------------------------------------
// Intensities
// ---------------------------------------------------------------------------

type Band = readonly [number, number];

/** Shares of VMA. */
export const BANDS = {
  recovery: [0.6, 0.66],
  easy: [0.62, 0.7],
  tempo: [0.8, 0.84],
  threshold: [0.85, 0.88],
  vmaLong: [0.92, 0.97],
  vma: [0.95, 1.0],
  vmaShort: [1.0, 1.05],
} as const satisfies Record<string, Band>;

type Intensity = { band: Band } | { goal: true } | { none: 'jog' | 'stride' };

/** Seconds per km either side of goal pace on the watch. */
const GOAL_TOLERANCE: Record<RunningDistance, number> = {
  '10k': 3,
  'half-marathon': 4,
  marathon: 5,
};

// ---------------------------------------------------------------------------
// Tuning per plan: easy run and long run at their peak, and a level (1-4)
// that sizes the interval sessions.
// ---------------------------------------------------------------------------

interface Tuning {
  easy: number;
  long: number;
  level: 1 | 2 | 3 | 4;
}

const TUNING: Record<string, Tuning> = {
  '10k/40min': { easy: 50, long: 80, level: 4 },
  '10k/45min': { easy: 50, long: 75, level: 3 },
  '10k/50min': { easy: 45, long: 70, level: 2 },
  '10k/1h00': { easy: 40, long: 65, level: 1 },
  'half-marathon/1h30': { easy: 45, long: 105, level: 4 },
  'half-marathon/1h45': { easy: 50, long: 105, level: 3 },
  'half-marathon/2h00': { easy: 45, long: 100, level: 1 },
  'marathon/3h00': { easy: 60, long: 160, level: 4 },
  'marathon/3h30': { easy: 55, long: 160, level: 3 },
  'marathon/3h45': { easy: 55, long: 160, level: 3 },
  'marathon/4h00': { easy: 50, long: 165, level: 2 },
  'marathon/4h15': { easy: 50, long: 165, level: 2 },
  'marathon/4h30': { easy: 50, long: 170, level: 2 },
  'marathon/5h00': { easy: 50, long: 175, level: 1 },
  'marathon/5h30': { easy: 50, long: 180, level: 1 },
};

// ---------------------------------------------------------------------------
// Periodisation: blocks of weeks, each with a volume factor (1 = peak week).
// Three harder weeks then a lighter one; the taper is 2 weeks for 10K and
// half, 3 for the marathon, race week included.
// ---------------------------------------------------------------------------

const SCHEDULES: Record<
  RunningDistance,
  { phase: PhaseKey; factors: number[] }[]
> = {
  '10k': [
    { phase: 'base', factors: [0.7, 0.78, 0.86, 0.62] },
    { phase: 'specific', factors: [0.86, 0.93, 1, 0.72] },
    { phase: 'taper', factors: [0.78, 0.45] },
  ],
  'half-marathon': [
    { phase: 'base', factors: [0.66, 0.74, 0.82, 0.6] },
    { phase: 'build', factors: [0.8, 0.88, 0.95, 0.68] },
    { phase: 'specific', factors: [0.94, 1] },
    { phase: 'taper', factors: [0.72, 0.42] },
  ],
  marathon: [
    { phase: 'base', factors: [0.6, 0.67, 0.74, 0.55] },
    { phase: 'build', factors: [0.74, 0.81, 0.88, 0.64] },
    { phase: 'specific', factors: [0.88, 0.95, 1, 0.72, 0.97] },
    { phase: 'taper', factors: [0.78, 0.6, 0.38] },
  ],
};

const PHASE_ENUM: Record<PhaseKey, CYCLE_PHASE> = {
  base: CYCLE_PHASE.BASE,
  build: CYCLE_PHASE.BASE,
  specific: CYCLE_PHASE.SPECIFIC,
  taper: CYCLE_PHASE.TAPER,
};

const PHASE_COLOR: Record<PhaseKey, string> = {
  base: '#3b82f6',
  build: '#10b981',
  specific: '#f59e0b',
  taper: '#6366f1',
};

interface Week {
  n: number;
  phase: PhaseKey;
  idx: number;
  f: number;
  kind: WeekKind;
  light: boolean;
}

function schedule(distance: RunningDistance): Week[][] {
  let n = 0;
  return SCHEDULES[distance].map(({ phase, factors }) =>
    factors.map((f, idx) => {
      n += 1;
      const last = idx === factors.length - 1;
      const light = phase !== 'taper' && idx > 0 && f < factors[idx - 1];
      let kind: WeekKind;
      if (phase === 'taper') kind = last ? 'race' : 'taper';
      else if (light) kind = 'light';
      else if (f === 1) kind = 'peak';
      else
        kind =
          phase === 'base' ? 'base' : phase === 'build' ? 'build' : 'specific';
      return { n, phase, idx, f, kind, light };
    }),
  );
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

interface Ctx {
  spec: RunningPlanSpec;
  tune: Tuning;
  t: PlanTexts;
  /** km/h */
  vma: number;
  /** m/s */
  goalSpeed: number;
  goalPace: number;
}

const round5 = (minutes: number) => Math.max(5, Math.round(minutes / 5) * 5);
const pc = (share: number) => Math.round(share * 100);

function targetOf(ctx: Ctx, intensity: Intensity): CreateWorkoutStepTarget[] {
  if ('band' in intensity) {
    return [
      {
        targetType: WORKOUT_TARGET_TYPE.PACE,
        targetMin: intensity.band[0],
        targetMax: intensity.band[1],
        targetValue: null,
        metricType: 'VMA',
      },
    ];
  }
  if ('goal' in intensity) {
    const tol = GOAL_TOLERANCE[ctx.spec.distance];
    const speed = (pace: number) => Math.round((1000 / pace) * 1000) / 1000;
    return [
      {
        targetType: WORKOUT_TARGET_TYPE.PACE,
        // Slower bound first, as for every speed range
        targetMin: speed(ctx.goalPace + tol),
        targetMax: speed(ctx.goalPace - tol),
        targetValue: null,
        metricType: null,
      },
    ];
  }
  return [];
}

/** m/s used to estimate distance and time. */
function speedOf(ctx: Ctx, intensity: Intensity): number {
  if ('band' in intensity)
    return (((intensity.band[0] + intensity.band[1]) / 2) * ctx.vma) / 3.6;
  if ('goal' in intensity) return ctx.goalSpeed;
  return ((intensity.none === 'jog' ? 0.55 : 1) * ctx.vma) / 3.6;
}

interface Built {
  step: CreateWorkoutStepDto;
  seconds: number;
  metres: number;
}

function timeStep(
  ctx: Ctx,
  type: WORKOUT_STEP_TYPE,
  name: StepKey,
  seconds: number,
  intensity: Intensity,
): Built {
  return {
    step: {
      stepType: type,
      name: ctx.t.steps[name],
      durationType: WORKOUT_DURATION_TYPE.TIME,
      durationValue: seconds,
      targets: targetOf(ctx, intensity),
    },
    seconds,
    metres: seconds * speedOf(ctx, intensity),
  };
}

function distanceStep(
  ctx: Ctx,
  type: WORKOUT_STEP_TYPE,
  name: StepKey | string,
  metres: number,
  intensity: Intensity,
): Built {
  return {
    step: {
      stepType: type,
      name: name in ctx.t.steps ? ctx.t.steps[name as StepKey] : name,
      durationType: WORKOUT_DURATION_TYPE.DISTANCE,
      durationValue: metres,
      targets: targetOf(ctx, intensity),
    },
    seconds: metres / speedOf(ctx, intensity),
    metres,
  };
}

function repeat(name: string, reps: number, children: Built[]): Built {
  return {
    step: {
      stepType: WORKOUT_STEP_TYPE.REPEAT,
      name,
      durationType: WORKOUT_DURATION_TYPE.OPEN,
      targets: [],
      repeatBlock: {
        repetitions: reps,
        childSteps: children.map((c) => c.step),
      },
    },
    seconds: reps * children.reduce((s, c) => s + c.seconds, 0),
    metres: reps * children.reduce((s, c) => s + c.metres, 0),
  };
}

const easyStep = (ctx: Ctx, minutes: number, band: Band = BANDS.easy) =>
  timeStep(ctx, WORKOUT_STEP_TYPE.STEADY, 'easy', minutes * 60, { band });
const warmup = (ctx: Ctx, minutes: number) =>
  timeStep(ctx, WORKOUT_STEP_TYPE.WARMUP, 'warmup', minutes * 60, {
    band: BANDS.easy,
  });
const cooldown = (ctx: Ctx, minutes: number) =>
  timeStep(ctx, WORKOUT_STEP_TYPE.COOLDOWN, 'cooldown', minutes * 60, {
    band: BANDS.easy,
  });
const jog = (ctx: Ctx, seconds: number) =>
  timeStep(ctx, WORKOUT_STEP_TYPE.INTERVAL_REST, 'jog', seconds, {
    none: 'jog',
  });

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

interface Session {
  kind: SessionKind;
  day: number;
  rpe: number;
  steps: Built[];
  parts: Partial<DescParts>;
  /** Extra sentence after the description. */
  tip?: string;
}

function dist(t: PlanTexts, metres: number): string {
  if (metres < 1000) return `${metres} m`;
  return `${String(metres / 1000).replace('.', t.decimal)} km`;
}

const atBand = (t: PlanTexts, band: Band) => t.atPct(pc(band[0]), pc(band[1]));
const pctBand = (t: PlanTexts, band: Band) => t.pct(pc(band[0]), pc(band[1]));

function formatPace(seconds: number): string {
  const r = Math.round(seconds);
  return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
}

const atGoal = (ctx: Ctx) =>
  ctx.t.atGoal(ctx.spec.distance, `${formatPace(ctx.goalPace)}/km`);

function wuMinutes(ctx: Ctx) {
  return ctx.tune.level >= 3 ? 20 : 15;
}

/** Sessions the builders below return, before the day is set. */
type Draft = Omit<Session, 'day'>;

const S = {
  easy(ctx: Ctx, minutes: number): Draft {
    const m = Math.max(25, round5(minutes));
    return {
      kind: 'easy',
      rpe: 3,
      steps: [easyStep(ctx, m)],
      parts: { dur: ctx.t.hm(m), pct: pctBand(ctx.t, BANDS.easy) },
    };
  },
  recovery(ctx: Ctx, minutes: number): Draft {
    const m = Math.max(20, round5(minutes));
    return {
      kind: 'recovery',
      rpe: 2,
      steps: [easyStep(ctx, m, BANDS.recovery)],
      parts: { dur: ctx.t.hm(m), pct: pctBand(ctx.t, BANDS.recovery) },
    };
  },
  easyStrides(ctx: Ctx, minutes: number, strides = 6): Draft {
    const m = Math.max(25, round5(minutes));
    const stride: Built = {
      ...timeStep(ctx, WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, 'stride', 20, {
        none: 'stride',
      }),
    };
    return {
      kind: 'easyStrides',
      rpe: 3,
      steps: [
        easyStep(ctx, m),
        repeat(`${strides} × 20 s`, strides, [stride, jog(ctx, 40)]),
      ],
      parts: {
        dur: ctx.t.hm(m),
        pct: pctBand(ctx.t, BANDS.easy),
        reps: strides,
      },
    };
  },
  long(ctx: Ctx, minutes: number): Draft {
    const m = round5(minutes);
    return {
      kind: 'long',
      rpe: 4,
      steps: [easyStep(ctx, m)],
      parts: { dur: ctx.t.hm(m), pct: pctBand(ctx.t, BANDS.easy) },
    };
  },
  /** The last minutes faster: goal pace for the half, tempo for the 10K. */
  longFinish(ctx: Ctx, minutes: number, fast: number): Draft {
    const m = round5(minutes);
    const goal = ctx.spec.distance !== '10k';
    const intensity: Intensity = goal ? { goal: true } : { band: BANDS.tempo };
    return {
      kind: 'longFinish',
      rpe: 5,
      steps: [
        easyStep(ctx, m - fast),
        timeStep(
          ctx,
          WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
          goal ? 'goal' : 'tempo',
          fast * 60,
          intensity,
        ),
      ],
      parts: {
        dur: ctx.t.hm(m),
        pct: pctBand(ctx.t, BANDS.easy),
        rep: ctx.t.hm(fast),
        at: goal ? atGoal(ctx) : atBand(ctx.t, BANDS.tempo),
      },
    };
  },
  /** Marathon-pace blocks inside a long run. */
  longGoal(ctx: Ctx, minutes: number, reps: number, block: number): Draft {
    const m = round5(minutes);
    const between = 5;
    const main = reps * block + (reps - 1) * between;
    const before = Math.max(20, round5((m - main) * 0.6));
    const after = Math.max(10, m - main - before);
    return {
      kind: 'longGoal',
      rpe: 6,
      steps: [
        easyStep(ctx, before),
        repeat(`${reps} × ${ctx.t.hm(block)}`, reps, [
          timeStep(ctx, WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, 'goal', block * 60, {
            goal: true,
          }),
          timeStep(ctx, WORKOUT_STEP_TYPE.INTERVAL_REST, 'easy', between * 60, {
            band: BANDS.easy,
          }),
        ]),
        easyStep(ctx, after - between),
      ],
      parts: {
        dur: ctx.t.hm(before + reps * (block + between) + after - between),
        pct: pctBand(ctx.t, BANDS.easy),
        reps,
        rep: ctx.t.hm(block),
        at: atGoal(ctx),
        between: ctx.t.hm(between),
      },
    };
  },
  fartlek(ctx: Ctx, reps: number, on = 60, off = 60): Draft {
    return interval(
      ctx,
      'fartlek',
      7,
      reps,
      { seconds: on },
      BANDS.vmaLong,
      off,
      'fast',
    );
  },
  vmaShort(ctx: Ctx, reps: number): Draft {
    return interval(
      ctx,
      'vmaShort',
      8,
      reps,
      { seconds: 30 },
      BANDS.vmaShort,
      30,
      'fast',
    );
  },
  vma(ctx: Ctx, reps: number, metres: number): Draft {
    const band = metres <= 400 ? BANDS.vmaShort : BANDS.vma;
    const rec = metres <= 400 ? 90 : metres <= 600 ? 105 : 120;
    return interval(ctx, 'vma', 8, reps, { metres }, band, rec, 'fast');
  },
  vmaLong(ctx: Ctx, reps: number, metres: number): Draft {
    return interval(
      ctx,
      'vmaLong',
      8,
      reps,
      { metres },
      BANDS.vmaLong,
      metres >= 1500 ? 180 : 150,
      'fast',
    );
  },
  threshold(ctx: Ctx, reps: number, minutes: number): Draft {
    const rec = ctx.tune.level >= 3 ? 90 : 120;
    if (reps === 1) {
      const wu = wuMinutes(ctx);
      const main = timeStep(
        ctx,
        WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
        'threshold',
        minutes * 60,
        {
          band: BANDS.threshold,
        },
      );
      return {
        kind: 'threshold',
        rpe: 7,
        steps: [warmup(ctx, wu), main, cooldown(ctx, 10)],
        parts: {
          wu: ctx.t.hm(wu),
          cd: ctx.t.hm(10),
          reps: 1,
          rep: ctx.t.hm(minutes),
          pct: pctBand(ctx.t, BANDS.threshold),
        },
      };
    }
    return interval(
      ctx,
      'threshold',
      7,
      reps,
      { seconds: minutes * 60 },
      BANDS.threshold,
      rec,
      'threshold',
    );
  },
  tempo(ctx: Ctx, minutes: number): Draft {
    const wu = wuMinutes(ctx);
    return {
      kind: 'tempo',
      rpe: 6,
      steps: [
        warmup(ctx, wu),
        timeStep(
          ctx,
          WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
          'tempo',
          minutes * 60,
          { band: BANDS.tempo },
        ),
        cooldown(ctx, 10),
      ],
      parts: {
        wu: ctx.t.hm(wu),
        cd: ctx.t.hm(10),
        dur: ctx.t.hm(minutes),
        pct: pctBand(ctx.t, BANDS.tempo),
      },
    };
  },
  goalPace(ctx: Ctx, reps: number, metres: number): Draft {
    const rec = metres <= 1000 ? 90 : metres <= 3000 ? 120 : 180;
    const rpe = { '10k': 8, 'half-marathon': 7, marathon: 6 }[
      ctx.spec.distance
    ];
    return interval(ctx, 'goalPace', rpe, reps, { metres }, null, rec, 'goal');
  },
  /** Race week: easy running with a few minutes at goal pace. */
  sharpen(ctx: Ctx, minutes: number, reps: number, seconds: number): Draft {
    const between = 120;
    const main = (reps * (seconds + between)) / 60;
    const before = round5((minutes - main) * 0.6);
    const after = Math.max(5, minutes - main - before);
    return {
      kind: 'sharpen',
      rpe: 4,
      steps: [
        easyStep(ctx, before),
        repeat(`${reps} × ${ctx.t.sec(seconds)}`, reps, [
          timeStep(ctx, WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, 'goal', seconds, {
            goal: true,
          }),
          timeStep(ctx, WORKOUT_STEP_TYPE.INTERVAL_REST, 'easy', between, {
            band: BANDS.easy,
          }),
        ]),
        easyStep(ctx, after),
      ],
      parts: {
        dur: ctx.t.hm(minutes),
        reps,
        rep: ctx.t.sec(seconds),
        at: atGoal(ctx),
      },
    };
  },
  race(ctx: Ctx): Draft {
    const metres = RACE_METRES[ctx.spec.distance];
    const step = distanceStep(
      ctx,
      WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
      ctx.t.raceName(ctx.spec.distance),
      Math.round(metres),
      { goal: true },
    );
    return {
      kind: 'race',
      rpe: 9,
      steps: [{ ...step, metres, seconds: ctx.spec.goalSeconds }],
      parts: { at: atGoal(ctx) },
    };
  },
};

/** Warm-up, reps with jogged recoveries, cool-down. */
function interval(
  ctx: Ctx,
  kind: SessionKind,
  rpe: number,
  reps: number,
  work: { seconds: number } | { metres: number },
  band: Band | null,
  recSeconds: number,
  name: StepKey,
): Draft {
  const wu = wuMinutes(ctx);
  const intensity: Intensity = band ? { band } : { goal: true };
  const rep =
    'seconds' in work
      ? timeStep(
          ctx,
          WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
          name,
          work.seconds,
          intensity,
        )
      : distanceStep(
          ctx,
          WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
          name,
          work.metres,
          intensity,
        );
  const repText =
    'seconds' in work
      ? work.seconds % 60 === 0
        ? ctx.t.hm(work.seconds / 60)
        : ctx.t.sec(work.seconds)
      : dist(ctx.t, work.metres);
  return {
    kind,
    rpe,
    steps: [
      warmup(ctx, wu),
      repeat(`${reps} × ${repText}`, reps, [rep, jog(ctx, recSeconds)]),
      cooldown(ctx, 10),
    ],
    parts: {
      wu: ctx.t.hm(wu),
      cd: ctx.t.hm(10),
      reps,
      rep: repText,
      rec: ctx.t.sec(recSeconds),
      at: band ? atBand(ctx.t, band) : atGoal(ctx),
      pct: band ? pctBand(ctx.t, band) : '',
    },
  };
}

// ---------------------------------------------------------------------------
// Weeks: which session goes in which slot
// ---------------------------------------------------------------------------

type Slot = 'Q1' | 'Q2' | 'X' | 'E' | 'R' | 'L';

const DAYS: Record<3 | 4 | 5, [Slot, number][]> = {
  // Tuesday, Thursday, Sunday
  3: [
    ['Q1', 2],
    ['X', 4],
    ['L', 0],
  ],
  // Tuesday, Wednesday, Friday, Sunday
  4: [
    ['Q1', 2],
    ['E', 3],
    ['Q2', 5],
    ['L', 0],
  ],
  // Tuesday, Wednesday, Thursday, Saturday, Sunday
  5: [
    ['Q1', 2],
    ['E', 3],
    ['Q2', 4],
    ['R', 6],
    ['L', 0],
  ],
};

/** Pick by level (1-4). */
const byLevel = <T>(ctx: Ctx, values: [T, T, T, T]): T =>
  values[ctx.tune.level - 1];

function longMinutes(ctx: Ctx, w: Week) {
  // Long runs grow faster than the rest of the week
  return ctx.tune.long * w.f ** 1.3;
}

function sessionFor(ctx: Ctx, w: Week, slot: Slot): Draft | null {
  const d = ctx.spec.distance;
  const three = ctx.spec.runsPerWeek === 3;
  const easyMin = ctx.tune.easy * (0.35 + 0.65 * w.f);
  const L = ctx.tune.level;

  // Race week
  if (w.kind === 'race') {
    switch (slot) {
      case 'Q1': {
        const [reps, secs] =
          d === '10k' ? [4, 60] : d === 'half-marathon' ? [3, 180] : [2, 300];
        return S.sharpen(ctx, 35, reps, secs);
      }
      case 'E':
        return S.easy(ctx, 30);
      case 'Q2':
      case 'X':
        return S.easyStrides(ctx, 25, 4);
      case 'R':
        return S.recovery(ctx, 20);
      case 'L':
        return S.race(ctx);
    }
  }

  switch (slot) {
    case 'E':
      return S.easy(ctx, easyMin);
    case 'R':
      return S.recovery(ctx, easyMin * 0.75);
    case 'X':
      return xSession(ctx, w, easyMin + 5);
    case 'L':
      return longSession(ctx, w);
    case 'Q1':
      return q1Session(ctx, w, easyMin, three, L);
    case 'Q2':
      return q2Session(ctx, w, easyMin, L);
  }
}

function q1Session(
  ctx: Ctx,
  w: Week,
  easyMin: number,
  three: boolean,
  L: number,
): Draft {
  const d = ctx.spec.distance;
  if (w.phase === 'base') {
    if (w.light) return S.easyStrides(ctx, easyMin);
    if (w.idx === 0) return S.fartlek(ctx, 5 + L);
    return S.vmaShort(ctx, 8 + 2 * L + (w.idx === 2 ? 2 : 0));
  }
  if (w.phase === 'build') {
    if (w.light) return S.fartlek(ctx, 4 + L);
    if (w.idx === 0) return S.vma(ctx, byLevel(ctx, [7, 8, 10, 12]), 400);
    if (w.idx === 1)
      return three
        ? S.threshold(ctx, 3, byLevel(ctx, [6, 8, 10, 10]))
        : S.vma(ctx, byLevel(ctx, [5, 5, 6, 7]), 800);
    return S.vmaLong(ctx, byLevel(ctx, [4, 5, 5, 6]), 1000);
  }
  if (w.phase === 'specific') {
    if (d === '10k') {
      if (w.light) return S.goalPace(ctx, byLevel(ctx, [3, 3, 4, 4]), 1000);
      if (w.idx === 0) return S.vma(ctx, byLevel(ctx, [8, 10, 10, 12]), 400);
      if (w.idx === 1) return S.goalPace(ctx, byLevel(ctx, [4, 5, 6, 6]), 1000);
      return S.vma(ctx, byLevel(ctx, [5, 6, 6, 7]), 800);
    }
    if (d === 'half-marathon') {
      if (w.idx === 0) return S.vmaLong(ctx, byLevel(ctx, [4, 5, 5, 6]), 1000);
      return S.threshold(ctx, 3, byLevel(ctx, [8, 8, 10, 12]));
    }
    // Marathon
    if (w.light) return S.fartlek(ctx, 4 + L);
    if (w.idx === 1) return S.vmaLong(ctx, byLevel(ctx, [4, 5, 5, 6]), 1000);
    if (w.idx === 2) return S.threshold(ctx, 2, byLevel(ctx, [10, 12, 15, 15]));
    return S.threshold(ctx, 3, byLevel(ctx, [6, 8, 10, 10]));
  }
  // Taper week before race week
  if (d === 'marathon' && w.idx === 0)
    return S.threshold(ctx, 2, byLevel(ctx, [8, 10, 10, 12]));
  return S.vma(ctx, byLevel(ctx, [5, 6, 6, 8]), 400);
}

function q2Session(ctx: Ctx, w: Week, easyMin: number, L: number): Draft {
  const d = ctx.spec.distance;
  if (w.light) return S.easyStrides(ctx, easyMin);
  if (w.phase === 'base') {
    if (w.idx === 0) return S.easyStrides(ctx, easyMin);
    return S.tempo(ctx, 10 + 5 * L + (w.idx === 2 ? 5 : 0) - 5);
  }
  if (w.phase === 'build') {
    if (w.idx === 1) return S.tempo(ctx, 15 + 5 * L);
    return S.threshold(ctx, w.idx === 0 ? 3 : 4, byLevel(ctx, [6, 8, 8, 10]));
  }
  if (w.phase === 'specific') {
    if (d === '10k') {
      if (w.idx === 0)
        return S.threshold(ctx, 2, byLevel(ctx, [8, 10, 10, 12]));
      if (w.idx === 1) return S.tempo(ctx, 15 + 5 * L);
      return S.goalPace(ctx, byLevel(ctx, [2, 2, 3, 3]), 2000);
    }
    if (d === 'half-marathon') {
      return w.idx === 0
        ? S.goalPace(ctx, 3, byLevel(ctx, [2000, 3000, 3000, 3000]))
        : S.goalPace(ctx, 2, byLevel(ctx, [4000, 4000, 5000, 5000]));
    }
    // Week by week of the block; the light week has no goal-pace session
    const blocks: [number, number][] =
      L <= 2
        ? [
            [3, 3000],
            [2, 4000],
            [3, 3000],
            [0, 0],
            [2, 5000],
          ]
        : [
            [3, 3000],
            [2, 5000],
            [3, 4000],
            [0, 0],
            [2, 6000],
          ];
    const [reps, metres] = blocks[w.idx];
    return S.goalPace(ctx, reps, metres);
  }
  // Taper week before race week
  if (d === '10k') return S.goalPace(ctx, 3, 1000);
  if (d === 'half-marathon') return S.goalPace(ctx, 2, L >= 3 ? 3000 : 2000);
  return S.goalPace(ctx, 2, w.idx === 0 ? 4000 : 3000);
}

/** Thursday of the three-run plans: easy, with race pace once it matters. */
function xSession(ctx: Ctx, w: Week, minutes: number): Draft {
  const d = ctx.spec.distance;
  if (w.light) return S.easy(ctx, minutes);
  if (w.phase === 'specific') {
    if (d === '10k')
      return w.idx === 2 ? S.tempo(ctx, 15) : S.easyStrides(ctx, minutes);
    if (d === 'half-marathon')
      return w.idx === 0
        ? S.goalPace(ctx, 3, 2000)
        : S.easyStrides(ctx, minutes);
    const marathon: Record<number, number> = { 0: 3000, 2: 4000, 4: 5000 };
    return marathon[w.idx]
      ? S.goalPace(ctx, 2, marathon[w.idx])
      : S.easyStrides(ctx, minutes);
  }
  return S.easyStrides(ctx, minutes);
}

function longSession(ctx: Ctx, w: Week): Draft {
  const d = ctx.spec.distance;
  const minutes = longMinutes(ctx, w);
  const strong = ctx.tune.level >= 3;
  const fuel = (draft: Draft): Draft => ({ ...draft, tip: ctx.t.fuelTip });
  if (d === 'marathon') {
    if (w.phase === 'build' && w.idx === 2)
      return S.longGoal(ctx, minutes, 2, 10);
    if (w.phase === 'specific') {
      if (w.idx === 0)
        return fuel(S.longGoal(ctx, minutes, 2, strong ? 20 : 15));
      if (w.idx === 2)
        return fuel(S.longGoal(ctx, minutes, 3, strong ? 20 : 15));
      if (w.idx === 4)
        return fuel(S.longGoal(ctx, minutes, 2, strong ? 25 : 20));
      return w.light ? S.long(ctx, minutes) : fuel(S.long(ctx, minutes));
    }
    if (w.phase === 'taper' && w.idx === 0)
      return S.longGoal(ctx, minutes, 2, 10);
    return S.long(ctx, minutes);
  }
  if (d === 'half-marathon') {
    if (w.phase === 'build' && w.idx === 2)
      return S.longFinish(ctx, minutes, 10);
    if (w.phase === 'specific')
      return fuel(
        S.longFinish(
          ctx,
          minutes,
          w.idx === 0 ? (strong ? 20 : 15) : strong ? 30 : 25,
        ),
      );
    if (w.phase === 'taper') return S.longFinish(ctx, minutes, 10);
    return S.long(ctx, minutes);
  }
  if (w.phase === 'specific' && w.idx === 1)
    return S.longFinish(ctx, minutes, 10);
  return S.long(ctx, minutes);
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

type PlanSession =
  SEOPlanData['cycles'][number]['weeks'][number]['sessions'][number];

function toSession(ctx: Ctx, d: Session): PlanSession {
  const t = ctx.t;
  const seconds = d.steps.reduce((s, b) => s + b.seconds, 0);
  const metres = d.steps.reduce((s, b) => s + b.metres, 0);
  const parts: DescParts = {
    wu: '',
    cd: '',
    dur: '',
    pct: '',
    at: '',
    reps: 0,
    rep: '',
    rec: '',
    between: '',
    ...d.parts,
  };
  const name =
    d.kind === 'goalPace'
      ? goalPaceSessionName(t, ctx.spec.distance)
      : d.kind === 'race'
        ? t.raceName(ctx.spec.distance)
        : d.kind === 'longGoal' && ctx.spec.distance !== 'marathon'
          ? t.names.longFinish
          : t.names[d.kind];
  const description = [t.desc[d.kind](parts), d.tip].filter(Boolean).join(' ');
  return {
    dayOfWeek: d.day,
    name,
    sport: SPORT_TYPE.RUNNING,
    description,
    goalDistance:
      d.kind === 'race'
        ? RACE_METRES[ctx.spec.distance]
        : Math.round(metres / 100) * 100,
    goalDuration:
      d.kind === 'race' ? ctx.spec.goalSeconds : Math.round(seconds / 60) * 60,
    goalRpe: d.rpe,
    workout: { steps: d.steps.map((b) => b.step) },
  };
}

export function goalTimeLabel(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  return `${h}h${String(Math.round((seconds % 3600) / 60)).padStart(2, '0')}`;
}

export function buildPlan(
  spec: RunningPlanSpec,
  locale: PlanLocale,
): SEOPlanData {
  const tune = TUNING[`${spec.distance}/${spec.variant}`];
  if (!tune) throw new Error(`No tuning for ${spec.distance}/${spec.variant}`);
  const ctx: Ctx = {
    spec,
    tune,
    t: TEXTS[locale],
    vma: referenceVma(spec),
    goalSpeed: goalSpeedKmh(spec) / 3.6,
    goalPace: spec.goalSeconds / (RACE_METRES[spec.distance] / 1000),
  };
  const t = ctx.t;
  const blocks = schedule(spec.distance);
  const cycles = blocks.map((weeks) => {
    const phase = weeks[0].phase;
    return {
      name: t.cycleName(phase, spec.distance),
      description: t.cycleDesc(
        phase,
        spec.distance,
        weeks.filter((w) => w.light).map((w) => w.n),
      ),
      phase: PHASE_ENUM[phase],
      color: PHASE_COLOR[phase],
      weeks: weeks.map((w) => ({
        weekNumber: w.n,
        theme: t.weekTheme[w.kind],
        sessions: DAYS[spec.runsPerWeek]
          .map(([slot, day]) => {
            const draft = sessionFor(ctx, w, slot);
            return draft ? toSession(ctx, { ...draft, day }) : null;
          })
          .filter((s): s is PlanSession => s !== null),
      })),
    };
  });

  const weeks = cycles.flatMap((c) => c.weeks);
  const km = weeks.map(
    (w) => w.sessions.reduce((s, x) => s + (x.goalDistance ?? 0), 0) / 1000,
  );
  // The race week counts the race: the biggest training week is what readers want
  const peakKm = Math.round(Math.max(...km.slice(0, -1)));
  const longest = Math.max(
    ...weeks
      .slice(0, -1)
      .flatMap((w) => w.sessions)
      .map((s) => s.goalDuration ?? 0),
  );
  const time = goalTimeLabel(spec.goalSeconds);
  const vma = String(ctx.vma).replace('.', t.decimal);
  const plan: SEOPlanData = {
    plan: {
      name: t.planName(spec.distance, time, spec.weeks),
      description: t.planDesc({
        d: spec.distance,
        time,
        pace: formatPace(ctx.goalPace),
        weeks: spec.weeks,
        runs: spec.runsPerWeek,
        vma,
        firstKm: Math.round(km[0]),
        peakKm,
        longest: t.hm(Math.round(longest / 300) * 5),
      }),
      goal: t.planGoal(spec.distance, time),
      sportType: SPORT_TYPE.RUNNING,
      distance: RACE_METRES[spec.distance],
      duration: spec.weeks,
      timeTarget: spec.goalSeconds,
    },
    cycles,
  };
  if (weeks.length !== spec.weeks) {
    throw new Error(
      `${spec.distance}/${spec.variant}: ${weeks.length} weeks, expected ${spec.weeks}`,
    );
  }
  return plan;
}

export function planFileName(
  spec: RunningPlanSpec,
  locale: PlanLocale,
): string {
  return `${spec.distance}-${spec.variant}.${locale}.json`;
}

function main() {
  const check = process.argv.includes('--check');
  mkdirSync(PLANS_DIR, { recursive: true });
  for (const spec of RUNNING_PLAN_SPECS) {
    for (const locale of PLAN_LOCALES) {
      const plan = buildPlan(spec, locale);
      const parsed = seoPlanDataSchema.safeParse(plan);
      if (!parsed.success) {
        throw new Error(
          `${planFileName(spec, locale)}: ${parsed.error.message}`,
        );
      }
      if (!check) {
        writeFileSync(
          join(PLANS_DIR, planFileName(spec, locale)),
          `${JSON.stringify(plan, null, 2)}\n`,
        );
      }
      if (locale === 'en') {
        const weeks = plan.cycles.flatMap((c) => c.weeks);
        const km = weeks.map((w) =>
          Math.round(
            w.sessions.reduce((s, x) => s + (x.goalDistance ?? 0), 0) / 1000,
          ),
        );
        const longKm = Math.max(
          ...weeks
            .slice(0, -1)
            .flatMap((w) =>
              w.sessions.map((s) => (s.goalDistance ?? 0) / 1000),
            ),
        );
        console.log(
          `${`${spec.distance}/${spec.variant}`.padEnd(20)} VMA ${referenceVma(spec)}  runs ${spec.runsPerWeek}  km/wk ${km.join(' ')}  longest ${longKm.toFixed(1)} km`,
        );
      }
    }
  }
  console.log(
    check
      ? 'Checked, nothing written.'
      : `Wrote ${RUNNING_PLAN_SPECS.length * PLAN_LOCALES.length} files.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
