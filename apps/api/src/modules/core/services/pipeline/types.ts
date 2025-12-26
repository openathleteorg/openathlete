export type ActivityPipelineContext = {
  eventActivityId: number;
  eventId: number;
  bulkImport?: boolean; // Skip weather enrichment for bulk imports
};

export interface ActivityProcessor {
  name: string;
  run(ctx: ActivityPipelineContext): Promise<void>;
}
