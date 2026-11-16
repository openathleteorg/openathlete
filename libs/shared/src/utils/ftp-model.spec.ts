import { describe, expect, it } from 'vitest';

import { modelFtp } from './ftp-model';

const effort = (duration: number, value: number, day = '2026-11-01') => ({
  duration,
  value,
  date: new Date(`${day}T08:00:00Z`),
  eventId: duration,
  activityName: `${duration / 60} min`,
});

describe('modelFtp', () => {
  it('takes 95% of the best 20 minutes', () => {
    expect(modelFtp([effort(1200, 335), effort(300, 342)])).toMatchObject({
      value: 318,
      duration: 1200,
      power: 335,
      factor: 0.95,
    });
  });

  it('takes the best hour when it is higher', () => {
    expect(modelFtp([effort(1200, 300), effort(3600, 290)])).toMatchObject({
      value: 290,
      duration: 3600,
      eventId: 3600,
    });
  });

  it('keeps the 20 minutes when the hour was easier', () => {
    expect(modelFtp([effort(1200, 335), effort(3600, 278)])?.value).toBe(318);
  });

  it('gives nothing without a 20-minute or hour effort', () => {
    expect(modelFtp([effort(300, 400)])).toBeNull();
    expect(modelFtp([])).toBeNull();
  });
});
