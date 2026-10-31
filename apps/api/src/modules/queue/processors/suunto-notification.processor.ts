import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, Optional, forwardRef } from '@nestjs/common';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';

import { SuuntoProviderService } from '../../providers-sync/providers';
import { SuuntoNotificationJobData } from '../queue.service';

/**
 * Handles Suunto webhooks: queues the import of a new workout, or syncs the
 * days of 24/7 data a webhook announced.
 */
@Processor('suunto-notification', {
  concurrency: 5,
})
export class SuuntoNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(SuuntoNotificationProcessor.name);

  constructor(
    @Inject(forwardRef(() => SuuntoProviderService))
    private readonly suuntoProviderService: SuuntoProviderService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {
    super();
  }

  async process(job: Job<SuuntoNotificationJobData>) {
    if (job.data.kind === 'workout') {
      await this.suuntoProviderService.processWorkoutNotification(
        job.data.username,
        job.data.workoutKey,
      );
    } else {
      await this.suuntoProviderService.syncAccountMetrics(
        job.data.providerAccountId,
        new Date(job.data.from),
      );
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SuuntoNotificationJobData>, error: Error) {
    reportJobFailure(this.analytics, job, error);
    const final = job.attemptsMade >= (job.opts.attempts ?? 1);
    const message = `Suunto ${job.data.kind} notification failed (attempt ${job.attemptsMade}): ${error.message}`;
    if (final) {
      this.logger.error(message, error.stack);
    } else {
      this.logger.warn(message);
    }
  }
}
