/** How far a finger travels sideways before the move counts as a swipe */
export const SWIPE_DISTANCE = 48;

export interface TouchPoint {
  x: number;
  y: number;
}

/**
 * 1 for a swipe to the left (the next period), -1 to the right (the previous
 * one), 0 otherwise. The move must be mostly sideways, so scrolling through
 * the days never changes the week.
 */
export function horizontalSwipe(
  start: TouchPoint,
  end: TouchPoint,
): -1 | 0 | 1 {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) <= SWIPE_DISTANCE || Math.abs(dx) < 2 * Math.abs(dy)) {
    return 0;
  }
  return dx < 0 ? 1 : -1;
}
