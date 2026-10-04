import { BadRequestException } from '@nestjs/common';

import {
  ActivityImportWarning,
  MAX_ACTIVITY_FILE_BYTES,
  SPORT_TYPE,
} from '@openathlete/shared';

import { ActivityParseResult } from './activity-parser.interface';
import { calculateSegmentMetrics } from './activity-segment';
import { buildFitActivityDetails } from './fit-activity-details';

export const MAX_MANUAL_FIT_BYTES = MAX_ACTIVITY_FILE_BYTES;

export function fitSport(sport: unknown, subSport: unknown): SPORT_TYPE {
  if (sport === 1)
    return subSport === 3 ? SPORT_TYPE.TRAIL_RUNNING : SPORT_TYPE.RUNNING;
  if (sport === 2) {
    if (subSport === 8) return SPORT_TYPE.MOUNTAIN_BIKE_RIDE;
    if (subSport === 46) return SPORT_TYPE.GRAVEL_RIDE;
    if (subSport === 58) return SPORT_TYPE.VIRTUAL_RIDE;
    return SPORT_TYPE.CYCLING;
  }
  if (sport === 10 || sport === 4) {
    if (subSport === 20) return SPORT_TYPE.WEIGHT_TRAINING;
    if (subSport === 43) return SPORT_TYPE.YOGA;
    if (subSport === 44) return SPORT_TYPE.PILATES;
    if (subSport === 15) return SPORT_TYPE.ELLIPTICAL;
    if (subSport === 14) return SPORT_TYPE.ROWING;
    if (subSport === 70) return SPORT_TYPE.HIGH_INTENSITY_INTERVAL_TRAINING;
    return SPORT_TYPE.WORKOUT;
  }
  const sports: Record<number, SPORT_TYPE> = {
    5: SPORT_TYPE.SWIMMING,
    7: SPORT_TYPE.SOCCER,
    8: SPORT_TYPE.TENNIS,
    11: SPORT_TYPE.WALK,
    12: SPORT_TYPE.NORDIC_SKI,
    13: SPORT_TYPE.ALPINE_SKI,
    14: SPORT_TYPE.SNOWBOARD,
    15: SPORT_TYPE.ROWING,
    17: SPORT_TYPE.HIKING,
    21: SPORT_TYPE.E_BIKE_RIDE,
    25: SPORT_TYPE.GOLF,
    31: SPORT_TYPE.ROCK_CLIMBING,
    32: SPORT_TYPE.SAIL,
    35: SPORT_TYPE.SNOWSHOE,
    37: SPORT_TYPE.STAND_UP_PADDLING,
    38: SPORT_TYPE.SURFING,
    41: SPORT_TYPE.KAYAKING,
  };
  return typeof sport === 'number'
    ? (sports[sport] ?? SPORT_TYPE.OTHER)
    : SPORT_TYPE.OTHER;
}

const positiveOrZero = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : undefined;

export function prepareManualFit(parsed: ActivityParseResult) {
  const metadata = parsed.fit;
  if (!metadata || metadata.decodeErrors)
    throw new BadRequestException('FIT_INVALID');
  if (metadata.fileType !== 4)
    throw new BadRequestException('FIT_NOT_ACTIVITY');
  if (metadata.sessions.length !== 1 || metadata.sessions[0].sport === 18)
    throw new BadRequestException('FIT_MULTISPORT_UNSUPPORTED');
  const session = metadata.sessions[0];
  const startDate =
    session.startTime instanceof Date ? session.startTime : null;
  const elapsed =
    positiveOrZero(session.totalElapsedTime) ??
    positiveOrZero(session.totalTimerTime);
  const timer = positiveOrZero(session.totalTimerTime) ?? elapsed;
  if (
    !startDate ||
    !Number.isFinite(startDate.getTime()) ||
    !elapsed ||
    !timer ||
    elapsed > 7 * 86400 ||
    timer > elapsed + 1 ||
    startDate.getTime() + elapsed * 1000 > Date.now() + 5 * 60000
  )
    throw new BadRequestException('FIT_INVALID');
  if (
    (parsed.stream.time?.length ?? 0) > 100000 ||
    (parsed.segments?.length ?? 0) > 1000
  )
    throw new BadRequestException('FIT_LIMIT');
  // Reject malformed samples, and omit incomplete channels rather than aligning them incorrectly.
  for (const [key, values] of Object.entries(parsed.stream)) {
    if (key === 'latlng') {
      if (
        values?.some(
          (v: unknown) =>
            !Array.isArray(v) ||
            (v.length !== 0 &&
              (v.length !== 2 ||
                !v.every(Number.isFinite) ||
                Math.abs(v[0]) > 90 ||
                Math.abs(v[1]) > 180)),
        )
      )
        delete parsed.stream.latlng;
    } else if (
      values?.some((v: unknown) => typeof v !== 'number' || !Number.isFinite(v))
    ) {
      throw new BadRequestException('FIT_INVALID');
    }
  }
  const details = buildFitActivityDetails(parsed);
  const metrics = calculateSegmentMetrics(parsed.stream, 0, elapsed + 1);
  const distance =
    positiveOrZero(session.totalDistance) ??
    positiveOrZero(metrics.distance) ??
    0;
  const movingTime = Math.round(timer);
  const sport = fitSport(session.sport, session.subSport);
  const missingSummary =
    (positiveOrZero(session.totalDistance) === undefined &&
      metrics.distance === undefined) ||
    (positiveOrZero(session.totalAscent) === undefined &&
      metrics.elevation_gain === undefined);
  return {
    startDate,
    endDate: new Date(startDate.getTime() + elapsed * 1000),
    details,
    warnings: [
      ...(details.incomplete ? ['FIT_INCOMPLETE_CHANNELS' as const] : []),
      ...(!parsed.stream.time?.length ? ['FIT_NO_STREAM' as const] : []),
      ...(missingSummary ? ['FIT_MISSING_SUMMARY' as const] : []),
      ...(sport === SPORT_TYPE.OTHER ? ['FIT_UNKNOWN_SPORT' as const] : []),
    ] satisfies ActivityImportWarning[],
    activity: {
      sport,
      distance,
      movingTime,
      elevationGain:
        positiveOrZero(session.totalAscent) ??
        positiveOrZero(metrics.elevation_gain) ??
        0,
      averageSpeed:
        positiveOrZero(session.enhancedAvgSpeed) ??
        positiveOrZero(session.avgSpeed) ??
        distance / timer,
      maxSpeed:
        positiveOrZero(session.enhancedMaxSpeed) ??
        positiveOrZero(session.maxSpeed) ??
        positiveOrZero(metrics.max_speed) ??
        0,
      averageHeartrate:
        positiveOrZero(session.avgHeartRate) ??
        metrics.average_heartrate ??
        null,
      maxHeartrate:
        positiveOrZero(session.maxHeartRate) ?? metrics.max_heartrate ?? null,
      averageCadence:
        positiveOrZero(session.avgCadence) ?? metrics.average_cadence ?? null,
      averageWatts:
        positiveOrZero(session.avgPower) ?? metrics.average_watts ?? null,
      maxWatts: positiveOrZero(session.maxPower) ?? metrics.max_watts ?? null,
      weightedAverageWatts: positiveOrZero(session.normalizedPower) ?? null,
      kilojoules:
        positiveOrZero(session.totalWork) !== undefined
          ? Number(session.totalWork) / 1000
          : null,
    },
  };
}
