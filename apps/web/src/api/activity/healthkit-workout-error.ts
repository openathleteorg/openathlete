import { healthImportFailure } from '@/api/metric/health-import-session';
import { ZodError } from 'zod';

/** Deliberately retain no Axios/native error, body, UUID, token or sample values. */
export class HealthWorkoutUploadError extends Error {
  readonly reason: ReturnType<typeof healthImportFailure>;
  readonly reference: string;
  constructor(
    error: unknown,
    stage: string,
    readonly confirmed: number,
  ) {
    const known = [
      'HEALTH_WORKOUT_API_UNAVAILABLE',
      'HEALTH_WORKOUT_TOO_LARGE',
      'HEALTH_IMPORT_SESSION_CHANGED',
      'HEALTH_IMPORT_WRONG_ACCOUNT',
      'HEALTH_IMPORT_INVALID_RESPONSE',
      'HEALTH_IMPORT_LOGIN_REQUIRED',
      'HEALTH_IMPORT_NOT_AUTHORIZED',
      'HEALTHKIT_LOCKED',
      'HEALTHKIT_STORAGE_LIMIT',
      'HEALTHKIT_READ_FAILED',
      'HEALTHKIT_SESSION_CHANGED',
    ];
    const candidate =
      error && typeof error === 'object'
        ? 'code' in error
          ? error.code
          : error instanceof Error
            ? error.message
            : ''
        : '';
    const code =
      typeof candidate === 'string' && known.includes(candidate)
        ? candidate
        : 'HEALTH_WORKOUT_UPLOAD_FAILED';
    super(code);
    this.name = 'HealthWorkoutUploadError';
    this.reason = healthImportFailure(error);
    const response =
      error && typeof error === 'object' && 'response' in error
        ? error.response
        : undefined;
    const status =
      response &&
      typeof response === 'object' &&
      'status' in response &&
      typeof response.status === 'number' &&
      Number.isInteger(response.status) &&
      response.status >= 100 &&
      response.status <= 599
        ? response.status
        : undefined;
    // Schema field names/codes are static; never include issue messages or input.
    const fields = [
      'protocolVersion',
      'workoutUuid',
      'revision',
      'name',
      'sport',
      'startDate',
      'endDate',
      'elapsedDuration',
      'activeDuration',
      'distance',
      'energy',
      'elevationGain',
      'source',
      'streams',
      'events',
      'laps',
    ];
    const issue = error instanceof ZodError ? error.issues[0] : undefined;
    const field =
      issue && fields.includes(String(issue.path[0]))
        ? String(issue.path[0])
        : 'record';
    this.reference = `${stage}/${status ?? (issue ? `FORMAT_${field}_${issue.code}` : code)}`;
  }
}
