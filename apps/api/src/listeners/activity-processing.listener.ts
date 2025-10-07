import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { ActivityImportedEvent } from 'src/events';
import { ActivityPipelineService } from 'src/modules/core/services/pipeline/activity-pipeline.service';

@Injectable()
export class ActivityProcessingListener {
  constructor(private readonly pipeline: ActivityPipelineService) {}

  @OnEvent(ActivityImportedEvent.SLUG, { async: true })
  async handle(event: ActivityImportedEvent) {
    await this.pipeline.run({
      eventActivityId: event.payload.eventActivityId,
      eventId: event.payload.eventId,
    });
  }
}
