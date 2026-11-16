import { isPlausibleRecord } from './record-plausibility';

describe('isPlausibleRecord', () => {
  it('refuses a run faster than any human', () => {
    expect(
      isPlausibleRecord(
        { type: 'SPEED', distance: 1000, value: 90 },
        'RUNNING',
      ),
    ).toBe(false);
  });

  it('keeps the same time on a bike', () => {
    expect(
      isPlausibleRecord(
        { type: 'SPEED', distance: 1000, value: 90 },
        'CYCLING',
      ),
    ).toBe(true);
  });

  it('keeps a fast amateur', () => {
    expect(
      isPlausibleRecord(
        { type: 'SPEED', distance: 5000, value: 1000 },
        'TRAIL_RUNNING',
      ),
    ).toBe(true);
  });

  it('refuses impossible power and heart rate', () => {
    expect(
      isPlausibleRecord(
        { type: 'POWER', duration: 3600, value: 900 },
        'CYCLING',
      ),
    ).toBe(false);
    expect(
      isPlausibleRecord(
        { type: 'HEARTRATE', duration: 60, value: 255 },
        'RUNNING',
      ),
    ).toBe(false);
  });
});

describe('climbing speed records', () => {
  it('keeps what a fast mountain runner climbs, not a lift', () => {
    const vam = (duration: number, value: number) =>
      isPlausibleRecord(
        { type: 'VERTICAL_SPEED', duration, value },
        'TRAIL_RUNNING',
      );
    expect(vam(1800, 1500)).toBe(true);
    expect(vam(1800, 2500)).toBe(false);
    expect(vam(60, 2900)).toBe(true);
  });
});
