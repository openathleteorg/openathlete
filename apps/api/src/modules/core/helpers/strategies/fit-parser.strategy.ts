import { Decoder, Stream } from '@garmin/fitsdk';

import { Logger } from '@nestjs/common';

import { ActivityStream } from '@openathlete/shared';

import {
  ActivityParseResult,
  ActivityParser,
  FitFileSegment,
} from '../activity-parser.interface';
import {
  calculateDistance,
  toFitTimestamp,
  toNumber,
} from '../activity-parser.utils';

const logger = new Logger('FitParserStrategy');

type RawLapMessage = Record<string, unknown>;
type BaseLapSegment = {
  startMs: number | null;
  endMs: number | null;
  durationSeconds: number | null;
  name?: string;
  order: number;
};

export class FitParserStrategy implements ActivityParser {
  private readonly supportedMimeTypes = [
    'application/vnd.garmin.fit',
    'application/fit',
    'application/octet-stream',
  ];

  canHandle(mimetype: string): boolean {
    const normalizedMimeType = mimetype.toLowerCase().trim();
    return this.supportedMimeTypes.some((type) =>
      normalizedMimeType.includes(type),
    );
  }

  async parse(fileBuffer: ArrayBuffer): Promise<ActivityParseResult> {
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
    const segments = this.buildFitSegments(
      lapMessages,
      startTimestamp,
      totalDurationSeconds,
    );

    return { stream: result, segments };
  }

  private buildFitSegments(
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
}
