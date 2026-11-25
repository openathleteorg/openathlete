import {
  CreateWorkoutStepDto,
  WORKOUT_DURATION_TYPE as DURATION,
  EXERCISE_SIDE,
  WORKOUT_REPEAT_KIND as KIND,
  SPORT_TYPE,
  WORKOUT_STEP_TYPE as STEP,
  StrengthBlock,
  WORKOUT_TARGET_TYPE as TARGET,
  createWorkoutSchema,
  strengthSteps,
} from '@openathlete/shared';

import {
  Workout,
  exerciseRefsOf,
  fromStoredWorkout,
  paceToSpeed,
  persisted,
  speedToPace,
  summarizeWorkout,
  toStoredWorkout,
  withExerciseNames,
  workoutOutputSchema,
  workoutProblems,
  workoutSchema,
  workoutSeconds,
  zoneIdsOf,
} from './workout-format';

const intervals: Workout = [
  {
    kind: 'warmup',
    durationSeconds: 900,
    targets: [{ type: 'zone', zoneId: 11 }],
  },
  {
    kind: 'repeat',
    name: '6 × 3 min',
    times: 6,
    steps: [
      {
        kind: 'work',
        durationSeconds: 180,
        targets: [{ type: 'pace', min: '4:05', max: '3:55' }],
      },
      { kind: 'recovery', durationSeconds: 120, notes: 'Jog' },
    ],
  },
  {
    kind: 'steady',
    distanceMeters: 2000,
    targets: [{ type: 'percent_of', metric: 'VMA', min: 80, max: 85 }],
  },
  { kind: 'cooldown' },
];

describe('agent workout format', () => {
  it('converts paces to speeds and back', () => {
    expect(paceToSpeed('4:00')).toBeCloseTo(1000 / 240);
    expect(speedToPace(1000 / 275)).toBe('4:35');
    expect(speedToPace(paceToSpeed('10:05'))).toBe('10:05');
  });

  it('builds a workout the API accepts, with readable units stored as the app expects', () => {
    const stored = toStoredWorkout(intervals);

    expect(createWorkoutSchema.safeParse({ steps: stored }).success).toBe(true);
    expect(stored[0]).toMatchObject({
      stepType: 'WARMUP',
      durationType: 'TIME',
      durationValue: 900,
      targets: [{ targetType: 'ZONE', targetValue: 11 }],
    });
    expect(stored[1]).toMatchObject({
      stepType: 'REPEAT',
      durationType: 'OPEN',
      repeatBlock: { repetitions: 6 },
    });
    // The slower pace is the lower speed
    const pace = stored[1].repeatBlock!.childSteps[0].targets![0];
    expect(pace.targetType).toBe('PACE');
    expect(pace.targetMin).toBeCloseTo(1000 / 245);
    expect(pace.targetMax).toBeCloseTo(1000 / 235);
    expect(stored[2]).toMatchObject({
      durationType: 'DISTANCE',
      durationValue: 2000,
      targets: [
        {
          targetType: 'PACE',
          targetMin: 0.8,
          targetMax: 0.85,
          metricType: 'VMA',
        },
      ],
    });
    // Neither a duration nor a distance: until the lap button
    expect(stored[3]).toMatchObject({ durationType: 'LAP_BUTTON' });
  });

  it('reads back what it wrote, with zone names', () => {
    const stored = toStoredWorkout(intervals).map((step) => ({
      notes: null,
      name: null,
      durationValue: null,
      ...step,
      targets: (step.targets ?? []).map((target) => ({
        targetMin: null,
        targetMax: null,
        targetValue: null,
        metricType: null,
        ...target,
      })),
      repeatBlock: step.repeatBlock && {
        repetitions: step.repeatBlock.repetitions,
        childSteps: step.repeatBlock.childSteps.map((child) => ({
          name: null,
          notes: null,
          durationValue: null,
          ...child,
          targets: (child.targets ?? []).map((target) => ({
            targetMin: null,
            targetMax: null,
            targetValue: null,
            metricType: null,
            ...target,
          })),
        })),
      },
    }));

    const read = fromStoredWorkout(
      stored as Parameters<typeof fromStoredWorkout>[0],
      new Map([[11, 'Endurance']]),
    );

    expect(read).toEqual([
      {
        kind: 'warmup',
        durationSeconds: 900,
        targets: [{ type: 'zone', zoneId: 11, zoneName: 'Endurance' }],
      },
      {
        kind: 'repeat',
        name: '6 × 3 min',
        times: 6,
        steps: [
          {
            kind: 'work',
            durationSeconds: 180,
            targets: [{ type: 'pace', min: '4:05', max: '3:55' }],
          },
          { kind: 'recovery', durationSeconds: 120, notes: 'Jog' },
        ],
      },
      {
        kind: 'steady',
        distanceMeters: 2000,
        targets: [{ type: 'percent_of', metric: 'VMA', min: 80, max: 85 }],
      },
      { kind: 'cooldown' },
    ]);
    expect(workoutSchema.safeParse(read).success).toBe(true);
  });

  it('summarizes a workout on one line', () => {
    expect(
      summarizeWorkout(
        fromStoredWorkout([], new Map()).concat([
          { kind: 'warmup', durationSeconds: 900 },
          {
            kind: 'repeat',
            times: 6,
            steps: [
              {
                kind: 'work',
                durationSeconds: 180,
                targets: [{ type: 'zone', zoneId: 4, zoneName: 'Threshold' }],
              },
              { kind: 'recovery', durationSeconds: 90 },
            ],
          },
          {
            kind: 'steady',
            distanceMeters: 5000,
            targets: [{ type: 'pace', min: '4:40' }],
          },
          { kind: 'cooldown', durationSeconds: 3900 },
        ]),
      ),
    ).toBe(
      'warmup 15min · 6×(work 3min @ Threshold, recovery 1min30s) · steady 5km @ 4:40/km · cooldown 1h05',
    );
  });

  it('counts the planned seconds and lists the zones used', () => {
    // 2 km at 82.5% of a default 15 km/h VMA, as the web app estimates it
    expect(workoutSeconds(intervals)).toBe(
      900 + 6 * 300 + Math.round(2000 / ((0.825 * 15) / 3.6)),
    );
    expect(zoneIdsOf(intervals)).toEqual([11]);
  });

  it('estimates distances at the pace of the sport', () => {
    const swim: Workout = [
      { kind: 'warmup', durationSeconds: 900 },
      {
        kind: 'repeat',
        times: 4,
        steps: [
          { kind: 'work', distanceMeters: 250 },
          { kind: 'recovery', durationSeconds: 60 },
        ],
      },
      { kind: 'cooldown', durationSeconds: 300 },
    ];
    // 1000 m at about 1:45 /100 m, not at a running pace
    const minutes = workoutSeconds(swim, SPORT_TYPE.SWIMMING) / 60;
    expect(minutes).toBeGreaterThan(40);
    expect(minutes).toBeLessThan(45);
    expect(workoutSeconds(swim, SPORT_TYPE.RUNNING)).toBeLessThan(
      workoutSeconds(swim, SPORT_TYPE.SWIMMING),
    );
  });

  it('refuses a repeat inside a repeat and unreadable paces', () => {
    expect(
      workoutSchema.safeParse([
        {
          kind: 'repeat',
          times: 2,
          steps: [{ kind: 'repeat', times: 2, steps: [{ kind: 'work' }] }],
        },
      ]).success,
    ).toBe(false);
    expect(
      workoutSchema.safeParse([
        { kind: 'work', targets: [{ type: 'pace', min: '4.5' }] },
      ]).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Strength sessions

type Row = Parameters<typeof fromStoredWorkout>[0][number];

/** Steps as Prisma returns them: ids, nulls, targets in no set order */
function row(step: CreateWorkoutStepDto, index = 0): Row {
  return {
    workoutStepId: index + 1,
    orderIndex: index,
    stepType: step.stepType,
    name: step.name ?? null,
    notes: step.notes ?? null,
    durationType: step.durationType ?? 'OPEN',
    durationValue: step.durationValue ?? null,
    exerciseRef: step.exerciseRef ?? null,
    tempo: step.tempo ?? null,
    side: step.side ?? null,
    createdAt: new Date(),
    targets: (step.targets ?? [])
      .map((target, i) => ({
        workoutStepTargetId: i + 1,
        targetMin: null,
        targetMax: null,
        targetValue: null,
        metricType: null,
        ...target,
      }))
      .reverse(),
    repeatBlock: step.repeatBlock
      ? {
          repetitions: step.repeatBlock.repetitions,
          kind: step.repeatBlock.kind ?? 'REPEAT',
          intervalSeconds: step.repeatBlock.intervalSeconds ?? null,
          timeCapSeconds: step.repeatBlock.timeCapSeconds ?? null,
          childSteps: step.repeatBlock.childSteps.map(row),
        }
      : null,
  } as Row;
}
const rows = (steps: CreateWorkoutStepDto[]) => steps.map(row);

/** read -> agent -> write, through the schema an agent's call goes through */
const roundTrip = (steps: CreateWorkoutStepDto[]) =>
  toStoredWorkout(
    workoutSchema.parse(fromStoredWorkout(rows(steps), new Map())),
  );

const REPS = DURATION.REPS;
const TIME = DURATION.TIME;
const set = (
  value: number,
  more: { load?: number; rpe?: number; rest?: number } = {},
  type: typeof REPS | typeof TIME | DURATION.DISTANCE = REPS,
) => ({
  work: { type, value },
  load: more.load ?? null,
  rpe: more.rpe ?? null,
  rest: more.rest ?? null,
});
const exercise = (
  ref: string,
  name: string,
  sets: ReturnType<typeof set>[],
  more: { tempo?: string; side?: EXERCISE_SIDE; notes?: string } = {},
) => ({
  exerciseRef: ref,
  name,
  sets,
  tempo: more.tempo ?? null,
  side: more.side ?? null,
  notes: more.notes ?? null,
});
const group = (
  kind: Exclude<KIND, KIND.REPEAT>,
  rounds: number,
  exercises: ReturnType<typeof exercise>[],
  more: {
    name?: string;
    intervalSeconds?: number;
    timeCapSeconds?: number;
    roundRest?: number;
  } = {},
): StrengthBlock => ({
  kind: 'group',
  group: kind,
  name: more.name ?? null,
  rounds,
  intervalSeconds: more.intervalSeconds ?? null,
  timeCapSeconds: more.timeCapSeconds ?? null,
  roundRest: more.roundRest ?? null,
  exercises,
});

const squat = 'c:barbell-full-squat';
// What the web builder saves, built with the same function
const strengthBlocks: StrengthBlock[] = [
  {
    kind: 'step',
    step: {
      stepType: STEP.WARMUP,
      name: 'Row',
      notes: null,
      durationType: TIME,
      durationValue: 600,
      targets: [],
    },
  },
  {
    kind: 'exercise',
    exercise: exercise(
      squat,
      'Barbell full squat',
      [1, 2, 3].map(() => set(5, { load: 80, rest: 90 })),
      { tempo: '3-1-X-0', notes: 'Belt on' },
    ),
  },
  {
    kind: 'exercise',
    exercise: exercise('c:barbell-bench-press', 'Bench press', [
      set(10, { load: 60, rest: 120 }),
      set(8, { load: 70, rest: 120 }),
      set(6, { load: 80, rpe: 8, rest: 120 }),
    ]),
  },
  {
    kind: 'exercise',
    exercise: exercise(
      'u:12',
      'Split squat',
      [set(10, { load: 61.2349 }), set(10, { load: 61.2349 })],
      { side: EXERCISE_SIDE.EACH },
    ),
  },
  group(
    KIND.SUPERSET,
    4,
    [
      exercise('c:pull-up', 'Pull-up', [set(8, { rest: 15 })]),
      exercise('c:push-up', 'Push-up', [set(15)]),
    ],
    { name: 'Upper', roundRest: 60 },
  ),
  group(
    KIND.EMOM,
    10,
    [
      exercise('c:kettlebell-swing', 'Kettlebell swing', [
        set(12, { load: 24, rest: 5 }),
      ]),
      exercise('c:burpee', 'Burpee', [set(6)]),
    ],
    { intervalSeconds: 60 },
  ),
  group(
    KIND.AMRAP,
    1,
    [
      exercise('c:air-squat', 'Air squat', [set(15)]),
      exercise('c:sit-up', 'Sit-up', [set(10)]),
    ],
    { timeCapSeconds: 720 },
  ),
  group(KIND.TABATA, 8, [exercise('c:plank', 'Plank', [set(20, {}, TIME)])], {
    roundRest: 10,
  }),
  group(
    KIND.CIRCUIT,
    3,
    [
      exercise('c:rope-jump', 'Rope jump', [set(30, { rest: 20 }, TIME)]),
      exercise('c:lunge', 'Lunge', [set(12, { rest: 20 })]),
      exercise('c:crunch', 'Crunch', [set(20)]),
    ],
    { roundRest: 90 },
  ),
];
const strengthStored = strengthSteps(strengthBlocks);

const strengthRead: Workout = [
  { kind: 'warmup', name: 'Row', durationSeconds: 600 },
  {
    kind: 'exercise',
    exercise: {
      exerciseRef: squat,
      name: 'Barbell full squat',
      sets: [1, 2, 3].map(() => ({
        work: { type: REPS, value: 5 },
        load: 80,
        rest: 90,
      })),
      tempo: '3-1-X-0',
      notes: 'Belt on',
    },
  },
  {
    kind: 'exercise',
    exercise: {
      exerciseRef: 'c:barbell-bench-press',
      name: 'Bench press',
      sets: [
        { work: { type: REPS, value: 10 }, load: 60, rest: 120 },
        { work: { type: REPS, value: 8 }, load: 70, rest: 120 },
        { work: { type: REPS, value: 6 }, load: 80, rpe: 8, rest: 120 },
      ],
    },
  },
  {
    kind: 'exercise',
    exercise: {
      exerciseRef: 'u:12',
      name: 'Split squat',
      sets: [
        { work: { type: REPS, value: 10 }, load: 61.2349 },
        { work: { type: REPS, value: 10 }, load: 61.2349 },
      ],
      side: EXERCISE_SIDE.EACH,
    },
  },
  {
    kind: 'group',
    group: KIND.SUPERSET,
    name: 'Upper',
    rounds: 4,
    roundRest: 60,
    exercises: [
      {
        exerciseRef: 'c:pull-up',
        name: 'Pull-up',
        sets: [{ work: { type: REPS, value: 8 }, rest: 15 }],
      },
      {
        exerciseRef: 'c:push-up',
        name: 'Push-up',
        sets: [{ work: { type: REPS, value: 15 } }],
      },
    ],
  },
  {
    kind: 'group',
    group: KIND.EMOM,
    rounds: 10,
    intervalSeconds: 60,
    exercises: [
      {
        exerciseRef: 'c:kettlebell-swing',
        name: 'Kettlebell swing',
        sets: [{ work: { type: REPS, value: 12 }, load: 24, rest: 5 }],
      },
      {
        exerciseRef: 'c:burpee',
        name: 'Burpee',
        sets: [{ work: { type: REPS, value: 6 } }],
      },
    ],
  },
  {
    kind: 'group',
    group: KIND.AMRAP,
    rounds: 1,
    timeCapSeconds: 720,
    exercises: [
      {
        exerciseRef: 'c:air-squat',
        name: 'Air squat',
        sets: [{ work: { type: REPS, value: 15 } }],
      },
      {
        exerciseRef: 'c:sit-up',
        name: 'Sit-up',
        sets: [{ work: { type: REPS, value: 10 } }],
      },
    ],
  },
  {
    kind: 'group',
    group: KIND.TABATA,
    rounds: 8,
    roundRest: 10,
    exercises: [
      {
        exerciseRef: 'c:plank',
        name: 'Plank',
        sets: [{ work: { type: TIME, value: 20 } }],
      },
    ],
  },
  {
    kind: 'group',
    group: KIND.CIRCUIT,
    rounds: 3,
    roundRest: 90,
    exercises: [
      {
        exerciseRef: 'c:rope-jump',
        name: 'Rope jump',
        sets: [{ work: { type: TIME, value: 30 }, rest: 20 }],
      },
      {
        exerciseRef: 'c:lunge',
        name: 'Lunge',
        sets: [{ work: { type: REPS, value: 12 }, rest: 20 }],
      },
      {
        exerciseRef: 'c:crunch',
        name: 'Crunch',
        sets: [{ work: { type: REPS, value: 20 } }],
      },
    ],
  },
];

const active = (
  more: Partial<CreateWorkoutStepDto> = {},
): CreateWorkoutStepDto => ({
  stepType: STEP.INTERVAL_ACTIVE,
  name: 'Barbell full squat',
  notes: null,
  durationType: REPS,
  durationValue: 5,
  exerciseRef: squat,
  tempo: null,
  side: null,
  targets: [{ targetType: TARGET.WEIGHT, targetValue: 80 }],
  ...more,
});
const rest = (
  seconds: number,
  more: Partial<CreateWorkoutStepDto> = {},
): CreateWorkoutStepDto => ({
  stepType: STEP.INTERVAL_REST,
  name: null,
  notes: null,
  durationType: TIME,
  durationValue: seconds,
  targets: [],
  ...more,
});
const repeatOf = (
  repetitions: number,
  childSteps: CreateWorkoutStepDto[],
  more: Partial<CreateWorkoutStepDto> & {
    kind?: KIND;
    intervalSeconds?: number;
    timeCapSeconds?: number;
  } = {},
): CreateWorkoutStepDto => {
  const { kind, intervalSeconds, timeCapSeconds, ...step } = more;
  return {
    stepType: STEP.REPEAT,
    name: null,
    durationType: DURATION.OPEN,
    durationValue: null,
    targets: [],
    ...step,
    repeatBlock: {
      repetitions,
      ...(kind && { kind }),
      ...(intervalSeconds && { intervalSeconds }),
      ...(timeCapSeconds && { timeCapSeconds }),
      childSteps,
    },
  };
};

// The shared estimate of calculateWorkoutDuration for strengthRead, pinned
const SESSION_SECONDS = 4311;

describe('strength sessions', () => {
  it('reads a session built by the web app as exercises and groups', () => {
    const read = fromStoredWorkout(rows(strengthStored));

    expect(read).toStrictEqual(strengthRead);
    expect(workoutSchema.safeParse(read).success).toBe(true);
    expect(workoutOutputSchema.safeParse(read).success).toBe(true);
  });

  it('writes it back to the same stored steps', () => {
    expect(persisted(roundTrip(strengthStored))).toEqual(
      persisted(strengthStored),
    );
    // And what an agent writes by hand gives the web's steps
    expect(toStoredWorkout(strengthRead)).toStrictEqual(strengthStored);
    expect(
      createWorkoutSchema.safeParse({ steps: toStoredWorkout(strengthRead) })
        .success,
    ).toBe(true);
  });

  it('stores a superset as the web app does, pinned step by step', () => {
    const exerciseStep = (
      ref: string,
      name: string,
      reps: number,
    ): CreateWorkoutStepDto => ({
      stepType: STEP.INTERVAL_ACTIVE,
      name,
      durationType: REPS,
      durationValue: reps,
      notes: null,
      exerciseRef: ref,
      tempo: null,
      side: null,
      targets: [],
    });

    const stored = toStoredWorkout(strengthRead);
    expect(stored.find((step) => step.name === 'Upper')).toStrictEqual({
      stepType: STEP.REPEAT,
      name: 'Upper',
      durationType: DURATION.OPEN,
      durationValue: null,
      targets: [],
      repeatBlock: {
        repetitions: 4,
        kind: KIND.SUPERSET,
        intervalSeconds: null,
        timeCapSeconds: null,
        childSteps: [
          exerciseStep('c:pull-up', 'Pull-up', 8),
          rest(15, { notes: null }),
          exerciseStep('c:push-up', 'Push-up', 15),
          rest(60),
        ],
      },
    });
  });

  it('leaves an endurance session unchanged', () => {
    const stored: CreateWorkoutStepDto[] = [
      {
        stepType: 'WARMUP' as STEP,
        name: null,
        notes: null,
        durationType: TIME,
        durationValue: 600,
        targets: [],
      },
      {
        stepType: 'REPEAT' as STEP,
        name: null,
        durationType: DURATION.OPEN,
        durationValue: null,
        targets: [],
        repeatBlock: {
          repetitions: 4,
          childSteps: [
            {
              stepType: 'INTERVAL_ACTIVE' as STEP,
              name: null,
              notes: 'Hard',
              durationType: TIME,
              durationValue: 60,
              targets: [
                {
                  targetType: 'HEARTRATE' as TARGET,
                  targetValue: null,
                  targetMin: 150,
                  targetMax: 160,
                  metricType: null,
                },
              ],
            },
            {
              stepType: 'INTERVAL_REST' as STEP,
              name: null,
              notes: null,
              durationType: TIME,
              durationValue: 60,
              targets: [],
            },
          ],
        },
      },
    ];
    const agent: Workout = [
      { kind: 'warmup', durationSeconds: 600 },
      {
        kind: 'repeat',
        times: 4,
        steps: [
          {
            kind: 'work',
            notes: 'Hard',
            durationSeconds: 60,
            targets: [{ type: 'heart_rate', min: 150, max: 160 }],
          },
          { kind: 'recovery', durationSeconds: 60 },
        ],
      },
    ];

    expect(fromStoredWorkout(rows(stored))).toStrictEqual(agent);
    // No strength key is added to what is stored
    expect(toStoredWorkout(agent)).toStrictEqual(stored);
  });

  const squatSet = (more: Partial<CreateWorkoutStepDto> = {}) => active(more);
  it.each<[string, CreateWorkoutStepDto[]]>([
    ['a repeat of one exercise, once', [repeatOf(1, [squatSet(), rest(90)])]],
    [
      'a plain repeat of several exercises',
      [repeatOf(3, [squatSet(), squatSet({ exerciseRef: 'c:lunge' })])],
    ],
    [
      'a named repeat of one exercise',
      [repeatOf(3, [squatSet()], { name: 'Heavy' })],
    ],
    [
      'an exercise that is not an active interval',
      [squatSet({ stepType: STEP.WARMUP })],
    ],
    [
      'a weight range',
      [
        squatSet({
          targets: [
            { targetType: TARGET.WEIGHT, targetMin: 60, targetMax: 70 },
          ],
        }),
      ],
    ],
    [
      'a target that is not a load',
      [
        squatSet({
          targets: [{ targetType: TARGET.ZONE, targetValue: 4 }],
        }),
      ],
    ],
    [
      'a rest with a name',
      [squatSet(), rest(60, { name: 'Breathe', notes: 'Walk' })],
    ],
    [
      'identical sets stored one by one',
      [squatSet(), rest(60), squatSet(), rest(60)],
    ],
    [
      'two rests in a row inside a group',
      [
        repeatOf(
          2,
          [
            squatSet(),
            rest(20),
            rest(30),
            squatSet({ exerciseRef: 'c:lunge' }),
          ],
          { kind: KIND.SUPERSET },
        ),
      ],
    ],
    [
      'an exercise whose name is null (blocks would store an empty name)',
      [squatSet({ name: null })],
    ],
    [
      'a repeat with notes',
      [repeatOf(3, [squatSet(), rest(60)], { notes: 'Heavy day' })],
    ],
    [
      'two targets of the same type',
      [
        squatSet({
          targets: [
            { targetType: TARGET.WEIGHT, targetValue: 80 },
            { targetType: TARGET.WEIGHT, targetValue: 60 },
          ],
        }),
      ],
    ],
  ])('reads %s step by step and writes it back unchanged', (_name, steps) => {
    const read = fromStoredWorkout(rows(steps));

    expect(read.every((item) => item.kind !== 'exercise')).toBe(true);
    expect(read.every((item) => item.kind !== 'group')).toBe(true);
    expect(persisted(roundTrip(steps))).toEqual(persisted(steps));
  });

  it('keeps the notes of a repeat read step by step', () => {
    const steps = [repeatOf(3, [squatSet(), rest(60)], { notes: 'Heavy day' })];

    expect(fromStoredWorkout(rows(steps))[0]).toMatchObject({
      kind: 'repeat',
      notes: 'Heavy day',
    });
  });

  it('reads a whole session step by step when one block is not clean', () => {
    const steps = [
      ...strengthSteps([strengthBlocks[1]]),
      squatSet({ exerciseRef: 'c:lunge', name: null }),
    ];
    const read = fromStoredWorkout(rows(steps));

    expect(read.some((item) => item.kind === 'exercise')).toBe(false);
    expect(persisted(roundTrip(steps))).toEqual(persisted(steps));
  });

  it.each<[string, CreateWorkoutStepDto[]]>([
    [
      'a repeat next to a single set of the same exercise',
      [repeatOf(3, [squatSet(), rest(60)]), squatSet()],
    ],
    [
      'endurance steps with a zone and a percent target in a strength session',
      [
        {
          stepType: STEP.WARMUP,
          name: null,
          notes: null,
          durationType: TIME,
          durationValue: 600,
          targets: [{ targetType: TARGET.ZONE, targetValue: 4 }],
        },
        ...strengthSteps([strengthBlocks[1]]),
        {
          stepType: STEP.COOLDOWN,
          name: null,
          notes: null,
          durationType: TIME,
          durationValue: 300,
          targets: [
            {
              targetType: TARGET.HEARTRATE,
              targetValue: 0.85,
              metricType: 'HR_MAX',
            },
          ],
        },
      ],
    ],
  ])('writes %s back unchanged', (_name, steps) => {
    expect(persisted(roundTrip(steps))).toEqual(persisted(steps));
  });

  it('reads stored values the input would refuse', () => {
    const odd = strengthSteps([
      {
        kind: 'exercise',
        exercise: exercise(squat, 'x'.repeat(200), [
          set(0.4, { load: -20, rpe: 0.5, rest: 37.5 }),
        ]),
      },
      {
        kind: 'group',
        group: KIND.EMOM,
        name: null,
        rounds: 500,
        intervalSeconds: 5,
        timeCapSeconds: null,
        roundRest: 7200,
        exercises: [exercise('c:burpee', 'Burpee', [set(6)])],
      },
    ]);
    const flat = fromStoredWorkout(
      rows([
        active({
          exerciseRef: 'zzz',
          tempo: 'fast',
          side: 'LEFT' as EXERCISE_SIDE,
          durationValue: 0,
          targets: [{ targetType: TARGET.WEIGHT, targetValue: -5 }],
        }),
      ]),
    );
    const blocks = fromStoredWorkout(rows(odd));

    expect(blocks[0].kind).toBe('exercise');
    for (const read of [blocks, flat]) {
      expect(workoutOutputSchema.safeParse(read).success).toBe(true);
      expect(workoutSchema.safeParse(read).success).toBe(false);
    }
  });

  it('accepts a rest of 0 and does not ask for roundRest for it', () => {
    const reps = (value: number, more: object = {}) => ({
      work: { type: 'REPS', value },
      ...more,
    });
    const lunges = [
      { exerciseRef: 'c:lunge', name: 'Lunge', sets: [reps(8)] },
      { exerciseRef: 'c:crunch', name: 'Crunch', sets: [reps(8, { rest: 0 })] },
    ];
    const workout = workoutSchema.parse([
      { kind: 'group', group: 'SUPERSET', rounds: 3, exercises: lunges },
    ]);

    expect(workoutProblems(workout)).toEqual([]);
    expect(toStoredWorkout(workout)).toStrictEqual(
      toStoredWorkout(
        workoutSchema.parse([
          {
            kind: 'group',
            group: 'SUPERSET',
            rounds: 3,
            exercises: [lunges[0], { ...lunges[1], sets: [reps(8)] }],
          },
        ]),
      ),
    );
  });

  it('keeps reps, weight ranges and the repeat kind on plain steps', () => {
    const steps = [
      active({ exerciseRef: null, name: 'Sled', tempo: null }),
      repeatOf(6, [active({ stepType: STEP.WARMUP }), rest(20)], {
        kind: KIND.EMOM,
        intervalSeconds: 90,
      }),
    ];
    const read = fromStoredWorkout(rows(steps));

    expect(read[0]).toEqual({
      kind: 'work',
      name: 'Sled',
      reps: 5,
      targets: [{ type: 'weight', min: 80 }],
    });
    expect(read[1]).toMatchObject({
      kind: 'repeat',
      times: 6,
      repeatKind: 'EMOM',
      intervalSeconds: 90,
    });
    expect(persisted(roundTrip(steps))).toEqual(persisted(steps));
  });

  it('does not round loads', () => {
    const read = fromStoredWorkout(rows(strengthStored));

    expect(JSON.stringify(read)).toContain('61.2349');
    expect(JSON.stringify(roundTrip(strengthStored))).toContain('61.2349');
  });

  it('refuses what storage would drop', () => {
    const reps = (value: number, more: object = {}) => ({
      work: { type: 'REPS', value },
      ...more,
    });
    const swing = (sets: object[]) => ({
      exerciseRef: 'c:kettlebell-swing',
      name: 'Swing',
      sets,
    });
    const problems = workoutProblems(
      workoutSchema.parse([
        {
          kind: 'group',
          group: 'SUPERSET',
          rounds: 3,
          exercises: [
            swing([reps(10), reps(10)]),
            swing([reps(10, { rest: 30 })]),
          ],
        },
        { kind: 'work', reps: 10, durationSeconds: 30 },
        {
          kind: 'repeat',
          times: 2,
          steps: [{ kind: 'work', reps: 5, distanceMeters: 100 }],
        },
        { kind: 'work', reps: 10 },
      ]),
    );

    expect(problems).toEqual([
      'workoutSteps[0].exercises[0]: group exercises take one set, done each round',
      'workoutSteps[0].exercises[1]: use roundRest for the rest after the last exercise',
      'workoutSteps[1]: give reps, durationSeconds or distanceMeters, not several',
      'workoutSteps[2].steps[0]: give reps, durationSeconds or distanceMeters, not several',
    ]);
  });

  it('checks formats and limits on what an agent writes', () => {
    const item = (more: object) => [
      {
        kind: 'exercise',
        exercise: {
          exerciseRef: squat,
          name: 'Squat',
          sets: [{ work: { type: 'REPS', value: 5 } }],
          ...more,
        },
      },
    ];

    expect(workoutSchema.safeParse(item({})).success).toBe(true);
    // The ref's format is checkExercises' to report, with the way to a valid one
    expect(
      workoutSchema.safeParse(item({ exerciseRef: 'squat' })).success,
    ).toBe(true);
    expect(
      workoutSchema.safeParse(item({ exerciseRef: 'c:' + 'x'.repeat(90) }))
        .success,
    ).toBe(false);
    // An empty ref would skip every check: it is not a ref
    expect(workoutSchema.safeParse(item({ exerciseRef: '' })).success).toBe(
      false,
    );
    expect(
      workoutSchema.safeParse([{ kind: 'work', reps: 5, exerciseRef: '' }])
        .success,
    ).toBe(false);
    expect(workoutSchema.safeParse(item({ tempo: '3-1' })).success).toBe(false);
    expect(workoutSchema.safeParse(item({ sets: [] })).success).toBe(false);
  });

  it('fills the name of exercises that have none and keeps a given one', () => {
    const exercise = (exerciseRef: string, name?: string) => ({
      exerciseRef,
      ...(name && { name }),
      sets: [{ work: { type: 'REPS' as const, value: 5 } }],
    });
    const workout = workoutSchema.parse([
      { kind: 'exercise', exercise: exercise('c:a') },
      { kind: 'exercise', exercise: exercise('c:b', 'My name') },
      {
        kind: 'group',
        group: 'SUPERSET',
        rounds: 3,
        exercises: [exercise('c:a'), exercise('u:7')],
      },
    ]);
    const named = withExerciseNames(
      workout,
      new Map([
        ['c:a', 'Alpha'],
        ['c:b', 'Beta'],
        ['u:7', 'Mine'],
      ]),
    );
    expect(summarizeWorkout(named)).toBe(
      '5 Alpha · 5 My name · superset 3×(5 Alpha, 5 Mine)',
    );
  });

  it('names flat steps and repeat children too, except those to keep unnamed', () => {
    const workout = workoutSchema.parse([
      { kind: 'work', reps: 5, exerciseRef: 'c:a' },
      { kind: 'work', reps: 5, exerciseRef: 'c:k' },
      {
        kind: 'repeat',
        times: 2,
        steps: [
          { kind: 'work', reps: 5, exerciseRef: 'c:a' },
          { kind: 'work', reps: 5, exerciseRef: 'c:a', name: 'Given' },
          { kind: 'recovery', durationSeconds: 30 },
        ],
      },
    ]);
    const named = withExerciseNames(
      workout,
      new Map([
        ['c:a', 'Alpha'],
        ['c:k', 'Kept'],
      ]),
      new Set(['c:k']),
    );
    expect(named).toMatchObject([
      { name: 'Alpha' },
      { exerciseRef: 'c:k' },
      { steps: [{ name: 'Alpha' }, { name: 'Given' }, { kind: 'recovery' }] },
    ]);
    expect((named[1] as { name?: string }).name).toBeUndefined();
  });

  it('collects an empty ref, so that it can be reported', () => {
    const workout = [
      { kind: 'work', reps: 5, exerciseRef: '' },
    ] as unknown as Workout;
    expect(exerciseRefsOf(workout)).toEqual(['']);
  });

  it('collects the exercise refs of items, groups, flat steps and repeats', () => {
    const sets = [{ work: { type: 'REPS' as const, value: 5 } }];
    const workout = workoutSchema.parse([
      { kind: 'exercise', exercise: { exerciseRef: 'c:a', sets } },
      {
        kind: 'group',
        group: 'CIRCUIT',
        rounds: 2,
        exercises: [
          { exerciseRef: 'c:b', sets },
          { exerciseRef: 'u:3', sets },
        ],
      },
      { kind: 'work', reps: 5, exerciseRef: 'c:c' },
      {
        kind: 'repeat',
        times: 3,
        steps: [{ kind: 'work', exerciseRef: 'c:d' }],
      },
      { kind: 'exercise', exercise: { exerciseRef: 'c:a', sets } },
      { kind: 'steady', durationSeconds: 60 },
    ]);
    expect(exerciseRefsOf(workout)).toEqual([
      'c:a',
      'c:b',
      'u:3',
      'c:c',
      'c:d',
    ]);
    expect(exerciseRefsOf(intervals)).toEqual([]);
  });

  it('reads sessions longer than the input limits', () => {
    const long = Array.from({ length: 80 }, (_, i) =>
      active({ name: `Set ${i}`, durationValue: 5 + i, exerciseRef: 'c:a' }),
    );
    const name = 'x'.repeat(120);
    const read = fromStoredWorkout(
      rows([
        ...long,
        active({ name, stepType: STEP.WARMUP, exerciseRef: 'c:b' }),
      ]),
    );

    expect(read).toHaveLength(81);
    expect(workoutOutputSchema.safeParse(read).success).toBe(true);
    expect(workoutSchema.safeParse(read).success).toBe(false);

    // A 120-character exercise name, read as an exercise item
    const named = fromStoredWorkout(
      rows(
        strengthSteps([
          {
            kind: 'exercise',
            exercise: exercise('u:3', name, [set(5, { load: 20 })]),
          },
        ]),
      ),
    );
    expect(named[0].kind).toBe('exercise');
    expect(workoutOutputSchema.safeParse(named).success).toBe(true);
    expect(workoutSchema.safeParse(named).success).toBe(true);
    // And the same name on a flat step, which the input takes as well
    expect(
      workoutSchema.safeParse([{ kind: 'work', name, reps: 5 }]).success,
    ).toBe(true);
  });

  it('summarizes a strength session on one line', () => {
    expect(summarizeWorkout(strengthRead)).toBe(
      [
        'warmup 10min',
        '3×5 Barbell full squat @ 80 kg, rest 1min30s',
        '10/8/6 Bench press @ 60/70/80 kg, rest 2min',
        '2×10 Split squat @ 61.23 kg',
        'superset 4×(8 Pull-up, 15 Push-up)',
        'emom 10×(12 Kettlebell swing @ 24 kg, 6 Burpee) every 1min',
        'amrap 12min (15 Air squat, 10 Sit-up)',
        'tabata 8×(20s Plank)',
        'circuit 3×(30s Rope jump, 12 Lunge, 20 Crunch)',
      ].join(' · '),
    );
    expect(
      summarizeWorkout([
        {
          kind: 'work',
          reps: 10,
          exerciseRef: 'c:sled-push',
          name: 'Sled push',
          targets: [{ type: 'weight', min: 40.123 }],
        },
        {
          kind: 'repeat',
          repeatKind: KIND.EMOM,
          times: 5,
          steps: [{ kind: 'recovery', durationSeconds: 30 }],
        },
        { kind: 'work', reps: 10, targets: [{ type: 'weight', min: 40 }] },
      ]),
    ).toBe(
      'work 10 reps Sled push @ 40.12 kg · emom 5×(recovery 30s) · work 10 reps @ 40 kg',
    );
  });

  it('counts the planned seconds of a strength session', () => {
    expect(workoutSeconds(strengthRead)).toBe(SESSION_SECONDS);
    expect(zoneIdsOf(strengthRead)).toEqual([]);
  });
});
