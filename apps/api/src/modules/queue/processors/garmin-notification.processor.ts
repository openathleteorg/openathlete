import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, Optional, forwardRef } from '@nestjs/common';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';

import { GarminProviderService } from '../../providers-sync/providers';
import { GarminNotificationJobData } from '../queue.service';

/**
 * Answers Garmin pings by pulling their callback URL, and saves the data
 * (activities, activity files, health summaries) of the accounts that
 * import it.
 */
@Processor('garmin-notification', {
  concurrency: 5,
})
export class GarminNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(GarminNotificationProcessor.name);

  constructor(
    @Inject(forwardRef(() => GarminProviderService))
    private readonly garminProviderService: GarminProviderService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {
    super();
  }

  async process(job: Job<GarminNotificationJobData>) {
    const lastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
    await this.garminProviderService.processNotification(job.data, {
      lastAttempt,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<GarminNotificationJobData>, error: Error) {
    reportJobFailure(this.analytics, job, error);
    const final = job.attemptsMade >= (job.opts.attempts ?? 1);
    const message = `Garmin ${job.data.summaryType} notification for user ${job.data.userId} failed (attempt ${job.attemptsMade}): ${error.message}`;
    if (final) {
      this.logger.error(message, error.stack);
    } else {
      this.logger.warn(message);
    }
  }
}
