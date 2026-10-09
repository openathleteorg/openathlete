import { describe, expect, it } from 'vitest';

import {
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
  TrainingZone,
  TrainingZoneValue,
  WorkoutStepDto,
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
});
