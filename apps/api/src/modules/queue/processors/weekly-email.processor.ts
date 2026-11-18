import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Optional } from '@nestjs/common';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';
import {
  WeeklyEmailJob,
  WeeklyEmailService,
} from 'src/modules/notification/weekly/weekly-email.service';

/**
 * Sends one Monday email. The limiter holds for every worker at once (it
 * lives in Redis): a whole time zone due at 7:00 goes out a few per second,
 * not in one burst at the email provider. The claim row makes a retry safe.
 */
@Processor('weekly-email', {
  concurrency: 1,
  limiter: { max: 2, duration: 1000 },
})
export class WeeklyEmailProcessor extends WorkerHost {
  constructor(
    private readonly weeklyEmail: WeeklyEmailService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<WeeklyEmailJob>, error: Error) {
    reportJobFailure(this.analytics, job, error);
  }

  async process(job: Job<WeeklyEmailJob>) {
    return this.weeklyEmail.send(job.data, new Date());
  }
}
