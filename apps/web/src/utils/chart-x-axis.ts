/**
 * Whether a distance stream actually progresses and can be used as a chart
 * X-axis. Indoor activities may record a distance stream that stays at zero,
 * in which case charts should fall back to time.
 */
export function hasDistanceProgression(
  distance?: number[] | null,
): distance is number[] {
  if (!distance?.length) return false;
  return distance.some((d) => d !== distance[0]);
}
