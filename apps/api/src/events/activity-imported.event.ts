type ActivityImportedPayload = {
  eventActivityId: number;
  eventId: number;
  bulkImport?: boolean; // Skip weather enrichment for bulk imports
};

export class ActivityImportedEvent {
  static SLUG = 'activity.imported';

  constructor(public readonly payload: ActivityImportedPayload) {}
}
