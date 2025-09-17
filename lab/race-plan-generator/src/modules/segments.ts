import { GpxSegment } from "./splitter";

export interface GpxEnrichedSegment extends GpxSegment {
  duration: number; // in seconds
  averagePace: number; // in min/km
}

export function stravaPolynomial(x: number): number {
  return (
    0.990554879163107 +
    0.032844586542411 * x +
    0.002148347700774 * Math.pow(x, 2) -
    0.000004498739573 * Math.pow(x, 3) -
    0.000000598866801 * Math.pow(x, 4)
  );
}

export function getEnrichedSegments(
  segments: GpxSegment[],
  normalizedPace: number,
  fatigue?: { startSpeedPct?: number; endSpeedPct?: number }
) {
  const totalDistance = segments.reduce((s, x) => s + x.length, 0) || 1;
  const startPct = (fatigue?.startSpeedPct ?? 0) / 100;
  const endPct = (fatigue?.endSpeedPct ?? 0) / 100;
  let accDist = 0;
  return segments.map((seg) => {
    const segCenterDist = accDist + seg.length / 2;
    const progress = Math.min(1, Math.max(0, segCenterDist / totalDistance));
    const speedMultiplier = 1 + startPct + (endPct - startPct) * progress;

    const paceFactor = stravaPolynomial(seg.averageGrade);
    const adjustedPace = normalizedPace * paceFactor; // in min/km
    const baseDuration = (seg.length / 1000) * adjustedPace * 60; // in seconds
    const duration = baseDuration / (speedMultiplier || 1); // protect div by 0
    const avgPaceMinPerKm = duration / 60 / (seg.length / 1000 || 1);

    accDist += seg.length;
    return {
      ...seg,
      duration,
      averagePace: avgPaceMinPerKm,
    };
  });
}
