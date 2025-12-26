import { Injectable } from '@nestjs/common';

import {
  ActivityParseResult,
  ActivityParser,
} from './activity-parser.interface';
import { FitParserStrategy } from './strategies/fit-parser.strategy';
import { GpxParserStrategy } from './strategies/gpx-parser.strategy';

@Injectable()
export class ActivityFileParserService {
  private readonly parsers: ActivityParser[];

  constructor() {
    this.parsers = [new FitParserStrategy(), new GpxParserStrategy()];
  }

  /**
   * Parse an activity file using the appropriate parser based on mimetype
   * @param fileBuffer The file buffer to parse
   * @param mimetype The mimetype of the file (e.g., 'application/gpx+xml', 'application/vnd.garmin.fit')
   * @returns The parsed activity stream and optional segments
   * @throws Error if no parser can handle the mimetype
   */
  async parse(
    fileBuffer: ArrayBuffer,
    mimetype: string,
  ): Promise<ActivityParseResult> {
    const parser = this.selectParser(mimetype);
    if (!parser) {
      throw new Error(
        `No parser available for mimetype: ${mimetype}. Supported types: ${this.getSupportedMimeTypes().join(', ')}`,
      );
    }

    return parser.parse(fileBuffer);
  }

  /**
   * Parse an activity file using file type (for backward compatibility)
   * @param fileBuffer The file buffer to parse
   * @param fileType The file type ('FIT' | 'GPX')
   * @returns The parsed activity stream and optional segments
   */
  async parseByFileType(
    fileBuffer: ArrayBuffer,
    fileType: 'FIT' | 'GPX',
  ): Promise<ActivityParseResult> {
    const mimetype = this.fileTypeToMimeType(fileType);
    return this.parse(fileBuffer, mimetype);
  }

  /**
   * Select the appropriate parser for the given mimetype
   * @param mimetype The mimetype to match
   * @returns The parser that can handle the mimetype, or null if none found
   */
  private selectParser(mimetype: string): ActivityParser | null {
    return this.parsers.find((parser) => parser.canHandle(mimetype)) ?? null;
  }

  /**
   * Convert file type to mimetype (for backward compatibility)
   * @param fileType The file type ('FIT' | 'GPX')
   * @returns The corresponding mimetype
   */
  private fileTypeToMimeType(fileType: 'FIT' | 'GPX'): string {
    switch (fileType) {
      case 'FIT':
        return 'application/vnd.garmin.fit';
      case 'GPX':
        return 'application/gpx+xml';
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Get all supported mimetypes
   * @returns Array of supported mimetypes
   */
  private getSupportedMimeTypes(): string[] {
    const mimeTypes = new Set<string>();
    for (const parser of this.parsers) {
      // We can't directly get the mimetypes from the parser interface,
      // but we can test common ones
      const commonTypes = [
        'application/vnd.garmin.fit',
        'application/fit',
        'application/octet-stream',
        'application/gpx+xml',
        'application/xml',
        'text/xml',
        'application/gpx',
      ];
      for (const type of commonTypes) {
        if (parser.canHandle(type)) {
          mimeTypes.add(type);
        }
      }
    }
    return Array.from(mimeTypes);
  }
}
