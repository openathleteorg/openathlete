import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  ActivityPipelineContext,
  ActivityProcessor,
} from '../activity-pipeline.service';

@Injectable()
export class VapProcessor implements ActivityProcessor {
  name = 'vap';
  private readonly logger = new Logger(VapProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ActivityPipelineContext) {
    // TODO: implement real GAP computation using stream data
    this.logger.log(
      `VAP processor running for activity ${ctx.eventActivityId}`,
    );
  }
}
