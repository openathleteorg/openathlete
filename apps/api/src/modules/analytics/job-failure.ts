import { Job, UnrecoverableError } from 'bullmq';

import { AnalyticsService } from './analytics.service';

/**
 * Reports a job once it will not run again: earlier attempts are retries doing
 * their work. BullMQ passes no job when it lost track of it (stalled).
 */
export function reportJobFailure(
  analytics: AnalyticsService | undefined,
  job: Job | undefined,
  error: Error,
): void {
  if (!job) {
    analytics?.captureException(error, { job_lost: true });
    return;
  }
  if (
    error instanceof UnrecoverableError ||
    job.attemptsMade >= (job.opts.attempts ?? 1)
  ) {
    analytics?.captureException(error, {
      queue: job.queueName,
      job_name: job.name,
      attempts: job.attemptsMade,
    });
  }
}
