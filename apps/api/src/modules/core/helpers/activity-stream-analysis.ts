import { ActivityStream, CompressedActivityStream } from '@openathlete/shared';

import { uncompressActivityStream } from './activity-stream';

/**
 * Segment query configuration
 */
interface StreamSegmentQuery {
  type: 'distance' | 'time' | 'altitude';
  from: number; // meters, seconds, or meters
  to: number;
  metrics?: StreamMetric[];
}

type StreamMetric =
  | 'avg_speed'
  | 'max_speed'
  | 'avg_heartrate'
  | 'max_heartrate'
  | 'avg_cadence'
  | 'avg_watts'
  | 'avg_gap'
  | 'elevation_gain'
  | 'elevation_loss';

/**
 * Segment analysis result
 */
interface StreamSegmentAnalysis {
  segment_info: {
    type: string;
    from: number;
    to: number;
    start_index: number;
    end_index: number;
    points_count: number;
    actual_from?: number; // Actual value at start_index
    actual_to?: number; // Actual value at end_index
  };
  // Speed metrics
  avg_speed_ms?: number;
  avg_speed_kmh?: number;
  avg_pace_min_km?: number;
  max_speed_ms?: number;
  max_speed_kmh?: number;
  // Heart rate metrics
  avg_heartrate_bpm?: number;
  max_heartrate_bpm?: number;
  // Power metrics
  avg_watts?: number;
  max_watts?: number;
  // Cadence
  avg_cadence_rpm?: number;
  // GAP
  avg_gap_ms?: number;
  avg_gap_pace_min_km?: number;
  // Elevation
  elevation_gain_m?: number;
  elevation_loss_m?: number;
}

/**
 * Find segment indices based on query type
 */
function findSegmentIndices(
  stream: ActivityStream,
  query: StreamSegmentQuery,
): { startIdx: number; endIdx: number } | null {
  let referenceArray: number[] | undefined;
  let arrayName: string;

  // Select the appropriate array based on query type
  switch (query.type) {
    case 'distance':
      referenceArray = stream.distance;
      arrayName = 'distance';
      break;
    case 'time':
      referenceArray = stream.time;
      arrayName = 'time';
      break;
    case 'altitude':
      referenceArray = stream.altitude;
      arrayName = 'altitude';
      break;
  }

  if (
    !referenceArray ||
    !Array.isArray(referenceArray) ||
    referenceArray.length === 0
  ) {
    console.warn(`[StreamAnalysis] ${arrayName} data not available`);
    return null;
  }

  // Find start and end indices
  let startIdx = referenceArray.findIndex((val) => val >= query.from);
  let endIdx = referenceArray.findIndex((val) => val >= query.to);

  // Handle edge cases
  if (startIdx === -1) startIdx = 0;
  if (endIdx === -1) endIdx = referenceArray.length - 1;
  if (endIdx < startIdx) endIdx = startIdx;

  return { startIdx, endIdx };
}

/**
 * Calculate average of an array
 */
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const validValues = values.filter((v) => Number.isFinite(v));
  if (validValues.length === 0) return 0;
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return sum / validValues.length;
}

/**
 * Calculate max of an array
 */
function calculateMax(values: number[]): number {
  if (values.length === 0) return 0;
  const validValues = values.filter((v) => Number.isFinite(v));
  if (validValues.length === 0) return 0;
  return Math.max(...validValues);
}

/**
 * Extract a slice from stream array with bounds checking
 */
function sliceStreamData(
  data: number[] | undefined,
  startIdx: number,
  endIdx: number,
): number[] {
  if (!data || !Array.isArray(data) || data.length === 0) return [];
  const safeStart = Math.max(0, Math.min(startIdx, data.length - 1));
  const safeEnd = Math.max(safeStart, Math.min(endIdx + 1, data.length));
  return data.slice(safeStart, safeEnd);
}

/**
 * Calculate speed metrics for a segment
 */
function calculateSpeedMetrics(
  stream: ActivityStream,
  startIdx: number,
  endIdx: number,
  includeMax: boolean = false,
): {
  avg_speed_ms?: number;
  avg_speed_kmh?: number;
  avg_pace_min_km?: number;
  max_speed_ms?: number;
  max_speed_kmh?: number;
} {
  const result: any = {};

  // Use distance and time to calculate speed if available
  const distance = sliceStreamData(stream.distance, startIdx, endIdx);
  const time = sliceStreamData(stream.time, startIdx, endIdx);

  if (distance.length > 1 && time.length > 1) {
    const totalDist = distance[distance.length - 1] - distance[0];
    const totalTime = time[time.length - 1] - time[0];

    if (totalTime > 0) {
      const avgSpeed = totalDist / totalTime; // m/s
      result.avg_speed_ms = avgSpeed;
      result.avg_speed_kmh = avgSpeed * 3.6;
      result.avg_pace_min_km = avgSpeed > 0 ? 1000 / (avgSpeed * 60) : 0;
    }
  }

  // Calculate max speed if needed (from instantaneous speeds)
  if (includeMax && distance.length > 1 && time.length > 1) {
    const instantaneousSpeeds: number[] = [];
    for (let i = 1; i < Math.min(distance.length, time.length); i++) {
      const dd = distance[i] - distance[i - 1];
      const dt = time[i] - time[i - 1];
      if (dt > 0) {
        instantaneousSpeeds.push(dd / dt);
      }
    }
    if (instantaneousSpeeds.length > 0) {
      result.max_speed_ms = calculateMax(instantaneousSpeeds);
      result.max_speed_kmh = result.max_speed_ms * 3.6;
    }
  }

  return result;
}

/**
 * Calculate heart rate metrics for a segment
 */
function calculateHeartRateMetrics(
  stream: ActivityStream,
  startIdx: number,
  endIdx: number,
): {
  avg_heartrate_bpm?: number;
  max_heartrate_bpm?: number;
} {
  const result: any = {};
  const hrs = sliceStreamData(stream.heartrate, startIdx, endIdx);

  if (hrs.length > 0) {
    result.avg_heartrate_bpm = calculateAverage(hrs);
    result.max_heartrate_bpm = calculateMax(hrs);
  }

  return result;
}

/**
 * Calculate cadence metrics for a segment
 */
function calculateCadenceMetrics(
  stream: ActivityStream,
  startIdx: number,
  endIdx: number,
): {
  avg_cadence_rpm?: number;
} {
  const result: any = {};
  const cadences = sliceStreamData(stream.cadence, startIdx, endIdx);

  if (cadences.length > 0) {
    result.avg_cadence_rpm = calculateAverage(cadences);
  }

  return result;
}

/**
 * Calculate power metrics for a segment
 */
function calculatePowerMetrics(
  stream: ActivityStream,
  startIdx: number,
  endIdx: number,
): {
  avg_watts?: number;
  max_watts?: number;
} {
  const result: any = {};
  const watts = sliceStreamData(stream.watts, startIdx, endIdx);

  if (watts.length > 0) {
    result.avg_watts = calculateAverage(watts);
    result.max_watts = calculateMax(watts);
  }

  return result;
}

/**
 * Calculate GAP (Grade Adjusted Pace) for a segment
 */
function calculateGAPMetrics(
  stream: ActivityStream,
  startIdx: number,
  endIdx: number,
): {
  avg_gap_ms?: number;
  avg_gap_pace_min_km?: number;
} {
  const result: any = {};

  // If GAP is already computed in the stream, use it
  if (stream.gap && Array.isArray(stream.gap) && stream.gap.length > 0) {
    const gapSpeeds = sliceStreamData(stream.gap, startIdx, endIdx);
    if (gapSpeeds.length > 0) {
      result.avg_gap_ms = calculateAverage(gapSpeeds);
      result.avg_gap_pace_min_km =
        result.avg_gap_ms > 0 ? 1000 / (result.avg_gap_ms * 60) : 0;
    }
  }

  return result;
}

/**
 * Calculate elevation gain/loss for a segment
 */
function calculateElevationMetrics(
  stream: ActivityStream,
  startIdx: number,
  endIdx: number,
): {
  elevation_gain_m?: number;
  elevation_loss_m?: number;
} {
  const result: any = {};
  const altitudes = sliceStreamData(stream.altitude, startIdx, endIdx);

  if (altitudes.length > 1) {
    let gain = 0;
    let loss = 0;

    for (let i = 1; i < altitudes.length; i++) {
      const diff = altitudes[i] - altitudes[i - 1];
      if (diff > 0) {
        gain += diff;
      } else {
        loss += Math.abs(diff);
      }
    }

    result.elevation_gain_m = gain;
    result.elevation_loss_m = loss;
  }

  return result;
}
