import { Job, UnrecoverableError } from 'bullmq';

import { AnalyticsService } from './analytics.service';

/**
 * The job cannot succeed for a reason outside our code, like a user who did
 * not grant a permission: it fails at once and stays out of error reports.
 */
export class RefusedJobError extends UnrecoverableError {
  constructor(message: string) {
    super(message);
    this.name = 'RefusedJobError';
  }
}

/**
 * Reports a job once it will not run again: earlier attempts are retries doing
 * their work. BullMQ passes no job when it lost track of it (stalled).
 */
export function reportJobFailure(
  analytics: AnalyticsService | undefined,
  job: Job | undefined,
  error: Error,
): void {
  if (error instanceof RefusedJobError) return;
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
