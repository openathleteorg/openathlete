import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, Optional, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ActivityImportedEvent } from 'src/events';
import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';

import { CalendarWebSocketService } from '../../calendar/services/calendar-websocket.service';
import { ActivityPipelineService } from '../../core/services/pipeline/activity-pipeline.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { ActivityDescriptionService } from '../../providers-sync/activity-description/activity-description.service';
import { ActivityProcessingJobData } from '../queue.service';

@Processor('activity-processing', {
  concurrency: 2,
})
export class ActivityProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivityProcessingProcessor.name);

  constructor(
    private readonly pipeline: ActivityPipelineService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(forwardRef(() => CalendarWebSocketService))
    private readonly calendarWebSocketService?: CalendarWebSocketService,
    @Optional() private readonly analytics?: AnalyticsService,
    @Optional()
    @Inject(forwardRef(() => ActivityDescriptionService))
    private readonly descriptions?: ActivityDescriptionService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    reportJobFailure(this.analytics, job, error);
  }

  async process(job: Job<ActivityProcessingJobData>) {
    const { eventActivityId, eventId, bulkImport } = job.data;

    try {
      // Get athleteId from event before processing
      const event = await this.prisma.event.findUnique({
        where: { eventId: eventId },
        select: { athleteId: true },
      });

      const athleteId = event?.athleteId;

      await this.pipeline.run({
        eventActivityId,
        eventId,
        bulkImport,
      });

      this.eventEmitter.emit(
        ActivityImportedEvent.SLUG,
        new ActivityImportedEvent({
          eventActivityId,
          eventId,
          bulkImport,
        }),
      );

      // A history import never writes to Strava: only activities as they come
      if (!bulkImport && this.descriptions) {
        await this.descriptions
          .scheduleAfterProcessing(eventActivityId)
          .catch((error: unknown) =>
            this.logger.warn(
              `Could not queue the Strava description of activity ${eventActivityId}: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
      }

      // Notify that activity was processed
      if (this.calendarWebSocketService && athleteId) {
        this.calendarWebSocketService.notifyActivityProcessed(
          eventId,
          athleteId,
        );
      }

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
