import { Injectable, Logger } from '@nestjs/common';

import { ActivityPipelineContext, ActivityProcessor } from './types';

@Injectable()
export class ActivityPipelineService {
  private readonly logger = new Logger(ActivityPipelineService.name);

  constructor(private readonly processors: ActivityProcessor[]) {}

  async run(ctx: ActivityPipelineContext) {
    for (const processor of this.processors) {
      const start = Date.now();
      try {
        await processor.run(ctx);
        this.logger.debug(
          `Processor ${processor.name} completed in ${Date.now() - start}ms`,
        );
      } catch (err) {
        this.logger.error(
          `Processor ${processor.name} failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
