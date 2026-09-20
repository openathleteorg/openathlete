import { ActivityStream } from '@openathlete/shared';
import { SPORT_TYPE } from '@openathlete/shared';

export interface FitFileSegment {
  startTimeSeconds: number;
  endTimeSeconds: number;
  orderIndex: number;
  name?: string;
}

export interface ActivitySummary {
  sport?: SPORT_TYPE;
  startTime: Date;
  totalTime?: number; // seconds
  movingTime?: number; // seconds
  totalDistance?: number; // meters
  totalElevationGain?: number; // meters
  averageSpeed?: number; // m/s
  maxSpeed?: number; // m/s
  averageCadence?: number;
  averagePower?: number; // watts
  maxPower?: number; // watts
  normalizedPower?: number; // watts
  averageHeartRate?: number; // bpm
  maxHeartRate?: number; // bpm
  totalWork?: number; // kilojoules
  name?: string;
}

export interface ActivityParseResult {
  stream: ActivityStream;
  segments?: FitFileSegment[];
  summary?: ActivitySummary;
}

export interface ActivityParser {
  /**
   * Parse an activity file buffer and return the parsed stream data
   * @param fileBuffer The file buffer to parse
   * @returns The parsed activity stream and optional segments
   */
  parse(fileBuffer: ArrayBuffer): Promise<ActivityParseResult>;

  /**
   * Check if this parser can handle the given mimetype
   * @param mimetype The mimetype to check
   * @returns true if this parser can handle the mimetype
   */
  canHandle(mimetype: string): boolean;
}
