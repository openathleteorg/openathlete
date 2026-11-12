/**
 * Session catalogue. A session is written once as structured workout steps:
 * they become the planned workout (Workout, WorkoutStep, WorkoutRepeat,
 * WorkoutStepTarget) and, executed, the blocks of the simulated recording.
 */
import type {
  Prisma,
  SportType,
  WorkoutStepType,
} from '../../../libs/database/generated/client';

import type { Block, RouteId } from './streams';

/** "3:40" per km to m/s */
export function pace(minPerKm: string): number {
  const [m, s] = minPerKm.split(':').map(Number);
  return 1000 / (m * 60 + s);
}

export type Target =
  | { type: 'PACE'; slow: string; fast: string }
  | { type: 'ZONE'; zone: number }
  | { type: 'POWER'; min: number; max: number }
  | { type: 'HEARTRATE'; min: number; max: number }
  | { type: 'RPE'; value: number };

/** A strength exercise of the bundled catalog, done for reps or for time */
export interface Exercise {
  /** Catalog id, stored as "c:<id>" */
  id: string;
  reps?: number;
  /** kg */
  load?: number;
  tempo?: string;
  side?: 'EACH' | 'LEFT' | 'RIGHT' | 'ALTERNATE';
}

export interface Step {
  type: Exclude<WorkoutStepType, 'REPEAT'>;
  name?: string;
  notes?: string;
  exercise?: Exercise;
  /** Seconds */
  duration?: number;
  /** Metres */
  distance?: number;
  target?: Target;
}

export interface Repeat {
  repeat: number;
  name?: string;
  kind?: 'REPEAT' | 'SUPERSET' | 'CIRCUIT' | 'EMOM' | 'AMRAP' | 'TABATA';
  steps: Step[];
}

export type WorkoutItem = Step | Repeat;

export interface Session {
  name: string;
  sport: SportType;
  description: string;
  items: WorkoutItem[];
  /** Routes the recording follows */
  routes: RouteId[];
  /** Planned goal, in metres, when not worked out from the steps */
  goalDistance?: number;
  goalElevationGain?: number;
  /** 0-1 */
  goalRpe: number;
  /** Keep the workout off the planned session (easy runs, long trail days) */
  unstructured?: boolean;
}

/** Flat speed (m/s) a heart-rate zone stands for, per zone index. */
const RUN_ZONE_SPEED = [2.7, 3.08, 3.6, 4.1, 4.5];
/** Power (W) a zone stands for on the bike */
const BIKE_ZONE_POWER = [105, 145, 180, 210, 240];

const isRepeat = (item: WorkoutItem): item is Repeat => 'repeat' in item;

function stepBlock(step: Step, ride: boolean): Block {
  const t = step.target;
  const block: Block = {
    name: step.name,
    duration: step.duration,
    distance: step.distance,
    lap: true,
  };
  if (ride) {
    block.power =
      t?.type === 'POWER'
        ? (t.min + t.max) / 2
        : t?.type === 'ZONE'
          ? BIKE_ZONE_POWER[t.zone]
          : step.type === 'INTERVAL_REST' || step.type === 'COOLDOWN'
            ? 110
            : 150;
  } else {
    block.speed =
      t?.type === 'PACE'
        ? // Aim a little inside the range: the first seconds of a rep are slower
          ((pace(t.slow) + pace(t.fast)) / 2) * (step.type === 'INTERVAL_ACTIVE' ? 1.012 : 1)
        : t?.type === 'ZONE'
          ? RUN_ZONE_SPEED[t.zone]
          : t?.type === 'RPE'
            ? 2.4 + t.value * 0.24
            : step.type === 'INTERVAL_REST'
              ? 2.55
              : 3.0;
  }
  return block;
}

/** The blocks an athlete runs or rides to execute a session. */
export function sessionBlocks(session: Session): Block[] {
  const ride = ['CYCLING', 'GRAVEL_RIDE', 'VIRTUAL_RIDE'].includes(session.sport);
  const blocks: Block[] = [];
  for (const item of session.items) {
    if (isRepeat(item)) {
      for (let i = 0; i < item.repeat; i++) {
        blocks.push(...item.steps.map((s) => stepBlock(s, ride)));
      }
    } else {
      blocks.push(stepBlock(item, ride));
    }
  }
  return blocks;
}

/** Planned duration (s) and distance (m), estimated from the steps. */
export function sessionGoals(session: Session): { duration: number; distance: number | null } {
  const ride = ['CYCLING', 'GRAVEL_RIDE', 'VIRTUAL_RIDE'].includes(session.sport);
  let duration = 0;
  let distance = 0;
  for (const block of sessionBlocks(session)) {
    const speed = ride ? 7.5 * ((block.power ?? 150) / 150) ** 0.4 : (block.speed ?? 3);
    if (block.duration) {
      duration += block.duration;
      distance += block.duration * speed;
    } else if (block.distance) {
      distance += block.distance;
      duration += block.distance / speed;
    }
  }
  // Climbing costs about 1.8 s per metre on foot, 1 s on a bike
  duration += (session.goalElevationGain ?? 0) * (ride ? 1 : 1.8);
  // Sets cover no ground
  if (session.sport === 'STRENGTH') return { duration: Math.round(duration / 60) * 60, distance: null };
  return {
    duration: Math.round(duration / 60) * 60,
    distance: session.goalDistance ?? (distance ? Math.round(distance / 100) * 100 : null),
  };
}

function targetCreate(
  target: Target,
  zoneIds: number[],
): Prisma.WorkoutStepTargetCreateWithoutStepInput {
  switch (target.type) {
    case 'PACE':
      return { targetType: 'PACE', targetMin: pace(target.slow), targetMax: pace(target.fast) };
    case 'ZONE':
      return { targetType: 'ZONE', targetValue: zoneIds[target.zone] };
    case 'POWER':
      return { targetType: 'POWER', targetMin: target.min, targetMax: target.max };
    case 'HEARTRATE':
      return { targetType: 'HEARTRATE', targetMin: target.min, targetMax: target.max };
    case 'RPE':
      return { targetType: 'RPE', targetValue: target.value };
  }
}

function stepCreate(step: Step, orderIndex: number, zoneIds: number[]) {
  const exercise = step.exercise;
  if (exercise) {
    return {
      orderIndex,
      stepType: step.type,
      name: step.name ?? null,
      notes: step.notes ?? '',
      exerciseRef: `c:${exercise.id}`,
      tempo: exercise.tempo ?? null,
      side: exercise.side ?? null,
      durationType: exercise.reps ? 'REPS' : 'TIME',
      durationValue: exercise.reps ?? step.duration ?? null,
      targets: exercise.load
        ? { create: [{ targetType: 'WEIGHT', targetValue: exercise.load }] }
        : undefined,
    } satisfies Prisma.WorkoutStepCreateWithoutWorkoutInput;
  }
  return {
    orderIndex,
    stepType: step.type,
    name: step.name ?? null,
    notes: step.notes ?? '',
    durationType: step.distance ? 'DISTANCE' : step.duration ? 'TIME' : 'OPEN',
    durationValue: step.distance ?? step.duration ?? null,
    targets: step.target ? { create: [targetCreate(step.target, zoneIds)] } : undefined,
  } satisfies Prisma.WorkoutStepCreateWithoutWorkoutInput;
}

/**
 * Nested create of a workout. `zoneIds` are the athlete's heart-rate zone
 * ids by index, which ZONE targets point at (or the coach's own for a
 * template).
 */
export function workoutCreate(
  session: Session,
  zoneIds: number[],
): Prisma.WorkoutCreateWithoutEventTrainingInput {
  return {
    steps: {
      create: session.items.map((item, index) =>
        isRepeat(item)
          ? {
              orderIndex: index,
              stepType: 'REPEAT',
              name: item.name ?? null,
              durationType: 'OPEN',
              repeatBlock: {
                create: {
                  repetitions: item.repeat,
                  kind: item.kind ?? 'REPEAT',
                  childSteps: {
                    create: item.steps.map((s, i) => stepCreate(s, i, zoneIds)),
                  },
                },
              },
            }
          : stepCreate(item, index, zoneIds),
      ),
    },
  };
}

// ---------------------------------------------------------------------------
// Catalogue (paces of a 3:08 marathoner, threshold about 3:55/km)
// ---------------------------------------------------------------------------

const Z1: Target = { type: 'ZONE', zone: 0 };
const Z2: Target = { type: 'ZONE', zone: 1 };

const warmup = (minutes = 20): Step => ({
  type: 'WARMUP',
  duration: minutes * 60,
  target: Z2,
  notes: 'Easy jog, finish with 4 strides',
});
const cooldown = (minutes = 10): Step => ({
  type: 'COOLDOWN',
  duration: minutes * 60,
  target: Z1,
});

export const sessions = {
  easy: (km: number, route: RouteId = 'lake-sevrier'): Session => ({
    name: `Easy run ${km} km`,
    sport: 'RUNNING',
    description: 'Conversational pace, nose breathing. Stay in zone 2 even on the climbs.',
    items: [{ type: 'STEADY', name: 'Easy', distance: km * 1000, target: Z2 }],
    routes: [route],
    goalRpe: 0.3,
    unstructured: true,
  }),

  recovery: (minutes: number): Session => ({
    name: `Recovery run ${minutes}'`,
    sport: 'RUNNING',
    description: 'Very easy, flat. Followed by 15 minutes of calf and hip mobility.',
    items: [{ type: 'STEADY', name: 'Recovery', duration: minutes * 60, target: Z1 }],
    routes: ['albigny-loop'],
    goalRpe: 0.2,
  }),

  intervals1000: (reps: number): Session => ({
    name: `${reps} × 1000 m`,
    sport: 'RUNNING',
    description: 'VO2max session. Even splits: the last rep as fast as the first.',
    items: [
      warmup(),
      {
        repeat: reps,
        steps: [
          { type: 'INTERVAL_ACTIVE', name: '1000 m', distance: 1000, target: { type: 'PACE', slow: '3:44', fast: '3:38' } },
          { type: 'INTERVAL_REST', name: 'Jog', duration: 120, target: Z1 },
        ],
      },
      cooldown(),
    ],
    routes: ['paquier-loop'],
    goalRpe: 0.8,
  }),

  intervals400: (reps: number): Session => ({
    name: `${reps} × 400 m`,
    sport: 'RUNNING',
    description: 'Speed and economy. Relaxed shoulders, quick feet.',
    items: [
      warmup(),
      {
        repeat: reps,
        steps: [
          { type: 'INTERVAL_ACTIVE', name: '400 m', distance: 400, target: { type: 'PACE', slow: '3:30', fast: '3:22' } },
          { type: 'INTERVAL_REST', name: 'Jog', duration: 90, target: Z1 },
        ],
      },
      cooldown(),
    ],
    routes: ['paquier-loop'],
    goalRpe: 0.8,
  }),

  threshold: (reps: number): Session => ({
    name: `${reps} × 6' threshold`,
    sport: 'RUNNING',
    description: 'Comfortably hard, at the edge of talking. Zone 4 heart rate.',
    items: [
      warmup(),
      {
        repeat: reps,
        steps: [
          { type: 'INTERVAL_ACTIVE', name: 'Threshold', duration: 360, target: { type: 'PACE', slow: '3:58', fast: '3:52' } },
          { type: 'INTERVAL_REST', name: 'Jog', duration: 120, target: Z1 },
        ],
      },
      cooldown(),
    ],
    routes: ['paquier-loop'],
    goalRpe: 0.75,
  }),

  marathonPace: (): Session => ({
    name: '3 × 3 km at marathon pace',
    sport: 'RUNNING',
    description: 'Lock into goal marathon pace and practise fuelling: one gel after the second block.',
    items: [
      warmup(15),
      {
        repeat: 3,
        steps: [
          { type: 'INTERVAL_ACTIVE', name: 'Marathon pace', distance: 3000, target: { type: 'PACE', slow: '4:30', fast: '4:24' } },
          { type: 'INTERVAL_REST', name: 'Float', duration: 180, target: Z1 },
        ],
      },
      cooldown(),
    ],
    routes: ['lake-sevrier'],
    goalRpe: 0.65,
  }),

  tempo: (): Session => ({
    name: "2 × 20' tempo",
    sport: 'RUNNING',
    description: 'Steady tempo, half-marathon effort. Hold back on the first one.',
    items: [
      warmup(15),
      {
        repeat: 2,
        steps: [
          { type: 'INTERVAL_ACTIVE', name: 'Tempo', duration: 1200, target: { type: 'PACE', slow: '4:12', fast: '4:05' } },
          { type: 'INTERVAL_REST', name: 'Jog', duration: 240, target: Z1 },
        ],
      },
      cooldown(),
    ],
    routes: ['lake-sevrier'],
    goalRpe: 0.7,
  }),

  hills: (reps: number): Session => ({
    name: `Hill repeats ${reps} × 1'30`,
    sport: 'TRAIL_RUNNING',
    description: 'Strong uphill drive, walk or jog back down. Short steps, tall posture.',
    items: [
      warmup(20),
      {
        repeat: reps,
        steps: [
          { type: 'INTERVAL_ACTIVE', name: 'Uphill', duration: 90, target: { type: 'RPE', value: 8 } },
          { type: 'INTERVAL_REST', name: 'Back down', duration: 120, target: Z1 },
        ],
      },
      cooldown(15),
    ],
    routes: ['cret-du-maure'],
    goalRpe: 0.75,
  }),

  longRun: (km: number, finishAtMarathonPace = 0): Session => ({
    name: finishAtMarathonPace ? `Long run ${km} km, last ${finishAtMarathonPace} at MP` : `Long run ${km} km`,
    sport: 'RUNNING',
    description: finishAtMarathonPace
      ? `Steady zone 2, then the last ${finishAtMarathonPace} km at marathon pace. Gel every 40 minutes.`
      : 'Zone 2 the whole way, fuel every 40 minutes.',
    items: [
      { type: 'STEADY', name: 'Endurance', distance: (km - finishAtMarathonPace) * 1000, target: Z2 },
      ...(finishAtMarathonPace
        ? [{ type: 'STEADY', name: 'Marathon pace', distance: finishAtMarathonPace * 1000, target: { type: 'PACE', slow: '4:30', fast: '4:24' } } as Step]
        : []),
    ],
    routes: ['lake-saint-jorioz'],
    goalRpe: finishAtMarathonPace ? 0.65 : 0.5,
    unstructured: !finishAtMarathonPace,
  }),

  trailLong: (route: RouteId, km: number, elevation: number, name: string): Session => ({
    name,
    sport: 'TRAIL_RUNNING',
    description: 'Power-hike anything steeper than 15 %, run the rest easy. Practise race food.',
    items: [{ type: 'STEADY', name: 'Endurance', distance: km * 1000, target: Z2 }],
    routes: [route],
    goalDistance: km * 1000,
    goalElevationGain: elevation,
    goalRpe: 0.6,
    unstructured: true,
  }),

  bikeEndurance: (minutes: number, route: RouteId = 'tour-du-lac'): Session => ({
    name: `Endurance ride ${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`,
    sport: 'CYCLING',
    description: 'Aerobic volume without the impact. High cadence, zone 2 power.',
    items: [{ type: 'STEADY', name: 'Endurance', duration: minutes * 60, target: { type: 'POWER', min: 135, max: 160 } }],
    routes: [route],
    goalRpe: 0.4,
  }),

  sweetSpot: (): Session => ({
    name: "Sweet spot 3 × 12'",
    sport: 'CYCLING',
    description: 'Just under threshold, seated, 85-90 rpm.',
    items: [
      { type: 'WARMUP', duration: 900, target: { type: 'POWER', min: 120, max: 145 } },
      {
        repeat: 3,
        steps: [
          { type: 'INTERVAL_ACTIVE', name: 'Sweet spot', duration: 720, target: { type: 'POWER', min: 190, max: 200 } },
          { type: 'INTERVAL_REST', name: 'Easy spin', duration: 300, target: { type: 'POWER', min: 110, max: 130 } },
        ],
      },
      { type: 'COOLDOWN', duration: 600, target: { type: 'POWER', min: 100, max: 125 } },
    ],
    routes: ['col-de-la-forclaz'],
    goalRpe: 0.65,
  }),

  strength: (): Session => ({
    name: 'Strength: legs & core',
    sport: 'STRENGTH',
    description: 'Strength for the hills: heavy and slow, then single-leg work and core. Keep 2 reps in reserve on the squats.',
    items: [
      { type: 'WARMUP', name: 'Mobility & activation', duration: 480 },
      {
        repeat: 4,
        steps: [
          {
            type: 'INTERVAL_ACTIVE',
            name: 'Barbell full squat',
            notes: 'Knees over the toes, chest up',
            exercise: { id: 'barbell-full-squat', reps: 6, load: 50, tempo: '3-1-1-0' },
          },
          { type: 'INTERVAL_REST', duration: 120 },
        ],
      },
      {
        repeat: 3,
        kind: 'SUPERSET',
        steps: [
          {
            type: 'INTERVAL_ACTIVE',
            name: 'Dumbbell step-up',
            exercise: { id: 'dumbbell-step-up', reps: 8, load: 12, side: 'EACH' },
          },
          {
            type: 'INTERVAL_ACTIVE',
            name: 'Barbell Romanian deadlift',
            exercise: { id: 'barbell-romanian-deadlift', reps: 8, load: 40 },
          },
          { type: 'INTERVAL_REST', duration: 90 },
        ],
      },
      {
        repeat: 3,
        steps: [
          {
            type: 'INTERVAL_ACTIVE',
            name: 'Barbell standing calf raise',
            notes: 'Three seconds down',
            exercise: { id: 'barbell-standing-calf-raise', reps: 12, load: 40, tempo: '3-0-1-1' },
          },
          { type: 'INTERVAL_REST', duration: 60 },
        ],
      },
      {
        repeat: 2,
        kind: 'CIRCUIT',
        steps: [
          { type: 'INTERVAL_ACTIVE', name: 'Side bridge', duration: 40, exercise: { id: 'side-bridge-v2', side: 'EACH' } },
          { type: 'INTERVAL_REST', duration: 15 },
          { type: 'INTERVAL_ACTIVE', name: 'Low glute bridge on floor', exercise: { id: 'low-glute-bridge-on-floor', reps: 15 } },
          { type: 'INTERVAL_REST', duration: 15 },
          { type: 'INTERVAL_ACTIVE', name: 'Push-up', exercise: { id: 'push-up', reps: 12 } },
          { type: 'INTERVAL_REST', duration: 60 },
        ],
      },
    ],
    routes: [],
    goalRpe: 0.6,
  }),
} as const;
