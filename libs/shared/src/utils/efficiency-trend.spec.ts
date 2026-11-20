import { describe, expect, it } from 'vitest';

import { efficiencyTrendChange } from './efficiency-trend';

const run = (day: number, factor: number | null, steady = true) => ({
  date: new Date(Date.UTC(2026, 9, day)),
  steady,
  factor,
});

describe('efficiencyTrendChange', () => {
  it('reads the move of the line over the steady runs', () => {
    expect(
      efficiencyTrendChange([run(1, 1.0), run(15, 1.05), run(29, 1.1)]),
    ).toBeCloseTo(0.1);
  });

  it('leaves the runs that were not steady out', () => {
    expect(
      efficiencyTrendChange([run(1, 1.0), run(10, 3, false), run(29, 1.0)]),
    ).toBeCloseTo(0);
  });

  it('needs two steady runs on different days', () => {
    expect(efficiencyTrendChange([run(1, 1.0)])).toBeNull();
    expect(efficiencyTrendChange([run(1, 1.0), run(1, 1.1)])).toBeNull();
    expect(efficiencyTrendChange([run(1, null), run(5, 1)])).toBeNull();
  });
});
