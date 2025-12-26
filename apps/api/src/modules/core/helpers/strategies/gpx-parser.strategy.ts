import { parseGPXWithCustomParser } from '@we-gold/gpxjs';
import { DOMParser } from 'xmldom-qsa';

import { ActivityStream } from '@openathlete/shared';

import {
  ActivityParseResult,
  ActivityParser,
} from '../activity-parser.interface';
import {
  calculateDistance,
  getFromExtensions,
  toNumber,
  toTimestamp,
} from '../activity-parser.utils';

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

export class GpxParserStrategy implements ActivityParser {
  private readonly supportedMimeTypes = [
    'application/gpx+xml',
    'application/xml',
    'text/xml',
    'application/gpx',
  ];

  canHandle(mimetype: string): boolean {
    const normalizedMimeType = mimetype.toLowerCase().trim();
    return this.supportedMimeTypes.some((type) =>
      normalizedMimeType.includes(type),
    );
  }

  async parse(fileBuffer: ArrayBuffer): Promise<ActivityParseResult> {
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
      return { stream: {} };
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

    return { stream };
  }
}
