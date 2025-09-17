import { GpxSegment } from "./splitter";

export interface OfficialMetrics {
  distanceMeters?: number;
  elevationGainMeters?: number;
}

export function computeOfficialRatios(
  segments: GpxSegment[],
  official: OfficialMetrics
) {
  const currentDistance = segments.reduce((s, x) => s + x.length, 0);
  const currentGain = segments.reduce((s, x) => s + x.elevationGain, 0);
  const distanceRatio =
    official.distanceMeters && currentDistance > 0
      ? official.distanceMeters / currentDistance
      : 1;
  const gainRatio =
    official.elevationGainMeters && currentGain > 0
      ? official.elevationGainMeters / currentGain
      : 1;
  return { distanceRatio, gainRatio, currentDistance, currentGain };
}

export function adjustSegmentsByRatios(
  segments: GpxSegment[],
  distanceRatio: number,
  gainRatio: number
): GpxSegment[] {
  if (distanceRatio === 1 && gainRatio === 1) return segments;
  return segments.map((s) => ({
    ...s,
    length: s.length * distanceRatio,
    elevationGain: s.elevationGain * gainRatio,
    elevationLoss: s.elevationLoss * gainRatio, // simplistic symmetric scaling
    averageGrade:
      s.length > 0 ? ((s.elevationGain - s.elevationLoss) / s.length) * 100 : 0,
    // keep max/minGrade as-is; they are shape descriptors; could rescale if needed
  }));
}
