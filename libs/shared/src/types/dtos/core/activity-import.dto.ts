import { z } from 'zod';

import { SPORT_TYPE } from '../../misc';

/** Largest activity file accepted, in bytes. */
export const MAX_ACTIVITY_FILE_BYTES = 20 * 1024 * 1024;

/** Multipart fields sent with an activity file. */
export const importActivityFileDtoSchema = z
  .object({ name: z.string().trim().min(1).max(100) })
  .strict();

export type ImportActivityFileDto = z.infer<typeof importActivityFileDtoSchema>;

/** GPX files do not always say the sport, so the athlete can choose it. */
export const importGpxActivityFileDtoSchema = importActivityFileDtoSchema
  .extend({ sport: z.nativeEnum(SPORT_TYPE).optional() })
  .strict();

export type ImportGpxActivityFileDto = z.infer<
  typeof importGpxActivityFileDtoSchema
>;

/** TCX only names running and biking, so the athlete can choose the sport. */
export const importTcxActivityFileDtoSchema = importGpxActivityFileDtoSchema;

export type ImportTcxActivityFileDto = z.infer<
  typeof importTcxActivityFileDtoSchema
>;

/** Data a file lacked, or that was left out to keep series aligned. */
export const ACTIVITY_IMPORT_WARNINGS = [
  'FIT_INCOMPLETE_CHANNELS',
  'FIT_NO_STREAM',
  'FIT_MISSING_SUMMARY',
  'FIT_UNKNOWN_SPORT',
  'GPX_INCOMPLETE_CHANNELS',
  'GPX_NO_GPS',
  'GPX_UNKNOWN_SPORT',
  'TCX_INCOMPLETE_CHANNELS',
  'TCX_NO_STREAM',
  'TCX_NO_GPS',
  'TCX_UNKNOWN_SPORT',
] as const;

export type ActivityImportWarning = (typeof ACTIVITY_IMPORT_WARNINGS)[number];

export interface ImportedActivityDto {
  eventId: number;
  name: string;
  /** ISO 8601 */
  startDate: string;
  /** The same file was imported before; nothing was duplicated. */
  alreadyImported: boolean;
  /** False when the activity is saved but its processing could not be queued. */
  processingQueued: boolean;
  warnings: ActivityImportWarning[];
}

/**
 * Answer to a request to remove duplicate activities (the same workout
 * synced from two sources). The removal runs in the background.
 */
export const removeDuplicateActivitiesResponseSchema = z
  .object({ queued: z.literal(true) })
  .strict();

export type RemoveDuplicateActivitiesResponseDto = z.infer<
  typeof removeDuplicateActivitiesResponseSchema
>;
