import { GpxPoint } from "./gpx";
import { haversineDistance } from "./utils";

export interface GpxSegment {
  points: GpxPoint[];
  length: number; // in meters
  elevationGain: number; // in meters
  elevationLoss: number; // in meters
  averageGrade: number; // in percentage
  maxGrade: number; // in percentage
  minGrade: number; // in percentage
}

export function splitGpxIntoSegments(
  points: GpxPoint[],
  stops?: Array<{ lat: number; lon: number }>
) {
  const segments: GpxSegment[] = [];
  if (points.length === 0) return segments;

  // Precompute forced cut indices: for each stop, find nearest point index
  const forcedCuts = new Set<number>();
  if (stops && stops.length) {
    for (const s of stops) {
      let bestIdx = -1;
      let bestD = Infinity;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const d = haversineDistance(p, { ...p, lat: s.lat, lon: s.lon });
        if (d < bestD) {
          bestD = d;
          bestIdx = i;
        }
      }
      if (bestIdx > 0 && bestIdx < points.length - 1) forcedCuts.add(bestIdx);
    }
  }

  let currentSegmentPoints: GpxPoint[] = [points[0]];
  let totalLength = 0;
  let totalElevationGain = 0;
  let totalElevationLoss = 0;
  let maxGrade = -Infinity;
  let minGrade = Infinity;
  // Split when the change in grade between consecutive steps is >= 2 percentage points
  const gradeChangeThresholdPct = 2; // percent points
  let prevGrade: number | null = null;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    const distance = Math.max(0, haversineDistance(prev, curr));
    let grade = 0;
    if (prev.ele !== null && curr.ele !== null) {
      const elevationChange = curr.ele - prev.ele;
      grade = distance > 0 ? (elevationChange / distance) * 100 : 0;
      maxGrade = Math.max(maxGrade, grade);
      minGrade = Math.min(minGrade, grade);
      // Accumulate elevation stats
      if (elevationChange > 0) totalElevationGain += elevationChange;
      else totalElevationLoss += -elevationChange;
    }
    // Always accumulate distance
    totalLength += distance;

    const shouldSplitByGrade =
      prevGrade !== null &&
      Math.abs(grade - prevGrade) >= gradeChangeThresholdPct;
    const shouldSplitByStop = forcedCuts.has(i);

    if (shouldSplitByGrade || shouldSplitByStop) {
      // start a new segment (the triggering step is included in the previous segment)
      segments.push({
        points: currentSegmentPoints,
        length: totalLength,
        elevationGain: totalElevationGain,
        elevationLoss: totalElevationLoss,
        averageGrade:
          totalLength === 0
            ? 0
            : ((totalElevationGain - totalElevationLoss) / totalLength) * 100,
        maxGrade: maxGrade === -Infinity ? 0 : maxGrade,
        minGrade: minGrade === Infinity ? 0 : minGrade,
      });
      currentSegmentPoints = [curr];
      totalLength = 0;
      totalElevationGain = 0;
      totalElevationLoss = 0;
      maxGrade = -Infinity;
      minGrade = Infinity;
      prevGrade = null; // reset comparator for the new segment
    } else {
      currentSegmentPoints.push(curr);
      prevGrade = grade;
    }
  }

  if (currentSegmentPoints.length > 0) {
    segments.push({
      points: currentSegmentPoints,
      length: totalLength,
      elevationGain: totalElevationGain,
      elevationLoss: totalElevationLoss,
      averageGrade:
        totalLength === 0
          ? 0
          : ((totalElevationGain - totalElevationLoss) / totalLength) * 100,
      maxGrade: maxGrade === -Infinity ? 0 : maxGrade,
      minGrade: minGrade === Infinity ? 0 : minGrade,
    });
  }

  return segments;
}
