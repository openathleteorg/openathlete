/**
 * Synthesises activity recordings (the `EventActivity.stream` shape of
 * libs/shared ActivityStream) along the real paths of routes.json: speed
 * follows the slope, heart rate lags the effort and drifts, power drives a
 * bike, laps cut the recording like a watch would.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Random } from './random';

interface RouteData {
  id: string;
  points: [number, number, number, number][];
  distance: number;
}

export type RouteId =
  | 'lake-sevrier'
  | 'albigny-loop'
  | 'lake-saint-jorioz'
  | 'paquier-loop'
  | 'cret-du-maure'
  | 'mont-veyrier'
  | 'tournette'
  | 'semnoz'
  | 'tour-du-lac'
  | 'col-de-la-forclaz';

const ROUTES: Map<string, RouteData> = new Map(
  (JSON.parse(readFileSync(join(__dirname, '..', 'routes.json'), 'utf8')) as RouteData[]).map(
    (r) => [r.id, r],
  ),
);

export function routeDistance(id: RouteId): number {
  return route(id).distance;
}

function route(id: RouteId): RouteData {
  const r = ROUTES.get(id);
  if (!r) throw new Error(`Unknown route ${id}; rebuild routes.json`);
  return r;
}

interface Path {
  lat: number[];
  lng: number[];
  alt: number[];
  dist: number[];
  length: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Elevation models are noisy along a shore or a cliff: median then mean. */
function smooth(alt: number[]): number[] {
  const med = alt.map((_, i) => median(alt.slice(Math.max(0, i - 8), i + 9)));
  return med.map((_, i) => {
    const w = med.slice(Math.max(0, i - 4), i + 5);
    return w.reduce((a, b) => a + b, 0) / w.length;
  });
}

/**
 * Lakeside routes are flat, but the 25 m elevation model picks up the
 * hillside next to the shore: keep only a gentle trace of it there.
 */
const FLAT_ROUTES = new Set<string>(['lake-sevrier', 'lake-saint-jorioz', 'paquier-loop', 'albigny-loop', 'tour-du-lac']);
const LAKE_LEVEL = 447;

function flatten(alt: number[]): number[] {
  return alt.map((_, i) => {
    const w = alt.slice(Math.max(0, i - 40), i + 41);
    const mean = w.reduce((a, b) => a + b, 0) / w.length;
    return LAKE_LEVEL + Math.max(0, mean - LAKE_LEVEL) * 0.12;
  });
}

/** Routes joined end to end (they all start and end at the same place). */
function buildPath(ids: RouteId[]): Path {
  const path: Path = { lat: [], lng: [], alt: [], dist: [], length: 0 };
  let offset = 0;
  for (const id of ids) {
    const r = route(id);
    const raw = smooth(r.points.map((p) => p[2]));
    const alt = FLAT_ROUTES.has(id) ? flatten(raw) : raw;
    r.points.forEach((p, i) => {
      if (i === 0 && path.dist.length) return;
      path.lat.push(p[0]);
      path.lng.push(p[1]);
      path.alt.push(alt[i]);
      path.dist.push(offset + p[3]);
    });
    offset += r.distance;
  }
  path.length = offset;
  return path;
}

/** Position on the path at a distance, looping when the session is longer. */
function locate(path: Path, distance: number): { lat: number; lng: number; alt: number } {
  const d = ((distance % path.length) + path.length) % path.length;
  let lo = 0;
  let hi = path.dist.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (path.dist[mid] <= d) lo = mid;
    else hi = mid;
  }
  const span = path.dist[hi] - path.dist[lo] || 1;
  const t = (d - path.dist[lo]) / span;
  return {
    lat: path.lat[lo] + (path.lat[hi] - path.lat[lo]) * t,
    lng: path.lng[lo] + (path.lng[hi] - path.lng[lo]) * t,
    alt: path.alt[lo] + (path.alt[hi] - path.alt[lo]) * t,
  };
}

export interface Physiology {
  hrRest: number;
  hrMax: number;
  /** Running speed at the second threshold, m/s */
  thresholdSpeed: number;
  /** Cycling FTP, W */
  ftp: number;
  massKg: number;
}

/** One part of a session: a target held until a distance or a duration. */
export interface Block {
  name?: string;
  /** Metres or seconds */
  distance?: number;
  duration?: number;
  /** Running: flat-ground speed in m/s */
  speed?: number;
  /** Cycling: power in W */
  power?: number;
  /** Close a device lap at the end of the block */
  lap?: boolean;
}

export interface SessionInput {
  kind: 'run' | 'ride';
  routes: RouteId[];
  blocks: Block[];
  athlete: Physiology;
  rng: Random;
  /** Device auto-lap distance; laps also close at blocks marked `lap` */
  autoLapMeters?: number;
  /** 1 to 1.04: how hard the day felt for the same pace (heat, fatigue) */
  strain?: number;
}

export interface Lap {
  name: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
  distance: number;
  movingTime: number;
  elevationGain: number;
  averageSpeed: number;
  maxSpeed: number;
  averageHeartrate: number;
  maxHeartrate: number;
  averageCadence: number;
  averageWatts: number | null;
  maxWatts: number | null;
}

export interface Recording {
  stream: {
    time: number[];
    distance: number[];
    latlng: number[][];
    altitude: number[];
    heartrate: number[];
    cadence: number[];
    watts?: number[];
  };
  laps: Lap[];
  summary: {
    distance: number;
    movingTime: number;
    elevationGain: number;
    averageSpeed: number;
    maxSpeed: number;
    averageHeartrate: number;
    maxHeartrate: number;
    averageCadence: number;
    averageWatts: number | null;
    maxWatts: number | null;
    weightedAverageWatts: number | null;
    kilojoules: number | null;
  };
}

const G = 9.81;

function runGradeFactor(grade: number): number {
  if (grade >= 0) return 1 / (1 + 5.5 * grade);
  const g = -grade;
  if (g <= 0.1) return 1 + 1.5 * g;
  return Math.max(0.6, 1.15 - 1.7 * (g - 0.1));
}

/** Bike speed for a power on a slope (bisection on the power balance). */
function bikeSpeed(power: number, grade: number, mass: number): number {
  const angle = Math.atan(grade);
  const crr = 0.004;
  const cda = 0.36;
  const rho = 1.15;
  const balance = (v: number) =>
    v * mass * G * (Math.sin(angle) + crr * Math.cos(angle)) + 0.5 * rho * cda * v ** 3 - power * 0.97;
  let lo = 0.5;
  let hi = 25;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (balance(mid) > 0) hi = mid;
    else lo = mid;
  }
  return Math.min(lo, 17);
}

function elevationGain(alt: number[]): number {
  let gain = 0;
  let anchor = alt[0] ?? 0;
  for (const a of alt) {
    if (a - anchor >= 2) {
      gain += a - anchor;
      anchor = a;
    } else if (anchor - a >= 2) {
      anchor = a;
    }
  }
  return gain;
}

function haversine(a: number[], b: number[]): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(toRad(b[0] - a[0]) / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(toRad(b[1] - a[1]) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function record(input: SessionInput): Recording {
  const { athlete, rng, kind } = input;
  const path = buildPath(input.routes);
  const dt = kind === 'ride' ? 3 : 2;
  const strain = input.strain ?? 1;
  const reserve = athlete.hrMax - athlete.hrRest;

  const time: number[] = [];
  const distance: number[] = [];
  const latlng: number[][] = [];
  const altitude: number[] = [];
  const heartrate: number[] = [];
  const cadence: number[] = [];
  const watts: number[] = [];
  const speeds: number[] = [];
  const lapEnds: { index: number; name: string }[] = [];

  let t = 0;
  // Position along the path, and distance as the watch derives it from GPS
  // (a little shorter: samples cut the corners)
  let d = 0;
  let gps = 0;
  let previous: number[] | null = null;
  // Samples cut the corners of the path: move a little further along it so
  // the speed the watch reads (from GPS) is the one aimed at
  let stretch = 1;
  let aimed = 0;
  let v = kind === 'ride' ? 4 : 2.2;
  let hr = athlete.hrRest + 45;
  let wobble = 0;
  let nextAutoLap = input.autoLapMeters ?? Infinity;
  let lapNumber = 1;

  for (const block of input.blocks) {
    const blockStartT = t;
    const blockStartD = gps;
    const done = () =>
      block.distance !== undefined
        ? gps - blockStartD >= block.distance
        : t - blockStartT >= (block.duration ?? 0);

    while (!done()) {
      const here = locate(path, d);
      const ahead = locate(path, d + 30).alt;
      const behind = locate(path, d - 30).alt;
      const grade = Math.max(-0.35, Math.min(0.35, (ahead - behind) / 60));
      wobble = wobble * 0.92 + rng.normal(0, 0.012);

      let target: number;
      let effort: number;
      let power: number | null = null;
      if (kind === 'run') {
        const flat = (block.speed ?? 2.8) * (1 + wobble);
        target = flat * runGradeFactor(grade);
        // Steep climbs turn into a power hike of about 900 m/h
        if (grade > 0.12) target = Math.min(target, Math.max(0.9, 0.25 / grade));
        effort = flat / athlete.thresholdSpeed;
        effort += Math.max(-0.06, Math.min(0.08, grade * 0.5));
      } else {
        const coasting = grade < -0.035;
        power = coasting
          ? Math.max(0, rng.normal(25, 20))
          : Math.max(0, (block.power ?? 150) * (1 + wobble * 2.5) * (1 + Math.min(0.25, grade * 2.5)));
        target = bikeSpeed(power, grade, athlete.massKg + 8);
        effort = (coasting ? 0.45 : power / athlete.ftp) * 0.92 + 0.05;
      }
      v += (target - v) * Math.min(1, dt / (kind === 'run' ? 3 : 5));

      const frac =
        kind === 'run'
          ? 0.65 + (effort - 0.75) * 0.88
          : 0.5 + ((power ?? 0) / athlete.ftp - 0.55) * 0.62;
      const drift = Math.max(0, t / 3600 - 0.3) * 4.5;
      const hrTarget = Math.min(
        athlete.hrMax - 3,
        athlete.hrRest + reserve * Math.max(0.35, frac) * strain + drift,
      );
      const tau = hrTarget > hr ? 22 : 38;
      hr += (hrTarget - hr) * (1 - Math.exp(-dt / tau));

      const point = [Number(here.lat.toFixed(6)), Number(here.lng.toFixed(6))];
      if (previous) {
        const step = haversine(previous, point);
        gps += step;
        if (step > 0.5 && aimed > 0) stretch = Math.min(1.3, Math.max(1, stretch * (0.85 + 0.15 * (aimed / step))));
      }
      previous = point;
      time.push(t);
      distance.push(Number(gps.toFixed(1)));
      latlng.push(point);
      altitude.push(Number(here.alt.toFixed(1)));
      heartrate.push(Math.round(hr + rng.normal(0, 1.2)));
      speeds.push(v);
      if (kind === 'run') {
        const cad = v < 1.9 ? 57 + rng.normal(0, 2) : 79 + 9 * Math.min(1.25, effort) + rng.normal(0, 1.2);
        cadence.push(Math.round(cad));
      } else {
        watts.push(Math.round(power ?? 0));
        cadence.push(power && power > 40 ? Math.round(86 + rng.normal(0, 3)) : 0);
      }

      t += dt;
      aimed = v * dt;
      d += aimed * stretch;
      if (gps >= nextAutoLap) {
        lapEnds.push({ index: time.length - 1, name: `Lap ${lapNumber++}` });
        nextAutoLap += input.autoLapMeters ?? Infinity;
      }
    }
    if (block.lap) {
      lapEnds.push({ index: time.length - 1, name: block.name ?? `Lap ${lapNumber}` });
      lapNumber++;
    }
  }

  const last = time.length - 1;
  if (!lapEnds.length || lapEnds[lapEnds.length - 1].index < last - 5) {
    lapEnds.push({ index: last, name: `Lap ${lapNumber}` });
  }

  const laps: Lap[] = [];
  let from = 0;
  for (const end of lapEnds) {
    if (end.index <= from) continue;
    const slice = <T>(xs: T[]) => xs.slice(from, end.index + 1);
    const lapDistance = distance[end.index] - distance[from];
    const lapTime = time[end.index] - time[from];
    const lapWatts = kind === 'ride' ? slice(watts) : [];
    laps.push({
      name: end.name,
      startTimeSeconds: time[from],
      endTimeSeconds: time[end.index],
      distance: lapDistance,
      movingTime: lapTime,
      elevationGain: elevationGain(slice(altitude)),
      averageSpeed: lapTime ? lapDistance / lapTime : 0,
      maxSpeed: Math.max(...slice(speeds)),
      averageHeartrate: Math.round(mean(slice(heartrate))),
      maxHeartrate: Math.max(...slice(heartrate)),
      averageCadence: Math.round(mean(slice(cadence).filter((c) => c > 0))),
      averageWatts: lapWatts.length ? Math.round(mean(lapWatts)) : null,
      maxWatts: lapWatts.length ? Math.max(...lapWatts) : null,
    });
    from = end.index;
  }

  const totalDistance = distance[last];
  const movingTime = time[last];
  let weighted: number | null = null;
  if (kind === 'ride') {
    // Normalised power: 30 s rolling mean, fourth power
    const window = Math.round(30 / dt);
    const rolled: number[] = [];
    for (let i = window; i < watts.length; i++) {
      rolled.push(mean(watts.slice(i - window, i)) ** 4);
    }
    weighted = Math.round(mean(rolled) ** 0.25);
  }

  return {
    stream: {
      time,
      distance,
      latlng,
      altitude,
      heartrate,
      cadence,
      ...(kind === 'ride' ? { watts } : {}),
    },
    laps,
    summary: {
      distance: totalDistance,
      movingTime,
      elevationGain: Math.round(elevationGain(altitude)),
      averageSpeed: totalDistance / movingTime,
      maxSpeed: Math.max(...speeds),
      averageHeartrate: Math.round(mean(heartrate)),
      maxHeartrate: Math.max(...heartrate),
      averageCadence: Math.round(mean(cadence.filter((c) => c > 0))),
      averageWatts: kind === 'ride' ? Math.round(mean(watts)) : null,
      maxWatts: kind === 'ride' ? Math.max(...watts) : null,
      weightedAverageWatts: weighted,
      kilojoules: kind === 'ride' ? Math.round((mean(watts) * movingTime) / 1000) : null,
    },
  };
}
