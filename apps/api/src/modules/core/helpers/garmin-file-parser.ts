import { Decoder, Stream } from '@garmin/fitsdk';
import { parseGPXWithCustomParser } from '@we-gold/gpxjs';
import { DOMParser } from 'xmldom-qsa';

import { Logger } from '@nestjs/common';

import { ActivityStream } from '@openathlete/shared';

const logger = new Logger('GarminFileParser');

type ParsedGpxPoint = {
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lon?: number | string;
  elevation?: number | string;
  ele?: number | string;
  altitude?: number | string;
  time?: Date | string | number;
  hr?: number | string;
  cadence?: number | string;
  power?: number | string;
  extensions?: Record<string, unknown>;
};

type ParsedGpxSegment = {
  points?: ParsedGpxPoint[];
};

type ParsedGpxTrack = {
  points?: ParsedGpxPoint[];
  segments?: ParsedGpxSegment[];
};

type ParsedGpx = {
  tracks?: ParsedGpxTrack[];
  routes?: ParsedGpxTrack[];
  points?: ParsedGpxPoint[];
};

export async function parseGpxFile(
  fileBuffer: ArrayBuffer,
): Promise<ActivityStream> {
  const xml = Buffer.from(fileBuffer).toString('utf-8');
  const [parsedFile, error] = parseGPXWithCustomParser(xml, (text) => {
    return new DOMParser().parseFromString(text, 'text/xml');
  });

  if (error || !parsedFile) {
    throw error || new Error('Unable to parse GPX file');
  }

  const parsedGpx = parsedFile as ParsedGpx;
  const track = parsedGpx.tracks?.[0] ?? parsedGpx.routes?.[0] ?? null;
  const segment = track?.segments?.[0];
  const points = segment?.points ?? track?.points ?? parsedGpx.points ?? [];

  if (!points.length) {
    return {};
  }

  const time: number[] = [];
  const latlng: number[][] = [];
  const altitude: number[] = [];
  const heartrate: number[] = [];
  const cadence: number[] = [];
  const watts: number[] = [];
  const distance: number[] = [];

  const startTimestamp = toTimestamp(points[0]?.time);
  let previousLat: number | null = null;
  let previousLon: number | null = null;
  let cumulativeDistance = 0;

  for (const point of points) {
    const lat = toNumber(point.latitude ?? point.lat);
    const lon = toNumber(point.longitude ?? point.lon);
    const timestamp = toTimestamp(point.time);

    if (startTimestamp !== null && timestamp !== null) {
      time.push(Math.max(0, (timestamp - startTimestamp) / 1000));
    } else if (time.length) {
      time.push(time[time.length - 1]);
    } else {
      time.push(0);
    }

    if (lat !== null && lon !== null) {
      if (previousLat !== null && previousLon !== null) {
        cumulativeDistance += calculateDistance(
          previousLat,
          previousLon,
          lat,
          lon,
        );
      }

      latlng.push([lat, lon]);
      distance.push(cumulativeDistance);
      previousLat = lat;
      previousLon = lon;
    } else if (distance.length) {
      distance.push(distance[distance.length - 1]);
    }

    const alt = toNumber(point.elevation ?? point.ele ?? point.altitude);
    if (alt !== null) {
      altitude.push(alt);
    }

    const hr =
      getFromExtensions(point.extensions, ['gpxtpx:hr', 'hr']) ??
      toNumber(point.hr);
    if (hr !== null) {
      heartrate.push(hr);
    }

    const cad =
      getFromExtensions(point.extensions, ['gpxtpx:cad', 'cad', 'cadence']) ??
      toNumber(point.cadence);
    if (cad !== null) {
      cadence.push(cad);
    }

    const power =
      getFromExtensions(point.extensions, ['power', 'gpxtpx:power']) ??
      toNumber(point.power);
    if (power !== null) {
      watts.push(power);
    }
  }

  const stream: ActivityStream = {};

  if (time.length) {
    stream.time = time;
  }
  if (latlng.length) {
    stream.latlng = latlng;
  }
  if (altitude.length) {
    stream.altitude = altitude;
  }
  if (heartrate.length) {
    stream.heartrate = heartrate;
  }
  if (cadence.length) {
    stream.cadence = cadence;
  }
  if (watts.length) {
    stream.watts = watts;
  }
  if (distance.length) {
    stream.distance = distance;
  }

  return stream;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toTimestamp(value: unknown): number | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function getFromExtensions(extensions: unknown, keys: string[]): number | null {
  if (!extensions || typeof extensions !== 'object') {
    return null;
  }

  const containers: Array<Record<string, unknown>> = [];
  const root = extensions as Record<string, unknown>;
  containers.push(root);

  if (root['gpxtpx:TrackPointExtension']) {
    containers.push(
      root['gpxtpx:TrackPointExtension'] as Record<string, unknown>,
    );
  }
  if (root.TrackPointExtension) {
    containers.push(root.TrackPointExtension as Record<string, unknown>);
  }

  for (const container of containers) {
    for (const key of keys) {
      if (container[key] === undefined) {
        continue;
      }

      const value = toNumber(container[key]);
      if (value !== null) {
        return value;
      }
    }
  }

  return null;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export interface FitFileSegment {
  startTimeSeconds: number;
  endTimeSeconds: number;
  orderIndex: number;
  name?: string;
}

export interface FitFileParseResult {
  stream: ActivityStream;
  segments: FitFileSegment[];
}

export async function parseFitFile(
  fileBuffer: ArrayBuffer,
): Promise<FitFileParseResult> {
  const buffer = Buffer.from(fileBuffer);
  const stream = Stream.fromBuffer(buffer);
  const decoder = new Decoder(stream);

  if (!decoder.isFIT()) {
    return { stream: {}, segments: [] };
  }

  if (!decoder.checkIntegrity()) {
    return { stream: {}, segments: [] };
  }

  const { messages, errors } = decoder.read({
    applyScaleAndOffset: true,
    expandSubFields: true,
    expandComponents: true,
    convertTypesToStrings: false,
    convertDateTimesToDates: true,
    includeUnknownData: false,
    mergeHeartRates: true,
    decodeMemoGlobs: false,
  });

  if (errors && errors.length > 0) {
    logger.warn(
      `FIT file decode errors detected: ${errors.length} error(s)`,
      errors,
    );
  }

  if (!messages) {
    return { stream: {}, segments: [] };
  }

  const records = (messages.recordMesgs ?? []) as Array<
    Record<string, unknown>
  >;
  if (!records.length) {
    return { stream: {}, segments: [] };
  }

  const session = (messages.sessionMesgs?.[0] ?? null) as Record<
    string,
    unknown
  > | null;

  const startTimeValue = session?.startTime ?? session?.start_time ?? null;
  const startTimestamp =
    startTimeValue instanceof Date
      ? startTimeValue.getTime()
      : typeof startTimeValue === 'number'
        ? startTimeValue * 1000
        : startTimeValue
          ? new Date(startTimeValue as string).getTime()
          : null;

  const result: ActivityStream = {};
  const time: number[] = [];
  const latlng: number[][] = [];
  const altitude: number[] = [];
  const heartrate: number[] = [];
  const cadence: number[] = [];
  const watts: number[] = [];
  const distance: number[] = [];

  let previousLat: number | null = null;
  let previousLon: number | null = null;
  let cumulativeDistance = 0;

  for (const record of records) {
    const timestamp =
      record.timestamp instanceof Date
        ? record.timestamp.getTime()
        : typeof record.timestamp === 'number'
          ? record.timestamp * 1000
          : null;

    const lat =
      typeof record.positionLat === 'number' ? record.positionLat : null;
    const lon =
      typeof record.positionLong === 'number' ? record.positionLong : null;

    // Check for altitude with different possible field names
    const alt =
      typeof record.altitude === 'number'
        ? record.altitude
        : typeof record.enhancedAltitude === 'number'
          ? record.enhancedAltitude
          : null;

    const hr =
      typeof record.heartRate === 'number'
        ? record.heartRate
        : typeof record.heart_rate === 'number'
          ? record.heart_rate
          : null;
    const cad =
      typeof record.cadence === 'number'
        ? record.cadence
        : typeof record.cadenceRpm === 'number'
          ? record.cadenceRpm
          : null;
    const power = typeof record.power === 'number' ? record.power : null;
    const dist = typeof record.distance === 'number' ? record.distance : null;

    if (startTimestamp !== null && timestamp !== null) {
      time.push(Math.max(0, (timestamp - startTimestamp) / 1000));
    } else if (time.length) {
      time.push(time[time.length - 1]);
    } else {
      time.push(0);
    }

    if (lat !== null && lon !== null) {
      const latDeg = lat * (180 / 2 ** 31);
      const lonDeg = lon * (180 / 2 ** 31);

      if (previousLat !== null && previousLon !== null) {
        cumulativeDistance += calculateDistance(
          previousLat,
          previousLon,
          latDeg,
          lonDeg,
        );
      }

      latlng.push([latDeg, lonDeg]);
      previousLat = latDeg;
      previousLon = lonDeg;
    }

    if (dist !== null) {
      distance.push(dist);
      cumulativeDistance = dist;
    } else if (distance.length) {
      distance.push(cumulativeDistance);
    }

    if (alt !== null) {
      altitude.push(alt);
    }

    if (hr !== null) {
      heartrate.push(hr);
    }

    if (cad !== null) {
      cadence.push(cad);
    }

    if (power !== null) {
      watts.push(power);
    }
  }

  if (time.length) {
    result.time = time;
  }
  if (latlng.length) {
    result.latlng = latlng;
  }
  if (altitude.length) {
    result.altitude = altitude;
  }
  if (heartrate.length) {
    result.heartrate = heartrate;
  }
  if (cadence.length) {
    result.cadence = cadence;
  }
  if (watts.length) {
    result.watts = watts;
  }
  if (distance.length) {
    result.distance = distance;
  }

  const totalDurationSeconds =
    typeof session?.totalTimerTime === 'number'
      ? session.totalTimerTime
      : typeof session?.totalElapsedTime === 'number'
        ? session.totalElapsedTime
        : time.length > 0
          ? time[time.length - 1]
          : null;

  const lapMessages = (messages.lapMesgs ?? []) as Array<
    Record<string, unknown>
  >;
  const segments = buildFitSegments(
    lapMessages,
    startTimestamp,
    totalDurationSeconds,
  );

  return { stream: result, segments };
}

type RawLapMessage = Record<string, unknown>;
type BaseLapSegment = {
  startMs: number | null;
  endMs: number | null;
  durationSeconds: number | null;
  name?: string;
  order: number;
};

function buildFitSegments(
  lapMessages: RawLapMessage[],
  startTimestamp: number | null,
  totalDurationSeconds: number | null,
): FitFileSegment[] {
  if (!lapMessages.length || startTimestamp === null) {
    return [];
  }

  const baseSegments: BaseLapSegment[] = lapMessages.map((lap, index) => {
    const startMs = toFitTimestamp(
      lap.startTime ?? lap.start_time ?? lap.start_time_ms,
    );
    const endMs = toFitTimestamp(lap.endTime ?? lap.end_time);
    const durationSeconds =
      toNumber(lap.totalTimerTime ?? lap.total_timer_time) ??
      toNumber(lap.totalElapsedTime ?? lap.total_elapsed_time);

    return {
      startMs,
      endMs,
      durationSeconds,
      name:
        typeof lap.name === 'string' && lap.name.trim().length > 0
          ? lap.name.trim()
          : undefined,
      order: index,
    };
  });

  const sanitizedSegments = baseSegments
    .filter(
      (lap): lap is BaseLapSegment & { startMs: number } =>
        typeof lap.startMs === 'number',
    )
    .sort((a, b) => a.startMs - b.startMs);

  if (!sanitizedSegments.length) {
    return [];
  }

  const totalDurationMs =
    typeof totalDurationSeconds === 'number'
      ? totalDurationSeconds * 1000
      : null;

  const normalizedSegments: FitFileSegment[] = [];

  for (let i = 0; i < sanitizedSegments.length; i++) {
    const lap = sanitizedSegments[i];
    let endMs = lap.endMs;

    if (endMs === null && lap.durationSeconds !== null) {
      endMs = lap.startMs + lap.durationSeconds * 1000;
    }

    if (endMs === null && sanitizedSegments[i + 1]) {
      endMs = sanitizedSegments[i + 1].startMs;
    }

    if (endMs === null && totalDurationMs !== null) {
      endMs = startTimestamp + totalDurationMs;
    }

    if (endMs === null || endMs <= lap.startMs) {
      continue;
    }

    const startSeconds = Math.max(
      0,
      Math.round((lap.startMs - startTimestamp) / 1000),
    );
    const endSeconds = Math.max(
      startSeconds + 1,
      Math.round((endMs - startTimestamp) / 1000),
    );

    normalizedSegments.push({
      startTimeSeconds: startSeconds,
      endTimeSeconds: endSeconds,
      orderIndex: normalizedSegments.length,
      name: lap.name,
    });
  }

  // Ensure last segment covers entire duration if we know it
  if (
    normalizedSegments.length > 0 &&
    totalDurationSeconds !== null &&
    normalizedSegments[normalizedSegments.length - 1].endTimeSeconds <
      Math.round(totalDurationSeconds)
  ) {
    const last = normalizedSegments[normalizedSegments.length - 1];
    normalizedSegments[normalizedSegments.length - 1] = {
      ...last,
      endTimeSeconds: Math.round(totalDurationSeconds),
    };
  }

  return normalizedSegments;
}

function toFitTimestamp(value: unknown): number | null {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }

    // Values coming from FIT files are usually seconds since epoch
    // Treat values that look like seconds and convert to ms
    if (value < 10_000_000_000) {
      return value * 1000;
    }

    return value;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  return null;
}
