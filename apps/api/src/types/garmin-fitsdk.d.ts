declare module '@garmin/fitsdk' {
  export class Decoder {
    constructor(stream: Stream);
    isFIT(): boolean;
    checkIntegrity(): boolean;
    read(options?: {
      applyScaleAndOffset?: boolean;
      expandSubFields?: boolean;
      expandComponents?: boolean;
      convertTypesToStrings?: boolean;
      convertDateTimesToDates?: boolean;
      includeUnknownData?: boolean;
      mergeHeartRates?: boolean;
      decodeMemoGlobs?: boolean;
    }): {
      messages?: {
        recordMesgs?: Array<Record<string, unknown>>;
        sessionMesgs?: Array<Record<string, unknown>>;
        lapMesgs?: Array<Record<string, unknown>>;
        [key: string]: unknown;
      };
      errors?: unknown[];
    };
    decode(): unknown;
  }

  export class Stream {
    constructor(buffer: ArrayBuffer | Buffer);
    static fromBuffer(buffer: ArrayBuffer | Buffer): Stream;
    [key: string]: unknown;
  }

  export interface FitFile {
    // Add type definitions as needed
    [key: string]: unknown;
  }

  export function parse(buffer: ArrayBuffer | Buffer): FitFile;
}

