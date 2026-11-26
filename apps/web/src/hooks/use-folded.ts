import { useCallback, useState } from 'react';

const PREFIX = 'oa.folded.';

function read(key: string): boolean {
  try {
    return window.localStorage.getItem(PREFIX + key) === 'true';
  } catch {
    // No storage (private mode): the card opens as it always did
    return false;
  }
}

/**
 * Whether the user folded a card away, remembered on this device. A blocked
 * storage only means the card is open again on the next visit.
 */
export function useFolded(key: string) {
  const [folded, setState] = useState(() => read(key));
  const setFolded = useCallback(
    (next: boolean) => {
      setState(next);
      try {
        window.localStorage.setItem(PREFIX + key, String(next));
      } catch {
        // Not remembered, still folded for this visit
      }
    },
    [key],
  );
  return { folded, setFolded };
}
