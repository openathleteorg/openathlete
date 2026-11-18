import { describe, expect, it } from 'vitest';

import {
  EFFICIENCY_WINDOW,
  efficiencyPoints,
  trendChange,
} from './efficiency-data';

const run = (
  day: number,
  values: Partial<Record<string, number | null | boolean>>,
) => ({
  eventId: day,
  name: `Run ${day}`,
  date: new Date(Date.UTC(2026, 0, day)),
  steady: true,
  factor: null,
  powerFactor: null,
  effectiveness: null,
  decoupling: null,
  ...values,
});
const data = (runs: ReturnType<typeof run>[]) => ({ runs, hasWeight: true });

describe('efficiencyPoints', () => {
  it('keeps the runs with the figure, with a straight trend', () => {
    const points = efficiencyPoints(
      data([
        run(1, { factor: 1.5 }),
        run(2, { powerFactor: 2.1 }),
        run(3, { factor: 1.7 }),
      ]),
      'factor',
    );
    expect(points.map((point) => point.eventId)).toEqual([1, 3]);
    expect(points[0].trend).toBeCloseTo(1.5, 9);
    expect(points[1].trend).toBeCloseTo(1.7, 9);
    expect(points[1].average).toBeCloseTo(1.6, 9);
  });

  it('leaves runs that were not steady out of the average and the trend', () => {
    const points = efficiencyPoints(
      data([
        run(1, { factor: 1.5 }),
        // Intervals read high on their own
        run(2, { factor: 2.4, steady: false }),
        run(3, { factor: 1.7 }),
      ]),
      'factor',
    );
    expect(points[1]).toMatchObject({ value: null, other: 2.4 });
    expect(points[1].average).toBeCloseTo(1.5, 9);
    expect(points[2].average).toBeCloseTo(1.6, 9);
    expect(points[1].trend).toBeCloseTo(1.6, 9);
  });

  it('averages the last 28 steady runs only', () => {
    const runs = Array.from({ length: 30 }, (_, i) =>
      run(i + 1, { powerFactor: i < 2 ? 10 : 2 }),
    );
    const points = efficiencyPoints(data(runs), 'powerFactor');
    expect(EFFICIENCY_WINDOW).toBe(28);
    expect(points[29].average).toBe(2);
    expect(points[27].average).toBeCloseTo((2 * 10 + 26 * 2) / 28, 9);
  });

  it('draws no trend from a single steady run', () => {
    const points = efficiencyPoints(
      data([
        run(1, { decoupling: 3 }),
        run(2, { decoupling: 8, steady: false }),
      ]),
      'decoupling',
    );
    expect(points.map((point) => point.trend)).toEqual([null, null]);
  });
});

describe('trendChange', () => {
  it('gives the change of the trend from the first steady run to the last', () => {
    const points = efficiencyPoints(
      data([
        run(1, { effectiveness: 0.96 }),
        run(5, { effectiveness: 1.3, steady: false }),
        run(11, { effectiveness: 1.008 }),
      ]),
      'effectiveness',
    );
    expect(trendChange(points)?.change).toBeCloseTo(0.05, 9);
    expect(trendChange(points.slice(0, 1))).toBeNull();
  });
});
