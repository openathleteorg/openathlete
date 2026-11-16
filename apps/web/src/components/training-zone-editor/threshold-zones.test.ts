import { describe, expect, it, vi } from 'vitest';

import { TRAINING_ZONE_TYPE } from '@openathlete/shared';

import { thresholdZones } from './threshold-zones';
import { formatPace } from './zone-profiles';

// Every message renders as its key
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

const labels = {
  names: ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'],
  descriptions: ['Recovery', 'Endurance', 'Tempo', 'Threshold', 'VO2max'],
};

describe('thresholdZones', () => {
  it('splits power at 80, 88, 96 and 102% of FTP', () => {
    const zones = thresholdZones(TRAINING_ZONE_TYPE.POWER, 318, labels)!;
    expect(zones.map((zone) => [zone.min, zone.max])).toEqual([
      [0, 253],
      [254, 279],
      [280, 304],
      [305, 323],
      [324, 477],
    ]);
    expect(zones[3]).toMatchObject({ name: 'Z4', description: 'Threshold' });
  });

  it('leaves the top heart-rate zone open', () => {
    const zones = thresholdZones(TRAINING_ZONE_TYPE.HEARTRATE, 165, labels)!;
    expect(zones.map((zone) => [zone.min, zone.max])).toEqual([
      [0, 131],
      [132, 144],
      [145, 157],
      [158, 167],
      [168, 250],
    ]);
  });

  it('turns a threshold pace into five pace zones, slowest first', () => {
    // 4:10/km
    const zones = thresholdZones(TRAINING_ZONE_TYPE.PACE, 4 + 10 / 60, labels)!;
    expect(
      zones.map((zone) => `${formatPace(zone.min)}-${formatPace(zone.max)}`),
    ).toEqual([
      '5:20-8:20',
      '4:45-5:19',
      '4:28-4:44',
      '4:10-4:27',
      '3:08-4:09',
    ]);
  });

  it('needs a threshold', () => {
    expect(thresholdZones(TRAINING_ZONE_TYPE.POWER, 0, labels)).toBeNull();
    expect(thresholdZones(TRAINING_ZONE_TYPE.PACE, NaN, labels)).toBeNull();
  });
});
