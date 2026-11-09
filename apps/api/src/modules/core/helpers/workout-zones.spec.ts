import {
  ZoneForMatching,
  equivalentZones,
  remapZoneTargets,
  remapZonesForAthlete,
  zoneTargetIds,
} from './workout-zones';

const COACH = 1;
const ATHLETE = 2;

const zone = (
  trainingZoneId: number,
  athleteId: number,
  index: number,
  type: ZoneForMatching['type'] = 'HEARTRATE',
  sports: ZoneForMatching['values'][number]['sports'] = [],
): ZoneForMatching => ({
  trainingZoneId,
  athleteId,
  type,
  index,
  values: [{ sports }],
});

// Five heart rate zones each, and two power zones for the athlete only
const ZONES: ZoneForMatching[] = [
  ...[0, 1, 2, 3, 4].map((index) => zone(100 + index, COACH, index)),
  ...[0, 1, 2, 3, 4].map((index) => zone(200 + index, ATHLETE, index)),
  zone(300, ATHLETE, 0, 'POWER'),
  zone(301, ATHLETE, 1, 'POWER'),
];

const zoneTarget = (targetValue: number) => ({
  targetType: 'ZONE',
  targetValue,
  targetMin: null,
  targetMax: null,
});

const steps = [
  { stepType: 'WARMUP', targets: [zoneTarget(100)] },
  {
    stepType: 'REPEAT',
    targets: [],
    repeatBlock: {
      repetitions: 4,
      childSteps: [
        {
          stepType: 'INTERVAL_ACTIVE',
          targets: [zoneTarget(103), { targetType: 'PACE', targetValue: 4 }],
        },
      ],
    },
  },
  { stepType: 'COOLDOWN', childSteps: [{ targets: [zoneTarget(101)] }] },
];

describe('zoneTargetIds', () => {
  it('collects the zones of every step, repeats and child steps included', () => {
    expect(zoneTargetIds(steps).sort()).toEqual([100, 101, 103]);
  });

  it('ignores other targets and empty zone targets', () => {
    expect(
      zoneTargetIds([
        {
          targets: [
            { targetType: 'PACE', targetValue: 4 },
            { targetType: 'ZONE', targetValue: null },
          ],
        },
      ]),
    ).toEqual([]);
  });
});

describe('equivalentZones', () => {
  it("maps a zone to the athlete's zone at the same position", () => {
    expect(equivalentZones([101, 104], ZONES, ATHLETE, 'RUNNING')).toEqual(
      new Map([
        [101, 201],
        [104, 204],
      ]),
    );
  });

  it("keeps the athlete's own zones", () => {
    expect(equivalentZones([202], ZONES, ATHLETE, 'RUNNING').get(202)).toBe(
      202,
    );
  });

  it('maps unknown ids, default zones and missing positions to null', () => {
    // The coach's third power zone: the athlete has two
    const coachPower = [0, 1, 2].map((index) =>
      zone(108 + index, COACH, index, 'POWER'),
    );
    expect(
      equivalentZones([-2, 999, 110], [...ZONES, ...coachPower], ATHLETE, null),
    ).toEqual(
      new Map([
        [-2, null],
        [999, null],
        [110, null],
      ]),
    );
  });

  it("ranks zones among the session sport's zones", () => {
    // The coach splits heart rate zones by sport; the athlete shares theirs
    const split = [
      zone(10, COACH, 0, 'HEARTRATE', ['CYCLING']),
      zone(11, COACH, 1, 'HEARTRATE', ['CYCLING']),
      zone(12, COACH, 2, 'HEARTRATE', ['RUNNING']),
      zone(13, COACH, 3, 'HEARTRATE', ['RUNNING']),
      zone(20, ATHLETE, 0, 'HEARTRATE', []),
      zone(21, ATHLETE, 1, 'HEARTRATE', []),
    ];
    expect(equivalentZones([13], split, ATHLETE, 'RUNNING').get(13)).toBe(21);
    // Without a sport, the rank among all zones of the type
    expect(equivalentZones([11], split, ATHLETE, null).get(11)).toBe(21);
  });
});

describe('remapZoneTargets', () => {
  it('rewrites zone ids and drops zones without an equivalent', () => {
    const mapping = new Map([
      [100, 200],
      [103, null],
      [101, 201],
    ]);
    const remapped = remapZoneTargets(steps, mapping);

    expect(zoneTargetIds(remapped).sort()).toEqual([200, 201]);
    expect(remapped[1].repeatBlock?.childSteps[0].targets).toEqual([
      { targetType: 'PACE', targetValue: 4 },
    ]);
    expect(remapped[1].repeatBlock?.repetitions).toBe(4);
    // The source is left as it was
    expect(zoneTargetIds(steps).sort()).toEqual([100, 101, 103]);
  });
});

describe('with the database', () => {
  const prisma = (zones: ZoneForMatching[]) => ({
    trainingZone: {
      findMany: jest.fn(
        async ({
          where,
        }: {
          where: {
            athleteId?: number | { in: number[] };
            trainingZoneId?: { in: number[] };
          };
        }) =>
          zones.filter(
            (z) =>
              (where.trainingZoneId === undefined ||
                where.trainingZoneId.in.includes(z.trainingZoneId)) &&
              (where.athleteId === undefined ||
                (typeof where.athleteId === 'number'
                  ? z.athleteId === where.athleteId
                  : where.athleteId.in.includes(z.athleteId))),
          ),
      ),
    },
  });
  type Client = Parameters<typeof remapZonesForAthlete>[0];
  const remap = (steps: object[], client = prisma(ZONES)) =>
    remapZonesForAthlete(
      client as unknown as Client,
      ATHLETE,
      'RUNNING',
      steps,
    );

  it("keeps the athlete's own zones", async () => {
    const remapped = await remap([{ targets: [zoneTarget(201)] }]);
    expect(zoneTargetIds(remapped)).toEqual([201]);
  });

  it('drops default zones and unknown ids, and keeps the step', async () => {
    const remapped = await remap([
      {
        stepType: 'STEADY',
        targets: [
          zoneTarget(-1),
          zoneTarget(999),
          { targetType: 'PACE', targetValue: 4 },
        ],
      },
    ]);
    expect(remapped).toEqual([
      { stepType: 'STEADY', targets: [{ targetType: 'PACE', targetValue: 4 }] },
    ]);
  });

  it('skips the query without zone targets', async () => {
    const client = prisma(ZONES);
    await remap([{ targets: [{ targetType: 'OPEN' }] }], client);
    expect(client.trainingZone.findMany).not.toHaveBeenCalled();
  });

  it("keeps the lower zone of a range, remapped to the athlete's", async () => {
    // An AI warm-up "from the coach's zone 2 to their zone 3"
    const remapped = await remap([
      {
        stepType: 'WARMUP',
        targets: [
          {
            targetType: 'ZONE',
            targetValue: null,
            targetMin: 101,
            targetMax: 102,
          },
        ],
      },
    ]);
    expect(remapped).toEqual([
      {
        stepType: 'WARMUP',
        targets: [
          {
            targetType: 'ZONE',
            targetValue: 201,
            targetMin: null,
            targetMax: null,
          },
        ],
      },
    ]);
  });

  it("remaps a coach's workout to the athlete's zones", async () => {
    const remapped = await remapZonesForAthlete(
      prisma(ZONES) as unknown as Client,
      ATHLETE,
      'RUNNING',
      steps,
    );
    expect(zoneTargetIds(remapped).sort()).toEqual([200, 201, 203]);
  });
});
