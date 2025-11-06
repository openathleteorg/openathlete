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

/**
 * Generic function to compute distance-based records for any stream
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

    let bestValue = computeMax ? -Infinity : Infinity;
    let bestStart = 0;
    let bestEnd = 0;
    let right = 0;

    for (let left = 0; left < cumulativeDistances.length; left++) {
      // Find the right boundary where cumulativeDistances[right] - cumulativeDistances[left] >= targetDistance
      while (
        right < cumulativeDistances.length &&
        cumulativeDistances[right] - cumulativeDistances[left] < targetDistance
      ) {
        right++;
      }

      if (right < cumulativeDistances.length) {
        const actualDistance =
          cumulativeDistances[right] - cumulativeDistances[left];

        // For speed records, we want the minimum time (bestValue = segmentTime)
        // But we need to normalize the time to the target distance for fair comparison
        if (recordType === 'SPEED') {
          const segmentTime = timeStream[right] - timeStream[left];

          let hasPause = false;
          for (let i = left + 1; i <= right; i++) {
            if (timeStream[i] - timeStream[i - 1] > 5) {
              hasPause = true;
              break;
            }
          }

          if (!hasPause && actualDistance >= targetDistance) {
            // Normalize time to target distance: if we ran actualDistance in segmentTime,
            // the equivalent time for targetDistance would be segmentTime * (targetDistance / actualDistance)
            const normalizedTime =
              segmentTime * (targetDistance / actualDistance);

            if (normalizedTime < bestValue) {
              bestValue = normalizedTime;
              bestStart = timeStream[left];
              bestEnd = timeStream[right];
            }
          }
        } else {
          // For other metrics, calculate average value over the segment
          // Ensure the segment is at least targetDistance for consistency
          if (actualDistance >= targetDistance) {
            // Find points within the segment
            const segmentPoints = [] as number[];
            for (let i = left; i <= right; i++) {
              if (i < valueStream.length) {
                segmentPoints.push(valueStream[i]);
              }
            }

            // Calculate average
            const average =
              segmentPoints.reduce((sum, val) => sum + val, 0) /
              segmentPoints.length;

            // Update best value if this segment has better average
            const isBetter = computeMax
              ? average > bestValue
              : average < bestValue;

            if (isBetter && segmentPoints.length > 0) {
              bestValue = average;
              bestStart = timeStream[left];
              bestEnd = timeStream[right];
            }
          }
        }
      }
    }

    const validValue = computeMax
      ? bestValue > -Infinity
      : bestValue < Infinity;

    if (validValue) {
      records.push({
        value: bestValue,
        type: recordType,
        distance: targetDistance,
        start_duration: bestStart,
        end_duration: bestEnd,
      });
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

    let maxGain = -Infinity;
    let bestStart = 0;
    let bestEnd = 0;
    let right = 0;

    for (let left = 0; left < cumulativeDistances.length; left++) {
      while (
        right < cumulativeDistances.length &&
        cumulativeDistances[right] - cumulativeDistances[left] < targetDistance
      ) {
        right++;
      }

      if (right < cumulativeDistances.length) {
        const actualDistance =
          cumulativeDistances[right] - cumulativeDistances[left];

        // Only consider segments that are at least targetDistance
        if (actualDistance >= targetDistance) {
          // Calculate elevation gain for this segment
          let elevGain = 0;
          for (let i = left + 1; i <= right && i < altitude.length; i++) {
            const diff = altitude[i] - altitude[i - 1];
            if (diff > 0) {
              elevGain += diff;
            }
          }

          if (elevGain > maxGain) {
            maxGain = elevGain;
            bestStart = time[left];
            bestEnd = time[right];
          }
        }
      }
    }

    if (maxGain > -Infinity) {
      records.push({
        value: maxGain,
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

    let maxLoss = -Infinity;
    let bestStart = 0;
    let bestEnd = 0;
    let right = 0;

    for (let left = 0; left < cumulativeDistances.length; left++) {
      while (
        right < cumulativeDistances.length &&
        cumulativeDistances[right] - cumulativeDistances[left] < targetDistance
      ) {
        right++;
      }

      if (right < cumulativeDistances.length) {
        const actualDistance =
          cumulativeDistances[right] - cumulativeDistances[left];

        // Only consider segments that are at least targetDistance
        if (actualDistance >= targetDistance) {
          // Calculate elevation loss for this segment
          let elevLoss = 0;
          for (let i = left + 1; i <= right && i < altitude.length; i++) {
            const diff = altitude[i - 1] - altitude[i];
            if (diff > 0) {
              elevLoss += diff;
            }
          }

          if (elevLoss > maxLoss) {
            maxLoss = elevLoss;
            bestStart = time[left];
            bestEnd = time[right];
          }
        }
      }
    }

    if (maxLoss > -Infinity) {
      records.push({
        value: maxLoss,
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
