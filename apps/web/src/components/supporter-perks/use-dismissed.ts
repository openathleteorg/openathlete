import { useCallback, useState } from 'react';

const DAY_MS = 24 * 60 * 60 * 1000;
const PREFIX = 'oa.dismissed.';

function read(key: string): number | null {
  try {
    const value = window.localStorage.getItem(PREFIX + key);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

/**
 * A card the user closed stays hidden this many days, on this device. A
 * blocked storage only means the card comes back: nothing depends on it.
 */
export function useDismissed(key: string, days = 30) {
  const [dismissedAt, setDismissedAt] = useState(() => read(key));
  const dismissed =
    dismissedAt !== null && Date.now() - dismissedAt < days * DAY_MS;

  const dismiss = useCallback(() => {
    const now = Date.now();
    setDismissedAt(now);
    try {
      window.localStorage.setItem(PREFIX + key, String(now));
    } catch {
      // Private mode or blocked storage: hidden until the next visit only
    }
  }, [key]);

  return { dismissed, dismiss };
}
