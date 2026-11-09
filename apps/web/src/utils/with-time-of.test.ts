import { describe, expect, it } from 'vitest';

import { withTimeOf } from './with-time-of';

describe('withTimeOf', () => {
  it('moves a date to another day at the same local time', () => {
    const moved = withTimeOf(
      new Date(2026, 10, 10),
      new Date(2026, 10, 9, 7, 30),
    );
    expect([moved.getDate(), moved.getHours(), moved.getMinutes()]).toEqual([
      10, 7, 30,
    ]);
  });

  it('keeps the local time across a daylight saving change', () => {
    // 1 November 2026 is the end of DST in New York, 25 October in Paris
    const moved = withTimeOf(new Date(2026, 10, 2), new Date(2026, 9, 20, 7));
    expect(moved.getHours()).toBe(7);
    expect(moved.getDate()).toBe(2);
  });

  it('keeps the picked day as is without a previous value', () => {
    const day = new Date(2026, 10, 10);
    expect(withTimeOf(day, undefined).getTime()).toBe(day.getTime());
  });
});
