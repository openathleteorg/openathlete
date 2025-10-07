import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  ActivityPipelineContext,
  ActivityProcessor,
} from '../activity-pipeline.service';

@Injectable()
export class WeatherProcessor implements ActivityProcessor {
  name = 'weather';
  private readonly logger = new Logger(WeatherProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(ctx: ActivityPipelineContext) {
    // TODO: Fetch and persist weather data based on event start date and coordinates
    this.logger.log(
      `Weather processor running for activity ${ctx.eventActivityId}`,
    );
  }
}
