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

// Maximum number of points to process without sampling
// If stream has more points, we'll sample it down to this limit
// Reduced from 10000 to 5000 to improve performance for large activities
const MAX_POINTS_WITHOUT_SAMPLING = 5000;

/**
 * Sample arrays to reduce size while preserving start and end points
 * Uses linear interpolation to maintain accuracy
 */
function sampleArray<T>(arr: T[], targetSize: number): T[] {
  if (arr.length <= targetSize) {
    return arr;
  }

  const sampled: T[] = [arr[0]]; // Always keep first point
  const step = (arr.length - 1) / (targetSize - 1);

  for (let i = 1; i < targetSize - 1; i++) {
    const index = i * step;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const fraction = index - lower;

    if (lower === upper || fraction === 0) {
      sampled.push(arr[lower]);
    } else if (typeof arr[0] === 'number') {
      // Interpolate numbers
      const lowerVal = arr[lower] as number;
      const upperVal = arr[upper] as number;
      sampled.push((lowerVal + (upperVal - lowerVal) * fraction) as T);
    } else if (Array.isArray(arr[0])) {
      // Interpolate arrays (like latlng)
      const lowerVal = arr[lower] as number[];
      const upperVal = arr[upper] as number[];
      const interpolated = lowerVal.map(
        (val, idx) => val + (upperVal[idx] - val) * fraction,
      );
      sampled.push(interpolated as T);
    } else {
      sampled.push(arr[lower]);
    }
  }

  sampled.push(arr[arr.length - 1]); // Always keep last point
  return sampled;
}

/**
 * Calculate cumulative distances from latlng stream
 * This is expensive, so we compute it once and reuse
 */
function calculateCumulativeDistances(latlngStream: number[][]): number[] {
  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < latlngStream.length; i++) {
    const [lat1, lng1] = latlngStream[i - 1];
    const [lat2, lng2] = latlngStream[i];
    const distance = calculateHaversineDistance(lat1, lng1, lat2, lng2);
    cumulativeDistances.push(cumulativeDistances[i - 1] + distance);
  }
  return cumulativeDistances;
}

/**
 * Find all segments of approximately targetDistance length and return the best one
 * Optimized version using sliding window approach with step size to reduce computation
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

  // Use step size to reduce computation: check every Nth point instead of every point
  // Step size increases with stream length to maintain performance
  const stepSize = Math.max(1, Math.floor(cumulativeDistances.length / 2000));
  const perfectDistanceThreshold = targetDistance * 0.001; // 0.1% tolerance for "perfect" match

  let right = 0;

  for (let left = 0; left < cumulativeDistances.length; left += stepSize) {
    // Find the right boundary where cumulativeDistances[right] - cumulativeDistances[left] >= minDistance
    while (
      right < cumulativeDistances.length &&
      cumulativeDistances[right] - cumulativeDistances[left] < minDistance
    ) {
      right++;
    }

    // Early exit if we found a perfect match
    if (bestValue) {
      const distanceDiff = Math.abs(bestValue.distance - targetDistance);
      if (distanceDiff < perfectDistanceThreshold) {
        // Found a very close match, continue searching but with early exit optimization
        // We'll still check a few more segments but can exit early if we find another perfect match
      }
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

            // Early exit if we found a perfect match (within 0.1% of target)
            const distanceDiff = Math.abs(actualDistance - targetDistance);
            if (distanceDiff < perfectDistanceThreshold) {
              // Perfect match found, but continue to see if we can find a better value
              // (distance is perfect, but value might be better)
            }
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
 * Optimized to use pre-calculated cumulativeDistances and avoid array allocations
 */
const computeDistanceBasedRecords = (
  timeStream: number[],
  cumulativeDistances: number[],
  valueStream: number[],
  recordType: record_type,
  computeMax: boolean = false, // true for max average, false for min average
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  if (
    !timeStream ||
    !cumulativeDistances ||
    !valueStream ||
    timeStream.length === 0 ||
    cumulativeDistances.length === 0 ||
    valueStream.length === 0
  ) {
    return [];
  }

  const records: Pick<
    record,
    'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
  >[] = [];

  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];

  for (const targetDistance of TARGET_DISTANCES) {
    if (totalDistance < targetDistance) {
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

          // Check for pauses (optimized: early exit)
          for (let i = left + 1; i <= right; i++) {
            if (timeStream[i] - timeStream[i - 1] > 5) {
              return { value: 0, isValid: false };
            }
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
      // Optimized: calculate average without creating intermediate array
      const segment = findBestSegmentForDistance(
        cumulativeDistances,
        timeStream,
        targetDistance,
        (left, right) => {
          // Calculate sum directly without creating array
          let sum = 0;
          let count = 0;
          const maxIndex = Math.min(right, valueStream.length - 1);

          for (let i = left; i <= maxIndex; i++) {
            if (i >= 0 && i < valueStream.length) {
              sum += valueStream[i];
              count++;
            }
          }

          if (count === 0) {
            return { value: 0, isValid: false };
          }

          const average = sum / count;
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
  timeStream: number[],
  cumulativeDistances: number[],
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  if (!timeStream || timeStream.length === 0) {
    return [];
  }

  return computeDistanceBasedRecords(
    timeStream,
    cumulativeDistances,
    timeStream,
    'SPEED',
    false,
  );
};

const computePowerRecords = (
  timeStream: number[],
  cumulativeDistances: number[],
  watts: number[],
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  if (!timeStream || !watts || timeStream.length === 0 || watts.length === 0) {
    return [];
  }

  return computeDistanceBasedRecords(
    timeStream,
    cumulativeDistances,
    watts,
    'POWER',
    true,
  );
};

const computeHeartRateRecords = (
  timeStream: number[],
  cumulativeDistances: number[],
  heartrate: number[],
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  if (
    !timeStream ||
    !heartrate ||
    timeStream.length === 0 ||
    heartrate.length === 0
  ) {
    return [];
  }

  return computeDistanceBasedRecords(
    timeStream,
    cumulativeDistances,
    heartrate,
    'HEARTRATE',
    true,
  );
};

const computeCadenceRecords = (
  timeStream: number[],
  cumulativeDistances: number[],
  cadence: number[],
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  if (
    !timeStream ||
    !cadence ||
    timeStream.length === 0 ||
    cadence.length === 0
  ) {
    return [];
  }

  return computeDistanceBasedRecords(
    timeStream,
    cumulativeDistances,
    cadence,
    'CADENCE',
    true,
  );
};

/**
 * Pre-calculate elevation gains/losses between consecutive points
 * Also calculate cumulative sums for O(1) range queries
 * This avoids recalculating the same values multiple times
 */
function calculateElevationChanges(altitude: number[]): {
  gains: number[];
  losses: number[];
  cumulativeGains: number[];
  cumulativeLosses: number[];
} {
  const gains: number[] = [0]; // First point has no change
  const losses: number[] = [0];
  const cumulativeGains: number[] = [0];
  const cumulativeLosses: number[] = [0];

  for (let i = 1; i < altitude.length; i++) {
    const diff = altitude[i] - altitude[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    gains.push(gain);
    losses.push(loss);
    cumulativeGains.push(cumulativeGains[i - 1] + gain);
    cumulativeLosses.push(cumulativeLosses[i - 1] + loss);
  }

  return { gains, losses, cumulativeGains, cumulativeLosses };
}

/**
 * Compute elevation gain records over specified distances
 * Optimized to use pre-calculated cumulativeDistances and elevation gains
 */
const computeElevationGainRecords = (
  timeStream: number[],
  cumulativeDistances: number[],
  altitude: number[],
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  if (
    !timeStream ||
    !cumulativeDistances ||
    !altitude ||
    timeStream.length === 0 ||
    cumulativeDistances.length === 0 ||
    altitude.length === 0
  ) {
    return [];
  }

  // Pre-calculate elevation gains with cumulative sums for O(1) queries
  const { cumulativeGains } = calculateElevationChanges(altitude);

  const records: Pick<
    record,
    'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
  >[] = [];

  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];

  for (const targetDistance of TARGET_DISTANCES) {
    if (totalDistance < targetDistance) {
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

    // Use step size to reduce computation
    const stepSize = Math.max(1, Math.floor(cumulativeDistances.length / 2000));

    let right = 0;

    for (let left = 0; left < cumulativeDistances.length; left += stepSize) {
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
          // Calculate elevation gain using cumulative sums (O(1) instead of O(n))
          // cumulativeGains[i] contains sum of gains from point 1 to i
          // To get gains from left+1 to r: cumulativeGains[r] - cumulativeGains[left]
          const startIndex = Math.max(
            0,
            Math.min(left, cumulativeGains.length - 1),
          );
          const endIndex = Math.min(r, cumulativeGains.length - 1);
          const elevGain =
            endIndex >= 0 && startIndex >= 0 && endIndex >= startIndex
              ? cumulativeGains[endIndex] - cumulativeGains[startIndex]
              : 0;

          // Normalize gain to target distance for fair comparison
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
            bestStart = timeStream[left];
            bestEnd = timeStream[r];
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
 * Optimized to use pre-calculated cumulativeDistances and elevation losses
 */
const computeElevationLossRecords = (
  timeStream: number[],
  cumulativeDistances: number[],
  altitude: number[],
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  if (
    !timeStream ||
    !cumulativeDistances ||
    !altitude ||
    timeStream.length === 0 ||
    cumulativeDistances.length === 0 ||
    altitude.length === 0
  ) {
    return [];
  }

  // Pre-calculate elevation losses with cumulative sums for O(1) queries
  const { cumulativeLosses } = calculateElevationChanges(altitude);

  const records: Pick<
    record,
    'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
  >[] = [];

  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];

  for (const targetDistance of TARGET_DISTANCES) {
    if (totalDistance < targetDistance) {
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

    // Use step size to reduce computation
    const stepSize = Math.max(1, Math.floor(cumulativeDistances.length / 2000));

    let right = 0;

    for (let left = 0; left < cumulativeDistances.length; left += stepSize) {
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
          // Calculate elevation loss using cumulative sums (O(1) instead of O(n))
          // cumulativeLosses[i] contains sum of losses from point 1 to i
          // To get losses from left+1 to r: cumulativeLosses[r] - cumulativeLosses[left]
          const startIndex = Math.max(
            0,
            Math.min(left, cumulativeLosses.length - 1),
          );
          const endIndex = Math.min(r, cumulativeLosses.length - 1);
          const elevLoss =
            endIndex >= 0 && startIndex >= 0 && endIndex >= startIndex
              ? cumulativeLosses[endIndex] - cumulativeLosses[startIndex]
              : 0;

          // Normalize loss to target distance for fair comparison
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
            bestStart = timeStream[left];
            bestEnd = timeStream[r];
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

/**
 * Main function to compute all records from an activity stream
 * Optimized to:
 * - Sample large streams to reduce memory usage
 * - Calculate cumulativeDistances once and reuse
 * - Pre-calculate elevation changes
 * - Avoid unnecessary array allocations
 */
export const computeRecords = (
  stream: ActivityStream,
): Pick<
  record,
  'distance' | 'value' | 'start_duration' | 'end_duration' | 'type'
>[] => {
  const { time, latlng, altitude, heartrate, cadence, watts } = stream;

  // Early exit if no essential data
  if (!time || !latlng || time.length === 0 || latlng.length === 0) {
    return [];
  }

  // Sample streams if they're too large to reduce memory usage and computation time
  let timeStream = time;
  let latlngStream = latlng;
  let altitudeStream = altitude;
  let heartrateStream = heartrate;
  let cadenceStream = cadence;
  let wattsStream = watts;

  const needsSampling = latlngStream.length > MAX_POINTS_WITHOUT_SAMPLING;
  if (needsSampling) {
    const targetSize = MAX_POINTS_WITHOUT_SAMPLING;
    timeStream = sampleArray(timeStream, targetSize);
    latlngStream = sampleArray(latlngStream, targetSize);
    if (altitudeStream) {
      altitudeStream = sampleArray(altitudeStream, targetSize);
    }
    if (heartrateStream) {
      heartrateStream = sampleArray(heartrateStream, targetSize);
    }
    if (cadenceStream) {
      cadenceStream = sampleArray(cadenceStream, targetSize);
    }
    if (wattsStream) {
      wattsStream = sampleArray(wattsStream, targetSize);
    }
  }

  // Calculate cumulative distances once and reuse for all record types
  // This is the most expensive operation, so we do it once
  const cumulativeDistances = calculateCumulativeDistances(latlngStream);

  // Compute all record types using the pre-calculated cumulativeDistances
  const speedRecords = computeSpeedRecords(timeStream, cumulativeDistances);
  const powerRecords = wattsStream
    ? computePowerRecords(timeStream, cumulativeDistances, wattsStream)
    : [];
  const heartRateRecords = heartrateStream
    ? computeHeartRateRecords(timeStream, cumulativeDistances, heartrateStream)
    : [];
  const cadenceRecords = cadenceStream
    ? computeCadenceRecords(timeStream, cumulativeDistances, cadenceStream)
    : [];
  const elevationGainRecords = altitudeStream
    ? computeElevationGainRecords(
        timeStream,
        cumulativeDistances,
        altitudeStream,
      )
    : [];
  const elevationLossRecords = altitudeStream
    ? computeElevationLossRecords(
        timeStream,
        cumulativeDistances,
        altitudeStream,
      )
    : [];

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
