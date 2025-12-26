import { Job, Queue } from 'bullmq';

import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, Optional, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ActivityImportedEvent } from 'src/events';

import { CalendarWebSocketService } from '../../calendar/services/calendar-websocket.service';
import { ActivityPipelineService } from '../../core/services/pipeline/activity-pipeline.service';
import { PrismaService } from '../../prisma/services/prisma.service';
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
    @InjectQueue('activity-processing')
    private readonly activityProcessingQueue: Queue<ActivityProcessingJobData>,
    @Optional()
    @Inject(forwardRef(() => CalendarWebSocketService))
    private readonly calendarWebSocketService?: CalendarWebSocketService,
  ) {
    super();
  }

  async process(job: Job<ActivityProcessingJobData>) {
    const { eventActivityId, eventId, bulkImport } = job.data;

    try {
      // Get athleteId from event before processing
      const event = await this.prisma.event.findUnique({
        where: { event_id: eventId },
        select: { athlete_id: true },
      });

      const athleteId = event?.athlete_id;

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
