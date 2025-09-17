import { GpxPoint } from "./gpx";
import { haversineDistance } from "./utils";
import { RacePlanConfig } from "./config";
import { GpxSegment } from "./splitter";
import { GpxEnrichedSegment, stravaPolynomial } from "./segments";

export interface LegSummary {
  name: string;
  startBoundaryIndex: number; // boundary index among segment boundaries
  endBoundaryIndex: number;
  distance: number; // meters
  elevationGain: number; // meters
  elevationLoss: number; // meters
  movingTimeSec: number; // seconds (without stop)
  stopTimeSec: number; // seconds (stop at end of leg)
  totalTimeSec: number; // moving + stop
}

export interface ComputePlanResult {
  legs: LegSummary[];
  totals: {
    distance: number;
    elevationGain: number;
    elevationLoss: number;
    movingTimeSec: number;
    stopTimeSec: number;
    totalTimeSec: number;
  };
}

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

export function computePlan(
  segments: Array<GpxSegment | GpxEnrichedSegment>,
  points: GpxPoint[],
  config: RacePlanConfig
): ComputePlanResult {
  if (!segments.length || !points.length) {
    return {
      legs: [],
      totals: {
        distance: 0,
        elevationGain: 0,
        elevationLoss: 0,
        movingTimeSec: 0,
        stopTimeSec: 0,
        totalTimeSec: 0,
      },
    };
  }

  // Map each segment to global point indices [startIdx, endIdx]
  const pointIndex = new Map<GpxPoint, number>();
  for (let i = 0; i < points.length; i++) pointIndex.set(points[i], i);
  const segmentRanges = segments.map((seg) => {
    const a = pointIndex.get(seg.points[0])!;
    const b = pointIndex.get(seg.points[seg.points.length - 1])!;
    return { seg, start: a, end: b };
  });
  const boundaryIndices = segmentRanges.map((r) => r.end);
  const boundarySet = new Set<number>(boundaryIndices);

  // Compute per-segment moving times according to goal
  let segMovingTimes: number[] = new Array(segments.length).fill(0);
  const totalDistance = segments.reduce((s, x) => s + x.length, 0);
  if (config.goal.type === "normalized_pace") {
    // If segments are enriched, prefer their precomputed durations (includes fatigue).
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i] as GpxEnrichedSegment;
      if (typeof seg.duration === "number" && !Number.isNaN(seg.duration)) {
        segMovingTimes[i] = seg.duration;
      } else {
        const paceFactor = stravaPolynomial(segments[i].averageGrade);
        const adjPace = config.goal.value * paceFactor; // min/km
        segMovingTimes[i] = (segments[i].length / 1000) * adjPace * 60; // seconds
      }
    }
  } else {
    const totalStopsCfg = (config.stops || []).reduce(
      (s, st) => s + (st.duration || 0),
      0
    );
    const movingBudget = Math.max(0, config.goal.value - totalStopsCfg);
    for (let i = 0; i < segments.length; i++) {
      const share = totalDistance > 0 ? segments[i].length / totalDistance : 0;
      segMovingTimes[i] = movingBudget * share;
    }
  }

  // Choose boundaries nearest to each stop, but align to segment boundaries and keep order
  const chosenBoundaryIdx: number[] = [];
  const stops = config.stops || [];
  let lastBoundaryPos = -1;
  for (const st of stops) {
    const stopPtIdx = nearestPointIndex(points, st.coords.lat, st.coords.lon);
    // find nearest boundary strictly after lastBoundaryPos
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
  // Ensure strictly increasing and within [0, last]
  const lastPointIdx = points.length - 1;
  const normalizedBoundaries = Array.from(new Set(chosenBoundaryIdx)).filter(
    (v) => v >= 0 && v < lastPointIdx
  );

  // Build legs between [start(0)] -> chosen boundaries -> [finish(last)]
  const legBoundaries = [
    boundaryIndices[0] ?? 0,
    ...normalizedBoundaries,
    lastPointIdx,
  ];
  // Ensure first boundary is 0 not segment end index: adjust
  legBoundaries[0] = 0;

  // Map stop durations to boundary index (end of leg)
  const boundaryToStopSec = new Map<number, number>();
  for (let i = 0; i < normalizedBoundaries.length; i++) {
    const b = normalizedBoundaries[i];
    const st = stops[i];
    if (st) boundaryToStopSec.set(b, st.duration || 0);
  }

  const legs: LegSummary[] = [];
  for (let i = 0; i < legBoundaries.length - 1; i++) {
    const startIdx = legBoundaries[i];
    const endIdx = legBoundaries[i + 1];
    // sum segments fully contained within (startIdx, endIdx]
    let dist = 0;
    let gain = 0;
    let loss = 0;
    let move = 0;
    for (let s = 0; s < segmentRanges.length; s++) {
      const r = segmentRanges[s];
      if (r.end <= endIdx && r.start >= startIdx) {
        dist += r.seg.length;
        gain += r.seg.elevationGain;
        loss += r.seg.elevationLoss;
        move += segMovingTimes[s];
      }
    }
    const stop = boundaryToStopSec.get(endIdx) || 0;
    const nameStart = i === 0 ? "Start" : stops[i - 1]?.name || `B${i}`;
    const nameEnd = i < normalizedBoundaries.length ? stops[i]?.name : "Finish";
    legs.push({
      name: `${nameStart} → ${nameEnd}`,
      startBoundaryIndex: startIdx,
      endBoundaryIndex: endIdx,
      distance: dist,
      elevationGain: gain,
      elevationLoss: loss,
      movingTimeSec: move,
      stopTimeSec: stop,
      totalTimeSec: move + stop,
    });
  }

  const totals = {
    distance: legs.reduce((s, l) => s + l.distance, 0),
    elevationGain: legs.reduce((s, l) => s + l.elevationGain, 0),
    elevationLoss: legs.reduce((s, l) => s + l.elevationLoss, 0),
    movingTimeSec: legs.reduce((s, l) => s + l.movingTimeSec, 0),
    stopTimeSec: legs.reduce((s, l) => s + l.stopTimeSec, 0),
    totalTimeSec: legs.reduce((s, l) => s + l.totalTimeSec, 0),
  };

  return { legs, totals };
}
