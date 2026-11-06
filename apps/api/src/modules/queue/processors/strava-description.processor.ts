import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Optional, forwardRef } from '@nestjs/common';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';

import { ActivityDescriptionService } from '../../providers-sync/activity-description/activity-description.service';
import { StravaDescriptionJobData } from '../queue.service';

/**
 * Writes OpenAthlete's analysis into a Strava activity's description. It
 * reads the description again each run and skips one already written, so a
 * retry never writes twice.
 */
@Processor('strava-description', { concurrency: 2 })
export class StravaDescriptionProcessor extends WorkerHost {
  constructor(
    @Inject(forwardRef(() => ActivityDescriptionService))
    private readonly descriptions: ActivityDescriptionService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<StravaDescriptionJobData>, error: Error) {
    reportJobFailure(this.analytics, job, error);
  }

  async process(job: Job<StravaDescriptionJobData>) {
    return { result: await this.descriptions.write(job.data) };
  }
}
