import { describe, expect, it } from 'vitest';

import {
  aerobicThresholdPower,
  missingTrainingFocusValues,
  modelTrainingFocus,
  powerAt,
  trainingFocusOf,
} from './training-focus';

describe('powerAt', () => {
  const curve = [
    { duration: 120, value: 346 },
    { duration: 300, value: 322 },
    { duration: 3600, value: 278 },
    { duration: 7200, value: 252 },
  ];

  it('reads between the two nearest records on a logarithmic time axis', () => {
    // log(180/120) / log(300/120) = 0.4425 of the way from 346 to 322 W
    expect(powerAt(curve, 180)).toBeCloseTo(335.38, 2);
    // log(4200/3600) / log 2 = 0.2224 of the way from 278 to 252 W
    expect(powerAt(curve, 4200)).toBeCloseTo(272.22, 2);
    expect(powerAt(curve, 300)).toBe(322);
  });

  it('reads less than a straight line in time on a convex curve', () => {
    const linear = 278 + ((252 - 278) * 600) / 3600;
    expect(powerAt(curve, 4200)).toBeLessThan(linear + 0.001);
    expect(powerAt(curve, 180)).toBeLessThan(346 + ((322 - 346) * 60) / 180);
  });

  it('gives nothing outside the records', () => {
    expect(powerAt(curve, 60)).toBeNull();
    expect(powerAt(curve, 9000)).toBeNull();
    expect(powerAt(curve.slice(0, 3), 4200)).toBeNull();
  });

  it('gives nothing when the records around are not maximal efforts', () => {
    // An easy two-hour run: 69 % of the hour, where all out keeps 84 %
    const easyLongRun = [
      { duration: 3600, value: 278 },
      { duration: 7200, value: 193 },
    ];
    expect(powerAt(easyLongRun, 4200)).toBeNull();
    // 84.1 % is just within duration^-0.25
    expect(
      powerAt(
        [
          { duration: 3600, value: 278 },
          { duration: 7200, value: 234 },
        ],
        4200,
      ),
    ).not.toBeNull();
  });

  it('gives nothing when the nearest records are too far apart', () => {
    // No 5-minute record: 2 to 10 minutes is too wide a gap for 3 minutes
    expect(
      powerAt(
        [
          { duration: 120, value: 346 },
          { duration: 600, value: 320 },
        ],
        180,
      ),
    ).toBeNull();
  });
});

describe('aerobicThresholdPower', () => {
  it('reads 70 minutes between two maximal efforts', () => {
    expect(
      aerobicThresholdPower([
        { duration: 3600, value: 278 },
        { duration: 7200, value: 252 },
      ]),
    ).toBeCloseTo(272.22, 2);
  });

  it('carries the hour on by Riegel when the two hours were easy', () => {
    // A mountain tour: 193 W over two hours after 278 W over the hour
    const power = aerobicThresholdPower([
      { duration: 1200, value: 335 },
      { duration: 3600, value: 278 },
      { duration: 7200, value: 193 },
    ]);
    // 278 × (70/60)^-0.07
    expect(power).toBeCloseTo(275.02, 2);
  });

  it('carries the hour on when there is no longer record', () => {
    expect(
      aerobicThresholdPower([
        { duration: 1200, value: 335 },
        { duration: 3600, value: 278 },
      ]),
    ).toBeCloseTo(275.02, 2);
  });

  it('needs the hour', () => {
    expect(
      aerobicThresholdPower([
        { duration: 1200, value: 335 },
        { duration: 7200, value: 252 },
      ]),
    ).toBeNull();
  });
});

describe('trainingFocusOf', () => {
  const ratios = (r1: number, r2: number, r3: number) => ({
    aerobicToVo2max: r1,
    aerobicToThreshold: r2,
    thresholdToVo2max: r3,
  });

  it('names the plan of each unambiguous rule of the test', () => {
    expect(trainingFocusOf(ratios(0.7, 0.82, 0.85))).toBe('AEROBIC_BASE');
    expect(trainingFocusOf(ratios(0.78, 0.88, 0.89))).toBe(
      'VO2MAX_THEN_THRESHOLD',
    );
    expect(trainingFocusOf(ratios(0.74, 0.88, 0.84))).toBe('THRESHOLD');
  });

  it('reads the overlap of the VO2max and threshold rules as threshold', () => {
    // r1 and r2 above, r3 below: both rules of the test match. The threshold
    // lags from both sides, close above the aerobic threshold and far below
    // VO2max
    expect(trainingFocusOf(ratios(0.78, 0.92, 0.85))).toBe('THRESHOLD');
  });

  it('names VO2max when it lags and the threshold does not', () => {
    // r2 below, r1 and r3 above: no rule of the test as written
    expect(trainingFocusOf(ratios(0.7652, 0.8302, 0.9217))).toBe('VO2MAX');
  });

  it('counts a ratio equal to its average as not above it', () => {
    expect(trainingFocusOf(ratios(0.7552, 0.865, 0.8754))).toBe('AEROBIC_BASE');
    expect(trainingFocusOf(ratios(0.77, 0.87, 0.8754))).toBe('THRESHOLD');
  });

  it('names one plan for every profile', () => {
    for (let r2 = 0.78; r2 <= 0.94; r2 += 0.005) {
      for (let r3 = 0.8; r3 <= 0.96; r3 += 0.005) {
        expect(trainingFocusOf(ratios(r2 * r3, r2, r3))).toMatch(
          /^(AEROBIC_BASE|VO2MAX_THEN_THRESHOLD|VO2MAX|THRESHOLD)$/,
        );
      }
    }
  });
});

describe('modelTrainingFocus', () => {
  it('follows the example of the test', () => {
    // 12.8 km/h at the aerobic threshold for 16.4 km/h at VO2max: 78.05%
    expect(
      modelTrainingFocus({
        aerobicThreshold: 12.8,
        lactateThreshold: 14,
        vo2max: 16.4,
      })?.ratios.aerobicToVo2max,
    ).toBe(0.7805);
  });

  it('gives the values, ratios, weaknesses and focus', () => {
    // 264 / 318 / 345 W: 76.5%, 83.0%, 92.2%
    expect(
      modelTrainingFocus({
        aerobicThreshold: 264,
        lactateThreshold: 318,
        vo2max: 345,
      }),
    ).toEqual({
      aerobicThreshold: 264,
      lactateThreshold: 318,
      vo2max: 345,
      ratios: {
        aerobicToVo2max: 0.7652,
        aerobicToThreshold: 0.8302,
        thresholdToVo2max: 0.9217,
      },
      weaknesses: ['VO2MAX'],
      focus: 'VO2MAX',
    });
  });

  it('flags clear weaknesses by the limits of the test', () => {
    expect(
      modelTrainingFocus({
        aerobicThreshold: 65,
        lactateThreshold: 82,
        vo2max: 100,
      })?.weaknesses,
    ).toEqual(['AEROBIC', 'THRESHOLD']);
  });

  it('needs the three values', () => {
    expect(
      modelTrainingFocus({
        aerobicThreshold: 0,
        lactateThreshold: 300,
        vo2max: 340,
      }),
    ).toBeNull();
  });
});

describe('missingTrainingFocusValues', () => {
  it('lists the values the records cannot give', () => {
    expect(
      missingTrainingFocusValues({
        aerobicThreshold: null,
        lactateThreshold: 300,
        vo2max: 0,
      }),
    ).toEqual(['AEROBIC_THRESHOLD', 'VO2MAX']);
    expect(
      missingTrainingFocusValues({
        aerobicThreshold: 250,
        lactateThreshold: 300,
        vo2max: 340,
      }),
    ).toEqual([]);
  });
});
