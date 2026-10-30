import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, forwardRef } from '@nestjs/common';

import { PolarProviderService } from '../../providers-sync/providers';
import { PolarNotificationJobData } from '../queue.service';

/**
 * Fetches what a Polar webhook announced, and runs the catch-up sync. The
 * activities then go through the activity-import queue like any other.
 */
@Processor('polar-notification', {
  concurrency: 5,
})
export class PolarNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(PolarNotificationProcessor.name);

  constructor(
    @Inject(forwardRef(() => PolarProviderService))
    private readonly polarProviderService: PolarProviderService,
  ) {
    super();
  }

  async process(job: Job<PolarNotificationJobData>) {
    const { data } = job;
    if (data.kind === 'exercise') {
      await this.polarProviderService.processExerciseNotification(
        data.providerAccountId,
        data.exerciseId,
      );
    } else if (data.kind === 'sync') {
      await this.polarProviderService.syncAccount(data.providerAccountId);
    } else {
      await this.polarProviderService.syncAccountMetrics(
        data.providerAccountId,
      );
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<PolarNotificationJobData>, error: Error) {
    const final = job.attemptsMade >= (job.opts.attempts ?? 1);
    const message = `Polar ${job.data.kind} job failed for account ${job.data.providerAccountId} (attempt ${job.attemptsMade}): ${error.message}`;
    if (final) {
      this.logger.error(message, error.stack);
    } else {
      this.logger.warn(message);
    }
  }
}
