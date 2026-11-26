import { describe, expect, it } from 'vitest';

import {
  CardiacBand,
  RangeSignal,
  cardiacScores,
  cardiacSeries,
  checkSummary,
  compareModels,
  compareWindows,
  rangeSignal,
  recoveryStatus,
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

describe('rangeSignal', () => {
  // 21 mornings between 45 and 55 ms
  const baseline = Array.from({ length: 21 }, (_, i) => 45 + (i % 3) * 5);

  it('needs four mornings in the week and two weeks before it', () => {
    expect(rangeSignal([50, 50, 50], baseline)).toBeNull();
    expect(rangeSignal([50, 50, 50, 50], baseline.slice(0, 13))).toBeNull();
  });

  it('places the week in the range of the weeks before', () => {
    const usual = rangeSignal([50, 49, 51, 50, 48], baseline, { log: true });
    expect(usual).toMatchObject({ state: 'NORMAL', days: 5 });
    // About 50 ms, give or take a few
    expect(usual!.low).toBeGreaterThan(45);
    expect(usual!.high).toBeLessThan(55);
    expect(usual!.week).toBeCloseTo(49.6, 0);

    expect(
      rangeSignal([40, 41, 39, 42, 40], baseline, { log: true })?.state,
    ).toBe('LOW');
    expect(
      rangeSignal([58, 60, 59, 61, 60], baseline, { log: true })?.state,
    ).toBe('HIGH');
  });
});

describe('recoveryStatus', () => {
  const signal = (state: RangeSignal['state']): RangeSignal => ({
    state,
    week: 50,
    low: 45,
    high: 55,
    days: 7,
  });

  it('is open without a measure, and follows a single one', () => {
    expect(recoveryStatus(null, null)).toBe('OPEN');
    expect(recoveryStatus(signal('LOW'), null)).toBe('WORSE');
    expect(recoveryStatus(signal('HIGH'), null)).toBe('BETTER');
    // A resting heart rate above the usual is the bad direction
    expect(recoveryStatus(null, signal('HIGH'))).toBe('WORSE');
    expect(recoveryStatus(null, signal('NORMAL'))).toBe('SAME');
  });

  it('wants variability and resting heart rate to agree', () => {
    expect(recoveryStatus(signal('LOW'), signal('HIGH'))).toBe('WORSE');
    expect(recoveryStatus(signal('HIGH'), signal('LOW'))).toBe('BETTER');
    expect(recoveryStatus(signal('LOW'), signal('NORMAL'))).toBe('SAME');
    expect(recoveryStatus(signal('LOW'), signal('LOW'))).toBe('SAME');
  });
});

describe('cardiacSeries', () => {
  it('scores every run of the span against the usual heart rate', () => {
    const row = (activityId: number, heartrate: number, band = 30) => ({
      activityId,
      band,
      seconds: 900,
      heartrate,
    });
    const { scores, referenceBand } = cardiacSeries([
      row(1, 150),
      row(2, 148),
      row(3, 146),
      row(4, 144),
      // A band three runs touched: too few to know its usual heart rate
      row(1, 160, 34),
      row(2, 160, 34),
      row(3, 160, 34),
    ]);
    expect(referenceBand).toBe(30);
    expect([...scores]).toEqual([
      [1, 3],
      [2, 1],
      [3, -1],
      [4, -3],
    ]);
  });
});

describe('checkSummary', () => {
  it('reads progress with what it costs', () => {
    expect(checkSummary(['BETTER', 'SAME', 'OPEN'], 'SAME')).toBe('WORKING');
    expect(checkSummary(['BETTER', 'SAME', 'OPEN'], 'WORSE')).toBe(
      'WORKING_COSTLY',
    );
    expect(checkSummary(['SAME', 'WORSE', 'OPEN'], 'BETTER')).toBe('DECLINING');
    expect(checkSummary(['SAME', 'WORSE', 'OPEN'], 'WORSE')).toBe(
      'DECLINING_TIRED',
    );
    expect(checkSummary(['BETTER', 'WORSE', 'SAME'], 'SAME')).toBe('MIXED');
  });

  it('says so when nothing moved, or nothing is known', () => {
    expect(checkSummary(['SAME', 'SAME', 'OPEN'], 'OPEN')).toBe('STABLE');
    expect(checkSummary(['SAME', 'OPEN', 'OPEN'], 'WORSE')).toBe(
      'STABLE_TIRED',
    );
    expect(checkSummary(['OPEN', 'OPEN', 'OPEN'], 'SAME')).toBe('OPEN');
  });
});
