import { ActivityStream } from '@openathlete/shared';

import {
  roundCadence,
  roundDistance,
  roundElevation,
  roundEnergy,
  roundHeartrate,
  roundPower,
  roundSpeed,
} from './round-activity-values';

export interface SegmentMetrics {
  distance?: number;
  elevation_gain?: number;
  moving_time?: number;
  average_speed?: number;
  max_speed?: number;
  average_cadence?: number;
  average_watts?: number;
  max_watts?: number;
  weighted_average_watts?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  kilojoules?: number;
  average_gap_speed?: number;
  average_normalized_speed?: number;
}

/**
 * Calculate aggregated metrics for a segment of an activity stream
 * @param stream The full activity stream
 * @param startTimeSeconds Start time of the segment (inclusive, seconds from activity start)
 * @param endTimeSeconds End time of the segment (exclusive, seconds from activity start)
 * @returns Aggregated metrics for the segment
 */
export function calculateSegmentMetrics(
  stream: ActivityStream,
  startTimeSeconds: number,
  endTimeSeconds: number,
): SegmentMetrics {
  const { time, distance, altitude, heartrate, cadence, watts, gap, norm } =
    stream;

  if (!time || time.length === 0) {
    return {};
  }

  // Find the indices in the time array that correspond to the segment
  let startIndex = 0;
  let endIndex = time.length;

  // Find first index where time >= startTimeSeconds
  for (let i = 0; i < time.length; i++) {
    if (time[i] >= startTimeSeconds) {
      startIndex = i;
      break;
    }
  }

  // Find first index where time >= endTimeSeconds
  for (let i = startIndex; i < time.length; i++) {
    if (time[i] >= endTimeSeconds) {
      endIndex = i;
      break;
    }
  }

  // If endTimeSeconds is beyond the last time point, use the last index
  if (endIndex === time.length && time[time.length - 1] < endTimeSeconds) {
    endIndex = time.length;
  }

  if (startIndex >= endIndex) {
    return {};
  }

  const segmentTime = time.slice(startIndex, endIndex);
  const segmentDistance = distance?.slice(startIndex, endIndex);
  const segmentAltitude = altitude?.slice(startIndex, endIndex);
  const segmentHeartrate = heartrate?.slice(startIndex, endIndex);
  const segmentCadence = cadence?.slice(startIndex, endIndex);
  const segmentWatts = watts?.slice(startIndex, endIndex);
  const segmentGap = gap?.slice(startIndex, endIndex);
  const segmentNorm = norm?.slice(startIndex, endIndex);

  const metrics: SegmentMetrics = {};

  // Calculate distance
  if (segmentDistance && segmentDistance.length > 0) {
    const startDist = segmentDistance[0] ?? 0;
    const endDist = segmentDistance[segmentDistance.length - 1] ?? startDist;
    metrics.distance = roundDistance(endDist - startDist);
  }

  // Calculate elevation gain
  if (segmentAltitude && segmentAltitude.length > 1) {
    let elevationGain = 0;
    for (let i = 1; i < segmentAltitude.length; i++) {
      const delta = segmentAltitude[i] - segmentAltitude[i - 1];
      if (delta > 0) {
        elevationGain += delta;
      }
    }
    metrics.elevation_gain = roundElevation(elevationGain);
  }

  // Calculate moving time (duration of the segment)
  if (segmentTime.length > 0) {
    const startTime = segmentTime[0] ?? 0;
    const endTime = segmentTime[segmentTime.length - 1] ?? startTime;
    metrics.moving_time = Math.round(endTime - startTime);
  }

  // Calculate average and max speed
  if (segmentDistance && segmentTime && segmentTime.length > 1) {
    const speeds: number[] = [];
    for (let i = 1; i < segmentTime.length; i++) {
      const dt = segmentTime[i] - segmentTime[i - 1];
      const dd = (segmentDistance[i] ?? 0) - (segmentDistance[i - 1] ?? 0);
      if (dt > 0) {
        speeds.push(dd / dt);
      }
    }
    if (speeds.length > 0) {
      const sum = speeds.reduce((a, b) => a + b, 0);
      metrics.average_speed = roundSpeed(sum / speeds.length) ?? undefined;
      metrics.max_speed = roundSpeed(Math.max(...speeds)) ?? undefined;
    }
  }

  // Calculate average and max heartrate
  if (segmentHeartrate && segmentHeartrate.length > 0) {
    const validHr = segmentHeartrate.filter(
      (hr) => hr !== null && hr !== undefined && Number.isFinite(hr),
    ) as number[];
    if (validHr.length > 0) {
      const sum = validHr.reduce((a, b) => a + b, 0);
      metrics.average_heartrate =
        roundHeartrate(sum / validHr.length) ?? undefined;
      metrics.max_heartrate = roundHeartrate(Math.max(...validHr)) ?? undefined;
    }
  }

  // Calculate average and max cadence
  if (segmentCadence && segmentCadence.length > 0) {
    const validCadence = segmentCadence.filter(
      (c) => c !== null && c !== undefined && Number.isFinite(c),
    ) as number[];
    if (validCadence.length > 0) {
      const sum = validCadence.reduce((a, b) => a + b, 0);
      metrics.average_cadence =
        roundCadence(sum / validCadence.length) ?? undefined;
    }
  }

  // Calculate average, max, and weighted average power
  if (segmentWatts && segmentWatts.length > 0) {
    const validWatts = segmentWatts.filter(
      (w) => w !== null && w !== undefined && Number.isFinite(w),
    ) as number[];
    if (validWatts.length > 0) {
      const sum = validWatts.reduce((a, b) => a + b, 0);
      metrics.average_watts = roundPower(sum / validWatts.length) ?? undefined;
      metrics.max_watts = roundPower(Math.max(...validWatts)) ?? undefined;

      // Calculate weighted average (time-weighted)
      if (segmentTime && segmentTime.length > 1) {
        let weightedSum = 0;
        let totalTime = 0;
        for (let i = 1; i < segmentTime.length; i++) {
          const dt = segmentTime[i] - segmentTime[i - 1];
          const watts = validWatts[i - 1];
          if (dt > 0 && watts !== undefined) {
            weightedSum += watts * dt;
            totalTime += dt;
          }
        }
        if (totalTime > 0) {
          metrics.weighted_average_watts =
            roundPower(weightedSum / totalTime) ?? undefined;
        }
      }
    }
  }

  // Calculate average GAP speed (time-weighted)
  if (
    segmentGap &&
    segmentGap.length > 0 &&
    segmentTime &&
    segmentTime.length > 1
  ) {
    const validGap = segmentGap.filter(
      (g) => g !== null && g !== undefined && Number.isFinite(g),
    ) as number[];
    if (validGap.length > 0) {
      let weightedSum = 0;
      let totalTime = 0;
      for (let i = 1; i < segmentTime.length; i++) {
        const dt = segmentTime[i] - segmentTime[i - 1];
        const gap = validGap[i - 1];
        if (dt > 0 && gap !== undefined) {
          weightedSum += gap * dt;
          totalTime += dt;
        }
      }
      if (totalTime > 0) {
        metrics.average_gap_speed =
          roundSpeed(weightedSum / totalTime) ?? undefined;
      }
    }
  }

  // Calculate average normalized speed (time-weighted)
  if (
    segmentNorm &&
    segmentNorm.length > 0 &&
    segmentTime &&
    segmentTime.length > 1
  ) {
    const validNorm = segmentNorm.filter(
      (n) => n !== null && n !== undefined && Number.isFinite(n),
    ) as number[];
    if (validNorm.length > 0) {
      let weightedSum = 0;
      let totalTime = 0;
      for (let i = 1; i < segmentTime.length; i++) {
        const dt = segmentTime[i] - segmentTime[i - 1];
        const norm = validNorm[i - 1];
        if (dt > 0 && norm !== undefined) {
          weightedSum += norm * dt;
          totalTime += dt;
        }
      }
      if (totalTime > 0) {
        metrics.average_normalized_speed =
          roundSpeed(weightedSum / totalTime) ?? undefined;
      }
    }
  }

  // Calculate kilojoules (energy) from power
  if (metrics.average_watts && metrics.moving_time) {
    // Energy (kJ) = Power (W) * Time (s) / 1000
    metrics.kilojoules =
      roundEnergy((metrics.average_watts * metrics.moving_time) / 1000) ??
      undefined;
  }

  return metrics;
}
