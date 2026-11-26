import { describe, expect, it } from 'vitest';

import {
  KG_TO_LB,
  KM_TO_MI,
  METERS_PER_MILE,
  MS_TO_MPH,
  M_TO_YD,
  roundImperialDistance,
} from './units';

describe('conversion factors', () => {
  it('are exact, so a value converted back lands where it started', () => {
    expect(KM_TO_MI * METERS_PER_MILE).toBeCloseTo(1000, 10);
    expect(80 * KG_TO_LB).toBeCloseTo(176.3698, 4);
    expect((80 * KG_TO_LB) / KG_TO_LB).toBe(80);
    expect(1760 / M_TO_YD).toBeCloseTo(METERS_PER_MILE, 10);
    // 8:00/mi is 3.3528 m/s, 7.5 mph
    expect((METERS_PER_MILE / 480) * MS_TO_MPH).toBeCloseTo(7.5, 10);
  });
});

describe('roundImperialDistance', () => {
  it('reads distances typed in miles or yards in them', () => {
    expect(roundImperialDistance(1609.34)).toEqual({ value: 1, unit: 'mi' });
    expect(roundImperialDistance(402.34)).toEqual({ value: 0.25, unit: 'mi' });
    expect(roundImperialDistance(91.44)).toEqual({ value: 100, unit: 'yd' });
    expect(roundImperialDistance(457.2, true)).toEqual({
      value: 500,
      unit: 'yd',
    });
    // The swimmer's mile stays in yards in the pool
    expect(roundImperialDistance(1508.76, true)).toEqual({
      value: 1650,
      unit: 'yd',
    });
  });

  it('leaves metric distances metric', () => {
    for (const meters of [200, 400, 800, 1000, 5000, 10000, 21097.5, 42195])
      expect(roundImperialDistance(meters)).toBeNull();
    expect(roundImperialDistance(100, true)).toBeNull();
    expect(roundImperialDistance(0)).toBeNull();
  });
});
