import { Record as PrismaRecord, RecordType } from '@openathlete/database';
import {
  ActivityStream,
  isValidGpsPoint,
  smoothAltitude,
} from '@openathlete/shared';

import { highestVerticalSpeed } from './record-plausibility';

// Target distances for all record types (in meters)
const TARGET_DISTANCES = [
  400, // 400m
  800, // 800m
  1000, // 1000m
  1500, // 1500m
  3000, // 3000m
  5000, // 5000m
  10000, // 10k
  15000, // 15k
  20000, // 20k
  21097.5, // Semi
  42195, // Marathon
  50000, // 50km
  100000, // 100km
];

// Durations for power and heart rate records (in seconds)
const TARGET_DURATIONS = [5, 15, 30, 60, 120, 300, 600, 1200, 1800, 3600, 7200];

// Durations for climbing speed records (VAM): those of power and heart rate,
// so the curves line up, from 5 minutes on. Shorter ones measure the
// altimeter's noise more than the climb
const VERTICAL_SPEED_DURATIONS = TARGET_DURATIONS.filter(
  (duration) => duration >= 300,
);

/**
 * Sports climbed by the athlete's own strength. Lifts carry alpine skiers
 * and snowboarders up, motors help e-bikes, and virtual rides simulate
 * their altitude.
 */
const VERTICAL_SPEED_SPORTS = new Set<string>([
  'RUNNING',
  'TRAIL_RUNNING',
  'WALK',
  'HIKING',
  'SNOWSHOE',
  'CYCLING',
  'MOUNTAIN_BIKE_RIDE',
  'GRAVEL_RIDE',
  'BACKCOUNTRY_SKI',
  'NORDIC_SKI',
]);

/** Without distance, altitude is smoothed with the median of this window */
const ALTITUDE_MEDIAN_SECONDS = 30;
/**
 * Metres a second between two samples that no climber reaches, about ten
 * times the fastest: an altimeter step (a recalibration, GPS altitude taking
 * over) or a lift. No climbing record spans one.
 */
const ALTITUDE_JUMP_SPEED = 3;

// A sample stands for the time until the next one, but no longer than this:
// a longer gap is a pause or a dropout, counted as zero
const MAX_SAMPLE_HOLD = 15;

/**
 * Calculate cumulative distances from latlng stream
 * This is expensive, so we compute it once and reuse.
 * No distance is counted across a GPS gap: the distance stays flat, which
 * can only make a segment slower, never invent a faster one.
 */
function calculateCumulativeDistances(latlngStream: number[][]): number[] {
  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < latlngStream.length; i++) {
    const previous = latlngStream[i - 1];
    const current = latlngStream[i];
    const distance =
      isValidGpsPoint(previous) && isValidGpsPoint(current)
        ? calculateHaversineDistance(
            previous[0],
            previous[1],
            current[0],
            current[1],
          )
        : 0;
    cumulativeDistances.push(cumulativeDistances[i - 1] + distance);
  }
  return cumulativeDistances;
}

type ComputedRecord = Pick<
  PrismaRecord,
  'distance' | 'duration' | 'value' | 'startDuration' | 'endDuration' | 'type'
>;

/**
 * A stretch of exactly targetDistance starting at a recorded point. It ends
 * between `right - 1` and `right`, `fraction` of the way: positions are
 * interpolated there, so the result no longer depends on a point happening
 * to fall at the target distance, which sparse recordings rarely provide.
 */
type Stretch = { left: number; right: number; fraction: number };

function* stretchesOf(
  cumulativeDistances: number[],
  targetDistance: number,
): Generator<Stretch> {
  let right = 0;
  for (let left = 0; left < cumulativeDistances.length; left++) {
    while (
      right < cumulativeDistances.length &&
      cumulativeDistances[right] - cumulativeDistances[left] < targetDistance
    ) {
      right++;
    }
    if (right === cumulativeDistances.length) return;
    // right > left, since a stretch of zero length never reaches the target
    const before = cumulativeDistances[right - 1] - cumulativeDistances[left];
    const step = cumulativeDistances[right] - cumulativeDistances[right - 1];
    yield { left, right, fraction: (targetDistance - before) / step };
  }
}

/** A cumulative series read at the end of a stretch. */
function at(series: number[], { right, fraction }: Stretch): number {
  return series[right - 1] + (series[right] - series[right - 1]) * fraction;
}

/**
 * Best stretch for each target distance, `score` returning the value to
 * keep (higher is better), or null when the stretch has no data.
 */
function bestStretches(
  type: RecordType,
  timeStream: number[],
  cumulativeDistances: number[],
  score: (stretch: Stretch) => { value: number; rank: number } | null,
): ComputedRecord[] {
  const records: ComputedRecord[] = [];
  for (const targetDistance of TARGET_DISTANCES) {
    let best: { value: number; rank: number; stretch: Stretch } | null = null;
    for (const stretch of stretchesOf(cumulativeDistances, targetDistance)) {
      const result = score(stretch);
      if (result && (!best || result.rank > best.rank)) {
        best = { ...result, stretch };
      }
    }
    if (!best) continue;
    records.push({
      type,
      distance: targetDistance,
      duration: null,
      value: best.value,
      startDuration: Math.round(timeStream[best.stretch.left]),
      endDuration: Math.round(at(timeStream, best.stretch)),
    });
  }
  return records;
}

/**
 * Fastest time over each distance. Pauses stay in: elapsed time only makes
 * a stretch slower, so the fastest one avoids them on its own.
 */
function computeSpeedRecords(
  timeStream: number[],
  cumulativeDistances: number[],
): ComputedRecord[] {
  return bestStretches('SPEED', timeStream, cumulativeDistances, (stretch) => {
    const time = at(timeStream, stretch) - timeStream[stretch.left];
    return time > 0 ? { value: time, rank: -time } : null;
  });
}

/**
 * Best average of a sampled value (power, heart rate) over each duration,
 * weighted by time so that irregular sampling does not tip the balance.
 */
function computeDurationRecords(
  type: RecordType,
  timeStream: number[],
  valueStream: number[],
): ComputedRecord[] {
  const length = Math.min(timeStream.length, valueStream.length);
  if (length < 2) return [];
  const value = (i: number) =>
    Number.isFinite(valueStream[i]) ? valueStream[i] : 0;
  const hold = (i: number) =>
    i + 1 < length
      ? Math.min(timeStream[i + 1] - timeStream[i], MAX_SAMPLE_HOLD)
      : 0;
  // integral[i]: value accumulated from the first sample to sample i
  const integral = [0];
  for (let i = 1; i < length; i++) {
    integral.push(integral[i - 1] + value(i - 1) * hold(i - 1));
  }
  const integralAt = (i: number, t: number) =>
    integral[i] + value(i) * Math.min(t - timeStream[i], hold(i));

  const records: ComputedRecord[] = [];
  for (const duration of TARGET_DURATIONS) {
    let best: { value: number; start: number } | null = null;
    let last = 0;
    for (let first = 0; first < length; first++) {
      const end = timeStream[first] + duration;
      if (end > timeStream[length - 1]) break;
      while (last + 1 < length && timeStream[last + 1] <= end) last++;
      const average = (integralAt(last, end) - integral[first]) / duration;
      if (!best || average > best.value) {
        best = { value: average, start: timeStream[first] };
      }
    }
    if (!best || best.value <= 0) continue;
    records.push({
      type,
      distance: null,
      duration,
      value: best.value,
      startDuration: Math.round(best.start),
      endDuration: Math.round(best.start + duration),
    });
  }
  return records;
}

/**
 * Altitude without its spikes: averaged over 100 m of distance, as the slope
 * profile reads it, or, without distance (a climb on foot without GPS
 * distance), the median of the samples within 15 s on either side. A single
 * altimeter spike then moves no record.
 */
function smoothedAltitude(
  time: number[],
  altitude: number[],
  distance: number[] | undefined,
): number[] {
  const n = Math.min(time.length, altitude.length);
  if (distance && distance.length >= n && distance[n - 1] > distance[0]) {
    return smoothAltitude(altitude.slice(0, n), distance.slice(0, n));
  }
  const half = ALTITUDE_MEDIAN_SECONDS / 2;
  const result: number[] = [];
  let lo = 0;
  let hi = 0;
  for (let i = 0; i < n; i++) {
    while (hi < n && time[hi] <= time[i] + half) hi++;
    while (time[lo] < time[i] - half) lo++;
    const window = altitude
      .slice(lo, hi)
      .filter(Number.isFinite)
      .sort((x, y) => x - y);
    result.push(
      window.length ? window[Math.floor(window.length / 2)] : altitude[i],
    );
  }
  return result;
}

/**
 * Fastest climbing over each duration, in metres per hour: the smoothed
 * altitude gained between the start and the end of the stretch, read
 * between samples at the end. A net gain, so the remaining noise cancels
 * out, and elapsed time, so a pause can only make it slower. A stretch
 * across an altitude jump, or faster than a human climbs, spoils its
 * samples: no window over them counts, and the activity keeps its best
 * climb elsewhere at that duration instead of losing the record.
 */
function computeVerticalSpeedRecords(
  timeStream: number[],
  rawAltitude: number[],
  distance?: number[],
): ComputedRecord[] {
  const altitude = smoothedAltitude(timeStream, rawAltitude, distance);
  // Jumps of the raw altitude, counted up to each sample
  const samples: { t: number; alt: number; jumps: number }[] = [];
  const length = Math.min(timeStream.length, altitude.length);
  let jumps = 0;
  let previous: { t: number; raw: number } | null = null;
  for (let i = 0; i < length; i++) {
    if (!Number.isFinite(timeStream[i]) || !Number.isFinite(altitude[i]))
      continue;
    const raw = rawAltitude[i];
    if (previous && Number.isFinite(raw)) {
      const dt = timeStream[i] - previous.t;
      if (Math.abs(raw - previous.raw) > ALTITUDE_JUMP_SPEED * Math.max(dt, 1))
        jumps++;
    }
    if (Number.isFinite(raw)) previous = { t: timeStream[i], raw };
    samples.push({ t: timeStream[i], alt: altitude[i], jumps });
  }
  if (samples.length < 2) return [];
  const records: ComputedRecord[] = [];
  for (const duration of VERTICAL_SPEED_DURATIONS) {
    const limit = highestVerticalSpeed(duration);
    // Every window of this duration, from its first sample to the sample
    // after its end
    const windows: { first: number; last: number; value: number }[] = [];
    let last = 0;
    for (let first = 0; first < samples.length; first++) {
      const end = samples[first].t + duration;
      if (end > samples[samples.length - 1].t) break;
      while (last + 1 < samples.length && samples[last + 1].t <= end) last++;
      const a = samples[last];
      const next = Math.min(last + 1, samples.length - 1);
      const b = samples[next];
      const altitudeAtEnd =
        b.t > a.t
          ? a.alt + ((b.alt - a.alt) * (end - a.t)) / (b.t - a.t)
          : a.alt;
      const value = ((altitudeAtEnd - samples[first].alt) / duration) * 3600;
      windows.push({ first, last: next, value });
    }
    // Samples of a window faster than a human climbs, or across a jump, are
    // spoilt: a window overlapping them would read the end of the lift
    const spoilt = new Array<number>(samples.length + 1).fill(0);
    for (const window of windows) {
      if (
        window.value > limit ||
        samples[window.last].jumps > samples[window.first].jumps
      ) {
        spoilt[window.first] += 1;
        spoilt[window.last + 1] -= 1;
      }
    }
    const spoiltBefore = [0];
    for (let i = 0, cover = 0; i < samples.length; i++) {
      cover += spoilt[i];
      spoiltBefore.push(spoiltBefore[i] + (cover > 0 ? 1 : 0));
    }
    let best: { value: number; start: number } | null = null;
    for (const window of windows) {
      if (spoiltBefore[window.last + 1] > spoiltBefore[window.first]) continue;
      if (!best || window.value > best.value)
        best = { value: window.value, start: samples[window.first].t };
    }
    if (!best || best.value <= 0) continue;
    records.push({
      type: 'VERTICAL_SPEED',
      distance: null,
      duration,
      value: best.value,
      startDuration: Math.round(best.start),
      endDuration: Math.round(best.start + duration),
    });
  }
  return records;
}

/** Most climbing over each distance. */
function computeElevationGainRecords(
  timeStream: number[],
  cumulativeDistances: number[],
  altitude: number[],
): ComputedRecord[] {
  const length = Math.min(altitude.length, cumulativeDistances.length);
  const cumulative = [0];
  for (let i = 1; i < length; i++) {
    const diff = altitude[i] - altitude[i - 1];
    cumulative.push(cumulative[i - 1] + (diff > 0 ? diff : 0));
  }
  return bestStretches(
    'ELEVATION_GAIN',
    timeStream,
    cumulativeDistances.slice(0, length),
    (stretch) => {
      const gain = at(cumulative, stretch) - cumulative[stretch.left];
      return { value: gain, rank: gain };
    },
  );
}

/**
 * Records of an activity: pace and climbing by distance (they need the GPS
 * route), power, heart rate and, in sports climbed by the athlete's own
 * strength, climbing speed by duration.
 */
export const computeRecords = (
  stream: ActivityStream,
  sport?: string,
): ComputedRecord[] => {
  const { time, latlng, altitude, heartrate, watts, distance } = stream;
  if (!time || time.length === 0) return [];

  const records = [
    ...(watts?.length ? computeDurationRecords('POWER', time, watts) : []),
    ...(heartrate?.length
      ? computeDurationRecords('HEARTRATE', time, heartrate)
      : []),
    // Climbing needs the altitude only: a treadmill with an incline has none
    ...(altitude?.length && sport && VERTICAL_SPEED_SPORTS.has(sport)
      ? computeVerticalSpeedRecords(time, altitude, distance)
      : []),
  ];

  // Distance records require a route aligned with time
  if (
    !latlng ||
    latlng.length !== time.length ||
    !latlng.some(isValidGpsPoint)
  ) {
    return records;
  }
  const cumulativeDistances = calculateCumulativeDistances(latlng);
  return [
    ...computeSpeedRecords(time, cumulativeDistances),
    ...(altitude?.length
      ? computeElevationGainRecords(time, cumulativeDistances, altitude)
      : []),
    ...records,
  ];
};

function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
