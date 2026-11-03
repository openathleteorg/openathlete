import { describe, expect, it } from 'vitest';

import {
  INITIAL_DURATION_MODE,
  adoptDuration,
  followWorkoutTotal,
  plannedEndDate,
} from './planned-duration';

const AUTO = { manual: false, settled: true };
const MANUAL = { manual: true, settled: true };

describe('followWorkoutTotal', () => {
  it('fills a new session with the workout total', () => {
    expect(followWorkoutTotal(INITIAL_DURATION_MODE, null, 1440)).toEqual({
      mode: AUTO,
      goalDuration: 1440,
    });
  });

  it('keeps the duration a session was saved with when it differs', () => {
    // A 45' swim whose steps add up to 24'
    expect(followWorkoutTotal(INITIAL_DURATION_MODE, 2700, 1440)).toEqual({
      mode: MANUAL,
    });
  });

  it('follows the workout when the saved duration was its total', () => {
    expect(followWorkoutTotal(INITIAL_DURATION_MODE, 1440, 1440)).toEqual({
      mode: AUTO,
    });
    // Within a minute: rounding, not a choice
    expect(followWorkoutTotal(INITIAL_DURATION_MODE, 1450, 1440)).toEqual({
      mode: AUTO,
      goalDuration: 1440,
    });
  });

  it('waits for steps before deciding', () => {
    expect(followWorkoutTotal(INITIAL_DURATION_MODE, 2700, null)).toEqual({
      mode: INITIAL_DURATION_MODE,
    });
  });

  it('follows step changes until the duration is set by hand', () => {
    expect(followWorkoutTotal(AUTO, 1440, 1800)).toEqual({
      mode: AUTO,
      goalDuration: 1800,
    });
    expect(followWorkoutTotal(MANUAL, 2700, 1800)).toEqual({ mode: MANUAL });
  });
});

describe('adoptDuration', () => {
  it('keeps a stated total that differs from the steps', () => {
    expect(adoptDuration(2700, 1440)).toEqual({
      mode: MANUAL,
      goalDuration: 2700,
    });
  });

  it('follows the steps without a duration, or with their own', () => {
    expect(adoptDuration(null, 1440)).toEqual({
      mode: AUTO,
      goalDuration: 1440,
    });
    expect(adoptDuration(1430, 1440)).toEqual({
      mode: AUTO,
      goalDuration: 1440,
    });
  });

  it('keeps the duration of a session without steps', () => {
    expect(adoptDuration(3600, null)).toEqual({
      mode: { manual: true, settled: false },
      goalDuration: 3600,
    });
  });
});

describe('plannedEndDate', () => {
  const start = new Date(Date.UTC(2026, 10, 3, 18));

  it('ends the planned duration after the start', () => {
    expect(plannedEndDate(start, 2700).getTime() - start.getTime()).toBe(
      2700 * 1000,
    );
  });

  it('lasts an hour without a duration', () => {
    expect(plannedEndDate(start, null).getTime() - start.getTime()).toBe(
      3600 * 1000,
    );
  });
});
