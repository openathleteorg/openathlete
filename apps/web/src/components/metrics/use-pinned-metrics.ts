import { METRICS_PINNED, getItem, setItem } from '@/utils/local-storage';
import { useCallback, useState } from 'react';

import { METRIC_TYPE } from '@openathlete/shared';

/** What most athletes follow day to day, until they choose for themselves */
const DEFAULT_PINNED = [
  METRIC_TYPE.HRV_LAST_NIGHT_AVG,
  METRIC_TYPE.HR_REST,
  METRIC_TYPE.SLEEP_DURATION,
  METRIC_TYPE.SLEEP_SCORE,
  METRIC_TYPE.WEIGHT,
];

const read = (key: string): METRIC_TYPE[] | null => {
  try {
    const stored: unknown = JSON.parse(getItem(key) ?? 'null');
    if (!Array.isArray(stored)) return null;
    const known = Object.values(METRIC_TYPE) as string[];
    return stored.filter((type): type is METRIC_TYPE => known.includes(type));
  } catch {
    return null;
  }
};

/** A coach pins per athlete: what matters differs from one to the next */
export function usePinnedMetrics(athleteId?: number) {
  const key = `${METRICS_PINNED}_${athleteId ?? 'me'}`;
  const [pinned, setPinned] = useState(() => read(key) ?? DEFAULT_PINNED);

  const togglePinned = useCallback(
    (type: METRIC_TYPE) => {
      setPinned((current) => {
        const next = current.includes(type)
          ? current.filter((other) => other !== type)
          : [...current, type];
        setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key],
  );

  return { pinned, togglePinned };
}
