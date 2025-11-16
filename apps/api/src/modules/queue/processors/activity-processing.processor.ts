import { Job, Queue } from 'bullmq';

import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ActivityImportedEvent } from 'src/events';

import { ActivityPipelineService } from '../../core/services/pipeline/activity-pipeline.service';
import { ActivityProcessingJobData } from '../queue.service';

@Processor('activity-processing', {
  concurrency: 2,
})
export class ActivityProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivityProcessingProcessor.name);

  constructor(
    private readonly pipeline: ActivityPipelineService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('activity-processing')
    private readonly activityProcessingQueue: Queue<ActivityProcessingJobData>,
  ) {
    super();
  }

  async process(job: Job<ActivityProcessingJobData>) {
    const { eventActivityId, eventId, skipWeather } = job.data;

    this.logger.log(
      `Processing activity processing job ${job.id} for eventActivityId ${eventActivityId}`,
    );

    try {
      await this.pipeline.run({
        eventActivityId,
        eventId,
        skipWeather,
      });

      this.eventEmitter.emit(
        ActivityImportedEvent.SLUG,
        new ActivityImportedEvent({
          eventActivityId,
          eventId,
          skipWeather,
        }),
      );

      this.logger.log(`Successfully processed activity ${eventActivityId}`);

      return {
        success: true,
        eventActivityId,
        eventId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process activity ${eventActivityId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
