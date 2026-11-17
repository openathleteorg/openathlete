import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createRefreshBatcher } from './refresh-batcher';

describe('refresh batcher', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('invalidates each query once for a burst of events', () => {
    const invalidate = vi.fn();
    const batcher = createRefreshBatcher(invalidate, { delayMs: 1000 });
    for (let i = 0; i < 200; i++) {
      batcher.add(['weekly'], ['events'], ['event', i % 2]);
      vi.advanceTimersByTime(10);
    }
    expect(invalidate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(invalidate.mock.calls).toEqual([
      [['weekly']],
      [['events']],
      [['event', 0]],
      [['event', 1]],
    ]);
  });

  it('still refreshes during a long import', () => {
    const invalidate = vi.fn();
    const batcher = createRefreshBatcher(invalidate, {
      delayMs: 1000,
      maxWaitMs: 5000,
    });
    // An event every 500 ms for 12 s never leaves a quiet second
    for (let t = 0; t < 12_000; t += 500) {
      batcher.add(['weekly']);
      vi.advanceTimersByTime(500);
    }
    expect(invalidate).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1000);
    expect(invalidate).toHaveBeenCalledTimes(3);
  });

  it('drops pending refreshes when cancelled', () => {
    const invalidate = vi.fn();
    const batcher = createRefreshBatcher(invalidate);
    batcher.add(['weekly']);
    batcher.cancel();
    vi.advanceTimersByTime(10_000);
    expect(invalidate).not.toHaveBeenCalled();
  });
});
