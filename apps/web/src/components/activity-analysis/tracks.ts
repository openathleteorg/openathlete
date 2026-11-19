import { despikeAndEma } from '@/utils/despike';

import {
  ActivityStream,
  SPORT_TYPE,
  isValidGpsPoint,
} from '@openathlete/shared';

import { XAxisKind, xSeries } from './stream-range';

export type TrackKey =
  | 'speed'
  | 'gap'
  | 'power'
  | 'heartrate'
  | 'altitude'
  | 'cadence'
  | 'temperature';

export type ChartRow = { index: number; x: number; time: number } & Partial<
  Record<TrackKey, number | null>
>;

const RUNNING_SPORTS = new Set<SPORT_TYPE>([
  SPORT_TYPE.RUNNING,
  SPORT_TYPE.TRAIL_RUNNING,
  SPORT_TYPE.VIRTUAL_RUN,
]);
const CYCLING_SPORTS = new Set<SPORT_TYPE>([
  SPORT_TYPE.CYCLING,
  SPORT_TYPE.GRAVEL_RIDE,
  SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
  SPORT_TYPE.E_BIKE_RIDE,
  SPORT_TYPE.E_MOUNTAIN_BIKE_RIDE,
  SPORT_TYPE.VIRTUAL_RIDE,
  SPORT_TYPE.HANDCYCLE,
  SPORT_TYPE.VELOMOBILE,
]);

/** Running cadence streams count one foot: shown per minute for both */
export const cadenceFactor = (sport: SPORT_TYPE) =>
  RUNNING_SPORTS.has(sport) ? 2 : 1;

/**
 * The tracks in the order a sport reads them: power first on a bike, pace
 * first on foot. Tracks without data are left out later.
 */
export function sportTrackOrder(sport: SPORT_TYPE): TrackKey[] {
  if (CYCLING_SPORTS.has(sport))
    return [
      'power',
      'heartrate',
      'speed',
      'altitude',
      'cadence',
      'temperature',
    ];
  if (sport === SPORT_TYPE.ROWING || sport === SPORT_TYPE.VIRTUAL_ROW)
    return ['speed', 'power', 'cadence', 'heartrate', 'temperature'];
  return [
    'speed',
    'gap',
    'heartrate',
    'altitude',
    'cadence',
    'power',
    'temperature',
  ];
}

const EARTH_RADIUS_M = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
function haversine([lat1, lng1]: number[], [lat2, lng2]: number[]) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Smooths each unbroken run of values, leaving the gaps as they are */
function smoothRuns(values: (number | null)[]): (number | null)[] {
  const result = values.slice();
  for (let start = 0; start < result.length;) {
    if (result[start] === null) {
      start++;
      continue;
    }
    let end = start;
    while (end < result.length && result[end] !== null) end++;
    const smoothed = despikeAndEma(result.slice(start, end) as number[]);
    for (let i = start; i < end; i++) result[i] = smoothed[i - start];
    start = end;
  }
  return result;
}

/**
 * Recorded speed in m/s, with distance or GPS as a fallback.
 */
function speedSeries(
  stream: ActivityStream,
  smooth: boolean,
): (number | null)[] | undefined {
  const time = stream.time;
  if (!time?.length) return undefined;
  const distance = stream.distance;
  const moves = !!distance?.length && distance.some((d) => d !== distance[0]);
  if (!stream.speed?.length && !moves && !stream.latlng?.length)
    return undefined;

  const raw = time.map((_, index): number | null => {
    if (stream.timerPaused?.[index]) return null;
    const recorded = stream.speed?.[index];
    if (
      typeof recorded === 'number' &&
      Number.isFinite(recorded) &&
      recorded >= 0
    )
      return recorded;

    // Derived speed uses the next sample, or the previous interval at the end.
    const i = Math.min(index, time.length - 2);
    if (i < 0 || stream.timerPaused?.[i]) return null;
    const next = i + 1;
    const dt = time[next] - time[i];
    if (!(dt > 0)) return null;
    if (moves) return Math.max(0, (distance![next] - distance![i]) / dt);
    const point = stream.latlng?.[i];
    const following = stream.latlng?.[next];
    if (!isValidGpsPoint(point) || !isValidGpsPoint(following)) return null;
    return haversine(point, following) / dt;
  });
  return smooth ? smoothRuns(raw) : raw;
}

/**
 * One row per sample with every track's value, for charts that share their
 * horizontal axis, and the tracks that have data.
 */
export function buildChartRows(
  stream: ActivityStream | undefined,
  sport: SPORT_TYPE,
  xAxis: XAxisKind,
  /**
   * Smoothing reads well on a chart but lags behind changes of pace: sums
   * such as time in zones take the raw speed
   */
  { smooth = true }: { smooth?: boolean } = {},
): { rows: ChartRow[]; tracks: TrackKey[] } {
  const time = stream?.time;
  const x = xSeries(stream, xAxis);
  if (!stream || !time?.length || !x?.length) return { rows: [], tracks: [] };

  const factor = cadenceFactor(sport);
  const series: Partial<Record<TrackKey, (number | null)[]>> = {
    speed: speedSeries(stream, smooth),
    gap: stream.gap?.length
      ? smooth
        ? smoothRuns(stream.gap)
        : stream.gap
      : undefined,
    power: stream.watts,
    heartrate: stream.heartrate?.map((v) => (v > 0 ? v : null)),
    altitude: stream.altitude,
    cadence: stream.cadence?.map((v) => v * factor),
    temperature: stream.temp,
  };

  const tracks = sportTrackOrder(sport).filter((key) =>
    series[key]?.some(
      (value) => value !== null && value !== undefined && value !== 0,
    ),
  );

  const rows = time.map((t, index) => {
    const row: ChartRow = { index, x: x[index], time: t };
    for (const key of tracks) row[key] = series[key]?.[index] ?? null;
    return row;
  });
  return { rows, tracks };
}
