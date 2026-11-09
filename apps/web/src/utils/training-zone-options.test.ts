import { describe, expect, it } from 'vitest';

import { SPORT_TYPE, TRAINING_ZONE_TYPE } from '@openathlete/shared';

import { zoneOptions } from './training-zone-options';

type Zones = NonNullable<Parameters<typeof zoneOptions>[0]>;

const zone = (
  trainingZoneId: number,
  index: number,
  type: TRAINING_ZONE_TYPE,
  sports: SPORT_TYPE[] = [],
) =>
  ({
    trainingZoneId,
    index,
    type,
    name: `Z${index + 1}`,
    description: '',
    color: 'green',
    values: [{ min: index * 10, max: index * 10 + 9, sports }],
  }) as unknown as Zones[number];

describe('zoneOptions', () => {
  it("lists the athlete's zones of the type, in order, with their ids", () => {
    const zones = [
      zone(12, 1, TRAINING_ZONE_TYPE.HEARTRATE),
      zone(11, 0, TRAINING_ZONE_TYPE.HEARTRATE),
      zone(20, 0, TRAINING_ZONE_TYPE.POWER),
    ];
    expect(
      zoneOptions(zones, TRAINING_ZONE_TYPE.HEARTRATE).map((z) => z.id),
    ).toEqual([11, 12]);
  });

  it('keeps the zones with bounds for the sport', () => {
    const zones = [
      zone(11, 0, TRAINING_ZONE_TYPE.HEARTRATE, [SPORT_TYPE.CYCLING]),
      zone(12, 1, TRAINING_ZONE_TYPE.HEARTRATE, [SPORT_TYPE.RUNNING]),
    ];
    expect(
      zoneOptions(zones, TRAINING_ZONE_TYPE.HEARTRATE, SPORT_TYPE.RUNNING).map(
        (z) => z.id,
      ),
    ).toEqual([12]);
  });

  it('offers no default zone: their ids belong to no athlete', () => {
    expect(zoneOptions(undefined, TRAINING_ZONE_TYPE.HEARTRATE)).toEqual([]);
    expect(zoneOptions([], TRAINING_ZONE_TYPE.HEARTRATE)).toEqual([]);
  });
});
