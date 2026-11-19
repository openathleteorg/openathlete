import { describe, expect, it } from 'vitest';

import {
  SLIDE_DURATION_MS,
  initialStoryState,
  slideProgress,
  storyReducer,
} from './story-state';

const start = initialStoryState(3);

describe('storyReducer', () => {
  it('moves on once a slide has been shown long enough', () => {
    const almost = storyReducer(start, {
      type: 'tick',
      ms: SLIDE_DURATION_MS - 1,
    });
    expect(almost.index).toBe(0);
    expect(storyReducer(almost, { type: 'tick', ms: 1 })).toMatchObject({
      index: 1,
      elapsed: 0,
    });
  });

  it('stands still while paused or held', () => {
    const paused = storyReducer(start, { type: 'togglePause' });
    expect(storyReducer(paused, { type: 'tick', ms: 1000 }).elapsed).toBe(0);
    const held = storyReducer(start, { type: 'hold', held: true });
    expect(storyReducer(held, { type: 'tick', ms: 1000 }).elapsed).toBe(0);
  });

  it('waits on the last slide, which shows as complete', () => {
    const last = storyReducer(start, { type: 'go', index: 2 });
    expect(storyReducer(last, { type: 'tick', ms: 60_000 })).toBe(last);
    expect(slideProgress(last)).toBe(1);
  });

  it('stays within the slides', () => {
    expect(storyReducer(start, { type: 'go', index: 9 }).index).toBe(2);
    const last = storyReducer(start, { type: 'go', index: 2 });
    expect(storyReducer(last, { type: 'next' }).index).toBe(2);
  });

  it('restarts the first slide when going back from it', () => {
    const halfway = storyReducer(start, { type: 'tick', ms: 3000 });
    expect(storyReducer(halfway, { type: 'previous' })).toMatchObject({
      index: 0,
      elapsed: 0,
    });
  });

  it('restarts the timer when changing slide', () => {
    const halfway = storyReducer(start, { type: 'tick', ms: 3000 });
    expect(storyReducer(halfway, { type: 'next' }).elapsed).toBe(0);
    expect(slideProgress(halfway)).toBeCloseTo(3000 / SLIDE_DURATION_MS);
  });
});
