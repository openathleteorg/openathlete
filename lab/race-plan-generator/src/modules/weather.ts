import { GpxPoint } from "./gpx";
import { GpxEnrichedSegment } from "./segments";
import { haversineDistance } from "./utils";
import { getOpenMeteoTemperatureC } from "./open-meteo";

export interface KmTemperatureSample {
  distM: number; // from start
  timeSec: number; // from start
  lat: number;
  lon: number;
  tempC: number;
}

function buildCumulativeDistances(points: GpxPoint[]): number[] {
  const cum: number[] = new Array(points.length).fill(0);
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += haversineDistance(points[i - 1], points[i]);
    cum[i] = d;
  }
  return cum;
}

export function mapDistanceToTime(segments: GpxEnrichedSegment[]): {
  distances: number[]; // meters at segment boundaries
  times: number[]; // seconds at same boundaries
} {
  const distances: number[] = [0];
  const times: number[] = [0];
  let cumD = 0;
  let cumT = 0;
  for (const s of segments) {
    cumD += s.length || 0;
    cumT += s.duration || 0;
    distances.push(cumD);
    times.push(cumT);
  }
  return { distances, times };
}

export function interpolateTimeAtDistance(
  distM: number,
  map: { distances: number[]; times: number[] }
): number {
  const { distances, times } = map;
  if (!distances.length || !times.length) return 0;
  for (let i = 1; i < distances.length; i++) {
    if (distM <= distances[i]) {
      const d0 = distances[i - 1];
      const d1 = distances[i];
      const t0 = times[i - 1];
      const t1 = times[i];
      const f = d1 > d0 ? (distM - d0) / (d1 - d0) : 0;
      return t0 + f * (t1 - t0);
    }
  }
  return times[times.length - 1];
}

export async function sampleTemperatureEveryKm(
  points: GpxPoint[],
  segments: GpxEnrichedSegment[],
  startDate: Date
): Promise<KmTemperatureSample[]> {
  if (!points.length || !segments.length) return [];
  const cumDist = buildCumulativeDistances(points);
  const totalDist = cumDist[cumDist.length - 1];
  const map = mapDistanceToTime(segments);

  const samples: KmTemperatureSample[] = [];
  let target = 0; // include 0 km sample at start
  while (target <= totalDist + 1e-6) {
    // find nearest point index for distance >= target
    let idx = cumDist.findIndex((d) => d >= target);
    if (idx === -1) idx = points.length - 1;
    const p = points[Math.max(0, idx)];
    const timeSec = interpolateTimeAtDistance(target, map);
    const date = new Date(startDate.getTime() + timeSec * 1000);
    let tempC = 10;
    try {
      tempC = await getOpenMeteoTemperatureC({ date, lat: p.lat, lon: p.lon });
    } catch {}
    samples.push({ distM: target, timeSec, lat: p.lat, lon: p.lon, tempC });
    target += 1000;
  }

  return samples;
}

export function getNearestKmSampleByTime(
  samples: KmTemperatureSample[],
  timeSec: number
): KmTemperatureSample | undefined {
  if (!samples.length) return undefined;
  let best = samples[0];
  let bestD = Math.abs(samples[0].timeSec - timeSec);
  for (let i = 1; i < samples.length; i++) {
    const d = Math.abs(samples[i].timeSec - timeSec);
    if (d < bestD) {
      best = samples[i];
      bestD = d;
    }
  }
  return best;
}
