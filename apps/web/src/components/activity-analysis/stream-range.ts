import { hasDistanceProgression } from '@/utils/chart-x-axis';

import { ActivityStream } from '@openathlete/shared';

/** What the charts' horizontal axis, and so a selection, is measured in */
export type XAxisKind = 'distance' | 'time';

export function defaultXAxis(stream?: Pick<ActivityStream, 'distance'>) {
  return hasDistanceProgression(stream?.distance) ? 'distance' : 'time';
}

/** The series the charts plot against, in metres or seconds */
export function xSeries(
  stream: Pick<ActivityStream, 'distance' | 'time'> | undefined,
  kind: XAxisKind,
): number[] | undefined {
  if (kind === 'distance' && hasDistanceProgression(stream?.distance))
    return stream.distance;
  return stream?.time;
}

/**
 * The first and last samples inside [from, to] of a non-decreasing series,
 * or null when none is.
 */
export function indexRange(
  series: number[],
  [from, to]: [number, number],
): [number, number] | null {
  let lo = 0;
  let hi = series.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid] < from) lo = mid + 1;
    else hi = mid;
  }
  const start = lo;
  lo = start;
  hi = series.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid] <= to) lo = mid + 1;
    else hi = mid;
  }
  const end = lo - 1;
  return start <= end ? [start, end] : null;
}

/** Locate chart samples on a separately sampled GPS route. */
export function routeRange(
  chart: ActivityStream,
  route: ActivityStream,
  start: number,
  end: number,
): [number, number] | null {
  for (const key of ['time', 'distance'] as const) {
    const source = chart[key];
    const target = route[key];
    if (!source || !target || target.length !== route.latlng?.length) continue;
    const from = source[start];
    const to = source[end];
    if (to > from && target[target.length - 1] > target[0]) {
      const range = indexRange(target, [from, to]);
      if (range) return range;
    }
  }
  return null;
}

export interface RangeStats {
  /** Seconds between the first and last samples */
  durationSec: number;
  distanceM?: number;
  /** Distance over duration, in m/s */
  averageSpeed?: number;
  averageGapSpeed?: number;
  averageHeartrate?: number;
  maxHeartrate?: number;
  averagePower?: number;
  maxPower?: number;
  averageCadence?: number;
  elevationGainM?: number;
  elevationLossM?: number;
}

// Below this, altitude changes are GPS and barometer noise
const ELEVATION_NOISE_M = 1;

/**
 * Time-weighted mean of a stream over [start, end]: each sample counts for
 * the time until the next one, so irregular sampling doesn't skew it.
 * `keep` drops samples, such as a cadence of 0 while stopped.
 */
function timeWeightedMean(
  values: number[] | undefined,
  time: number[],
  start: number,
  end: number,
  keep: (value: number) => boolean = Number.isFinite,
): number | undefined {
  if (!values?.length) return undefined;
  let sum = 0;
  let weight = 0;
  for (let i = start; i < end; i++) {
    const value = values[i];
    const dt = time[i + 1] - time[i];
    if (value === undefined || !keep(value) || !(dt > 0)) continue;
    sum += value * dt;
    weight += dt;
  }
  return weight > 0 ? sum / weight : undefined;
}

function maxOf(values: number[] | undefined, start: number, end: number) {
  if (!values?.length) return undefined;
  let max = -Infinity;
  for (let i = start; i <= end; i++) {
    const value = values[i];
    if (Number.isFinite(value) && value > max) max = value;
  }
  return max > 0 ? max : undefined;
}

function elevationChange(altitude: number[], start: number, end: number) {
  let gain = 0;
  let loss = 0;
  let reference = altitude[start];
  for (let i = start + 1; i <= end; i++) {
    const delta = altitude[i] - reference;
    if (Math.abs(delta) < ELEVATION_NOISE_M) continue;
    if (delta > 0) gain += delta;
    else loss -= delta;
    reference = altitude[i];
  }
  return { gain, loss };
}

/** The figures of the samples [start, end] of an activity's streams */
export function computeRangeStats(
  stream: ActivityStream,
  [start, end]: [number, number],
): RangeStats | null {
  const time = stream.time;
  if (!time?.length || end <= start) return null;
  const durationSec = time[end] - time[start];
  if (!(durationSec > 0)) return null;

  const stats: RangeStats = { durationSec };
  if (hasDistanceProgression(stream.distance)) {
    stats.distanceM = stream.distance[end] - stream.distance[start];
    stats.averageSpeed = stats.distanceM / durationSec;
  }
  stats.averageGapSpeed = timeWeightedMean(stream.gap, time, start, end);
  stats.averageHeartrate = timeWeightedMean(
    stream.heartrate,
    time,
    start,
    end,
    (value) => value > 0,
  );
  stats.maxHeartrate = maxOf(stream.heartrate, start, end);
  // Zeros count: coasting is part of the average power
  stats.averagePower = timeWeightedMean(stream.watts, time, start, end);
  stats.maxPower = maxOf(stream.watts, start, end);
  stats.averageCadence = timeWeightedMean(
    stream.cadence,
    time,
    start,
    end,
    (value) => value > 0,
  );
  if (stream.altitude?.length) {
    const { gain, loss } = elevationChange(stream.altitude, start, end);
    stats.elevationGainM = gain;
    stats.elevationLossM = loss;
  }
  return stats;
}
