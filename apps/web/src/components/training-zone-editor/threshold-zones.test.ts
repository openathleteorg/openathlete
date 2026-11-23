import { describe, expect, it, vi } from 'vitest';

import { TRAINING_ZONE_TYPE } from '@openathlete/shared';

import { thresholdZones } from './threshold-zones';
import {
  ZONE_MODELS,
  ZoneModelTable,
  customTable,
  mergedTable,
} from './zone-models';
import { formatPace } from './zone-profiles';

// Every message renders as its key
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

const label = (zone: ZoneModelTable['zones'][number]) => ({
  name: `Z${zone.id}`,
  description: zone.role,
});
const table = (
  id: string,
  type: TRAINING_ZONE_TYPE,
  sport: 'run' | 'bike' | null = null,
) =>
  ZONE_MODELS.find((model) => model.id === id)!.tables.find(
    (t) => t.type === type && t.sport === sport,
  )!;
const limits = (zones: { min: number; max: number }[]) =>
  zones.map((zone) => [zone.min, zone.max]);

describe('thresholdZones', () => {
  it('splits power at limits set by hand, 80, 88, 96 and 102 %', () => {
    const zones = thresholdZones(
      TRAINING_ZONE_TYPE.POWER,
      318,
      customTable(TRAINING_ZONE_TYPE.POWER, [0.8, 0.88, 0.96, 1.02])!,
      label,
    )!;
    expect(limits(zones)).toEqual([
      [0, 253],
      [254, 279],
      [280, 304],
      [305, 323],
      [324, 477],
    ]);
    expect(zones[3]).toMatchObject({ name: 'Z4', description: 'threshold' });
  });

  it("gives Friel's seven run heart-rate zones, the top one open", () => {
    const zones = thresholdZones(
      TRAINING_ZONE_TYPE.HEARTRATE,
      170,
      table('friel', TRAINING_ZONE_TYPE.HEARTRATE, 'run'),
      label,
    )!;
    // < 85, 85-89, 90-94, 95-99, 100-102, 103-106, > 106 % of 170 bpm
    expect(limits(zones)).toEqual([
      [0, 144],
      [145, 152],
      [153, 161],
      [162, 169],
      [170, 174],
      [175, 181],
      [182, 250],
    ]);
    expect(zones.map((zone) => zone.name)).toEqual([
      'Z1',
      'Z2',
      'Z3',
      'Z4',
      'Z5a',
      'Z5b',
      'Z5c',
    ]);
  });

  it("gives Coggan's seven power levels, with room for sprints", () => {
    const zones = thresholdZones(
      TRAINING_ZONE_TYPE.POWER,
      250,
      table('coggan', TRAINING_ZONE_TYPE.POWER, 'bike'),
      label,
    )!;
    expect(limits(zones)).toEqual([
      [0, 139],
      [140, 189],
      [190, 227],
      [228, 264],
      [265, 302],
      [303, 377],
      [378, 502],
    ]);
  });

  it("gives Palladino's ten zones and Vance's seven", () => {
    const palladino = thresholdZones(
      TRAINING_ZONE_TYPE.POWER,
      300,
      table('palladino', TRAINING_ZONE_TYPE.POWER, 'run'),
      label,
    )!;
    expect(palladino.map((zone) => zone.min)).toEqual([
      0, 195, 225, 243, 264, 285, 306, 318, 351, 453,
    ]);
    const vance = thresholdZones(
      TRAINING_ZONE_TYPE.POWER,
      300,
      table('vance', TRAINING_ZONE_TYPE.POWER, 'run'),
      label,
    )!;
    expect(vance.map((zone) => zone.min)).toEqual([
      0, 243, 267, 288, 318, 348, 387,
    ]);
  });

  it("gives Stryd's five zones of critical power", () => {
    const zones = thresholdZones(
      TRAINING_ZONE_TYPE.POWER,
      300,
      table('stryd', TRAINING_ZONE_TYPE.POWER, 'run'),
      label,
    )!;
    // Easy up to 80 %, Moderate 80-90, Threshold 90-100, Interval 100-115,
    // Repetition from 115 %
    expect(limits(zones)).toEqual([
      [0, 239],
      [240, 269],
      [270, 299],
      [300, 344],
      [345, 450],
    ]);
    expect(zones.map((zone) => zone.description)).toEqual([
      'endurance',
      'tempo',
      'threshold',
      'vo2max',
      'anaerobic',
    ]);
  });

  it('turns a threshold pace into pace zones, slowest first', () => {
    // 4:10/km, limits set by hand
    const custom = thresholdZones(
      TRAINING_ZONE_TYPE.PACE,
      4 + 10 / 60,
      customTable(TRAINING_ZONE_TYPE.PACE, [1.28, 1.14, 1.07, 1])!,
      label,
    )!;
    expect(
      custom.map((zone) => `${formatPace(zone.min)}-${formatPace(zone.max)}`),
    ).toEqual([
      '5:20-8:20',
      '4:45-5:19',
      '4:28-4:44',
      '4:10-4:27',
      '3:08-4:09',
    ]);
    // By Friel: seven zones, 5a from 99 % to 97 % of the threshold pace
    const friel = thresholdZones(
      TRAINING_ZONE_TYPE.PACE,
      4 + 10 / 60,
      table('friel', TRAINING_ZONE_TYPE.PACE, 'run'),
      label,
    )!;
    expect(friel).toHaveLength(7);
    expect(`${formatPace(friel[4].min)}-${formatPace(friel[4].max)}`).toBe(
      '4:03-4:07',
    );
  });

  it('needs a threshold and a table of the zone type', () => {
    const power = table('coggan', TRAINING_ZONE_TYPE.POWER, 'bike');
    expect(
      thresholdZones(TRAINING_ZONE_TYPE.POWER, 0, power, label),
    ).toBeNull();
    expect(thresholdZones(TRAINING_ZONE_TYPE.PACE, 4, power, label)).toBeNull();
  });
});

describe('mergedTable', () => {
  it("merges Friel's 5a, 5b and 5c into zone 5", () => {
    const merged = mergedTable(
      table('friel', TRAINING_ZONE_TYPE.HEARTRATE, 'run'),
    );
    expect(merged.zones.map((zone) => zone.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);
    expect(merged.starts).toEqual([0, 0.85, 0.9, 0.95, 1]);
  });

  it("merges Palladino's sub-zones where his zones meet Coggan's", () => {
    const merged = mergedTable(
      table('palladino', TRAINING_ZONE_TYPE.POWER, 'run'),
    );
    // 1A-1C, 2, 3A, 3B with 4, then 5 to 7 from 106 %
    expect(merged.starts).toEqual([0, 0.81, 0.88, 0.95, 1.06]);
  });

  it('keeps the pace limits between the merged zones', () => {
    const merged = mergedTable(table('friel', TRAINING_ZONE_TYPE.PACE, 'run'));
    expect(merged.paceLimits).toEqual([1.29, 1.14, 1.06, 0.99]);
  });

  it('merges every model into five zones', () => {
    for (const model of ZONE_MODELS)
      for (const t of model.tables) {
        const merged = mergedTable(t);
        expect(merged.zones).toHaveLength(5);
        const limitsOf = merged.starts ?? merged.paceLimits!;
        expect(limitsOf).toHaveLength(merged.starts ? 5 : 4);
        expect(
          thresholdZones(t.type, t.type === 'PACE' ? 4.5 : 250, merged, label),
        ).toHaveLength(5);
      }
  });

  it('lists every model with as many limits as zones', () => {
    for (const model of ZONE_MODELS)
      for (const t of model.tables) {
        if (t.starts) expect(t.starts).toHaveLength(t.zones.length);
        else expect(t.paceLimits).toHaveLength(t.zones.length - 1);
      }
  });
});
