import { GpxPoint } from "./gpx";
import { GpxEnrichedSegment } from "./segments";
import { RacePlanConfig } from "./config";
import { haversineDistance } from "./utils";
import * as SunCalc from "suncalc";

function nearestPointIndex(
  points: GpxPoint[],
  lat: number,
  lon: number
): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const d = haversineDistance(p, { ...p, lat, lon });
    if (d < bestD) {
      best = i;
      bestD = d;
    }
  }
  return best;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

// Smooth night multiplier with linear fade around dawn/sunrise and sunset/dusk
function nightMultiplierAt(
  lat: number,
  lon: number,
  date: Date,
  nightPct: number
): number {
  const times = SunCalc.getTimes(date, lat, lon);

  // Define transition windows
  // Morning fade: from civil/nautical dawn up to sunriseEnd (if present), otherwise sunrise + 15min
  const morningStart = (times.nauticalDawn ?? times.dawn ?? times.sunrise) as
    | Date
    | undefined;
  const morningEnd = (
    times.sunriseEnd
      ? times.sunriseEnd
      : times.sunrise
        ? new Date(times.sunrise.getTime() + 15 * 60 * 1000)
        : undefined
  ) as Date | undefined;

  // Evening fade: from sunset to civil/nautical dusk (prefer nautical for longer fade)
  const eveningStart = (times.sunset ?? times.dusk ?? times.nauticalDusk) as
    | Date
    | undefined;
  const eveningEnd = (
    (times.nauticalDusk ?? times.dusk)
      ? (times.nauticalDusk ?? times.dusk)!
      : times.sunset
        ? new Date(times.sunset.getTime() + 30 * 60 * 1000)
        : undefined
  ) as Date | undefined;

  const full = 1 + nightPct; // full night penalty multiplier
  const t = date.getTime();

  // Fallback to simple heuristic if critical times are missing
  if (!morningStart || !morningEnd || !eveningStart || !eveningEnd) {
    const h = date.getHours();
    return h >= 21 || h < 6 ? full : 1;
  }

  const ms = morningStart.getTime();
  const me = morningEnd.getTime();
  const es = eveningStart.getTime();
  const ee = eveningEnd.getTime();

  if (me <= ms || ee <= es) {
    const h = date.getHours();
    return h >= 21 || h < 6 ? full : 1;
  }

  // Deep night before morning twilight
  if (t <= ms) return full;

  // Morning fade-out: night -> day
  if (t < me) {
    const k = 1 - clamp01((t - ms) / (me - ms));
    return 1 + nightPct * k;
  }

  // Daytime between morning end and evening start
  if (t <= es) return 1;

  // Evening fade-in: day -> night
  if (t < ee) {
    const k = clamp01((t - es) / (ee - es));
    return 1 + nightPct * k;
  }

  // Deep night after dusk
  return full;
}

export function applyNightUnderperformance(
  segments: GpxEnrichedSegment[],
  points: GpxPoint[],
  config: RacePlanConfig
): GpxEnrichedSegment[] {
  if (!segments.length || !points.length) return segments;
  const startIso = config.startTime;
  if (!startIso) return segments; // nothing to do without start time
  const startDate = new Date(startIso);
  const nightPct = (config.nightUnderperfPct ?? 10) / 100; // fraction

  // Map segments to global indices [start, end]
  const pointIndex = new Map<GpxPoint, number>();
  for (let i = 0; i < points.length; i++) pointIndex.set(points[i], i);
  const segmentRanges = segments.map((seg) => {
    const a = pointIndex.get(seg.points[0])!;
    const b = pointIndex.get(seg.points[seg.points.length - 1])!;
    return { seg, start: a, end: b };
  });
  const boundaryIndices = segmentRanges.map((r) => r.end);

  // Associate stops to nearest boundary index (like compute-plan)
  const chosenBoundaryIdx: number[] = [];
  const stops = config.stops || [];
  let lastBoundaryPos = -1;
  for (const st of stops) {
    const stopPtIdx = nearestPointIndex(points, st.coords.lat, st.coords.lon);
    let nearest = -1;
    let bestDelta = Infinity;
    for (const b of boundaryIndices) {
      if (b <= lastBoundaryPos) continue;
      const delta = Math.abs(b - stopPtIdx);
      if (delta < bestDelta) {
        bestDelta = delta;
        nearest = b;
      }
    }
    if (nearest !== -1) {
      chosenBoundaryIdx.push(nearest);
      lastBoundaryPos = nearest;
    }
  }
  const boundaryToStopSec = new Map<number, number>();
  for (let i = 0; i < chosenBoundaryIdx.length; i++) {
    const b = chosenBoundaryIdx[i];
    const st = stops[i];
    if (st) boundaryToStopSec.set(b, st.duration || 0);
  }

  // Iterate segments accumulating time and apply night multiplier when center instant is at night
  let cumulativeSec = 0; // includes both moving and stops completed so far
  const out: GpxEnrichedSegment[] = [];
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const move = s.duration || 0;
    const segCenterOffset = cumulativeSec + move / 2;
    const segCenterDate = new Date(
      startDate.getTime() + segCenterOffset * 1000
    );
    // center coordinates of the segment
    const midIdx = Math.floor(s.points.length / 2);
    const mid = s.points[Math.max(0, Math.min(s.points.length - 1, midIdx))];
    const nightMult = nightMultiplierAt(
      mid?.lat ?? 0,
      mid?.lon ?? 0,
      segCenterDate,
      nightPct
    );

    const newDuration = move * nightMult;
    out.push({
      ...s,
      duration: newDuration,
      // keep average pace consistent with new duration
      averagePace: newDuration / 60 / ((s.length || 1) / 1000),
      // expose night multiplier for visualization
      nightMultiplier: nightMult > 1 ? nightMult : undefined,
    });

    // Advance time by moving duration (post-adjustment)
    cumulativeSec += newDuration;
    // Add stop if boundary is a stop
    const endBoundary = segmentRanges[i].end;
    if (boundaryToStopSec.has(endBoundary)) {
      cumulativeSec += boundaryToStopSec.get(endBoundary)!;
    }
  }

  return out;
}
