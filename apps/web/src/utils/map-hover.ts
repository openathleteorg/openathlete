import { ActivityStream } from '@openathlete/shared';

type HoverPoint = { index: number; time: number } | undefined;

/**
 * Given activity latlng + time streams and the current chart hover (index/time),
 * returns a single pin [[lat,lng]] or undefined if unavailable.
 */
export function computeHoverPin(
  latlng?: ActivityStream['latlng'],
  time?: ActivityStream['time'],
  hover?: HoverPoint,
): number[][] | undefined {
  if (!latlng || !hover) return undefined;
  let idx = hover.index;
  if (time && typeof hover.time === 'number') {
    const times = time;
    // binary search for first index >= hover.time
    let lo = 0;
    let hi = times.length - 1;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (times[mid] < hover.time) lo = mid + 1;
      else hi = mid;
    }
    // Choose the closest between lo and lo-1
    const candidates = [lo, Math.max(0, lo - 1)];
    idx = candidates.reduce((best, cur) => {
      const bt = times[best] ?? Infinity;
      const ct = times[cur] ?? Infinity;
      return Math.abs(ct - hover.time) < Math.abs(bt - hover.time) ? cur : best;
    }, candidates[0]);
  }
  const coord = latlng[idx];
  if (!coord) return undefined;
  return [coord];
}
