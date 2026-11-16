import { describe, expect, it } from 'vitest';

import { SWIPE_DISTANCE, horizontalSwipe } from './swipe';

const start = { x: 200, y: 400 };

describe('horizontalSwipe', () => {
  it('goes to the next period on a swipe to the left', () => {
    expect(horizontalSwipe(start, { x: 100, y: 410 })).toBe(1);
  });

  it('goes to the previous period on a swipe to the right', () => {
    expect(horizontalSwipe(start, { x: 300, y: 390 })).toBe(-1);
  });

  it('ignores a short move, as a tap', () => {
    expect(horizontalSwipe(start, { x: 200 - SWIPE_DISTANCE, y: 400 })).toBe(0);
  });

  it('ignores a scroll through the days that drifts sideways', () => {
    expect(horizontalSwipe(start, { x: 140, y: 250 })).toBe(0);
  });
});
