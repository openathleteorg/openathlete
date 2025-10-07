export type ActivityImportedPayload = {
  eventActivityId: number;
  eventId: number;
};

export class ActivityImportedEvent {
  static SLUG = 'activity.imported';

  constructor(public readonly payload: ActivityImportedPayload) {}
}
