import { describe, expect, it } from 'vitest';

import { modelTrainingFocus, powerAt } from './training-focus';

describe('powerAt', () => {
  const curve = [
    { duration: 120, value: 346 },
    { duration: 300, value: 342 },
    { duration: 3600, value: 278 },
    { duration: 7200, value: 193 },
  ];

  it('reads between the two nearest records', () => {
    expect(powerAt(curve, 180)).toBeCloseTo(344.67, 2);
    expect(powerAt(curve, 4200)).toBeCloseTo(263.83, 2);
    expect(powerAt(curve, 300)).toBe(342);
  });

  it('gives nothing outside the records', () => {
    expect(powerAt(curve, 60)).toBeNull();
    expect(powerAt(curve, 9000)).toBeNull();
    expect(powerAt(curve.slice(0, 3), 4200)).toBeNull();
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

  it('applies each rule of the test', () => {
    const focus = (a: number, t: number, v: number) =>
      modelTrainingFocus({
        aerobicThreshold: a,
        lactateThreshold: t,
        vo2max: v,
      });
    // 70/100, 70/85: both below average
    expect(focus(70, 85, 100)).toMatchObject({
      focus: 'AEROBIC_BASE',
      byRule: true,
    });
    // 78/100, 78/89, 89/100: all above
    expect(focus(78, 89, 100)).toMatchObject({
      focus: 'VO2MAX_THEN_THRESHOLD',
      byRule: true,
    });
    // 78/100 above, 85/100 below
    expect(focus(78, 85, 100)).toMatchObject({ focus: 'VO2MAX', byRule: true });
    // 74/100 below, 74/84 above, 84/100 below
    expect(focus(74, 84, 100)).toMatchObject({
      focus: 'THRESHOLD',
      byRule: true,
    });
  });

  it('answers the profile no rule covers with the clearest weakness', () => {
    // 264 / 318 / 345 W: 76.5%, 83.0%, 92.2%
    const result = modelTrainingFocus({
      aerobicThreshold: 264,
      lactateThreshold: 318,
      vo2max: 345,
    });
    expect(result).toMatchObject({
      ratios: {
        aerobicToVo2max: 0.7652,
        aerobicToThreshold: 0.8302,
        thresholdToVo2max: 0.9217,
      },
      weaknesses: ['VO2MAX'],
      focus: 'VO2MAX',
      byRule: false,
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
