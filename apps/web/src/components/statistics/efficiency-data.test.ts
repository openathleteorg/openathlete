import { describe, expect, it } from 'vitest';

import {
  EFFICIENCY_WINDOW,
  efficiencyPoints,
  trendChange,
} from './efficiency-data';

const run = (day: number, values: Partial<Record<string, number | null>>) => ({
  eventId: day,
  name: `Run ${day}`,
  date: new Date(Date.UTC(2026, 0, day)),
  biomechanical: null,
  metabolic: null,
  total: null,
  factor: null,
  ...values,
});

describe('efficiencyPoints', () => {
  it('keeps the runs with the figure, with a straight trend', () => {
    const points = efficiencyPoints(
      {
        runs: [
          run(1, { total: 1.5 }),
          run(2, { factor: 1.2 }),
          run(3, { total: 1.7 }),
        ],
      },
      'total',
    );
    expect(points.map((point) => point.eventId)).toEqual([1, 3]);
    expect(points[0].trend).toBeCloseTo(1.5, 9);
    expect(points[1].trend).toBeCloseTo(1.7, 9);
    expect(points[1].average).toBeCloseTo(1.6, 9);
  });

  it('averages the last 28 runs only', () => {
    const runs = Array.from({ length: 30 }, (_, i) =>
      run(i + 1, { metabolic: i < 2 ? 1000 : 100 }),
    );
    const points = efficiencyPoints({ runs }, 'metabolic');
    expect(EFFICIENCY_WINDOW).toBe(28);
    expect(points[29].average).toBe(100);
    expect(points[27].average).toBeCloseTo((2 * 1000 + 26 * 100) / 28, 9);
  });

  it('reads the biomechanical figure in metres per kilojoule', () => {
    const [point] = efficiencyPoints(
      { runs: [run(1, { biomechanical: 0.0135 })] },
      'biomechanical',
    );
    expect(point.value).toBeCloseTo(13.5, 9);
  });
});

describe('trendChange', () => {
  it('gives the change of the trend from the first run to the last', () => {
    const points = efficiencyPoints(
      { runs: [run(1, { total: 1.6 }), run(11, { total: 1.68 })] },
      'total',
    );
    expect(trendChange(points)?.change).toBeCloseTo(0.05, 9);
    expect(trendChange(points.slice(0, 1))).toBeNull();
  });
});
