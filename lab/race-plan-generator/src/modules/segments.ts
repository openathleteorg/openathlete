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
  // First pass: compute base durations without fatigue (grade effect only)
  const baseDurations = segments.map((seg) => {
    const paceFactor = stravaPolynomial(seg.averageGrade);
    const adjustedPace = normalizedPace * paceFactor; // min/km
    return (seg.length / 1000) * adjustedPace * 60; // seconds
  });
  const totalBaseTime = baseDurations.reduce((s, t) => s + t, 0) || 1;

  const startPct = (fatigue?.startSpeedPct ?? 0) / 100;
  const endPct = (fatigue?.endSpeedPct ?? 0) / 100;

  let accBase = 0;
  const enriched = segments.map((seg, i) => {
    const baseDuration = baseDurations[i];
    const centerTime = accBase + baseDuration / 2;
    const progress = Math.min(1, Math.max(0, centerTime / totalBaseTime));
    const speedMultiplier = 1 + startPct + (endPct - startPct) * progress;

    const duration = baseDuration / (speedMultiplier || 1);
    const avgPaceMinPerKm = duration / 60 / (seg.length / 1000 || 1);

    accBase += baseDuration;
    return {
      ...seg,
      duration,
      averagePace: avgPaceMinPerKm,
    };
  });

  return enriched;
}
