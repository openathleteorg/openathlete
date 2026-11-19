import type { QueryKey } from '@tanstack/react-query';

/**
 * Collects the queries realtime events make stale and invalidates them in one
 * go once the events calm down. A history import sends an event for every
 * activity, hundreds a minute: refetching the calendar for each one exhausted
 * the API's database connections (15/11/2026). `maxWaitMs` still refreshes
 * the screen during a long import.
 */
export function createRefreshBatcher(
  invalidate: (queryKey: QueryKey) => void,
  { delayMs = 1000, maxWaitMs = 5000 } = {},
) {
  const pending = new Map<string, QueryKey>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let firstAt: number | undefined;

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    firstAt = undefined;
    const keys = [...pending.values()];
    pending.clear();
    keys.forEach((key) => invalidate(key));
  };

  return {
    add(...queryKeys: QueryKey[]) {
      queryKeys.forEach((key) => pending.set(JSON.stringify(key), key));
      const now = Date.now();
      firstAt ??= now;
      clearTimeout(timer);
      timer = setTimeout(flush, Math.min(delayMs, firstAt + maxWaitMs - now));
    },
    /** Drops what is pending: the calendar is gone */
    cancel() {
      clearTimeout(timer);
      timer = undefined;
      firstAt = undefined;
      pending.clear();
    },
  };
}
