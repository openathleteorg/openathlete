import {
  addUtcDays,
  advanceFitness,
  calculateTrimpFromAverage,
  calculateTrimpFromStream,
  estimatePlannedTrimp,
  getUtcWeekStart,
  startOfUtcDay,
  toUtcDateKey,
} from './training-load';

const HR_MAX = 190;
const HR_REST = 50;

describe('UTC date helpers', () => {
  it('keys a date by its UTC calendar day', () => {
    expect(toUtcDateKey(new Date('2026-05-04T23:30:00.000Z'))).toBe(
      '2026-05-04',
    );
  });

  it('truncates to UTC midnight', () => {
    expect(
      startOfUtcDay(new Date('2026-05-04T23:30:00.000Z')).toISOString(),
    ).toBe('2026-05-04T00:00:00.000Z');
  });

  it('adds whole UTC days across a DST change', () => {
    // Europe switches to summer time on 2026-03-29
    expect(
      addUtcDays(new Date('2026-03-28T00:00:00.000Z'), 2).toISOString(),
    ).toBe('2026-03-30T00:00:00.000Z');
  });

  it.each([
    ['2026-05-04T00:00:00.000Z', '2026-05-04T00:00:00.000Z'], // Monday
    ['2026-05-06T12:00:00.000Z', '2026-05-04T00:00:00.000Z'], // Wednesday
    ['2026-05-10T23:59:59.999Z', '2026-05-04T00:00:00.000Z'], // Sunday
    ['2026-05-11T00:00:00.000Z', '2026-05-11T00:00:00.000Z'], // next Monday
  ])('returns the UTC Monday of the week of %s', (input, expected) => {
    expect(getUtcWeekStart(new Date(input)).toISOString()).toBe(expected);
  });
});

describe('calculateTrimpFromAverage', () => {
  it('applies the male Banister formula', () => {
    const result = calculateTrimpFromAverage(150, 3600, HR_MAX, HR_REST);
    expect(result.value).toBeCloseTo(108.0954, 3);
    expect(result).toMatchObject({ avgHr: 150, duration: 3600 });
  });

  it('applies the female coefficients', () => {
    const result = calculateTrimpFromAverage(
      150,
      3600,
      HR_MAX,
      HR_REST,
      'female',
    );
    expect(result.value).toBeCloseTo(121.4991, 3);
  });

  it('returns 0 when average HR is at or below resting HR', () => {
    expect(calculateTrimpFromAverage(50, 3600, HR_MAX, HR_REST).value).toBe(0);
  });
});

describe('calculateTrimpFromStream', () => {
  it('matches the average-based TRIMP for a constant heart rate', () => {
    const time = Array.from({ length: 3601 }, (_, i) => i);
    const heartrate = time.map(() => 150);

    const result = calculateTrimpFromStream(
      { time, heartrate },
      HR_MAX,
      HR_REST,
    );

    expect(result.value).toBeCloseTo(108.0954, 3);
    expect(result.avgHr).toBe(150);
    expect(result.duration).toBe(3600);
  });

  it('ignores samples at or below resting HR', () => {
    const result = calculateTrimpFromStream(
      { time: [0, 60, 120], heartrate: [40, 40, 40] },
      HR_MAX,
      HR_REST,
    );
    expect(result).toMatchObject({ value: 0, avgHr: 0 });
  });

  it('throws without heart rate data', () => {
    expect(() =>
      calculateTrimpFromStream({ time: [0, 1] }, HR_MAX, HR_REST),
    ).toThrow('Heart rate or time data not available');
  });
});

describe('estimatePlannedTrimp', () => {
  const profile = { hrMax: HR_MAX, hrRest: HR_REST, gender: 'male' as const };

  it('equals the TRIMP of the session done at the heart rate of its RPE', () => {
    // RPE 5/10: 60% of the heart rate reserve, 134 bpm
    expect(estimatePlannedTrimp(3600, 0.5, profile)).toBeCloseTo(
      calculateTrimpFromAverage(134, 3600, HR_MAX, HR_REST).value,
    );
  });

  it('grows with the effort and the duration', () => {
    const easy = estimatePlannedTrimp(3600, 0.3, profile)!;
    const hard = estimatePlannedTrimp(3600, 0.8, profile)!;
    expect(hard).toBeGreaterThan(easy * 2);
    expect(estimatePlannedTrimp(7200, 0.3, profile)).toBeCloseTo(easy * 2);
  });

  it('assumes a moderate effort without a target RPE', () => {
    expect(estimatePlannedTrimp(3600, null, profile)).toBeCloseTo(
      estimatePlannedTrimp(3600, 0.5, profile)!,
    );
  });

  it('clamps an RPE given on the wrong scale', () => {
    expect(estimatePlannedTrimp(3600, 8, profile)).toBeCloseTo(
      estimatePlannedTrimp(3600, 1, profile)!,
    );
  });

  it('cannot estimate a session without a duration or a valid profile', () => {
    expect(estimatePlannedTrimp(null, 0.5, profile)).toBeNull();
    expect(estimatePlannedTrimp(0, 0.5, profile)).toBeNull();
    expect(
      estimatePlannedTrimp(3600, 0.5, { ...profile, hrMax: HR_REST }),
    ).toBeNull();
  });
});

describe('advanceFitness', () => {
  it('builds fatigue faster than fitness, and lets both decay at rest', () => {
    let state = { ctl: 0, atl: 0 };
    for (let day = 0; day < 7; day++) state = advanceFitness(state, 100);
    expect(state.atl).toBeGreaterThan(state.ctl);

    const rested = advanceFitness(state, 0);
    expect(rested.atl).toBeLessThan(state.atl);
    expect(rested.ctl).toBeLessThan(state.ctl);
    // Form (CTL - ATL) improves with rest
    expect(rested.ctl - rested.atl).toBeGreaterThan(state.ctl - state.atl);
  });
});
