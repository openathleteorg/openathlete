export type ActivityPipelineContext = {
  eventActivityId: number;
  eventId: number;
};

export interface ActivityProcessor {
  name: string;
  run(ctx: ActivityPipelineContext): Promise<void>;
}
