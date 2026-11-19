import type { CreateWorkoutStepDto } from '@openathlete/shared';
import {
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_REPEAT_KIND,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
} from '@openathlete/shared';

import type { BuilderEnv } from './use-builder-env';

export type AddableType =
  | WORKOUT_STEP_TYPE.WARMUP
  | WORKOUT_STEP_TYPE.INTERVAL_ACTIVE
  | WORKOUT_STEP_TYPE.INTERVAL_REST
  | WORKOUT_STEP_TYPE.STEADY
  | WORKOUT_STEP_TYPE.COOLDOWN
  | WORKOUT_STEP_TYPE.REPEAT;

export const ADDABLE_TYPES: AddableType[] = [
  WORKOUT_STEP_TYPE.WARMUP,
  WORKOUT_STEP_TYPE.INTERVAL_ACTIVE,
  WORKOUT_STEP_TYPE.INTERVAL_REST,
  WORKOUT_STEP_TYPE.STEADY,
  WORKOUT_STEP_TYPE.COOLDOWN,
  WORKOUT_STEP_TYPE.REPEAT,
];

type Length = Pick<CreateWorkoutStepDto, 'durationType' | 'durationValue'>;
type StepType = Exclude<AddableType, WORKOUT_STEP_TYPE.REPEAT>;

const time = (seconds: number): Length => ({
  durationType: WORKOUT_DURATION_TYPE.TIME,
  durationValue: seconds,
});
const distance = (meters: number): Length => ({
  durationType: WORKOUT_DURATION_TYPE.DISTANCE,
  durationValue: meters,
});

/** Pools count in lengths; rests stay in time, as swimmers take them */
const LENGTHS: Record<'swim' | 'other', Record<StepType, Length>> = {
  swim: {
    [WORKOUT_STEP_TYPE.WARMUP]: distance(400),
    [WORKOUT_STEP_TYPE.INTERVAL_ACTIVE]: distance(100),
    [WORKOUT_STEP_TYPE.INTERVAL_REST]: time(20),
    [WORKOUT_STEP_TYPE.STEADY]: distance(400),
    [WORKOUT_STEP_TYPE.COOLDOWN]: distance(200),
  },
  other: {
    [WORKOUT_STEP_TYPE.WARMUP]: time(600),
    [WORKOUT_STEP_TYPE.INTERVAL_ACTIVE]: time(180),
    [WORKOUT_STEP_TYPE.INTERVAL_REST]: time(120),
    [WORKOUT_STEP_TYPE.STEADY]: time(1200),
    [WORKOUT_STEP_TYPE.COOLDOWN]: time(600),
  },
};

/** The zone each kind of step usually aims at, 0 being Z1 */
const ZONE_INDEX: Record<StepType, number> = {
  [WORKOUT_STEP_TYPE.WARMUP]: 1,
  [WORKOUT_STEP_TYPE.INTERVAL_ACTIVE]: 3,
  [WORKOUT_STEP_TYPE.INTERVAL_REST]: 0,
  [WORKOUT_STEP_TYPE.STEADY]: 1,
  [WORKOUT_STEP_TYPE.COOLDOWN]: 0,
};

function plainStep(
  type: StepType,
  env: Pick<BuilderEnv, 'sport' | 'zonesByType' | 'zoneType'>,
): CreateWorkoutStepDto {
  const zones = env.zonesByType[env.zoneType] ?? [];
  // An athlete with three zones gets their top one for an effort
  const zone = zones.length
    ? zones[Math.min(ZONE_INDEX[type], zones.length - 1)]
    : null;
  return {
    stepType: type,
    name: null,
    notes: null,
    ...LENGTHS[env.sport === SPORT_TYPE.SWIMMING ? 'swim' : 'other'][type],
    targets: zone
      ? [{ targetType: WORKOUT_TARGET_TYPE.ZONE, targetValue: zone.id }]
      : [],
  };
}

/**
 * The step a tap on "add" makes: a length and a zone that fit its kind and
 * the sport, so the coach adjusts instead of filling a form. A repeat comes
 * with an effort and its recovery.
 */
export function defaultStep(
  type: AddableType,
  env: Pick<BuilderEnv, 'sport' | 'zonesByType' | 'zoneType'>,
): CreateWorkoutStepDto {
  if (type !== WORKOUT_STEP_TYPE.REPEAT) return plainStep(type, env);
  return {
    stepType: WORKOUT_STEP_TYPE.REPEAT,
    name: null,
    durationType: WORKOUT_DURATION_TYPE.OPEN,
    durationValue: null,
    targets: [],
    repeatBlock: {
      repetitions: 4,
      kind: WORKOUT_REPEAT_KIND.REPEAT,
      childSteps: [
        plainStep(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, env),
        plainStep(WORKOUT_STEP_TYPE.INTERVAL_REST, env),
      ],
    },
  };
}
