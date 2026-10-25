import { describe, expect, it } from 'vitest';

import { hasDistanceProgression } from './chart-x-axis';

describe('hasDistanceProgression', () => {
  it('rejects missing or empty streams', () => {
    expect(hasDistanceProgression(undefined)).toBe(false);
    expect(hasDistanceProgression(null)).toBe(false);
    expect(hasDistanceProgression([])).toBe(false);
  });

  it('rejects streams that never move', () => {
    expect(hasDistanceProgression([0, 0, 0, 0])).toBe(false);
    expect(hasDistanceProgression([0])).toBe(false);
    expect(hasDistanceProgression([1200, 1200])).toBe(false);
  });

  it('accepts streams with progression', () => {
    expect(hasDistanceProgression([0, 4.2, 9.8, 15])).toBe(true);
    expect(hasDistanceProgression([0, 0, 0, 3])).toBe(true);
  });
});
