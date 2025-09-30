import { GpxPoint } from "./gpx";
import { GpxEnrichedSegment } from "./segments";
import { haversineDistance } from "./utils";
import {
  getOpenMeteoTemperatureC,
  getOpenMeteoHourlyBundle,
  isoHourUtc,
} from "./open-meteo";
import * as SunCalc from "suncalc";

export interface KmTemperatureSample {
  distM: number; // from start
  timeSec: number; // from start
  lat: number;
  lon: number;
  tempC: number;
}

export interface KmWeatherSample extends KmTemperatureSample {
  // Additional meteorology
  apparentC?: number;
  humidityPct?: number;
  precipitationMm?: number;
  rainMm?: number;
  snowfallCm?: number;
  cloudCoverPct?: number;
  windSpeed10mKmh?: number;
  windGusts10mKmh?: number;
  shortwaveRadiationWm2?: number;
  sunshineDurationSec?: number;
  isDay?: boolean;
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

export async function sampleWeatherEveryKm(
  points: GpxPoint[],
  segments: GpxEnrichedSegment[],
  startDate: Date
): Promise<KmWeatherSample[]> {
  if (!points.length || !segments.length) return [];
  const cumDist = buildCumulativeDistances(points);
  const totalDist = cumDist[cumDist.length - 1];
  const map = mapDistanceToTime(segments);
  // Compute race end time estimate to bound the range
  const totalTimeSec = segments.reduce((a, s) => a + (s.duration || 0), 0);
  const endDate = new Date(startDate.getTime() + totalTimeSec * 1000);
  // We'll fetch hourly bundles per km location (per UTC day) using in-memory caching inside the provider

  const out: KmWeatherSample[] = [];
  let target = 0;
  while (target <= totalDist + 1e-6) {
    let idx = cumDist.findIndex((d) => d >= target);
    if (idx === -1) idx = points.length - 1;
    const p = points[Math.max(0, idx)];
    const timeSec = interpolateTimeAtDistance(target, map);
    const date = new Date(startDate.getTime() + timeSec * 1000);

    // Use pre-fetched bundle for the race window
    let tempC = 10;
    let apparentC: number | undefined;
    let humidityPct: number | undefined;
    let precipitationMm: number | undefined;
    let rainMm: number | undefined;
    let snowfallCm: number | undefined;
    let cloudCoverPct: number | undefined;
    let windSpeed10mKmh: number | undefined;
    let windGusts10mKmh: number | undefined;
    let shortwaveRadiationWm2: number | undefined;
    let sunshineDurationSec: number | undefined;
    let isDay: boolean | undefined;

    // Interpolate between adjacent hourly samples for smoother per‑km values
    let s: any | undefined;
    let s1: any | undefined;
    try {
      const kmBundle = await getOpenMeteoHourlyBundle({
        date,
        lat: p.lat,
        lon: p.lon,
      });
      const iso = isoHourUtc(date);
      s = kmBundle?.byHour.get(iso);
      const t0 = s ? Date.parse(s.timeIso) : Date.UTC(1970, 0, 1);
      const nextHour = new Date((s ? t0 : date.getTime()) + 3600 * 1000);
      s1 = kmBundle?.byHour.get(isoHourUtc(nextHour));
    } catch {}
    if (s) {
      // If the date isn't exactly on the hour, interpolate with next hour when available
      const t0 = Date.parse(s.timeIso);
      const t = date.getTime();
      const nextHour = new Date(t0 + 3600 * 1000);
      // s1 might be precomputed above; if missing, try to look it up now
      s1 =
        s1 ??
        (await (async () => {
          try {
            const kmBundle = await getOpenMeteoHourlyBundle({
              date: nextHour,
              lat: p.lat,
              lon: p.lon,
            });
            return kmBundle?.byHour.get(isoHourUtc(nextHour));
          } catch {
            return undefined;
          }
        })());
      const f = Math.min(1, Math.max(0, (t - t0) / (3600 * 1000)));
      function lerp(a?: number, b?: number): number | undefined {
        if (typeof a === "number" && typeof b === "number")
          return a + f * (b - a);
        return a ?? b; // fallback to available
      }
      tempC = lerp(s.temperatureC, s1?.temperatureC) ?? tempC;
      apparentC = lerp(s.apparentTemperatureC, s1?.apparentTemperatureC);
      humidityPct = lerp(s.humidityPct, s1?.humidityPct);
      precipitationMm = lerp(s.precipitationMm, s1?.precipitationMm);
      rainMm = lerp(s.rainMm, s1?.rainMm);
      snowfallCm = lerp(s.snowfallCm, s1?.snowfallCm);
      cloudCoverPct = lerp(s.cloudCoverPct, s1?.cloudCoverPct);
      windSpeed10mKmh = lerp(s.windSpeed10mKmh, s1?.windSpeed10mKmh);
      windGusts10mKmh = lerp(s.windGusts10mKmh, s1?.windGusts10mKmh);
      shortwaveRadiationWm2 = lerp(
        s.shortwaveRadiationWm2,
        s1?.shortwaveRadiationWm2
      );
      sunshineDurationSec = lerp(
        s.sunshineDurationSec,
        s1?.sunshineDurationSec
      );
      // For isDay, pick the dominant hour (threshold 0.5)
      if (typeof s.isDay === "boolean" && typeof s1?.isDay === "boolean") {
        isDay = f < 0.5 ? s.isDay : s1.isDay;
      } else {
        isDay = s.isDay ?? s1?.isDay;
      }
    } else {
      try {
        tempC = await getOpenMeteoTemperatureC({
          date,
          lat: p.lat,
          lon: p.lon,
        });
      } catch {}
    }
    // If isDay unknown, compute roughly using SunCalc at that instant and location
    if (typeof isDay !== "boolean") {
      const times = SunCalc.getTimes(date, p.lat, p.lon);
      isDay = date >= (times.sunrise as any) && date <= (times.sunset as any);
    }

    out.push({
      distM: target,
      timeSec,
      lat: p.lat,
      lon: p.lon,
      tempC,
      apparentC,
      humidityPct,
      precipitationMm,
      rainMm,
      snowfallCm,
      cloudCoverPct,
      windSpeed10mKmh,
      windGusts10mKmh,
      shortwaveRadiationWm2,
      sunshineDurationSec,
      isDay,
    });
    target += 1000;
  }
  return out;
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
