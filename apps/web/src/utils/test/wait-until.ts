import { act } from 'react';

/**
 * Lets React and pending promises run until `check` passes, then returns.
 * Tests wait for an outcome rather than a fixed delay, which a loaded CI
 * runner can outlast. `check` throws (an `expect`) or returns false while
 * the outcome is not there yet; the last failure is rethrown at the deadline.
 */
export async function waitUntil(
  check: () => unknown,
  timeout = 3000,
): Promise<void> {
  const deadline = Date.now() + timeout;
  for (;;) {
    let failure: unknown;
    try {
      if (check() !== false) return;
      failure = new Error('waitUntil: condition still false');
    } catch (error) {
      failure = error;
    }
    if (Date.now() > deadline) throw failure;
    await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
  }
}
