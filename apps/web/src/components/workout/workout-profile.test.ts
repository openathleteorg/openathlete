import { describe, expect, it } from 'vitest';

import {
  METRIC_TYPE,
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
  TrainingZone,
  TrainingZoneValue,
  WorkoutDto,
  WorkoutStepDto,
  calculateWorkoutDistance,
  calculateWorkoutDuration,
  estimateStepDistanceFromDuration,
  paceToSpeed,
  readCalendarDisplay,
} from '@openathlete/shared';

import { buildZonesByType, flattenSteps } from './workout-profile';

const zone = (
  trainingZoneId: number,
  index: number,
  color: string,
  sports: SPORT_TYPE[] = [SPORT_TYPE.RUNNING],
) =>
  ({
    trainingZoneId,
    index,
    color,
    name: `Z${index + 1}`,
    type: TRAINING_ZONE_TYPE.HEARTRATE,
    values: [{ min: 100 + index * 10, max: 109 + index * 10, sports }],
  }) as unknown as TrainingZone & { values: TrainingZoneValue[] };

const step = (partial: Partial<WorkoutStepDto>): WorkoutStepDto =>
  ({
    orderIndex: 0,
    stepType: 'STEADY',
    durationType: 'TIME',
    targets: [],
    ...partial,
  }) as WorkoutStepDto;

describe('workout profile', () => {
  const zones = [
    zone(1, 0, '#aaa'),
    zone(5, 4, '#f00'),
    zone(9, 2, '#0f0', [SPORT_TYPE.CYCLING]),
  ];

  it('keeps the zones of the sport, in order', () => {
    const byType = buildZonesByType(zones, SPORT_TYPE.RUNNING);
    expect(byType[TRAINING_ZONE_TYPE.HEARTRATE].map((z) => z.id)).toEqual([
      1, 5,
    ]);
    expect(byType[TRAINING_ZONE_TYPE.POWER]).toEqual([]);
  });

  it('expands repeats into steps with their zone intensity and colour', () => {
    const segments = flattenSteps(
      [
        step({
          stepType: 'WARMUP',
          durationValue: 600,
          targets: [{ targetType: 'ZONE', targetValue: 1 }],
        }),
        step({
          stepType: 'REPEAT',
          durationType: 'OPEN',
          repeatBlock: {
            repetitions: 3,
            childSteps: [
              step({
                stepType: 'INTERVAL_ACTIVE',
                durationValue: 120,
                targets: [{ targetType: 'ZONE', targetValue: 5 }],
              }),
              step({ stepType: 'INTERVAL_REST', durationValue: 60 }),
            ],
          },
        }),
      ] as WorkoutStepDto[],
      buildZonesByType(zones, SPORT_TYPE.RUNNING),
      undefined,
      SPORT_TYPE.RUNNING,
    );

    expect(segments).toHaveLength(7);
    expect(segments[0]).toMatchObject({
      duration: 600,
      intensity: 0,
      color: '#aaa',
      isWarmup: true,
    });
    expect(segments[1]).toMatchObject({
      duration: 120,
      intensity: 4,
      color: '#f00',
    });
    expect(segments[6].startTime).toBe(600 + 2 * 180 + 120);
  });

  it('reads any stored display preference as a full one', () => {
    expect(readCalendarDisplay(null).card.profile).toBe(true);
    expect(
      readCalendarDisplay({ density: 'compact', card: { distance: false } }),
    ).toMatchObject({
      density: 'compact',
      card: { profile: true, distance: false, duration: true },
      summary: { form: true },
    });
    expect(readCalendarDisplay({ density: 'huge' }).density).toBe(
      'comfortable',
    );
  });

  it('estimates step distance from PACE and %VMA targets', () => {
    const paceStep = step({
      durationValue: 120,
      targets: [{ targetType: 'PACE', targetValue: paceToSpeed(4) }],
    });
    expect(Math.round(estimateStepDistanceFromDuration(paceStep)!)).toBe(500);

    const vmaStep = step({
      durationValue: 120,
      targets: [
        { targetType: 'PACE', targetValue: 1, metricType: METRIC_TYPE.VMA },
      ],
    });
    expect(
      Math.round(
        estimateStepDistanceFromDuration(vmaStep, {
          [METRIC_TYPE.VMA]: { value: 18 },
        })!,
      ),
    ).toBe(600);
  });

  it('estimates step distance from ZONE, HEARTRATE, POWER, and RPE targets using sport pace zones', () => {
    const paceZone = {
      trainingZoneId: 10,
      index: 3,
      type: TRAINING_ZONE_TYPE.PACE,
      values: [{ min: 3.8, max: 4.2, sports: [SPORT_TYPE.RUNNING] }],
    };
    const hrZone = {
      trainingZoneId: 11,
      index: 3,
      type: TRAINING_ZONE_TYPE.HEARTRATE,
      values: [{ min: 160, max: 175, sports: [SPORT_TYPE.RUNNING] }],
    };
    const powerZone = {
      trainingZoneId: 12,
      index: 3,
      type: TRAINING_ZONE_TYPE.POWER,
      values: [{ min: 280, max: 320, sports: [SPORT_TYPE.RUNNING] }],
    };

    const zoneStep = step({
      durationValue: 120,
      targets: [{ targetType: 'ZONE', targetValue: 10 }],
    });
    expect(
      Math.round(
        estimateStepDistanceFromDuration(
          zoneStep,
          undefined,
          SPORT_TYPE.RUNNING,
          [paceZone],
        )!,
      ),
    ).toBe(500);

    const hrStep = step({
      durationValue: 120,
      targets: [{ targetType: 'HEARTRATE', targetMin: 165, targetMax: 170 }],
    });
    expect(
      Math.round(
        estimateStepDistanceFromDuration(
          hrStep,
          undefined,
          SPORT_TYPE.RUNNING,
          [hrZone, paceZone],
        )!,
      ),
    ).toBe(500);

    const powerStep = step({
      durationValue: 120,
      targets: [{ targetType: 'POWER', targetValue: 300 }],
    });
    expect(
      Math.round(
        estimateStepDistanceFromDuration(
          powerStep,
          undefined,
          SPORT_TYPE.RUNNING,
          [powerZone, paceZone],
        )!,
      ),
    ).toBe(500);

    const rpeStep = step({
      durationValue: 120,
      targets: [{ targetType: 'RPE', targetValue: 8 }],
    });
    expect(
      Math.round(
        estimateStepDistanceFromDuration(
          rpeStep,
          undefined,
          SPORT_TYPE.RUNNING,
          [paceZone],
        )!,
      ),
    ).toBe(500);
  });

  it('uses Zone 1-2 average speed for untargeted steps of that sport', () => {
    const z1Pace = {
      trainingZoneId: 1,
      index: 0,
      type: TRAINING_ZONE_TYPE.PACE,
      values: [{ min: 5.5, max: 6.5, sports: [SPORT_TYPE.RUNNING] }],
    };
    const z2Pace = {
      trainingZoneId: 2,
      index: 1,
      type: TRAINING_ZONE_TYPE.PACE,
      values: [{ min: 4.5, max: 5.5, sports: [SPORT_TYPE.RUNNING] }],
    };
    const openStep = step({ durationValue: 120, targets: [] });
    expect(
      Math.round(
        estimateStepDistanceFromDuration(
          openStep,
          undefined,
          SPORT_TYPE.RUNNING,
          [z1Pace, z2Pace],
        )!,
      ),
    ).toBe(Math.round(120 * ((paceToSpeed(6) + paceToSpeed(5)) / 2)));
  });

  it('filters zones by sport and applies cycling speed for rides and virtual rides', () => {
    const runningZ1Pace = {
      trainingZoneId: 1,
      index: 0,
      type: TRAINING_ZONE_TYPE.PACE,
      values: [{ min: 5.5, max: 6.5, sports: [SPORT_TYPE.RUNNING] }],
    };
    const runningZ2Pace = {
      trainingZoneId: 2,
      index: 1,
      type: TRAINING_ZONE_TYPE.PACE,
      values: [{ min: 4.5, max: 5.5, sports: [SPORT_TYPE.RUNNING] }],
    };

    // 60 min untargeted ride ignores running pace zones and uses ~30 km/h (8.3 m/s -> 29,880 m)
    const ride60Min = step({ durationValue: 3600, targets: [] });
    expect(
      Math.round(
        estimateStepDistanceFromDuration(
          ride60Min,
          undefined,
          SPORT_TYPE.CYCLING,
          [runningZ1Pace, runningZ2Pace],
        )!,
      ),
    ).toBe(29880);

    // Rides keep the usual bike speed whatever the intensity: harder must
    // never look slower than easy
    const virtualRide200W = step({
      durationValue: 3600,
      targets: [{ targetType: 'POWER', targetValue: 200 }],
    });
    const rideAtHeartRate = step({
      durationValue: 3600,
      targets: [{ targetType: 'HEARTRATE', targetValue: 145 }],
    });
    const powerZone = {
      trainingZoneId: 3,
      index: 0,
      type: TRAINING_ZONE_TYPE.POWER,
      values: [{ min: 0, max: 120, sports: [] }],
    };
    for (const [ride, sport] of [
      [virtualRide200W, SPORT_TYPE.VIRTUAL_RIDE],
      [rideAtHeartRate, SPORT_TYPE.CYCLING],
    ] as const) {
      expect(
        Math.round(
          estimateStepDistanceFromDuration(ride, undefined, sport, [
            powerZone,
          ])!,
        ),
      ).toBe(29880);
    }
  });

  it('ignores the default heart-rate zones for untargeted runs', () => {
    // Every account starts with these: Zone 1 begins at 0 bpm
    const defaultHrZones = [
      [0, 131],
      [132, 142],
    ].map(([min, max], index) => ({
      trainingZoneId: 10 + index,
      index,
      type: TRAINING_ZONE_TYPE.HEARTRATE,
      values: [{ min, max, sports: [] }],
    }));
    const easyRun = step({ durationValue: 3600, targets: [] });
    expect(
      Math.round(
        estimateStepDistanceFromDuration(
          easyRun,
          undefined,
          SPORT_TYPE.RUNNING,
          defaultHrZones,
        )!,
      ),
    ).toBe(
      Math.round(
        estimateStepDistanceFromDuration(
          easyRun,
          undefined,
          SPORT_TYPE.RUNNING,
        )!,
      ),
    );
  });

  it('returns null when estimating distance for sports with showDistance = false', () => {
    const strengthStep = step({ durationValue: 600, targets: [] });
    expect(
      estimateStepDistanceFromDuration(
        strengthStep,
        undefined,
        SPORT_TYPE.STRENGTH,
      ),
    ).toBeNull();
  });

  it('keeps calculateWorkoutDuration identical to main for distance-based rides and swims with HR targets', () => {
    const ride40km = {
      steps: [
        step({
          durationType: 'DISTANCE',
          durationValue: 40000,
          targets: [
            { targetType: 'HEARTRATE', targetMin: 140, targetMax: 150 },
          ],
        }),
      ],
    };
    expect(
      Math.round(
        calculateWorkoutDuration(ride40km, {}, SPORT_TYPE.CYCLING)! / 60,
      ),
    ).toBe(80);

    const swim2000m = {
      steps: [
        step({
          durationType: 'DISTANCE',
          durationValue: 2000,
          targets: [
            {
              targetType: 'HEARTRATE',
              targetValue: 0.75,
              metricType: METRIC_TYPE.HR_MAX,
            },
          ],
        }),
      ],
    };
    expect(
      Math.round(
        calculateWorkoutDuration(swim2000m, {}, SPORT_TYPE.SWIMMING)! / 60,
      ),
    ).toBe(35);
  });

  it('includes estimated time-based step distances in calculateWorkoutDistance', () => {
    const paceStep = step({
      durationValue: 120,
      targets: [{ targetType: 'PACE', targetValue: paceToSpeed(4) }],
    });
    const workout: WorkoutDto = {
      eventTrainingId: 1,
      steps: [
        step({ durationType: 'DISTANCE', durationValue: 1000 }),
        step({
          stepType: 'REPEAT',
          durationType: 'OPEN',
          repeatBlock: { repetitions: 2, childSteps: [paceStep] },
        }),
      ],
    };
    expect(Math.round(calculateWorkoutDistance(workout)!)).toBe(2000);
  });
});
