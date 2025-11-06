import { record, record_type } from '@openathlete/database';
import { ActivityStream } from '@openathlete/shared';

// Target distances for all record types (in meters)
const TARGET_DISTANCES = [
  400, // 400m
  800, // 800m
  1000, // 1000m
  1500, // 1500m
  3000, // 3000m
  5000, // 5000m
  10000, // 10k
  15000, // 15k
  20000, // 20k
  21097.5, // Semi
  42195, // Marathon
  50000, // 50km
  100000, // 100km
];

// Tolerance for finding segments close to target distance (2% above target only)
// Segments must be at least targetDistance, but can be up to 2% longer
const DISTANCE_TOLERANCE_RATIO = 0.02;

/**
 * Find all segments of approximately targetDistance length and return the best one
 * For ELEVATION: returns the segment with maximum gain/loss (absolute value)
 * For SPEED: returns the segment with minimum normalized time
 * For other metrics: returns the segment with best average value
 */
function findBestSegmentForDistance(
  cumulativeDistances: number[],
  timeStream: number[],
  targetDistance: number,
  computeValue: (
    left: number,
    right: number,
    actualDistance: number,
  ) => {
    value: number;
    isValid: boolean;
  },
  compareValues: (current: number, best: number) => boolean, // returns true if current is better than best
): {
  value: number;
  start: number;
  end: number;
  distance: number;
} | null {
  let bestValue = null as {
    value: number;
    start: number;
    end: number;
    distance: number;
  } | null;

  const tolerance = targetDistance * DISTANCE_TOLERANCE_RATIO;
  const minDistance = targetDistance; // Must be at least targetDistance
  const maxDistance = targetDistance + tolerance;

  let right = 0;

  for (let left = 0; left < cumulativeDistances.length; left++) {
    // Find the right boundary where cumulativeDistances[right] - cumulativeDistances[left] >= minDistance
    while (
      right < cumulativeDistances.length &&
      cumulativeDistances[right] - cumulativeDistances[left] < minDistance
    ) {
      right++;
    }

    // Check all segments within tolerance and find the best one by value
    for (let r = right; r < cumulativeDistances.length; r++) {
      const actualDistance = cumulativeDistances[r] - cumulativeDistances[left];

      if (actualDistance > maxDistance) {
        break; // Too far, stop searching
      }

      if (actualDistance >= minDistance) {
        const result = computeValue(left, r, actualDistance);

        if (result.isValid) {
          const shouldUpdate =
            bestValue === null || compareValues(result.value, bestValue.value);

          if (shouldUpdate) {
            bestValue = {
              value: result.value,
              start: timeStream[left],
              end: timeStream[r],
              distance: actualDistance,
            };
          }
        }
      }
    }
  }

  return bestValue;
}

/**
 * Generic function to compute distance-based records for any stream
 * For SPEED: finds minimum time (normalized to target distance)
 * For other metrics: finds maximum/minimum average value
 */
const computeDistanceBasedRecords = (
  timeStream: number[],
  latlngStream: number[][],
  valueStream: number[],
  recordType: record_type,
  computeMax: boolean = false, // true for max average, false for min average
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  if (
    !timeStream ||
    !latlngStream ||
    !valueStream ||
    timeStream.length === 0 ||
    latlngStream.length === 0 ||
    valueStream.length === 0
  ) {
    return [];
  }

  // Calculate cumulative distances
  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < latlngStream.length; i++) {
    const [lat1, lng1] = latlngStream[i - 1];
    const [lat2, lng2] = latlngStream[i];
    const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);
    cumulativeDistances.push(cumulativeDistances[i - 1] + distance);
  }

  const records: Pick<
    record,
    'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
  >[] = [];

  for (const targetDistance of TARGET_DISTANCES) {
    if (cumulativeDistances[cumulativeDistances.length - 1] < targetDistance) {
      continue;
    }

    if (recordType === 'SPEED') {
      // For SPEED: find minimum time, normalized to target distance
      const segment = findBestSegmentForDistance(
        cumulativeDistances,
        timeStream,
        targetDistance,
        (left, right, actualDistance) => {
          const segmentTime = timeStream[right] - timeStream[left];

          // Check for pauses
          let hasPause = false;
          for (let i = left + 1; i <= right; i++) {
            if (timeStream[i] - timeStream[i - 1] > 5) {
              hasPause = true;
              break;
            }
          }

          if (hasPause) {
            return { value: 0, isValid: false };
          }

          // Normalize time to target distance
          const normalizedTime =
            segmentTime * (targetDistance / actualDistance);
          return { value: normalizedTime, isValid: true };
        },
        (current, best) => current < best, // smaller time is better
      );

      if (segment) {
        records.push({
          value: segment.value,
          type: 'SPEED',
          distance: targetDistance,
          start_duration: segment.start,
          end_duration: segment.end,
        });
      }
    } else {
      // For other metrics: find best average value
      const segment = findBestSegmentForDistance(
        cumulativeDistances,
        timeStream,
        targetDistance,
        (left, right) => {
          const segmentPoints: number[] = [];
          for (let i = left; i <= right; i++) {
            if (i < valueStream.length) {
              segmentPoints.push(valueStream[i]);
            }
          }

          if (segmentPoints.length === 0) {
            return { value: 0, isValid: false };
          }

          const average =
            segmentPoints.reduce((sum, val) => sum + val, 0) /
            segmentPoints.length;

          return { value: average, isValid: true };
        },
        computeMax
          ? (current, best) => current > best // larger is better
          : (current, best) => current < best, // smaller is better
      );

      if (segment) {
        records.push({
          value: segment.value,
          type: recordType,
          distance: targetDistance,
          start_duration: segment.start,
          end_duration: segment.end,
        });
      }
    }
  }

  return records;
};

const computeSpeedRecords = (
  stream: ActivityStream,
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  const { time, latlng } = stream;

  if (!time || !latlng || time.length === 0 || latlng.length === 0) {
    return [];
  }

  return computeDistanceBasedRecords(time, latlng, time, 'SPEED', false);
};

const computePowerRecords = (
  stream: ActivityStream,
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  const { time, latlng, watts } = stream;

  if (
    !time ||
    !latlng ||
    !watts ||
    time.length === 0 ||
    latlng.length === 0 ||
    watts.length === 0
  ) {
    return [];
  }

  return computeDistanceBasedRecords(time, latlng, watts, 'POWER', true);
};

const computeHeartRateRecords = (
  stream: ActivityStream,
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  const { time, latlng, heartrate } = stream;

  if (
    !time ||
    !latlng ||
    !heartrate ||
    time.length === 0 ||
    latlng.length === 0 ||
    heartrate.length === 0
  ) {
    return [];
  }

  return computeDistanceBasedRecords(
    time,
    latlng,
    heartrate,
    'HEARTRATE',
    true,
  );
};

const computeCadenceRecords = (
  stream: ActivityStream,
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  const { time, latlng, cadence } = stream;

  if (
    !time ||
    !latlng ||
    !cadence ||
    time.length === 0 ||
    latlng.length === 0 ||
    cadence.length === 0
  ) {
    return [];
  }

  return computeDistanceBasedRecords(time, latlng, cadence, 'CADENCE', true);
};

/**
 * Compute elevation gain records over specified distances
 * For each target distance, finds the segment closest to that distance with maximum elevation gain
 * Uses absolute values (not normalized) and ensures monotonicity
 */
const computeElevationGainRecords = (
  stream: ActivityStream,
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  const { time, latlng, altitude } = stream;

  if (
    !time ||
    !latlng ||
    !altitude ||
    time.length === 0 ||
    latlng.length === 0 ||
    altitude.length === 0
  ) {
    return [];
  }

  // Calculate cumulative distances
  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < latlng.length; i++) {
    const [lat1, lng1] = latlng[i - 1];
    const [lat2, lng2] = latlng[i];
    const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);
    cumulativeDistances.push(cumulativeDistances[i - 1] + distance);
  }

  const records: Pick<
    record,
    'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
  >[] = [];

  for (const targetDistance of TARGET_DISTANCES) {
    if (cumulativeDistances[cumulativeDistances.length - 1] < targetDistance) {
      continue;
    }

    // Find the segment with maximum elevation gain that is closest to targetDistance
    let bestGain = -Infinity;
    let bestStart = 0;
    let bestEnd = 0;
    let bestActualDistance = 0;

    const tolerance = targetDistance * DISTANCE_TOLERANCE_RATIO;
    const minDistance = targetDistance;
    const maxDistance = targetDistance + tolerance;

    let right = 0;

    for (let left = 0; left < cumulativeDistances.length; left++) {
      // Find right boundary
      while (
        right < cumulativeDistances.length &&
        cumulativeDistances[right] - cumulativeDistances[left] < minDistance
      ) {
        right++;
      }

      // Check all segments within tolerance
      for (let r = right; r < cumulativeDistances.length; r++) {
        const actualDistance =
          cumulativeDistances[r] - cumulativeDistances[left];

        if (actualDistance > maxDistance) {
          break;
        }

        if (actualDistance >= minDistance) {
          // Calculate elevation gain for this segment (absolute value)
          let elevGain = 0;
          for (let i = left + 1; i <= r && i < altitude.length; i++) {
            const diff = altitude[i] - altitude[i - 1];
            if (diff > 0) {
              elevGain += diff;
            }
          }

          // Normalize gain to target distance for fair comparison
          // This ensures monotonicity: a longer segment normalized to a shorter distance
          // will have at least the normalized gain of the best shorter segment
          const normalizedGain = elevGain * (targetDistance / actualDistance);

          // Find the segment with best normalized gain, preferring those closer to targetDistance when gain is similar
          const distanceDiff = Math.abs(actualDistance - targetDistance);
          const currentBestDistanceDiff = Math.abs(
            bestActualDistance - targetDistance,
          );

          const isBetter =
            normalizedGain > bestGain ||
            (normalizedGain === bestGain &&
              distanceDiff < currentBestDistanceDiff);

          if (isBetter) {
            bestGain = normalizedGain;
            bestStart = time[left];
            bestEnd = time[r];
            bestActualDistance = actualDistance;
          }
        }
      }
    }

    if (bestGain > -Infinity) {
      records.push({
        value: bestGain,
        type: 'ELEVATION_GAIN',
        distance: targetDistance,
        start_duration: bestStart,
        end_duration: bestEnd,
      });
    }
  }

  return records;
};

/**
 * Compute elevation loss records over specified distances
 * For each target distance, finds the segment closest to that distance with maximum elevation loss
 * Uses absolute values (not normalized) and ensures monotonicity
 */
const computeElevationLossRecords = (
  stream: ActivityStream,
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  const { time, latlng, altitude } = stream;

  if (
    !time ||
    !latlng ||
    !altitude ||
    time.length === 0 ||
    latlng.length === 0 ||
    altitude.length === 0
  ) {
    return [];
  }

  // Calculate cumulative distances
  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < latlng.length; i++) {
    const [lat1, lng1] = latlng[i - 1];
    const [lat2, lng2] = latlng[i];
    const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);
    cumulativeDistances.push(cumulativeDistances[i - 1] + distance);
  }

  const records: Pick<
    record,
    'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
  >[] = [];

  for (const targetDistance of TARGET_DISTANCES) {
    if (cumulativeDistances[cumulativeDistances.length - 1] < targetDistance) {
      continue;
    }

    // Find the segment with maximum elevation loss that is closest to targetDistance
    let bestLoss = -Infinity;
    let bestStart = 0;
    let bestEnd = 0;
    let bestActualDistance = 0;

    const tolerance = targetDistance * DISTANCE_TOLERANCE_RATIO;
    const minDistance = targetDistance;
    const maxDistance = targetDistance + tolerance;

    let right = 0;

    for (let left = 0; left < cumulativeDistances.length; left++) {
      // Find right boundary
      while (
        right < cumulativeDistances.length &&
        cumulativeDistances[right] - cumulativeDistances[left] < minDistance
      ) {
        right++;
      }

      // Check all segments within tolerance
      for (let r = right; r < cumulativeDistances.length; r++) {
        const actualDistance =
          cumulativeDistances[r] - cumulativeDistances[left];

        if (actualDistance > maxDistance) {
          break;
        }

        if (actualDistance >= minDistance) {
          // Calculate elevation loss for this segment (absolute value)
          let elevLoss = 0;
          for (let i = left + 1; i <= r && i < altitude.length; i++) {
            const diff = altitude[i - 1] - altitude[i];
            if (diff > 0) {
              elevLoss += diff;
            }
          }

          // Normalize loss to target distance for fair comparison
          // This ensures monotonicity: a longer segment normalized to a shorter distance
          // will have at least the normalized loss of the best shorter segment
          const normalizedLoss = elevLoss * (targetDistance / actualDistance);

          // Find the segment with best normalized loss, preferring those closer to targetDistance when loss is similar
          const distanceDiff = Math.abs(actualDistance - targetDistance);
          const currentBestDistanceDiff = Math.abs(
            bestActualDistance - targetDistance,
          );

          const isBetter =
            normalizedLoss > bestLoss ||
            (normalizedLoss === bestLoss &&
              distanceDiff < currentBestDistanceDiff);

          if (isBetter) {
            bestLoss = normalizedLoss;
            bestStart = time[left];
            bestEnd = time[r];
            bestActualDistance = actualDistance;
          }
        }
      }
    }

    if (bestLoss > -Infinity) {
      records.push({
        value: bestLoss,
        type: 'ELEVATION_LOSS',
        distance: targetDistance,
        start_duration: bestStart,
        end_duration: bestEnd,
      });
    }
  }

  return records;
};

export const computeRecords = (
  stream: ActivityStream,
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  const speedRecords = computeSpeedRecords(stream);
  const powerRecords = computePowerRecords(stream);
  const heartRateRecords = computeHeartRateRecords(stream);
  const cadenceRecords = computeCadenceRecords(stream);
  const elevationGainRecords = computeElevationGainRecords(stream);
  const elevationLossRecords = computeElevationLossRecords(stream);

  return [
    ...speedRecords,
    ...powerRecords,
    ...heartRateRecords,
    ...cadenceRecords,
    ...elevationGainRecords,
    ...elevationLossRecords,
  ];
};

function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
