import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Optional, forwardRef } from '@nestjs/common';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';

import { ActivityDuplicateService } from '../../core/services/activity-duplicate.service';
import { DuplicateActivitiesJobData } from '../queue.service';

/**
 * Removes the activities an athlete has twice, from two sources. It reads
 * the activities afresh each run, so a retry after a failure part way
 * through finishes the work without deleting more.
 */
@Processor('duplicate-activities', { concurrency: 1 })
export class DuplicateActivitiesProcessor extends WorkerHost {
  constructor(
    @Inject(forwardRef(() => ActivityDuplicateService))
    private readonly duplicates: ActivityDuplicateService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<DuplicateActivitiesJobData>, error: Error) {
    reportJobFailure(this.analytics, job, error);
  }

  async process(job: Job<DuplicateActivitiesJobData>) {
    return this.duplicates.removeDuplicates(job.data.athleteId);
  }
}
