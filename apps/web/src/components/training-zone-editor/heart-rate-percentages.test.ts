import { describe, expect, it } from 'vitest';

import {
  DEFAULT_HEART_RATE_PERCENTAGES,
  heartRateToPercentage,
  isValidMaxHeartRate,
  isValidRestingHeartRate,
  percentageToHeartRate,
} from './heart-rate-percentages';

/** How many zones contain each bpm from `from` to `to`. */
const coverage = (
  zones: { min: number; max: number }[],
  from: number,
  to: number,
) =>
  Array.from(
    { length: to - from + 1 },
    (_, i) =>
      zones.filter((z) => from + i >= z.min && from + i <= z.max).length,
  );

describe('percentage of maximum heart rate', () => {
  it('turns the defaults into zones 0 to 5, shared limits in the higher zone', () => {
    expect(
      DEFAULT_HEART_RATE_PERCENTAGES.map((range) =>
        percentageToHeartRate(range, 200),
      ),
    ).toEqual([
      { min: 0, max: 99 },
      { min: 100, max: 119 },
      { min: 120, max: 139 },
      { min: 140, max: 159 },
      { min: 160, max: 179 },
      { min: 180, max: 200 },
    ]);
  });

  it('covers every bpm exactly once for any maximum', () => {
    for (const hrMax of [163, 185, 191, 202]) {
      const zones = DEFAULT_HEART_RATE_PERCENTAGES.map((range) =>
        percentageToHeartRate(range, hrMax),
      );
      expect(new Set(coverage(zones, 0, hrMax))).toEqual(new Set([1]));
    }
  });

  it('calculates custom percentages', () => {
    expect(percentageToHeartRate({ min: 62.5, max: 75 }, 200)).toEqual({
      min: 125,
      max: 149,
    });
    expect(percentageToHeartRate({ min: 60, max: 70 }, 180)).toEqual({
      min: 108,
      max: 125,
    });
    // 100% is the only inclusive upper limit.
    expect(percentageToHeartRate({ min: 100, max: 100 }, 180)).toEqual({
      min: 180,
      max: 180,
    });
  });

  it('keeps bpm ranges unchanged through a round trip', () => {
    for (let hrMax = 1; hrMax <= 300; hrMax++) {
      for (let bpm = 0; bpm <= hrMax; bpm++) {
        const range = { min: bpm, max: Math.min(bpm + 8, hrMax) };
        expect(
          percentageToHeartRate(heartRateToPercentage(range, hrMax), hrMax),
        ).toEqual(range);
      }
    }
  });

  it('refuses invalid maximums and percentages', () => {
    for (const hrMax of [0, -1, NaN, Infinity, 200.5, 301]) {
      expect(() =>
        percentageToHeartRate({ min: 50, max: 60 }, hrMax),
      ).toThrow();
    }
    for (const range of [
      { min: -1, max: 60 },
      { min: 60, max: 50 },
      { min: 50, max: 101 },
      { min: 50, max: 50 },
      { min: NaN, max: 60 },
      // Too narrow to contain a whole bpm.
      { min: 50, max: 50.01 },
    ]) {
      expect(() => percentageToHeartRate(range, 185)).toThrow();
    }
    expect(() => heartRateToPercentage({ min: 190, max: 220 }, 185)).toThrow();
    expect(() => heartRateToPercentage({ min: 186, max: 220 }, 185)).toThrow();
    expect(() =>
      heartRateToPercentage({ min: 120.5, max: 130 }, 185),
    ).toThrow();
    expect(() => heartRateToPercentage({ min: 130, max: 120 }, 185)).toThrow();
  });
});

describe('percentage of heart-rate reserve', () => {
  it('adds a share of the reserve to resting heart rate', () => {
    // 60 + 60% × (195 − 60) = 141; 60 + 70% × 135 = 154.5.
    expect(percentageToHeartRate({ min: 60, max: 70 }, 195, 60)).toEqual({
      min: 141,
      max: 154,
    });
    expect(percentageToHeartRate({ min: 70, max: 80 }, 195, 60)).toEqual({
      min: 155,
      max: 167,
    });
    expect(percentageToHeartRate({ min: 90, max: 100 }, 195, 60)).toEqual({
      min: 182,
      max: 195,
    });
    expect(percentageToHeartRate({ min: 60, max: 70 }, 195, 50)).toEqual({
      min: 137,
      max: 151,
    });
  });

  it('covers resting to maximum exactly once and round-trips', () => {
    for (const hrMax of [163, 185, 195, 202]) {
      for (const hrRest of [40, 55, 60, 75]) {
        const zones = DEFAULT_HEART_RATE_PERCENTAGES.map((range) =>
          percentageToHeartRate(range, hrMax, hrRest),
        );
        expect(new Set(coverage(zones, hrRest, hrMax))).toEqual(new Set([1]));
        for (let bpm = hrRest; bpm <= hrMax; bpm++) {
          const range = { min: bpm, max: Math.min(bpm + 8, hrMax) };
          expect(
            percentageToHeartRate(
              heartRateToPercentage(range, hrMax, hrRest),
              hrMax,
              hrRest,
            ),
          ).toEqual(range);
        }
      }
    }
  });

  it('refuses invalid resting heart rates and ranges below it', () => {
    for (const hrRest of [-1, NaN, Infinity, 60.5, 195, 200]) {
      expect(() =>
        percentageToHeartRate({ min: 60, max: 70 }, 195, hrRest),
      ).toThrow();
      expect(() =>
        heartRateToPercentage({ min: 141, max: 154 }, 195, hrRest),
      ).toThrow();
    }
    expect(() => heartRateToPercentage({ min: 0, max: 59 }, 195, 60)).toThrow();
  });

  it('opens zones that reach past resting or maximum heart rate', () => {
    // The default zones every athlete gets start at 0 and end at 220 bpm.
    expect(heartRateToPercentage({ min: 0, max: 131 }, 190, 50)).toEqual({
      min: 0,
      max: 58.57,
    });
    expect(heartRateToPercentage({ min: 164, max: 220 }, 190, 50)).toEqual({
      min: 81.43,
      max: 100,
    });
    expect(heartRateToPercentage({ min: 164, max: 220 }, 190)).toEqual({
      min: 86.32,
      max: 100,
    });
  });
});

describe('reference heart rates', () => {
  it('accepts whole maximums up to 300 and resting rates below them', () => {
    expect([1, 190, 300].map(isValidMaxHeartRate)).toEqual([true, true, true]);
    expect([0, 301, 190.5].map(isValidMaxHeartRate)).toEqual([
      false,
      false,
      false,
    ]);
    expect(isValidRestingHeartRate(50, 190)).toBe(true);
    expect(isValidRestingHeartRate(189, 190)).toBe(true);
    expect(isValidRestingHeartRate(190, 190)).toBe(false);
    expect(isValidRestingHeartRate(0, 190)).toBe(false);
    expect(isValidRestingHeartRate(50, 0)).toBe(false);
  });
});
