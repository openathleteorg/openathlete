import { describe, expect, it } from 'vitest';

import { splitGpsPath } from '@openathlete/shared';

import { computeHoverPin } from './map-hover';

describe('computeHoverPin', () => {
  it('places no marker on a GPS gap', () => {
    const gps = [[40, 1], [], [40, 2]];
    expect(
      computeHoverPin(gps, [0, 1, 2], { index: 1, time: 1 }),
    ).toBeUndefined();
    expect(computeHoverPin(gps, [0, 1, 2], { index: 2, time: 2 })).toEqual([
      [40, 2],
    ]);
  });

  it('ignores unavailable or invalid coordinates', () => {
    for (const point of [[], [Number.NaN, 1], [91, 1]])
      expect(
        computeHoverPin([point], [0], { index: 0, time: 0 }),
      ).toBeUndefined();
  });
});

describe('splitGpsPath', () => {
  it('splits the route instead of drawing a line across a gap', () => {
    expect(splitGpsPath([[40, 1], [40, 2], [], [], [41, 1], [41, 2]])).toEqual([
      [
        [40, 1],
        [40, 2],
      ],
      [
        [41, 1],
        [41, 2],
      ],
    ]);
    expect(splitGpsPath([[], []])).toEqual([]);
  });
});
