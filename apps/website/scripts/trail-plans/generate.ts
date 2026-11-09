/**
 * Writes the trail plans to src/lib/training-plans/plans/trail, one JSON
 * file per plan and language, and checks each against seoPlanDataSchema.
 *
 *   npx tsx scripts/trail-plans/generate.ts
 *
 * Targets are relative so the app can turn them into the athlete's own
 * numbers: PACE as a fraction of VMA on flat or rolling ground, HEARTRATE as
 * a fraction of max heart rate on climbs (pace means nothing on a 12% slope),
 * RPE (1–10) on descents and strides.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  CYCLE_PHASE,
  type CreateWorkoutStepDto,
  type CreateWorkoutStepTarget,
  type PlanSession,
  type SEOPlanData,
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  seoPlanDataSchema,
} from '@openathlete/shared';

import {
  CYCLE,
  LOCALES,
  type Locale,
  PLAN,
  STEP,
  T,
  THEME,
  type Text,
  runsLabel,
} from './texts';

const OUT_DIR = join(process.cwd(), 'src/lib/training-plans/plans/trail');

// ---------------------------------------------------------------------------
// Targets and steps
// ---------------------------------------------------------------------------

const vma = (min: number, max: number): CreateWorkoutStepTarget => ({
  targetType: WORKOUT_TARGET_TYPE.PACE,
  targetMin: min,
  targetMax: max,
  targetValue: null,
  metricType: 'VMA',
});
const hr = (min: number, max: number): CreateWorkoutStepTarget => ({
  targetType: WORKOUT_TARGET_TYPE.HEARTRATE,
  targetMin: min,
  targetMax: max,
  targetValue: null,
  metricType: 'HR_MAX',
});
const rpe = (value: number): CreateWorkoutStepTarget => ({
  targetType: WORKOUT_TARGET_TYPE.RPE,
  targetValue: value,
});

const EASY_VMA = vma(0.62, 0.7);
const EASY_HR = hr(0.6, 0.7);
const LONG_HR = hr(0.65, 0.75);

function step(
  stepType: WORKOUT_STEP_TYPE,
  seconds: number,
  target: CreateWorkoutStepTarget,
  name?: string,
): CreateWorkoutStepDto {
  return {
    stepType,
    durationType: WORKOUT_DURATION_TYPE.TIME,
    durationValue: seconds,
    targets: [target],
    ...(name ? { name } : {}),
  };
}

function repeat(
  repetitions: number,
  childSteps: CreateWorkoutStepDto[],
): CreateWorkoutStepDto {
  return {
    stepType: WORKOUT_STEP_TYPE.REPEAT,
    durationType: WORKOUT_DURATION_TYPE.OPEN,
    repeatBlock: { repetitions, childSteps },
  };
}

function totalSeconds(steps: CreateWorkoutStepDto[]): number {
  return steps.reduce((sum, s) => {
    if (s.repeatBlock)
      return (
        sum + s.repeatBlock.repetitions * totalSeconds(s.repeatBlock.childSteps)
      );
    return sum + (s.durationValue ?? 0);
  }, 0);
}

const round10 = (value: number) => Math.round(value / 10) * 10;
const halfKm = (km: number) => Math.max(1, Math.round(km * 2) / 2) * 1000;

/**
 * Rough distance for the weekly totals, for an athlete around 14 km/h of
 * VMA: about 9 km/h on easy flat ground; on trails 10 "effort km" an hour,
 * where 100 m of climbing count as one extra kilometre.
 */
const flatKm = (seconds: number, kmh = 9) => halfKm((seconds / 3600) * kmh);
const trailKm = (seconds: number, dplus: number) =>
  halfKm((seconds / 3600) * 10 - dplus / 100);

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

type Session = (l: Locale) => PlanSession;
type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function session(
  day: Day,
  sport: SPORT_TYPE,
  name: Text,
  description: Text,
  goals: {
    seconds: number;
    distance?: number | null;
    dplus?: number | null;
    rpe: number;
  },
  steps: ((l: Locale) => CreateWorkoutStepDto[]) | null,
): Session {
  return (l) => ({
    dayOfWeek: day,
    name: name[l],
    sport,
    description: description[l],
    goalDuration: goals.seconds,
    goalDistance: goals.distance ?? null,
    goalElevationGain: goals.dplus ?? null,
    goalRpe: goals.rpe,
    workout: steps ? { steps: steps(l) } : null,
  });
}

const strides = (count: number) =>
  repeat(count, [
    step(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, 20, rpe(8)),
    step(WORKOUT_STEP_TYPE.INTERVAL_REST, 40, rpe(2)),
  ]);

function easy(day: Day, min: number, withStrides = false): Session {
  const steps = [
    step(WORKOUT_STEP_TYPE.STEADY, min * 60, EASY_VMA),
    ...(withStrides ? [strides(6)] : []),
  ];
  const seconds = totalSeconds(steps);
  return session(
    day,
    SPORT_TYPE.RUNNING,
    T.easy.name,
    T.easy.desc(min, withStrides),
    { seconds, distance: flatKm(seconds), rpe: 3 },
    () => steps,
  );
}

function easyTrail(day: Day, min: number, dplus: number): Session {
  const steps = [step(WORKOUT_STEP_TYPE.STEADY, min * 60, LONG_HR)];
  return session(
    day,
    SPORT_TYPE.TRAIL_RUNNING,
    T.easyTrail.name,
    T.easyTrail.desc(min, dplus),
    { seconds: min * 60, distance: trailKm(min * 60, dplus), dplus, rpe: 3 },
    () => steps,
  );
}

function vma3030(day: Day, sets: number, reps: number): Session {
  const build = (l: Locale) => {
    const block = repeat(reps, [
      step(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, 30, vma(0.95, 1), STEP.fast[l]),
      step(WORKOUT_STEP_TYPE.INTERVAL_REST, 30, vma(0.55, 0.65), STEP.jog[l]),
    ]);
    const middle: CreateWorkoutStepDto[] = [];
    for (let i = 0; i < sets; i++) {
      if (i > 0)
        middle.push(step(WORKOUT_STEP_TYPE.INTERVAL_REST, 180, EASY_VMA));
      middle.push(block);
    }
    return [
      step(WORKOUT_STEP_TYPE.WARMUP, 1200, EASY_VMA),
      ...middle,
      step(WORKOUT_STEP_TYPE.COOLDOWN, 600, EASY_VMA),
    ];
  };
  const seconds = totalSeconds(build('en'));
  return session(
    day,
    SPORT_TYPE.RUNNING,
    T.vma3030.name,
    T.vma3030.desc(sets, reps),
    { seconds, distance: flatKm(seconds, 10), rpe: 8 },
    build,
  );
}

function intervals(day: Day, reps: number, sec: number, rec: number): Session {
  const steps = [
    step(WORKOUT_STEP_TYPE.WARMUP, 1200, EASY_VMA),
    repeat(reps, [
      step(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, sec, vma(0.9, 0.95)),
      step(WORKOUT_STEP_TYPE.INTERVAL_REST, rec, vma(0.55, 0.65)),
    ]),
    step(WORKOUT_STEP_TYPE.COOLDOWN, 600, EASY_VMA),
  ];
  const seconds = totalSeconds(steps);
  return session(
    day,
    SPORT_TYPE.RUNNING,
    T.intervals.name,
    T.intervals.desc(reps, sec, rec),
    { seconds, distance: flatKm(seconds, 10.5), rpe: 8 },
    () => steps,
  );
}

function tempo(day: Day, reps: number, min: number): Session {
  const steps = [
    step(WORKOUT_STEP_TYPE.WARMUP, 900, EASY_VMA),
    repeat(reps, [
      step(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, min * 60, vma(0.82, 0.87)),
      step(WORKOUT_STEP_TYPE.INTERVAL_REST, 120, EASY_VMA),
    ]),
    step(WORKOUT_STEP_TYPE.COOLDOWN, 600, EASY_VMA),
  ];
  const seconds = totalSeconds(steps);
  return session(
    day,
    SPORT_TYPE.RUNNING,
    T.tempo.name,
    T.tempo.desc(reps, min),
    { seconds, distance: flatKm(seconds, 10.5), rpe: 7 },
    () => steps,
  );
}

function hills(day: Day, reps: number, sec: number): Session {
  // Heart rate barely reaches the top of the range on reps under 2 minutes
  const [lo, hi] = sec >= 120 ? [0.9, 0.95] : [0.88, 0.93];
  const build = (l: Locale) => [
    step(WORKOUT_STEP_TYPE.WARMUP, 1200, EASY_HR),
    repeat(reps, [
      step(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, sec, hr(lo, hi), STEP.uphill[l]),
      step(WORKOUT_STEP_TYPE.INTERVAL_REST, sec + 30, rpe(2), STEP.down[l]),
    ]),
    step(WORKOUT_STEP_TYPE.COOLDOWN, 600, EASY_HR),
  ];
  const seconds = totalSeconds(build('en'));
  const dplus = round10(reps * sec * 0.22 + 40);
  return session(
    day,
    SPORT_TYPE.TRAIL_RUNNING,
    T.hills.name,
    T.hills.desc(reps, sec, lo * 100, hi * 100),
    { seconds, distance: trailKm(seconds, dplus), dplus, rpe: 8 },
    build,
  );
}

function uphillTempo(day: Day, reps: number, min: number): Session {
  const recovery = Math.round(min * 0.6) * 60;
  const build = (l: Locale) => [
    step(WORKOUT_STEP_TYPE.WARMUP, 1200, EASY_HR),
    repeat(reps, [
      step(
        WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
        min * 60,
        hr(0.82, 0.87),
        STEP.uphill[l],
      ),
      step(WORKOUT_STEP_TYPE.INTERVAL_REST, recovery, rpe(2), STEP.down[l]),
    ]),
    step(WORKOUT_STEP_TYPE.COOLDOWN, 600, EASY_HR),
  ];
  const seconds = totalSeconds(build('en'));
  const dplus = round10(reps * min * 10 + 40);
  return session(
    day,
    SPORT_TYPE.TRAIL_RUNNING,
    T.uphillTempo.name,
    T.uphillTempo.desc(reps, min),
    { seconds, distance: trailKm(seconds, dplus), dplus, rpe: 7 },
    build,
  );
}

function hike(day: Day, reps: number, min: number): Session {
  const build = (l: Locale) => [
    step(WORKOUT_STEP_TYPE.WARMUP, 900, EASY_HR),
    repeat(reps, [
      step(
        WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
        min * 60,
        hr(0.75, 0.85),
        STEP.hike[l],
      ),
      step(
        WORKOUT_STEP_TYPE.INTERVAL_REST,
        Math.round(min * 0.6) * 60,
        rpe(2),
        STEP.down[l],
      ),
    ]),
    step(WORKOUT_STEP_TYPE.COOLDOWN, 600, EASY_HR),
  ];
  const seconds = totalSeconds(build('en'));
  const dplus = round10(reps * min * 12 + 40);
  return session(
    day,
    SPORT_TYPE.TRAIL_RUNNING,
    T.hike.name,
    T.hike.desc(reps, min),
    { seconds, distance: trailKm(seconds, dplus), dplus, rpe: 6 },
    build,
  );
}

function downhill(day: Day, reps: number, sec: number): Session {
  const build = (l: Locale) => [
    step(WORKOUT_STEP_TYPE.WARMUP, 1200, EASY_HR),
    repeat(reps, [
      step(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, sec, rpe(5), STEP.downhill[l]),
      step(WORKOUT_STEP_TYPE.INTERVAL_REST, sec * 2, rpe(3), STEP.hikeUp[l]),
    ]),
    step(WORKOUT_STEP_TYPE.COOLDOWN, 600, EASY_HR),
  ];
  const seconds = totalSeconds(build('en'));
  const dplus = round10(reps * sec * 2 * 0.12 + 50);
  return session(
    day,
    SPORT_TYPE.TRAIL_RUNNING,
    T.downhill.name,
    T.downhill.desc(reps, sec),
    { seconds, distance: trailKm(seconds, dplus), dplus, rpe: 5 },
    build,
  );
}

function long(
  day: Day,
  min: number,
  dplus: number,
  opts: {
    poles?: boolean;
    block?: number;
    b2b?: boolean;
    rehearsal?: boolean;
  } = {},
): Session {
  const build = (l: Locale) => [
    step(WORKOUT_STEP_TYPE.STEADY, (min - (opts.block ?? 0)) * 60, LONG_HR),
    ...(opts.block
      ? [
          step(
            WORKOUT_STEP_TYPE.STEADY,
            opts.block * 60,
            hr(0.75, 0.82),
            STEP.raceEffort[l],
          ),
        ]
      : []),
  ];
  const name = opts.rehearsal
    ? T.long.nameRehearsal
    : opts.b2b
      ? T.long.nameB2b
      : T.long.name;
  return session(
    day,
    SPORT_TYPE.TRAIL_RUNNING,
    name,
    T.long.desc(min, dplus, opts),
    {
      seconds: min * 60,
      distance: trailKm(min * 60, dplus),
      dplus,
      rpe: opts.block || opts.rehearsal ? 5 : 4,
    },
    build,
  );
}

function shakeout(day: Day): Session {
  const steps = [
    step(WORKOUT_STEP_TYPE.STEADY, 900, vma(0.6, 0.68)),
    repeat(4, [
      step(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, 20, rpe(7)),
      step(WORKOUT_STEP_TYPE.INTERVAL_REST, 70, rpe(2)),
    ]),
  ];
  const seconds = totalSeconds(steps);
  return session(
    day,
    SPORT_TYPE.RUNNING,
    T.shakeout.name,
    T.shakeout.desc,
    { seconds, distance: flatKm(seconds), rpe: 2 },
    () => steps,
  );
}

function race(day: Day, km: number, dplus: number, minutes: number): Session {
  return session(
    day,
    SPORT_TYPE.TRAIL_RUNNING,
    T.race.name(km),
    T.race.desc(km, dplus),
    { seconds: minutes * 60, distance: km * 1000, dplus, rpe: 9 },
    null,
  );
}

function strength(
  day: Day,
  variant: 'a' | 'b' | 'mobility',
  min = 30,
): Session {
  return session(
    day,
    SPORT_TYPE.STRENGTH,
    variant === 'mobility' ? T.strength.nameMobility : T.strength.name,
    T.strength.desc(variant, min),
    { seconds: min * 60, rpe: variant === 'mobility' ? 2 : 5 },
    null,
  );
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

interface WeekSpec {
  theme?: keyof typeof THEME;
  sessions: Session[];
}

interface CycleSpec {
  kind: 'base' | 'build' | 'specific' | 'taper';
  phase: CYCLE_PHASE;
  color: string;
  light?: number | null;
  weeks: WeekSpec[];
}

interface PlanSpec {
  slug: string; // {distance}-{variant}
  km: number;
  dplus: number;
  runs: [number, number];
  b2b: boolean;
  cycles: CycleSpec[];
}

const COLORS = {
  base: '#3b82f6',
  build: '#10b981',
  specific: '#f59e0b',
  taper: '#6366f1',
};

const TUE: Day = 2;
const WED: Day = 3;
const THU: Day = 4;
const SAT: Day = 6;
const SUN: Day = 0;
const MON: Day = 1;

const trail20: PlanSpec = {
  slug: '20km-800m',
  km: 20,
  dplus: 800,
  runs: [3, 3],
  b2b: false,
  cycles: [
    {
      kind: 'base',
      phase: CYCLE_PHASE.BASE,
      color: COLORS.base,
      light: 4,
      weeks: [
        {
          sessions: [
            hills(TUE, 6, 60),
            strength(WED, 'a'),
            easy(THU, 40),
            long(SUN, 65, 250),
          ],
        },
        {
          sessions: [
            vma3030(TUE, 2, 8),
            strength(WED, 'a'),
            easy(THU, 45, true),
            long(SUN, 75, 350),
          ],
        },
        {
          sessions: [
            hills(TUE, 8, 90),
            strength(WED, 'a'),
            downhill(THU, 6, 60),
            long(SUN, 85, 450, { poles: true }),
          ],
        },
        {
          theme: 'light',
          sessions: [
            easy(TUE, 40, true),
            strength(WED, 'a', 20),
            downhill(THU, 5, 60),
            long(SUN, 60, 250),
          ],
        },
      ],
    },
    {
      kind: 'build',
      phase: CYCLE_PHASE.SPECIFIC,
      color: COLORS.build,
      light: null,
      weeks: [
        {
          sessions: [
            hills(TUE, 8, 120),
            strength(WED, 'b'),
            tempo(THU, 3, 8),
            long(SUN, 95, 550),
          ],
        },
        {
          sessions: [
            uphillTempo(TUE, 3, 8),
            strength(WED, 'b'),
            intervals(THU, 6, 180, 120),
            long(SUN, 105, 650, { poles: true }),
          ],
        },
        {
          sessions: [
            hills(TUE, 10, 90),
            strength(WED, 'b'),
            downhill(THU, 8, 75),
            long(SUN, 115, 750),
          ],
        },
        {
          theme: 'peak',
          sessions: [
            uphillTempo(TUE, 3, 10),
            strength(WED, 'b'),
            hike(THU, 5, 5),
            long(SUN, 120, 850, { block: 25, poles: true }),
          ],
        },
      ],
    },
    {
      kind: 'taper',
      phase: CYCLE_PHASE.TAPER,
      color: COLORS.taper,
      weeks: [
        {
          theme: 'taper',
          sessions: [
            hills(TUE, 6, 120),
            strength(WED, 'mobility', 20),
            easy(THU, 40, true),
            long(SUN, 80, 450),
          ],
        },
        {
          theme: 'race',
          sessions: [
            uphillTempo(TUE, 2, 5),
            easy(THU, 30, true),
            race(SUN, 20, 800, 180),
          ],
        },
      ],
    },
  ],
};

const trail30: PlanSpec = {
  slug: '30km-1000m',
  km: 30,
  dplus: 1000,
  runs: [4, 4],
  b2b: false,
  cycles: [
    {
      kind: 'base',
      phase: CYCLE_PHASE.BASE,
      color: COLORS.base,
      light: 4,
      weeks: [
        {
          sessions: [
            hills(TUE, 6, 90),
            strength(WED, 'a'),
            easy(THU, 45),
            easy(SAT, 40, true),
            long(SUN, 75, 300),
          ],
        },
        {
          sessions: [
            vma3030(TUE, 2, 8),
            strength(WED, 'a'),
            easy(THU, 50),
            downhill(SAT, 6, 60),
            long(SUN, 85, 400),
          ],
        },
        {
          sessions: [
            hills(TUE, 8, 90),
            strength(WED, 'a'),
            tempo(THU, 3, 8),
            easy(SAT, 45, true),
            long(SUN, 100, 500, { poles: true }),
          ],
        },
        {
          theme: 'light',
          sessions: [
            easy(TUE, 40, true),
            strength(WED, 'a', 20),
            hills(THU, 6, 60),
            easy(SAT, 40),
            long(SUN, 75, 350),
          ],
        },
      ],
    },
    {
      kind: 'build',
      phase: CYCLE_PHASE.SPECIFIC,
      color: COLORS.build,
      light: 8,
      weeks: [
        {
          sessions: [
            hills(TUE, 8, 120),
            strength(WED, 'b'),
            easy(THU, 50),
            downhill(SAT, 8, 60),
            long(SUN, 110, 600),
          ],
        },
        {
          sessions: [
            uphillTempo(TUE, 3, 8),
            strength(WED, 'b'),
            intervals(THU, 6, 180, 120),
            easy(SAT, 45, true),
            long(SUN, 120, 700, { poles: true }),
          ],
        },
        {
          sessions: [
            hills(TUE, 10, 120),
            strength(WED, 'b'),
            tempo(THU, 2, 12),
            hike(SAT, 5, 6),
            long(SUN, 135, 800),
          ],
        },
        {
          theme: 'light',
          sessions: [
            easy(TUE, 45, true),
            strength(WED, 'b', 20),
            uphillTempo(THU, 2, 8),
            easy(SAT, 40),
            long(SUN, 90, 500),
          ],
        },
      ],
    },
    {
      kind: 'specific',
      phase: CYCLE_PHASE.SPECIFIC,
      color: COLORS.specific,
      light: null,
      weeks: [
        {
          theme: 'peak',
          sessions: [
            uphillTempo(TUE, 3, 10),
            strength(WED, 'b'),
            vma3030(THU, 2, 10),
            hike(SAT, 5, 6),
            long(SUN, 150, 1000, { block: 30, poles: true }),
          ],
        },
        {
          sessions: [
            hills(TUE, 8, 150),
            strength(WED, 'b'),
            tempo(THU, 2, 12),
            downhill(SAT, 8, 75),
            long(SUN, 135, 900, { rehearsal: true }),
          ],
        },
      ],
    },
    {
      kind: 'taper',
      phase: CYCLE_PHASE.TAPER,
      color: COLORS.taper,
      weeks: [
        {
          theme: 'taper',
          sessions: [
            hills(TUE, 6, 120),
            strength(WED, 'mobility', 20),
            easy(THU, 45),
            easy(SAT, 40, true),
            long(SUN, 90, 500),
          ],
        },
        {
          theme: 'race',
          sessions: [
            uphillTempo(TUE, 2, 6),
            easy(THU, 35, true),
            shakeout(SAT),
            race(SUN, 30, 1000, 270),
          ],
        },
      ],
    },
  ],
};

const trail50: PlanSpec = {
  slug: '50km-2500m',
  km: 50,
  dplus: 2500,
  runs: [4, 5],
  b2b: true,
  cycles: [
    {
      kind: 'base',
      phase: CYCLE_PHASE.BASE,
      color: COLORS.base,
      light: 4,
      weeks: [
        {
          sessions: [
            strength(MON, 'a'),
            hills(TUE, 6, 90),
            easy(THU, 50),
            long(SAT, 90, 500),
            easyTrail(SUN, 45, 150),
          ],
        },
        {
          sessions: [
            strength(MON, 'a'),
            vma3030(TUE, 2, 8),
            easy(THU, 50, true),
            long(SAT, 105, 650),
            easyTrail(SUN, 55, 200),
          ],
        },
        {
          sessions: [
            strength(MON, 'a'),
            hills(TUE, 8, 90),
            tempo(THU, 3, 8),
            long(SAT, 120, 800, { poles: true }),
            downhill(SUN, 6, 60),
          ],
        },
        {
          theme: 'light',
          sessions: [
            strength(MON, 'a', 20),
            easy(TUE, 45, true),
            hills(THU, 6, 60),
            long(SAT, 90, 500),
            easyTrail(SUN, 45, 150),
          ],
        },
      ],
    },
    {
      kind: 'build',
      phase: CYCLE_PHASE.SPECIFIC,
      color: COLORS.build,
      light: 8,
      weeks: [
        {
          sessions: [
            strength(MON, 'b'),
            hills(TUE, 8, 120),
            easy(WED, 40),
            downhill(THU, 8, 60),
            long(SAT, 135, 1000),
            long(SUN, 75, 400, { b2b: true }),
          ],
        },
        {
          sessions: [
            strength(MON, 'b'),
            uphillTempo(TUE, 3, 8),
            easy(WED, 45),
            intervals(THU, 6, 180, 120),
            long(SAT, 150, 1200, { poles: true }),
            long(SUN, 80, 500, { b2b: true }),
          ],
        },
        {
          sessions: [
            strength(MON, 'b'),
            hills(TUE, 10, 120),
            easy(WED, 45),
            hike(THU, 5, 6),
            long(SAT, 165, 1400, { poles: true }),
            long(SUN, 90, 600, { b2b: true }),
          ],
        },
        {
          theme: 'light',
          sessions: [
            strength(MON, 'b', 20),
            easy(TUE, 45, true),
            uphillTempo(THU, 2, 8),
            long(SAT, 105, 700),
            easyTrail(SUN, 60, 300),
          ],
        },
      ],
    },
    {
      kind: 'specific',
      phase: CYCLE_PHASE.SPECIFIC,
      color: COLORS.specific,
      light: 12,
      weeks: [
        {
          sessions: [
            strength(MON, 'b'),
            uphillTempo(TUE, 3, 10),
            easy(WED, 45),
            downhill(THU, 8, 75),
            long(SAT, 180, 1600, { poles: true }),
            long(SUN, 105, 700, { b2b: true }),
          ],
        },
        {
          sessions: [
            strength(MON, 'b'),
            hills(TUE, 8, 150),
            easy(WED, 50),
            tempo(THU, 2, 12),
            long(SAT, 210, 1800, { block: 30 }),
            long(SUN, 105, 800, { b2b: true }),
          ],
        },
        {
          sessions: [
            strength(MON, 'b'),
            uphillTempo(TUE, 4, 10),
            easy(WED, 50),
            hike(THU, 6, 6),
            long(SAT, 195, 1700, { poles: true }),
            long(SUN, 120, 900, { b2b: true }),
          ],
        },
        {
          theme: 'light',
          sessions: [
            strength(MON, 'b', 20),
            easy(TUE, 45, true),
            hills(THU, 6, 120),
            long(SAT, 120, 900),
            easyTrail(SUN, 60, 300),
          ],
        },
        {
          theme: 'peak',
          sessions: [
            strength(MON, 'b'),
            uphillTempo(TUE, 3, 12),
            easy(WED, 50),
            downhill(THU, 8, 75),
            long(SAT, 240, 2000, { block: 40, poles: true }),
            long(SUN, 120, 1000, { b2b: true }),
          ],
        },
        {
          sessions: [
            strength(MON, 'b'),
            hills(TUE, 8, 150),
            easy(WED, 45),
            tempo(THU, 2, 12),
            long(SAT, 210, 1800, { rehearsal: true }),
            long(SUN, 90, 600, { b2b: true }),
          ],
        },
      ],
    },
    {
      kind: 'taper',
      phase: CYCLE_PHASE.TAPER,
      color: COLORS.taper,
      weeks: [
        {
          theme: 'taper',
          sessions: [
            strength(MON, 'mobility', 20),
            uphillTempo(TUE, 3, 8),
            easy(WED, 40),
            easy(THU, 45, true),
            long(SAT, 135, 1000),
            easyTrail(SUN, 60, 300),
          ],
        },
        {
          theme: 'race',
          sessions: [
            hills(TUE, 6, 90),
            easy(WED, 35),
            easy(THU, 30, true),
            shakeout(SAT),
            race(SUN, 50, 2500, 540),
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function build(spec: PlanSpec, l: Locale): SEOPlanData {
  let weekNumber = 0;
  const weeks = spec.cycles.flatMap((c) => c.weeks);
  const all = weeks.flatMap((w) => w.sessions.map((s) => s('en')));
  const longest = all
    .filter(
      (s) =>
        s.sport === SPORT_TYPE.TRAIL_RUNNING &&
        s.goalDistance !== spec.km * 1000,
    )
    .sort((a, b) => (b.goalDuration ?? 0) - (a.goalDuration ?? 0))[0];
  const peakMin = (longest.goalDuration ?? 0) / 60;
  const peakDplus = longest.goalElevationGain ?? 0;

  const cycles = spec.cycles.map((c) => {
    const desc =
      c.kind === 'base'
        ? CYCLE.base.desc(c.light ?? 4)
        : c.kind === 'build'
          ? CYCLE.build.desc(c.light ?? null)
          : c.kind === 'specific'
            ? CYCLE.specific.desc(peakMin, peakDplus, spec.b2b, c.light ?? null)
            : CYCLE.taper.desc;
    return {
      name: CYCLE[c.kind].name[l],
      description: desc[l],
      phase: c.phase,
      color: c.color,
      weeks: c.weeks.map((w) => ({
        weekNumber: ++weekNumber,
        theme: w.theme ? THEME[w.theme][l] : null,
        sessions: w.sessions.map((s) => s(l)),
      })),
    };
  });

  return {
    plan: {
      name: PLAN.name(spec.km, spec.dplus, weeks.length)[l],
      description: PLAN.description({
        km: spec.km,
        dplus: spec.dplus,
        weeks: weeks.length,
        runs: runsLabel(l, ...spec.runs),
        peakMin,
        peakDplus,
        b2b: spec.b2b,
      })[l],
      goal: PLAN.goal(spec.km, spec.dplus)[l],
      sportType: SPORT_TYPE.TRAIL_RUNNING,
      distance: spec.km * 1000,
      duration: weeks.length,
      timeTarget: null,
      elevationGainRange: {
        min: Math.round(spec.dplus * 0.8),
        max: Math.round(spec.dplus * 1.2),
      },
    },
    cycles,
  };
}

mkdirSync(OUT_DIR, { recursive: true });
for (const spec of [trail20, trail30, trail50]) {
  for (const l of LOCALES) {
    const data = build(spec, l);
    const parsed = seoPlanDataSchema.safeParse(data);
    if (!parsed.success) {
      console.error(spec.slug, l, parsed.error.issues);
      process.exit(1);
    }
    const file = join(OUT_DIR, `${spec.slug}.${l}.json`);
    writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  }
  const en = build(spec, 'en');
  const weeks = en.cycles.flatMap((c) => c.weeks);
  const km = weeks.map((w) =>
    Math.round(
      w.sessions.reduce((s, x) => s + (x.goalDistance ?? 0), 0) / 1000,
    ),
  );
  const dplus = weeks.map((w) =>
    w.sessions.reduce((s, x) => s + (x.goalElevationGain ?? 0), 0),
  );
  process.stdout.write(
    `${spec.slug} km ${km.join(' ')} | D+ ${dplus.join(' ')}\n`,
  );
}
