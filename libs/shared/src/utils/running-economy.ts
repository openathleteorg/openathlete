import type { ActivityStream } from '../types/misc/core/activity-stream';

/** A sample longer than this is a pause or a dropout */
const MAX_SAMPLE_SECONDS = 15;
/** Walking and standing say nothing about running */
const MIN_RUNNING_SPEED = 1.5;
/** Enough running to read from */
const MIN_RUNNING_SECONDS = 600;

/**
 * Joules per metre of one run: the work of its power over the distance it
 * covered, counting only the samples run faster than a walk. Null without
 * ten minutes of running with power.
 */
export function runEnergyPerMetre(stream: ActivityStream): number | null {
  const { time, distance, watts } = stream;
  if (!time || !distance || !watts) return null;
  let work = 0;
  let metres = 0;
  let seconds = 0;
  const length = Math.min(time.length, distance.length, watts.length);
  for (let i = 1; i < length; i++) {
    const dt = time[i] - time[i - 1];
    const dd = distance[i] - distance[i - 1];
    if (!(dt > 0 && dt <= MAX_SAMPLE_SECONDS) || !(dd > 0)) continue;
    if (dd / dt < MIN_RUNNING_SPEED || !(watts[i] > 0)) continue;
    work += watts[i] * dt;
    metres += dd;
    seconds += dt;
  }
  return seconds >= MIN_RUNNING_SECONDS ? work / metres : null;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

/** Minutes per km at the speed a power holds: 318 W at 80 J/m is 4:12 */
export function powerToPace(watts: number, joulesPerMetre: number): number {
  return 1000 / (watts / joulesPerMetre) / 60;
}
