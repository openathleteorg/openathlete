import { durabilityClasses } from './durability';

const outing = (hours: number, percent: number) => ({
  kind: 'DRIFT_PACE' as const,
  hours,
  percent,
});

describe('durabilityClasses', () => {
  it('gives the median of each length of outing', () => {
    const { series } = durabilityClasses([
      outing(1.1, 1),
      outing(1.2, 2),
      outing(1.3, 3),
    ]);
    expect(series[0].classes).toEqual([
      { fromHours: 1, low: 1.5, median: 2, high: 2.5, count: 3 },
    ]);
  });

  it('leaves out a class of too few outings, not the outings', () => {
    const outings = [outing(5, 12), outing(5.5, 15)];
    const { series, outings: kept } = durabilityClasses(outings);
    expect(series[0].classes).toEqual([]);
    expect(kept).toHaveLength(2);
  });

  it('keeps pace and heart rate apart', () => {
    const { series } = durabilityClasses([
      outing(1, 1),
      { kind: 'DRIFT_HEARTRATE', hours: 1, percent: 3 },
    ]);
    expect(series.map(({ kind }) => kind)).toEqual([
      'DRIFT_PACE',
      'DRIFT_HEARTRATE',
    ]);
  });
});
