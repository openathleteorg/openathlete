import { Decoder, Stream } from '@garmin/fitsdk';
import { parseGPXWithCustomParser } from '@we-gold/gpxjs';
import { DOMParser } from 'xmldom-qsa';

import { ActivityStream } from '@openathlete/shared';

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

export async function parseFitFile(
  fileBuffer: ArrayBuffer,
): Promise<ActivityStream> {
  const buffer = Buffer.from(fileBuffer);
  const stream = Stream.fromBuffer(buffer);
  const decoder = new Decoder(stream);

  if (!decoder.isFIT()) {
    return {};
  }

  if (!decoder.checkIntegrity()) {
    return {};
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
    console.error('[FIT Parser] Decode errors:', errors);
  }

  const records = (messages.recordMesgs ?? []) as Array<
    Record<string, unknown>
  >;
  if (!records.length) {
    return {};
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

  return result;
}
