import { parseGPXWithCustomParser } from '@we-gold/gpxjs';
import { DOMParser } from 'xmldom-qsa';

import { BadRequestException } from '@nestjs/common';

import {
  ActivityImportWarning,
  ActivityStream,
  SPORT_TYPE,
} from '@openathlete/shared';

import {
  calculateDistance,
  toNumber,
  toTimestamp,
} from './activity-parser.utils';
import { calculateSegmentMetrics } from './activity-segment';
import { buildFitActivityDetails } from './fit-activity-details';

/** Same limits as manual FIT files. */
export const MAX_MANUAL_GPX_POINTS = 100000;
/** Below this speed (m/s) a stretch counts as stopped, not moving. */
const MOVING_SPEED = 0.3;
/** Climbs smaller than this (m) are treated as altitude noise. */
const ELEVATION_THRESHOLD = 2;
/** Max speed is measured over at least this many seconds. */
const MAX_SPEED_WINDOW = 10;
/** Faster than this (m/s, 180 km/h) between two points is a GPS glitch. */
const MAX_PLAUSIBLE_SPEED = 50;
/** A sensor present on this share of points has its gaps filled. */
const MIN_CHANNEL_COVERAGE = 0.9;

type GpxPoint = {
  latitude?: unknown;
  longitude?: unknown;
  elevation?: unknown;
  time?: unknown;
  extensions?: Record<string, unknown>;
};
type GpxTrack = { type?: unknown; points?: GpxPoint[] };

// <type> values written by Garmin, Strava, Komoot, Wahoo and others.
const GPX_SPORTS: Record<string, SPORT_TYPE> = {
  running: SPORT_TYPE.RUNNING,
  run: SPORT_TYPE.RUNNING,
  street_running: SPORT_TYPE.RUNNING,
  track_running: SPORT_TYPE.RUNNING,
  treadmill_running: SPORT_TYPE.RUNNING,
  trail_running: SPORT_TYPE.TRAIL_RUNNING,
  cycling: SPORT_TYPE.CYCLING,
  biking: SPORT_TYPE.CYCLING,
  ride: SPORT_TYPE.CYCLING,
  road_biking: SPORT_TYPE.CYCLING,
  road_cycling: SPORT_TYPE.CYCLING,
  mountain_biking: SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
  mtb: SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
  gravel_cycling: SPORT_TYPE.GRAVEL_RIDE,
  gravel_biking: SPORT_TYPE.GRAVEL_RIDE,
  e_bike_ride: SPORT_TYPE.E_BIKE_RIDE,
  hiking: SPORT_TYPE.HIKING,
  hike: SPORT_TYPE.HIKING,
  walking: SPORT_TYPE.WALK,
  walk: SPORT_TYPE.WALK,
  swimming: SPORT_TYPE.SWIMMING,
  open_water_swimming: SPORT_TYPE.SWIMMING,
  rowing: SPORT_TYPE.ROWING,
  kayaking: SPORT_TYPE.KAYAKING,
  cross_country_skiing: SPORT_TYPE.NORDIC_SKI,
  backcountry_skiing: SPORT_TYPE.BACKCOUNTRY_SKI,
  resort_skiing: SPORT_TYPE.ALPINE_SKI,
  // Strava writes activity type numbers: 1 is a ride, 9 a run.
  '1': SPORT_TYPE.CYCLING,
  '9': SPORT_TYPE.RUNNING,
};

/**
 * A sensor value from point extensions, by local name whatever the namespace
 * prefix: Garmin Connect writes ns3:hr, others gpxtpx:hr or plain hr, usually
 * inside a TrackPointExtension element.
 */
export function extensionValue(
  extensions: unknown,
  names: string[],
  depth = 0,
): number | null {
  if (!extensions || typeof extensions !== 'object' || depth > 2) return null;
  const entries = Object.entries(extensions as Record<string, unknown>);
  for (const [key, value] of entries) {
    const local = key.split(':').pop()!.toLowerCase();
    if (names.includes(local)) {
      const number = toNumber(value);
      if (number !== null) return number;
    }
  }
  for (const [, value] of entries) {
    const nested = extensionValue(value, names, depth + 1);
    if (nested !== null) return nested;
  }
  return null;
}

/** The sport a GPX track declares, if it is one we recognize. */
export function gpxSport(type: unknown): SPORT_TYPE | undefined {
  if (typeof type !== 'string' && typeof type !== 'number') return undefined;
  const key = String(type)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return GPX_SPORTS[key];
}

/**
 * A sensor value for every point, or nothing. Short dropouts are filled with
 * the last value (the first value for leading gaps); a sensor missing on more
 * than a tenth of the points is left out instead of being misaligned.
 */
function alignChannel(values: (number | null)[]) {
  const present = values.filter((value) => value !== null).length;
  if (!present) return { values: undefined, incomplete: false };
  if (present / values.length < MIN_CHANNEL_COVERAGE)
    return { values: undefined, incomplete: true };
  let last = values.find((value) => value !== null)!;
  return {
    values: values.map((value) => (value === null ? last : (last = value))),
    incomplete: false,
  };
}

/** Climbing with a small hysteresis, so GPS altitude noise is not counted. */
function elevationGain(altitude: number[]) {
  let gain = 0;
  let reference = altitude[0];
  for (const value of altitude) {
    if (value < reference) reference = value;
    else if (value - reference >= ELEVATION_THRESHOLD) {
      gain += value - reference;
      reference = value;
    }
  }
  return Math.round(gain);
}

/** Highest speed held for at least MAX_SPEED_WINDOW seconds. */
function maxSpeed(time: number[], distance: number[]) {
  let best = 0;
  let start = 0;
  for (let end = 1; end < time.length; end++) {
    while (start < end && time[end] - time[start + 1] >= MAX_SPEED_WINDOW)
      start++;
    const span = time[end] - time[start];
    if (span >= MAX_SPEED_WINDOW)
      best = Math.max(best, (distance[end] - distance[start]) / span);
  }
  return best;
}

/**
 * Validates a recorded GPX activity and prepares it like a manual FIT file.
 * GPX has no laps, timer or summary: distance, moving time and climbing are
 * computed from the track. `sport` overrides the sport the file declares.
 */
export function prepareManualGpx(buffer: Buffer, sport?: SPORT_TYPE) {
  let tracks: GpxTrack[];
  let routes: unknown[];
  try {
    const [parsed, error] = parseGPXWithCustomParser(
      buffer.toString('utf-8'),
      (text) => new DOMParser().parseFromString(text, 'text/xml'),
    );
    if (error || !parsed) throw error;
    tracks = (parsed.tracks ?? []) as GpxTrack[];
    routes = parsed.routes ?? [];
  } catch {
    throw new BadRequestException('GPX_INVALID');
  }
  // The first track, all its segments. A route alone is a plan, not an activity.
  const track = tracks.find((item) => item.points?.length);
  if (!track) {
    throw new BadRequestException(
      routes.length ? 'GPX_NO_TIME' : 'GPX_INVALID',
    );
  }
  if (track.points!.length > MAX_MANUAL_GPX_POINTS)
    throw new BadRequestException('GPX_LIMIT');

  // Timed points in order; a point going back in time is a recording glitch.
  const points: { at: number; point: GpxPoint }[] = [];
  for (const point of track.points!) {
    const at = toTimestamp(point.time);
    if (at === null) continue;
    if (points.length && at < points[points.length - 1].at) continue;
    points.push({ at, point });
  }
  if (points.length < 2 || points[points.length - 1].at === points[0].at)
    throw new BadRequestException('GPX_NO_TIME');
  const startDate = new Date(points[0].at);
  const elapsed = (points[points.length - 1].at - points[0].at) / 1000;
  if (
    elapsed > 7 * 86400 ||
    startDate.getTime() + elapsed * 1000 > Date.now() + 5 * 60000
  )
    throw new BadRequestException('GPX_INVALID');

  const time = points.map(({ at }) => (at - points[0].at) / 1000);
  const coordinates = points.map(({ point }) => {
    const lat = toNumber(point.latitude);
    const lon = toNumber(point.longitude);
    return lat !== null &&
      lon !== null &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180 &&
      !(lat === 0 && lon === 0)
      ? [lat, lon]
      : [];
  });
  // Cumulative distance between consecutive known positions. A position
  // implying an impossible speed is a glitch: it loses its GPS, so it neither
  // adds distance nor draws a spike on the map.
  let total = 0;
  let previous: { at: number; point: number[] } | null = null;
  const distance = coordinates.map((point, index) => {
    if (point.length !== 2) return total;
    if (previous) {
      const meters = calculateDistance(
        previous.point[0],
        previous.point[1],
        point[0],
        point[1],
      );
      const seconds = time[index] - previous.at;
      if (meters > MAX_PLAUSIBLE_SPEED * Math.max(seconds, 1)) {
        coordinates[index] = [];
        return total;
      }
      total += meters;
    }
    previous = { at: time[index], point };
    return total;
  });
  const hasGps = coordinates.some((point) => point.length === 2);
  const sensor = (names: string[]) =>
    alignChannel(
      points.map(({ point }) => {
        const value = extensionValue(point.extensions, names);
        return value !== null && Number.isFinite(value) && value >= 0
          ? value
          : null;
      }),
    );
  const channels = {
    altitude: alignChannel(
      points.map(({ point }) => toNumber(point.elevation)),
    ),
    heartrate: sensor(['hr', 'heartrate']),
    cadence: sensor(['cad', 'cadence']),
    watts: sensor(['power', 'watts']),
  };

  const stream: ActivityStream = { time };
  if (hasGps) {
    stream.latlng = coordinates;
    stream.distance = distance;
  }
  for (const [key, channel] of Object.entries(channels))
    if (channel.values) stream[key as keyof typeof channels] = channel.values;

  // Moving time: stretches faster than a slow walk; all of it without GPS.
  let movingTime = 0;
  for (let i = 1; i < time.length; i++) {
    const seconds = time[i] - time[i - 1];
    if (!hasGps || (distance[i] - distance[i - 1]) / seconds >= MOVING_SPEED)
      movingTime += seconds;
  }
  movingTime = Math.round(movingTime) || Math.round(elapsed);
  const metrics = calculateSegmentMetrics(stream, 0, elapsed + 1);
  let details: ReturnType<typeof buildFitActivityDetails>;
  try {
    details = buildFitActivityDetails({ stream });
  } catch {
    throw new BadRequestException('GPX_INVALID');
  }
  const detected = gpxSport(track.type);
  const chosen = sport ?? detected ?? SPORT_TYPE.OTHER;
  const incomplete =
    details.incomplete ||
    Object.values(channels).some((channel) => channel.incomplete);
  return {
    startDate,
    endDate: new Date(startDate.getTime() + elapsed * 1000),
    details,
    warnings: [
      ...(incomplete ? ['GPX_INCOMPLETE_CHANNELS' as const] : []),
      ...(hasGps ? [] : ['GPX_NO_GPS' as const]),
      ...(chosen === SPORT_TYPE.OTHER ? ['GPX_UNKNOWN_SPORT' as const] : []),
    ] satisfies ActivityImportWarning[],
    activity: {
      sport: chosen,
      distance: hasGps ? Math.round(total) : 0,
      movingTime,
      elevationGain: channels.altitude.values
        ? elevationGain(channels.altitude.values)
        : 0,
      averageSpeed: hasGps ? total / movingTime : 0,
      maxSpeed: hasGps ? maxSpeed(time, distance) : 0,
      averageHeartrate: metrics.average_heartrate ?? null,
      maxHeartrate: metrics.max_heartrate ?? null,
      averageCadence: metrics.average_cadence ?? null,
      averageWatts: metrics.average_watts ?? null,
      maxWatts: metrics.max_watts ?? null,
      weightedAverageWatts: null,
      kilojoules: metrics.kilojoules ?? null,
    },
  };
}
