import { isIOS } from '@/utils/capacitor';
import { hapticTap } from '@/utils/haptics';
import { useEffect, useRef } from 'react';

const EDGE = 24;
const COMMIT = 90;

/**
 * The iOS swipe from the left edge. A browser has its own, so only the app
 * adds it. The screen follows the finger through a transform, written
 * directly for each frame of the gesture.
 */
export function useEdgeSwipeBack(enabled: boolean, onBack: () => void) {
  const ref = useRef<HTMLElement>(null);
  const latest = useRef(onBack);
  latest.current = onBack;

  useEffect(() => {
    if (!enabled || !isIOS()) return;
    let startX: number | null = null;
    let dx = 0;
    const reset = (element: HTMLElement) => {
      element.style.transition = 'transform 0.22s ease-out';
      element.style.transform = '';
    };
    const onStart = (event: TouchEvent) => {
      const x = event.touches[0].clientX;
      startX = x <= EDGE ? x : null;
      dx = 0;
    };
    const onMove = (event: TouchEvent) => {
      const element = ref.current;
      if (startX === null || !element) return;
      dx = Math.max(0, event.touches[0].clientX - startX);
      element.style.transition = 'none';
      element.style.transform = `translateX(${dx}px)`;
    };
    const onEnd = () => {
      const element = ref.current;
      if (startX === null || !element) return;
      startX = null;
      if (dx > COMMIT) {
        hapticTap();
        latest.current();
      } else {
        reset(element);
      }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled]);

  return { ref };
}
