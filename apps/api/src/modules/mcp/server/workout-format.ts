import { z } from 'zod';

import {
  CreateWorkoutStepDto,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
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

const pace = z
  .string()
  .regex(PACE_PATTERN, 'Pace as m:ss per km, e.g. 4:35')
  .describe('Pace per kilometer as m:ss, e.g. "4:35"');

const range = (unit: string, schema: z.ZodNumber) => ({
  min: schema.describe(`Lower bound, or the single value (${unit})`),
  max: schema.optional().describe(`Upper bound (${unit}); omit for one value`),
});

export const targetSchema = z.discriminatedUnion('type', [
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
    min: pace.describe('Pace per km as m:ss; the two bounds in any order'),
    max: pace.optional().describe('Other bound of a pace range, m:ss per km'),
  }),
  z.object({
    type: z.literal('heart_rate'),
    ...range('bpm', z.number().min(30).max(250)),
  }),
  z.object({
    type: z.literal('power'),
    ...range('W', z.number().min(1).max(3000)),
  }),
  z.object({
    type: z.literal('cadence'),
    ...range('rpm or steps/min', z.number().min(1).max(300)),
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
    ...range('% of the metric, e.g. 85', z.number().min(1).max(200)),
  }),
]);
export type WorkoutTarget = z.infer<typeof targetSchema>;

const stepFields = {
  name: z.string().max(100).optional(),
  notes: z.string().max(500).optional().describe('Cue shown to the athlete'),
  durationSeconds: z
    .number()
    .int()
    .min(1)
    .max(86400)
    .optional()
    .describe('Step length in seconds'),
  distanceMeters: z
    .number()
    .min(1)
    .max(1_000_000)
    .optional()
    .describe('Step length in meters, instead of a duration'),
  targets: z
    .array(targetSchema)
    .max(3)
    .optional()
    .describe('Intensity: usually one target, e.g. a zone or a pace range'),
};

export const stepSchema = z
  .object({
    kind: z
      .enum(Object.keys(STEP_KINDS) as [StepKind, ...StepKind[]])
      .describe('warmup, steady, work (interval), recovery, cooldown or free'),
    ...stepFields,
  })
  .describe(
    'A step. Give durationSeconds or distanceMeters, or neither for a step ended with the lap button',
  );
export type WorkoutStep = z.infer<typeof stepSchema>;

export const repeatSchema = z
  .object({
    kind: z.literal('repeat'),
    name: z.string().max(100).optional(),
    times: z.number().int().min(1).max(99),
    steps: z
      .array(stepSchema)
      .min(1)
      .max(20)
      .describe('Steps done each time; a repeat cannot contain a repeat'),
  })
  .describe('Steps repeated, e.g. 6 × (3 min work, 2 min recovery)');
export type WorkoutRepeat = z.infer<typeof repeatSchema>;

export const workoutSchema = z
  .array(z.union([stepSchema, repeatSchema]))
  .max(60)
  .describe(
    'Structured workout, in order. Example: warmup 900 s, repeat 6 × [work 180 s @ zone, recovery 120 s], cooldown 600 s',
  );
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
        : {
            durationType: WORKOUT_DURATION_TYPE.LAP_BUTTON,
            durationValue: null,
          };
  return {
    stepType: STEP_KINDS[step.kind],
    name: step.name ?? null,
    notes: step.notes ?? null,
    ...duration,
    targets: (step.targets ?? []).map(toStoredTarget),
  };
}

export function toStoredWorkout(workout: Workout): CreateWorkoutStepDto[] {
  return workout.map((item) =>
    item.kind === 'repeat'
      ? {
          stepType: WORKOUT_STEP_TYPE.REPEAT,
          name: item.name ?? null,
          durationType: WORKOUT_DURATION_TYPE.OPEN,
          durationValue: null,
          targets: [],
          repeatBlock: {
            repetitions: item.times,
            childSteps: item.steps.map(toStoredStep),
          },
        }
      : toStoredStep(item),
  );
}

/** Zone ids a workout uses, to check they belong to the athlete */
export function zoneIdsOf(workout: Workout): number[] {
  const steps = workout.flatMap((item) =>
    item.kind === 'repeat' ? item.steps : [item],
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

/** Seconds of the timed steps, repeats included */
export function workoutSeconds(workout: Workout): number {
  return workout.reduce(
    (total, item) =>
      total +
      (item.kind === 'repeat'
        ? item.times *
          item.steps.reduce((sum, step) => sum + (step.durationSeconds ?? 0), 0)
        : (item.durationSeconds ?? 0)),
    0,
  );
}

// ---------------------------------------------------------------------------
// From the stored model

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
  targets: StoredStepTarget[];
  repeatBlock?: { repetitions: number; childSteps: StoredStep[] } | null;
};

const round = (value: number, digits = 0) =>
  Math.round(value * 10 ** digits) / 10 ** digits;

function fromStoredTarget(
  target: StoredStepTarget,
  zoneNames: Map<number, string>,
): WorkoutTarget | null {
  const low = target.targetMin ?? target.targetValue;
  const high =
    target.targetMin !== null ? (target.targetMax ?? undefined) : undefined;
  if (target.targetType === WORKOUT_TARGET_TYPE.ZONE) {
    if (target.targetValue === null) return null;
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
    case WORKOUT_TARGET_TYPE.RPE:
      return { type: 'rpe', value: Math.min(Math.max(round(low, 1), 1), 10) };
    default:
      return null;
  }
}

function fromStoredStep(
  step: StoredStep,
  zoneNames: Map<number, string>,
): WorkoutStep {
  const targets = step.targets
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
    ...(targets.length && { targets }),
  };
}

export function fromStoredWorkout(
  steps: StoredStep[],
  zoneNames: Map<number, string> = new Map(),
): Workout {
  return steps.map((step) =>
    step.stepType === WORKOUT_STEP_TYPE.REPEAT && step.repeatBlock
      ? {
          kind: 'repeat' as const,
          ...(step.name && { name: step.name }),
          times: step.repeatBlock.repetitions,
          steps: step.repeatBlock.childSteps.map((child) =>
            fromStoredStep(child, zoneNames),
          ),
        }
      : fromStoredStep(step, zoneNames),
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
      return target.zoneName ?? `zone ${target.zoneId}`;
    case 'pace':
      return `${span(target.min, target.max)}/km`;
    case 'heart_rate':
      return `${span(target.min, target.max)} bpm`;
    case 'power':
      return `${span(target.min, target.max)} W`;
    case 'cadence':
      return `${span(target.min, target.max)} rpm`;
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
        : 'lap';
  const intensity = step.targets?.length
    ? ` @ ${step.targets.map(formatTarget).join(', ')}`
    : '';
  return `${step.kind} ${length}${intensity}`;
}

/** e.g. "warmup 15min · 6×(work 3min @ 4:00/km, recovery 2min) · cooldown 10min" */
export function summarizeWorkout(workout: Workout): string {
  return workout
    .map((item) =>
      item.kind === 'repeat'
        ? `${item.times}×(${item.steps.map(formatStep).join(', ')})`
        : formatStep(item),
    )
    .join(' · ');
}
