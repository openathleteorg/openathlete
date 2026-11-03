import { SPORT_TYPE, createWorkoutSchema } from '@openathlete/shared';

import {
  Workout,
  fromStoredWorkout,
  paceToSpeed,
  speedToPace,
  summarizeWorkout,
  toStoredWorkout,
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
