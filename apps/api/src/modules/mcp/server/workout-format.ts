import { z } from 'zod';

import {
  CreateWorkoutStepDto,
  EXERCISE_SIDE,
  SPORT_TYPE,
  SetWork,
  StrengthBlock,
  StrengthExercise,
  StrengthGroupKind,
  StrengthSet,
  WORKOUT_DURATION_TYPE,
  WORKOUT_REPEAT_KIND,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  calculateWorkoutDuration,
  exerciseRefSchema,
  isExerciseStep,
  mapWorkoutDtoToPrisma,
  normalizeWorkoutForCreate,
  strengthBlocks,
  strengthSteps,
  tempoSchema,
} from '@openathlete/shared';

/**
 * The workout format agents read and write. The stored model is built for
 * watch exports (speeds in m/s, percentages as 0-1, a REPEAT step with its
 * child steps); agents get readable units instead, and the same shape both
 * ways, so they can read a session, change it and write it back.
 */

const STEP_KINDS = {
  warmup: WORKOUT_STEP_TYPE.WARMUP,
  steady: WORKOUT_STEP_TYPE.STEADY,
  work: WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
  recovery: WORKOUT_STEP_TYPE.INTERVAL_REST,
  cooldown: WORKOUT_STEP_TYPE.COOLDOWN,
  free: WORKOUT_STEP_TYPE.FREE,
} as const;
type StepKind = keyof typeof STEP_KINDS;
const KIND_OF_TYPE = Object.fromEntries(
  Object.entries(STEP_KINDS).map(([kind, type]) => [type, kind]),
) as Record<string, StepKind>;

/** Which stored target a percentage of a metric becomes */
const PERCENT_METRICS = {
  VMA: WORKOUT_TARGET_TYPE.PACE,
  CRITICAL_POWER_RUNNING: WORKOUT_TARGET_TYPE.PACE,
  HR_MAX: WORKOUT_TARGET_TYPE.HEARTRATE,
  HR_RESERVE: WORKOUT_TARGET_TYPE.HEARTRATE,
  FTP_CYCLING: WORKOUT_TARGET_TYPE.POWER,
  FTP_RUNNING: WORKOUT_TARGET_TYPE.POWER,
  CRITICAL_POWER_CYCLING: WORKOUT_TARGET_TYPE.POWER,
} as const;
type PercentMetric = keyof typeof PERCENT_METRICS;
const PERCENT_METRIC_NAMES = Object.keys(PERCENT_METRICS) as [
  PercentMetric,
  ...PercentMetric[],
];

const PACE_PATTERN = /^(\d{1,2}):([0-5]\d)$/;

const pace = () =>
  z
    .string()
    .regex(PACE_PATTERN, 'Pace as m:ss per km, e.g. 4:35')
    .describe('Pace per kilometer as m:ss, e.g. "4:35"');

const range = (unit: string, schema: () => z.ZodNumber) => ({
  min: schema().describe(`Lower bound, or the single value (${unit})`),
  max: schema()
    .optional()
    .describe(`Upper bound (${unit}); omit for one value`),
});

/**
 * The same shape goes in and out. The output schema has none of the input's
 * limits: a stored session may exceed them (web pyramids store two steps per
 * set, REST accepts any number), and a ZodError on output reaches the agent
 * as "Internal error". Fields that existed before strength keep their output
 * rules; every field added for strength accepts any number or string.
 */
type Mode = 'input' | 'output';

/** An upper limit that only applies to what an agent writes */
const capped = <T extends { max(limit: number): T }>(
  mode: Mode,
  schema: T,
  limit: number,
): T => (mode === 'input' ? schema.max(limit) : schema);

/** A number with limits on input and only the lower one on output */
const bounded = (mode: Mode, min: number, max: number) =>
  mode === 'input' ? z.number().min(min).max(max) : z.number().min(min);

/**
 * `strict` on input, `loose` on output. The type stays the strict one: what
 * the server reads is what it validated on the way in, or the web app stored.
 */
const lenient = <T extends z.ZodTypeAny>(
  mode: Mode,
  strict: T,
  loose: z.ZodTypeAny,
): T => (mode === 'input' ? strict : (loose as T));

const EXERCISE_REF_HELP =
  'As read from get_session or a template; never invent one';

const makeTargetSchema = (mode: Mode) =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('zone'),
      zoneId: z
        .number()
        .int()
        .describe(
          'trainingZoneId of one of the athlete zones (get_athlete_context)',
        ),
      zoneName: z.string().optional().describe('Ignored on input'),
    }),
    z.object({
      type: z.literal('pace'),
      min: pace().describe('Pace per km as m:ss; the two bounds in any order'),
      max: pace()
        .optional()
        .describe('Other bound of a pace range, m:ss per km'),
    }),
    z.object({
      type: z.literal('heart_rate'),
      ...range('bpm', () => z.number().min(30).max(250)),
    }),
    z.object({
      type: z.literal('power'),
      ...range('W', () => z.number().min(1).max(3000)),
    }),
    z.object({
      type: z.literal('cadence'),
      ...range('rpm or steps/min', () => z.number().min(1).max(300)),
    }),
    z.object({
      type: z.literal('weight'),
      ...range('kg', () =>
        lenient(mode, z.number().min(0).max(1000), z.number()),
      ),
    }),
    z.object({
      type: z.literal('rpe'),
      value: z.number().min(1).max(10).describe('Perceived effort, 1-10'),
    }),
    z.object({
      type: z.literal('percent_of'),
      metric: z
        .enum(PERCENT_METRIC_NAMES)
        .describe(
          'VMA and CRITICAL_POWER_RUNNING give a pace, HR_MAX and HR_RESERVE a heart rate, FTP_* and CRITICAL_POWER_CYCLING a power',
        ),
      ...range('% of the metric, e.g. 85', () => z.number().min(1).max(200)),
    }),
  ]);
export const targetSchema = makeTargetSchema('input');
export type WorkoutTarget = z.infer<typeof targetSchema>;

const REPEAT_KINDS = Object.values(WORKOUT_REPEAT_KIND) as [
  WORKOUT_REPEAT_KIND,
  ...WORKOUT_REPEAT_KIND[],
];
const GROUP_KINDS = REPEAT_KINDS.filter(
  (kind) => kind !== WORKOUT_REPEAT_KIND.REPEAT,
) as [StrengthGroupKind, ...StrengthGroupKind[]];

const stepFields = (mode: Mode) => ({
  // 120 like an exercise name: a custom exercise read flat must write back
  name: capped(mode, z.string(), 120).optional(),
  notes: capped(mode, z.string(), 500)
    .optional()
    .describe('Cue shown to the athlete'),
  durationSeconds: bounded(mode, 1, 86400)
    .int()
    .optional()
    .describe('Step length in seconds'),
  distanceMeters: bounded(mode, 1, 1_000_000)
    .optional()
    .describe('Step length in meters, instead of a duration'),
  reps: lenient(mode, z.number().int().min(1).max(100_000), z.number())
    .optional()
    .describe('Number of reps, instead of a duration or distance'),
  exerciseRef: lenient(mode, exerciseRefSchema, z.string())
    .describe(EXERCISE_REF_HELP)
    .optional(),
  tempo: lenient(mode, tempoSchema, z.string())
    .describe('Seconds, X explosive: "3-1-X-0"')
    .optional(),
  side: lenient(mode, z.nativeEnum(EXERCISE_SIDE), z.string()).optional(),
  targets: capped(mode, z.array(makeTargetSchema(mode)), 3)
    .optional()
    .describe('Intensity: usually one target, e.g. a zone or a pace range'),
});

// Built per use: a schema instance shared between the workout and its repeat
// blocks becomes a relative $ref in the JSON schema, which some MCP clients
// do not resolve (they see an empty union)
const makeStepSchema = (mode: Mode) =>
  z
    .object({
      kind: z
        .enum(Object.keys(STEP_KINDS) as [StepKind, ...StepKind[]])
        .describe(
          'warmup, steady, work (interval), recovery, cooldown or free',
        ),
      ...stepFields(mode),
    })
    .describe(
      'A step. Give durationSeconds, distanceMeters or reps, or none for a step ended with the lap button. An exercise without an exerciseRef to read: name and reps',
    );
export const stepSchema = makeStepSchema('input');
export type WorkoutStep = z.infer<typeof stepSchema>;

const makeRepeatSchema = (mode: Mode) =>
  z
    .object({
      kind: z.literal('repeat'),
      name: capped(mode, z.string(), 100).optional(),
      notes: lenient(mode, z.string().max(500), z.string()).optional(),
      times: z.number().int().min(1).max(99),
      repeatKind: z.enum(REPEAT_KINDS).optional().describe('Default REPEAT'),
      intervalSeconds: lenient(
        mode,
        z.number().int().min(10).max(3600),
        z.number(),
      )
        .optional()
        .describe('EMOM: a round starts every this many seconds'),
      timeCapSeconds: lenient(
        mode,
        z.number().int().min(30).max(14400),
        z.number(),
      )
        .optional()
        .describe('AMRAP: seconds the rounds fit in'),
      steps: capped(mode, z.array(makeStepSchema(mode)).min(1), 20).describe(
        'Steps done each time; a repeat cannot contain a repeat',
      ),
    })
    .describe('Steps repeated, e.g. 6 × (3 min work, 2 min recovery)');
export const repeatSchema = makeRepeatSchema('input');
export type WorkoutRepeat = z.infer<typeof repeatSchema>;

const makeSetSchema = (mode: Mode) =>
  z.object({
    work: z.object({
      type: z.enum([
        WORKOUT_DURATION_TYPE.REPS,
        WORKOUT_DURATION_TYPE.TIME,
        WORKOUT_DURATION_TYPE.DISTANCE,
      ]),
      value: lenient(mode, z.number().min(1).max(100_000), z.number()).describe(
        'Reps, seconds or meters',
      ),
    }),
    load: lenient(mode, z.number().min(0).max(1000), z.number())
      .optional()
      .describe('Load in kg'),
    rpe: lenient(mode, z.number().min(1).max(10), z.number())
      .optional()
      .describe('Effort, 1-10'),
    rest: lenient(mode, z.number().int().min(0).max(3600), z.number())
      .optional()
      .describe('Rest after the set, in seconds'),
  });

const makeExerciseSchema = (mode: Mode) =>
  z.object({
    exerciseRef: lenient(mode, exerciseRefSchema, z.string()).describe(
      EXERCISE_REF_HELP,
    ),
    name: lenient(mode, z.string().max(120), z.string()),
    sets: capped(mode, z.array(makeSetSchema(mode)).min(1), 99).describe(
      'One entry per set; in a group exactly one, done each round',
    ),
    tempo: lenient(mode, tempoSchema, z.string())
      .describe('Seconds, X explosive: "3-1-X-0"')
      .optional(),
    side: lenient(mode, z.nativeEnum(EXERCISE_SIDE), z.string()).optional(),
    notes: lenient(mode, z.string().max(500), z.string()).optional(),
  });

const makeExerciseItemSchema = (mode: Mode) =>
  z
    .object({
      kind: z.literal('exercise'),
      exercise: makeExerciseSchema(mode),
    })
    .describe('A strength exercise with its sets, e.g. 3 × 10 at 80 kg');
export type WorkoutExercise = z.infer<
  ReturnType<typeof makeExerciseItemSchema>
>;

const makeGroupSchema = (mode: Mode) =>
  z
    .object({
      kind: z.literal('group'),
      group: z.enum(GROUP_KINDS),
      name: lenient(mode, z.string().max(100), z.string()).optional(),
      rounds: lenient(mode, z.number().int().min(1).max(99), z.number()),
      intervalSeconds: lenient(
        mode,
        z.number().int().min(10).max(3600),
        z.number(),
      )
        .optional()
        .describe('EMOM: a round starts every this many seconds'),
      timeCapSeconds: lenient(
        mode,
        z.number().int().min(30).max(14400),
        z.number(),
      )
        .optional()
        .describe('AMRAP: seconds the rounds fit in'),
      roundRest: lenient(mode, z.number().int().min(0).max(3600), z.number())
        .optional()
        .describe('Rest after each round, in seconds'),
      exercises: capped(
        mode,
        z.array(makeExerciseSchema(mode)).min(1),
        20,
      ).describe(
        'One set each per round; the set rest comes before the next exercise',
      ),
    })
    .describe(
      'Exercises done in a row, rounds times: superset, circuit, EMOM, AMRAP or Tabata',
    );
type WorkoutGroup = z.infer<ReturnType<typeof makeGroupSchema>>;

const makeWorkoutSchema = (mode: Mode) =>
  capped(
    mode,
    z.array(
      z.discriminatedUnion('kind', [
        makeStepSchema(mode),
        makeRepeatSchema(mode),
        makeExerciseItemSchema(mode),
        makeGroupSchema(mode),
      ]),
    ),
    60,
  ).describe(
    'Structured workout, in order. Endurance: warmup 900 s, repeat 6 × [work 180 s @ zone, recovery 120 s], cooldown 600 s. Strength: exercise and group items',
  );
export const workoutSchema = makeWorkoutSchema('input');
export const workoutOutputSchema = makeWorkoutSchema('output');
export type Workout = z.infer<typeof workoutSchema>;

// ---------------------------------------------------------------------------
// To the stored model

export function paceToSpeed(value: string): number {
  const [, minutes, seconds] = PACE_PATTERN.exec(value)!;
  return 1000 / (Number(minutes) * 60 + Number(seconds));
}

export function speedToPace(speed: number): string {
  const total = Math.round(1000 / speed);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

type StoredTarget = CreateWorkoutStepDto['targets'] extends
  (infer T)[] | undefined
  ? T
  : never;

/** A value or a range, in stored form: targetValue alone, or min below max */
function bounds(min: number, max: number | undefined) {
  if (max === undefined || max === min) {
    return { targetValue: min, targetMin: null, targetMax: null };
  }
  return {
    targetValue: null,
    targetMin: Math.min(min, max),
    targetMax: Math.max(min, max),
  };
}

function toStoredTarget(target: WorkoutTarget): StoredTarget {
  switch (target.type) {
    case 'zone':
      return {
        targetType: WORKOUT_TARGET_TYPE.ZONE,
        targetValue: target.zoneId,
        targetMin: null,
        targetMax: null,
        metricType: null,
      };
    case 'pace':
      return {
        targetType: WORKOUT_TARGET_TYPE.PACE,
        ...bounds(
          paceToSpeed(target.min),
          target.max === undefined ? undefined : paceToSpeed(target.max),
        ),
        metricType: null,
      };
    case 'heart_rate':
      return {
        targetType: WORKOUT_TARGET_TYPE.HEARTRATE,
        ...bounds(target.min, target.max),
        metricType: null,
      };
    case 'power':
      return {
        targetType: WORKOUT_TARGET_TYPE.POWER,
        ...bounds(target.min, target.max),
        metricType: null,
      };
    case 'cadence':
      return {
        targetType: WORKOUT_TARGET_TYPE.CADENCE,
        ...bounds(target.min, target.max),
        metricType: null,
      };
    case 'weight':
      return {
        targetType: WORKOUT_TARGET_TYPE.WEIGHT,
        ...bounds(target.min, target.max),
        metricType: null,
      };
    case 'rpe':
      return {
        targetType: WORKOUT_TARGET_TYPE.RPE,
        ...bounds(target.value, undefined),
        metricType: null,
      };
    case 'percent_of':
      return {
        targetType: PERCENT_METRICS[target.metric],
        ...bounds(
          target.min / 100,
          target.max === undefined ? undefined : target.max / 100,
        ),
        metricType: target.metric,
      };
  }
}

function toStoredStep(step: WorkoutStep): CreateWorkoutStepDto {
  const duration =
    step.durationSeconds !== undefined
      ? {
          durationType: WORKOUT_DURATION_TYPE.TIME,
          durationValue: step.durationSeconds,
        }
      : step.distanceMeters !== undefined
        ? {
            durationType: WORKOUT_DURATION_TYPE.DISTANCE,
            durationValue: step.distanceMeters,
          }
        : step.reps !== undefined
          ? {
              durationType: WORKOUT_DURATION_TYPE.REPS,
              durationValue: step.reps,
            }
          : {
              durationType: WORKOUT_DURATION_TYPE.LAP_BUTTON,
              durationValue: null,
            };
  return {
    stepType: STEP_KINDS[step.kind],
    name: step.name ?? null,
    notes: step.notes ?? null,
    ...duration,
    // Only when given, so an endurance step is stored exactly as before
    ...(step.exerciseRef && { exerciseRef: step.exerciseRef }),
    ...(step.tempo && { tempo: step.tempo }),
    ...(step.side && { side: step.side }),
    targets: (step.targets ?? []).map(toStoredTarget),
  };
}

function toStoredRepeat(item: WorkoutRepeat): CreateWorkoutStepDto {
  return {
    stepType: WORKOUT_STEP_TYPE.REPEAT,
    name: item.name ?? null,
    ...(item.notes && { notes: item.notes }),
    durationType: WORKOUT_DURATION_TYPE.OPEN,
    durationValue: null,
    targets: [],
    repeatBlock: {
      repetitions: item.times,
      ...(item.repeatKind && { kind: item.repeatKind }),
      ...(item.intervalSeconds !== undefined && {
        intervalSeconds: item.intervalSeconds,
      }),
      ...(item.timeCapSeconds !== undefined && {
        timeCapSeconds: item.timeCapSeconds,
      }),
      childSteps: item.steps.map(toStoredStep),
    },
  };
}

function toStrengthExercise(
  exercise: WorkoutExercise['exercise'],
): StrengthExercise {
  return {
    exerciseRef: exercise.exerciseRef,
    name: exercise.name,
    sets: exercise.sets.map((set): StrengthSet => ({
      work: { type: set.work.type, value: set.work.value },
      load: set.load ?? null,
      rpe: set.rpe ?? null,
      rest: set.rest ?? null,
    })),
    tempo: exercise.tempo ?? null,
    side: exercise.side ?? null,
    notes: exercise.notes ?? null,
  };
}

/** Steps and repeats go through as they are: strengthSteps returns them untouched */
function toBlock(item: Workout[number]): StrengthBlock {
  if (item.kind === 'exercise') {
    return { kind: 'exercise', exercise: toStrengthExercise(item.exercise) };
  }
  if (item.kind === 'group') {
    return {
      kind: 'group',
      group: item.group,
      name: item.name ?? null,
      rounds: item.rounds,
      intervalSeconds: item.intervalSeconds ?? null,
      timeCapSeconds: item.timeCapSeconds ?? null,
      roundRest: item.roundRest ?? null,
      exercises: item.exercises.map(toStrengthExercise),
    };
  }
  return {
    kind: 'step',
    step: item.kind === 'repeat' ? toStoredRepeat(item) : toStoredStep(item),
  };
}

export function toStoredWorkout(workout: Workout): CreateWorkoutStepDto[] {
  return strengthSteps(workout.map(toBlock));
}

/** Zone ids a workout uses, to check they belong to the athlete */
export function zoneIdsOf(workout: Workout): number[] {
  const steps = workout.flatMap((item) =>
    item.kind === 'repeat'
      ? item.steps
      : item.kind === 'exercise' || item.kind === 'group'
        ? []
        : [item],
  );
  return [
    ...new Set(
      steps.flatMap((step) =>
        (step.targets ?? []).flatMap((target) =>
          target.type === 'zone' ? [target.zoneId] : [],
        ),
      ),
    ),
  ];
}

/**
 * Planned seconds of a workout, repeats included: the same estimate as the
 * web app's, distances at the pace of their target or of the sport
 */
export function workoutSeconds(workout: Workout, sport?: SPORT_TYPE): number {
  return Math.round(
    calculateWorkoutDuration({ steps: toStoredWorkout(workout) }, {}, sport) ??
      0,
  );
}

// ---------------------------------------------------------------------------
// From the stored model

// What Prisma returns. The new fields are optional so that rows of an older
// shape still fit.
type StoredStepTarget = {
  targetType: string;
  targetMin: number | null;
  targetMax: number | null;
  targetValue: number | null;
  metricType: string | null;
};

type StoredStep = {
  stepType: string;
  name: string | null;
  notes: string | null;
  durationType: string;
  durationValue: number | null;
  exerciseRef?: string | null;
  tempo?: string | null;
  side?: string | null;
  targets: StoredStepTarget[];
  repeatBlock?: {
    repetitions: number;
    kind?: string | null;
    intervalSeconds?: number | null;
    timeCapSeconds?: number | null;
    childSteps: StoredStep[];
  } | null;
};

const round = (value: number, digits = 0) =>
  Math.round(value * 10 ** digits) / 10 ** digits;

const isSet = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

// Reads run on normalized steps (nulls for what is absent), whose type still
// says "optional", hence the `?? null`
function fromStoredTarget(
  target: StoredTarget,
  zoneNames: Map<number, string>,
): WorkoutTarget | null {
  const low = target.targetMin ?? target.targetValue ?? null;
  const high =
    (target.targetMin ?? null) !== null
      ? (target.targetMax ?? undefined)
      : undefined;
  if (target.targetType === WORKOUT_TARGET_TYPE.ZONE) {
    if (!isSet(target.targetValue)) return null;
    const zoneName = zoneNames.get(target.targetValue);
    return {
      type: 'zone',
      zoneId: target.targetValue,
      ...(zoneName && { zoneName }),
    };
  }
  if (low === null) return null;
  if (target.metricType && target.metricType in PERCENT_METRICS) {
    return {
      type: 'percent_of',
      metric: target.metricType as PercentMetric,
      min: round(low * 100, 1),
      ...(high !== undefined && { max: round(high * 100, 1) }),
    };
  }
  switch (target.targetType) {
    case WORKOUT_TARGET_TYPE.PACE:
      if (low <= 0 || (high !== undefined && high <= 0)) return null;
      // The slower pace first, as people write ranges
      return {
        type: 'pace',
        min: speedToPace(low),
        ...(high !== undefined && { max: speedToPace(high) }),
      };
    case WORKOUT_TARGET_TYPE.HEARTRATE:
      return {
        type: 'heart_rate',
        min: round(low),
        ...(high !== undefined && { max: round(high) }),
      };
    case WORKOUT_TARGET_TYPE.POWER:
      return {
        type: 'power',
        min: round(low),
        ...(high !== undefined && { max: round(high) }),
      };
    case WORKOUT_TARGET_TYPE.CADENCE:
      return {
        type: 'cadence',
        min: round(low),
        ...(high !== undefined && { max: round(high) }),
      };
    case WORKOUT_TARGET_TYPE.WEIGHT:
      // Loads are kept as stored: lb entered in the app are decimals in kg
      return {
        type: 'weight',
        min: low,
        ...(high !== undefined && { max: high }),
      };
    case WORKOUT_TARGET_TYPE.RPE:
      return { type: 'rpe', value: Math.min(Math.max(round(low, 1), 1), 10) };
    default:
      return null;
  }
}

function fromStoredStep(
  step: CreateWorkoutStepDto,
  zoneNames: Map<number, string>,
): WorkoutStep {
  const targets = (step.targets ?? [])
    .map((target) => fromStoredTarget(target, zoneNames))
    .filter((target): target is WorkoutTarget => target !== null);
  return {
    kind: KIND_OF_TYPE[step.stepType] ?? 'free',
    ...(step.name && { name: step.name }),
    ...(step.notes && { notes: step.notes }),
    ...(step.durationType === WORKOUT_DURATION_TYPE.TIME &&
      step.durationValue && {
        durationSeconds: Math.round(step.durationValue),
      }),
    ...(step.durationType === WORKOUT_DURATION_TYPE.DISTANCE &&
      step.durationValue && { distanceMeters: step.durationValue }),
    // Rounded like the durations: a fractional rep count is not kept
    ...(step.durationType === WORKOUT_DURATION_TYPE.REPS &&
      isSet(step.durationValue) && { reps: Math.round(step.durationValue) }),
    ...(step.exerciseRef && { exerciseRef: step.exerciseRef }),
    ...(step.tempo && { tempo: step.tempo }),
    ...(step.side && { side: step.side }),
    ...(targets.length && { targets }),
  };
}

function fromStoredItem(
  step: CreateWorkoutStepDto,
  zoneNames: Map<number, string>,
): WorkoutStep | WorkoutRepeat {
  const block = step.repeatBlock;
  if (step.stepType !== WORKOUT_STEP_TYPE.REPEAT || !block) {
    return fromStoredStep(step, zoneNames);
  }
  return {
    kind: 'repeat' as const,
    ...(step.name && { name: step.name }),
    ...(step.notes && { notes: step.notes }),
    times: block.repetitions,
    ...(block.kind &&
      block.kind !== WORKOUT_REPEAT_KIND.REPEAT && {
        repeatKind: block.kind,
      }),
    ...(isSet(block.intervalSeconds) && {
      intervalSeconds: block.intervalSeconds,
    }),
    ...(isSet(block.timeCapSeconds) && {
      timeCapSeconds: block.timeCapSeconds,
    }),
    steps: block.childSteps.map((child) => fromStoredStep(child, zoneNames)),
  };
}

const hasExercise = (steps: CreateWorkoutStepDto[]): boolean =>
  steps.some(
    (step) =>
      isExerciseStep(step) ||
      (step.repeatBlock?.childSteps ?? []).some(isExerciseStep),
  );

/**
 * Exactly what is persisted (the mapper `createWorkout` uses), with the
 * targets of a step in a fixed order: rows come back in no particular order
 */
export function persisted(steps: CreateWorkoutStepDto[]): string {
  return JSON.stringify(
    mapWorkoutDtoToPrisma({ steps }),
    (key, value: unknown) =>
      key === 'targets' && typeof value === 'object' && value !== null
        ? {
            create: [...(value as { create: object[] }).create]
              .map((target) => JSON.stringify(target))
              .sort(),
          }
        : value,
  );
}

const sameSteps = (a: CreateWorkoutStepDto[], b: CreateWorkoutStepDto[]) =>
  persisted(a) === persisted(b);

function fromStrengthExercise(
  exercise: StrengthExercise,
): WorkoutExercise['exercise'] {
  return {
    exerciseRef: exercise.exerciseRef!,
    name: exercise.name,
    sets: exercise.sets.map((set) => ({
      work: { type: set.work.type, value: set.work.value },
      ...(isSet(set.load) && { load: set.load }),
      ...(isSet(set.rpe) && { rpe: set.rpe }),
      ...(isSet(set.rest) && { rest: set.rest }),
    })),
    ...(exercise.tempo && { tempo: exercise.tempo }),
    ...(exercise.side && { side: exercise.side }),
    ...(exercise.notes && { notes: exercise.notes }),
  };
}

function fromBlock(
  block: StrengthBlock,
  zoneNames: Map<number, string>,
): Workout[number] {
  if (block.kind === 'exercise') {
    return {
      kind: 'exercise',
      exercise: fromStrengthExercise(block.exercise),
    };
  }
  if (block.kind === 'group') {
    return {
      kind: 'group',
      group: block.group,
      ...(block.name && { name: block.name }),
      rounds: block.rounds,
      ...(isSet(block.intervalSeconds) && {
        intervalSeconds: block.intervalSeconds,
      }),
      ...(isSet(block.timeCapSeconds) && {
        timeCapSeconds: block.timeCapSeconds,
      }),
      ...(isSet(block.roundRest) && { roundRest: block.roundRest }),
      exercises: block.exercises.map(fromStrengthExercise),
    };
  }
  return fromStoredItem(block.step, zoneNames);
}

/**
 * The steps in the pieces the shared block functions can be applied to one
 * by one: each repeat on its own, and each run of steps between repeats
 * (where sets of one exercise written one after the other become one
 * exercise)
 */
function segmentsOf(steps: CreateWorkoutStepDto[]): CreateWorkoutStepDto[][] {
  const segments: CreateWorkoutStepDto[][] = [];
  let run: CreateWorkoutStepDto[] | null = null;
  for (const step of steps) {
    if (step.stepType === WORKOUT_STEP_TYPE.REPEAT) {
      segments.push([step]);
      run = null;
    } else if (run) {
      run.push(step);
    } else {
      run = [step];
      segments.push(run);
    }
  }
  return segments;
}

/**
 * The shared block functions are not the identity for every stored segment
 * (two sets of one exercise stored flat become a repeat, a named rest loses
 * its name...), so a segment whose blocks would not write back to the same
 * steps is read step by step. That keeps exercise, reps, load, tempo, side
 * and the repeat kind, its timings and notes.
 */
function fromSegment(
  segment: CreateWorkoutStepDto[],
  zoneNames: Map<number, string>,
): Workout {
  const blocks = strengthBlocks(segment);
  if (sameSteps(strengthSteps(blocks), segment)) {
    return blocks.map((block) => fromBlock(block, zoneNames));
  }
  return segment.map((step) => fromStoredItem(step, zoneNames));
}

/**
 * Sessions with strength exercises are read as exercise and group items,
 * segment by segment: one segment that does not round-trip is read step by
 * step and does not change how the others are read. The conversions of
 * endurance steps stay as they are: rounded seconds and reps, OPEN, CALORIES
 * and HR_* durations read as lap button, one value of a weight range (a
 * weight with a maximum only, and the upper bound of an RPE range, are not
 * read).
 *
 * Values above what an agent may write (a long cue, a rest over an hour) are
 * read as stored: they must be shortened before the session is written back.
 */
export function fromStoredWorkout(
  steps: StoredStep[],
  zoneNames: Map<number, string> = new Map(),
): Workout {
  const plain = normalizeWorkoutForCreate({ steps }).steps;
  if (!hasExercise(plain)) {
    return plain.map((step) => fromStoredItem(step, zoneNames));
  }
  return segmentsOf(plain).flatMap((segment) =>
    fromSegment(segment, zoneNames),
  );
}

// ---------------------------------------------------------------------------
// One line per workout, for calendar listings

function formatSeconds(seconds: number): string {
  if (seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds >= 3600) {
    return `${Math.floor(seconds / 3600)}h${String(Math.round((seconds % 3600) / 60)).padStart(2, '0')}`;
  }
  if (seconds % 60 === 0) return `${seconds / 60}min`;
  if (seconds > 60) return `${Math.floor(seconds / 60)}min${seconds % 60}s`;
  return `${seconds}s`;
}

function formatTarget(target: WorkoutTarget): string {
  const span = (min: number | string, max?: number | string) =>
    max === undefined ? `${min}` : `${min}-${max}`;
  switch (target.type) {
    case 'zone':
      // Not one of the athlete's zones: say so rather than pass the id off
      return target.zoneName ?? `unknown zone ${target.zoneId}`;
    case 'pace':
      return `${span(target.min, target.max)}/km`;
    case 'heart_rate':
      return `${span(target.min, target.max)} bpm`;
    case 'power':
      return `${span(target.min, target.max)} W`;
    case 'cadence':
      return `${span(target.min, target.max)} rpm`;
    case 'weight':
      return `${span(round(target.min, 2), target.max === undefined ? undefined : round(target.max, 2))} kg`;
    case 'rpe':
      return `RPE ${target.value}`;
    case 'percent_of':
      return `${span(target.min, target.max)}% ${target.metric}`;
  }
}

function formatStep(step: WorkoutStep): string {
  const length =
    step.durationSeconds !== undefined
      ? formatSeconds(step.durationSeconds)
      : step.distanceMeters !== undefined
        ? step.distanceMeters >= 1000
          ? `${round(step.distanceMeters / 1000, 2)}km`
          : `${step.distanceMeters}m`
        : step.reps !== undefined
          ? `${step.reps} reps`
          : 'lap';
  const intensity = step.targets?.length
    ? ` @ ${step.targets.map(formatTarget).join(', ')}`
    : '';
  // Which exercise, for a strength step; endurance steps print as before
  const exercise = step.exerciseRef && step.name ? ` ${step.name}` : '';
  return `${step.kind} ${length}${exercise}${intensity}`;
}

const formatWork = ({ type, value }: SetWork): string =>
  type === WORKOUT_DURATION_TYPE.TIME
    ? formatSeconds(value)
    : type === WORKOUT_DURATION_TYPE.DISTANCE
      ? `${value}m`
      : `${value}`;

type SummarySet = WorkoutExercise['exercise']['sets'][number];

/** "3×10 Barbell full squat @ 80 kg, rest 1min30s", a pyramid "10/8/6 Bench press" */
function formatExercise(
  exercise: WorkoutExercise['exercise'],
  withRest = true,
): string {
  const { sets } = exercise;
  const same = (pick: (set: SummarySet) => unknown) =>
    sets.every((set) => pick(set) === pick(sets[0]));
  const identical =
    same((set) => set.work.type) &&
    same((set) => set.work.value) &&
    same((set) => set.load ?? null) &&
    same((set) => set.rest ?? null);
  const work =
    identical && sets.length > 1
      ? `${sets.length}×${formatWork(sets[0].work)}`
      : sets.map((set) => formatWork(set.work)).join('/');
  const loads = sets.some((set) => isSet(set.load))
    ? ` @ ${
        same((set) => set.load ?? null)
          ? round(sets[0].load!, 2)
          : sets
              .map((set) => (isSet(set.load) ? round(set.load, 2) : '-'))
              .join('/')
      } kg`
    : '';
  const rest =
    withRest && same((set) => set.rest ?? null) && isSet(sets[0].rest)
      ? `, rest ${formatSeconds(sets[0].rest)}`
      : '';
  return `${work} ${exercise.name}${loads}${rest}`;
}

/** "superset 4×(8 Pull-up, 15 Push-up)" */
function formatGroup(group: WorkoutGroup): string {
  const members = group.exercises
    .map((exercise) => formatExercise(exercise, false))
    .join(', ');
  const kind = group.group.toLowerCase();
  if (group.group === WORKOUT_REPEAT_KIND.AMRAP && group.timeCapSeconds) {
    return `${kind} ${formatSeconds(group.timeCapSeconds)} (${members})`;
  }
  const every =
    group.group === WORKOUT_REPEAT_KIND.EMOM && group.intervalSeconds
      ? ` every ${formatSeconds(group.intervalSeconds)}`
      : '';
  return `${kind} ${group.rounds}×(${members})${every}`;
}

/** e.g. "warmup 15min · 6×(work 3min @ 4:00/km, recovery 2min) · cooldown 10min" */
export function summarizeWorkout(workout: Workout): string {
  return workout
    .map((item) => {
      switch (item.kind) {
        case 'repeat':
          return `${item.repeatKind && item.repeatKind !== WORKOUT_REPEAT_KIND.REPEAT ? `${item.repeatKind.toLowerCase()} ` : ''}${item.times}×(${item.steps.map(formatStep).join(', ')})`;
        case 'exercise':
          return formatExercise(item.exercise);
        case 'group':
          return formatGroup(item);
        default:
          return formatStep(item);
      }
    })
    .join(' · ');
}

// ---------------------------------------------------------------------------
// What the stored model would silently drop of the strength fields

/** Problems the schema cannot express, one message each */
export function workoutProblems(workout: Workout): string[] {
  const problems: string[] = [];
  const checkStep = (step: WorkoutStep, path: string) => {
    if (
      step.reps !== undefined &&
      (step.durationSeconds !== undefined || step.distanceMeters !== undefined)
    ) {
      problems.push(
        `${path}: give reps, durationSeconds or distanceMeters, not several`,
      );
    }
  };
  workout.forEach((item, index) => {
    const path = `workoutSteps[${index}]`;
    if (item.kind === 'repeat') {
      item.steps.forEach((step, child) =>
        checkStep(step, `${path}.steps[${child}]`),
      );
    } else if (item.kind === 'group') {
      item.exercises.forEach((exercise, member) => {
        const where = `${path}.exercises[${member}]`;
        if (exercise.sets.length !== 1) {
          problems.push(
            `${where}: group exercises take one set, done each round`,
          );
        } else if (
          member === item.exercises.length - 1 &&
          (exercise.sets[0].rest ?? 0) > 0
        ) {
          problems.push(
            `${where}: use roundRest for the rest after the last exercise`,
          );
        }
      });
    } else if (item.kind !== 'exercise') {
      checkStep(item, path);
    }
  });
  return problems;
}
