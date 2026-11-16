/**
 * A Garmin activity file arrived before its activity was imported. The
 * notification job is retried until the import catches up: an expected
 * wait, not a failure.
 */
export class GarminActivityNotSavedError extends Error {
  constructor(activityId: string) {
    super(
      `Garmin activity ${activityId} is not saved yet; its file will be fetched on the next attempt`,
    );
    this.name = 'GarminActivityNotSavedError';
  }
}
