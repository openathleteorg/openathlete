import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, Optional, forwardRef } from '@nestjs/common';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';

import { CorosProviderService } from '../../providers-sync/providers';
import { CorosSyncJobData } from '../queue.service';

/**
 * COROS has no webhooks: this polls what it holds for an account. Activities
 * then go through the activity-import queue like any other.
 */
@Processor('coros-sync', {
  concurrency: 3,
})
export class CorosSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CorosSyncProcessor.name);

  constructor(
    @Inject(forwardRef(() => CorosProviderService))
    private readonly corosProviderService: CorosProviderService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {
    super();
  }

  async process(job: Job<CorosSyncJobData>) {
    const { data } = job;
    if (data.kind === 'sync') {
      await this.corosProviderService.syncAccount(data.providerAccountId);
    } else if (data.kind === 'metrics') {
      await this.corosProviderService.syncAccountMetrics(
        data.providerAccountId,
      );
    } else {
      await this.corosProviderService.importHistoryBatch(
        data.providerAccountId,
        data.activities,
      );
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<CorosSyncJobData>, error: Error) {
    reportJobFailure(this.analytics, job, error);
    const final = job.attemptsMade >= (job.opts.attempts ?? 1);
    const message = `COROS ${job.data.kind} job failed for account ${job.data.providerAccountId} (attempt ${job.attemptsMade}): ${error.message}`;
    if (final) {
      this.logger.error(message, error.stack);
    } else {
      this.logger.warn(message);
    }
  }
}
