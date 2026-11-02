import { isCapacitor } from '@/utils/capacitor';
import { hapticSuccess } from '@/utils/haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const THRESHOLD = 64;
const MAX_PULL = 96;

/**
 * Pull down from the top of a screen to reload its data. Browsers do this
 * themselves, so only the apps need it.
 */
export function usePullToRefresh(enabled: boolean) {
  const queryClient = useQueryClient();
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!enabled || !isCapacitor()) return;
    let startY: number | null = null;
    let pulled = 0;
    const onStart = (event: TouchEvent) => {
      startY = window.scrollY <= 0 ? event.touches[0].clientY : null;
      pulled = 0;
    };
    const onMove = (event: TouchEvent) => {
      if (startY === null) return;
      // Resisted, so that the finger travels further than the content
      pulled = Math.min(
        MAX_PULL,
        Math.max(0, (event.touches[0].clientY - startY) * 0.45),
      );
      setDistance(pulled);
    };
    const onEnd = async () => {
      if (startY === null) return;
      startY = null;
      if (pulled < THRESHOLD) {
        setDistance(0);
        return;
      }
      setDistance(THRESHOLD * 0.75);
      setRefreshing(true);
      await queryClient.invalidateQueries();
      hapticSuccess();
      setRefreshing(false);
      setDistance(0);
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [enabled, queryClient]);

  return { distance, refreshing };
}
