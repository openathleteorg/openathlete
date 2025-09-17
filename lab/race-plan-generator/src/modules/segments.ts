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
  normalizedPace: number
) {
  return segments.map((seg) => {
    const paceFactor = stravaPolynomial(seg.averageGrade);
    const adjustedPace = normalizedPace * paceFactor; // in min/km
    const duration = (seg.length / 1000) * adjustedPace * 60; // in seconds
    return {
      ...seg,
      duration,
      averagePace: adjustedPace,
    };
  });
}
