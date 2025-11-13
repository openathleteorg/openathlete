import { Job } from 'bull';

import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ActivityImportedEvent } from 'src/events';

import { ActivityPipelineService } from '../../core/services/pipeline/activity-pipeline.service';
import { ActivityProcessingJobData } from '../queue.service';

@Processor('activity-processing')
export class ActivityProcessingProcessor {
  private readonly logger = new Logger(ActivityProcessingProcessor.name);

  constructor(
    private readonly pipeline: ActivityPipelineService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process({ concurrency: 2 })
  async handleActivityProcessing(job: Job<ActivityProcessingJobData>) {
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

      // Emit event for other listeners (e.g., TrainingLoadListener)
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
