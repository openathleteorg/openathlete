import { ActivityStream } from '@openathlete/shared';

export interface FitFileSegment {
  startTimeSeconds: number;
  endTimeSeconds: number;
  orderIndex: number;
  name?: string;
}

export interface ActivityParseResult {
  stream: ActivityStream;
  /** FIT metadata is consumed only by manual activity import. */
  fit?: {
    fileType: unknown;
    sessions: Array<Record<string, unknown>>;
    decodeErrors: boolean;
  };
  segments?: FitFileSegment[];
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
