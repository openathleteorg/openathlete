import { describe, expect, it } from 'vitest';

import {
  CardiacBand,
  cardiacScores,
  compareModels,
  compareWindows,
} from './training-check';

describe('compareWindows', () => {
  it('stays open with too few values in a window', () => {
    expect(
      compareWindows([140, 141, 139], [150, 151, 149, 150], {
        higherIsBetter: false,
      }),
    ).toMatchObject({ status: 'OPEN', noise: null, counts: [3, 4] });
    expect(compareWindows([], [], { higherIsBetter: true })).toEqual({
      status: 'OPEN',
      current: null,
      previous: null,
      noise: null,
      counts: [0, 0],
    });
  });

  it('reads a change within the spread between runs as the same', () => {
    // Medians 146 and 147, runs 2 and 4 away from them: one beat is noise
    const result = compareWindows([142, 150, 144, 148], [143, 151, 145, 149], {
      higherIsBetter: false,
    });
    expect(result.status).toBe('SAME');
    expect(result.current).toBe(146);
    expect(result.previous).toBe(147);
    expect(result.noise).toBeCloseTo(1.4826 * 3, 6);
  });

  it('is not moved by one outing with a failing sensor', () => {
    // 44 beats below the usual: an average would call the others worse
    const result = compareWindows([1, -2, 3, -1, 1], [0, -44, 2, -3, 0], {
      higherIsBetter: false,
    });
    expect(result).toMatchObject({ status: 'SAME', current: 1, previous: 0 });
  });

  it('asks for more of a change when a window holds few runs', () => {
    // Runs 2 away from their median, medians 3 apart. With six and four
    // runs (the first real case) the medians are not sure enough; with
    // twelve a side they are
    const low = [138, 142, 138, 142];
    const high = [141, 145, 141, 145];
    expect(
      compareWindows([...low, 138, 142], high, { higherIsBetter: false })
        .status,
    ).toBe('SAME');
    expect(
      compareWindows([...low, ...low, ...low], [...high, ...high, ...high], {
        higherIsBetter: false,
      }).status,
    ).toBe('BETTER');
  });

  it('follows the direction that is better', () => {
    const lower = [140, 141, 139, 140];
    const higher = [146, 147, 145, 146];
    expect(
      compareWindows(lower, higher, { higherIsBetter: false }).status,
    ).toBe('BETTER');
    expect(
      compareWindows(higher, lower, { higherIsBetter: false }).status,
    ).toBe('WORSE');
    expect(compareWindows(higher, lower, { higherIsBetter: true }).status).toBe(
      'BETTER',
    );
  });

  it('takes fewer values when asked, as for long runs', () => {
    expect(
      compareWindows([4, 4.4], [7, 7.2], {
        higherIsBetter: false,
        minCount: 2,
      }).status,
    ).toBe('BETTER');
  });

  it('counts any change between values that never vary', () => {
    expect(
      compareWindows([5, 5, 5, 5], [6, 6, 6, 6], { higherIsBetter: true })
        .status,
    ).toBe('WORSE');
    expect(
      compareWindows([5, 5, 5, 5], [5, 5, 5, 5], { higherIsBetter: true })
        .status,
    ).toBe('SAME');
  });
});

describe('compareModels', () => {
  it('is open without a model on either side', () => {
    expect(compareModels(null, 4)).toBe('OPEN');
    expect(compareModels(4, null)).toBe('OPEN');
  });

  it('wants more than one percent', () => {
    expect(compareModels(318, 315)).toBe('SAME');
    expect(compareModels(320, 315)).toBe('BETTER');
    expect(compareModels(310, 315)).toBe('WORSE');
  });
});

describe('cardiacScores', () => {
  const band = (
    activityId: number,
    current: boolean,
    value: number,
    heartrate: number,
    seconds = 900,
  ): CardiacBand => ({ activityId, current, band: value, seconds, heartrate });

  it('compares heart rate band by band, not across outputs', () => {
    // Easy runs lately, hard ones before: heart rate fell only because the
    // output did, and no band was run in both windows
    const scores = cardiacScores([
      band(1, true, 20, 130),
      band(2, true, 20, 131),
      band(3, false, 30, 160),
      band(4, false, 30, 161),
    ]);
    expect(scores).toEqual({ current: [], previous: [], referenceBand: null });
  });

  it('scores each run against the usual heart rate at its outputs', () => {
    const scores = cardiacScores([
      band(1, true, 30, 142),
      band(2, true, 30, 144),
      band(3, false, 30, 148),
      band(4, false, 30, 150),
      // A second band, with less time: 4 beats lower lately as well
      band(1, true, 32, 150, 600),
      band(2, true, 32, 150, 600),
      band(3, false, 32, 154, 600),
      band(4, false, 32, 154, 600),
    ]);
    expect(scores.referenceBand).toBe(30);
    // Usual: 146 at band 30, 152 at band 32
    expect(scores.current).toEqual([
      (-4 * 900 - 2 * 600) / 1500,
      (-2 * 900 - 2 * 600) / 1500,
    ]);
    expect(scores.previous).toEqual([
      (2 * 900 + 2 * 600) / 1500,
      (4 * 900 + 2 * 600) / 1500,
    ]);
  });

  it('keeps walking out: bands far below the brisk output', () => {
    const scores = cardiacScores([
      band(1, true, 30, 142),
      band(2, true, 30, 144),
      band(3, false, 30, 148),
      band(4, false, 30, 150),
      // Hiking up a steep slope: little output, a heart rate of its own
      band(1, true, 4, 150, 3000),
      band(2, true, 4, 150, 3000),
      band(3, false, 4, 120, 3000),
      band(4, false, 4, 120, 3000),
    ]);
    expect(scores.referenceBand).toBe(30);
    expect(scores.current).toEqual([-4, -2]);
    expect(scores.previous).toEqual([2, 4]);
  });

  it('leaves out runs with little time in the shared bands', () => {
    const scores = cardiacScores([
      band(1, true, 30, 142),
      band(2, true, 30, 144),
      band(3, false, 30, 148),
      band(4, false, 30, 150),
      band(5, true, 30, 120, 120),
    ]);
    expect(scores.current).toHaveLength(2);
  });
});
