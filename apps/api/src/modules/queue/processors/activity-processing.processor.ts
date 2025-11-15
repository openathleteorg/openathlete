import { Job, Queue } from 'bull';

import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ActivityImportedEvent } from 'src/events';

import { ActivityPipelineService } from '../../core/services/pipeline/activity-pipeline.service';
import { ActivityProcessingJobData } from '../queue.service';

@Processor('activity-processing')
export class ActivityProcessingProcessor implements OnModuleInit {
  private readonly logger = new Logger(ActivityProcessingProcessor.name);

  constructor(
    private readonly pipeline: ActivityPipelineService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('activity-processing')
    private readonly activityProcessingQueue: Queue<ActivityProcessingJobData>,
  ) {
    // Check if processing is enabled
    if (process.env.ENABLE_ACTIVITY_PROCESSING !== 'true') {
      this.logger.warn(
        'ActivityProcessingProcessor disabled (ENABLE_ACTIVITY_PROCESSING not set to true)',
      );
    }
  }

  async onModuleInit() {
    if (process.env.ENABLE_ACTIVITY_PROCESSING !== 'true') {
      this.logger.warn(
        'ActivityProcessingProcessor disabled (ENABLE_ACTIVITY_PROCESSING not set to true)',
      );
      return;
    }

    this.logger.log('Initializing ActivityProcessingProcessor...');

    // Force Redis connection by accessing the queue
    // Bull listens continuously once the processor is registered and Redis is connected
    try {
      const client = (this.activityProcessingQueue as any).client;
      if (client) {
        if (client.status === 'ready') {
          this.logger.log(
            'Redis already connected for activity-processing queue',
          );
        } else {
          this.logger.log('Attempting to connect to Redis...');
          await client.connect();
          this.logger.log(
            'Redis connection established for activity-processing queue',
          );
        }
      } else {
        this.logger.warn(
          'Redis client not available yet, Bull will connect automatically',
        );
      }

      // Verify queue is ready
      try {
        const waiting = await this.activityProcessingQueue.getWaitingCount();
        const active = await this.activityProcessingQueue.getActiveCount();
        const completed =
          await this.activityProcessingQueue.getCompletedCount();
        const failed = await this.activityProcessingQueue.getFailedCount();

        this.logger.log(
          `Queue status - Waiting: ${waiting}, Active: ${active}, Completed: ${completed}, Failed: ${failed}`,
        );
        this.logger.log(
          'ActivityProcessingProcessor is now listening for jobs (Bull listens continuously)',
        );
      } catch (queueError) {
        this.logger.warn(
          `Could not check queue status: ${queueError instanceof Error ? queueError.message : String(queueError)}. Queue may still be initializing.`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to force Redis connection: ${error instanceof Error ? error.message : String(error)}. Will retry automatically.`,
      );
    }

    this.logger.log(
      'ActivityProcessingProcessor initialized and ready to process jobs',
    );
  }

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
