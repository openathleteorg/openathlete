import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { HttpException, Inject, Optional, forwardRef } from '@nestjs/common';

import { Prisma } from '@openathlete/database';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';

import { TrainingPlanLibraryService } from '../../core/services/training-plan-library.service';
import { TrainingPlanApplyJobData } from '../queue.service';

/**
 * Applies a library plan to several athletes. Each athlete is its own
 * transaction, and the job records who is done: a retry applies the plan
 * to the others only. The plan also carries the job id, so an athlete whose
 * plan was saved just before a restart is finished, not applied twice.
 * Access was checked when the job was queued.
 */
@Processor('training-plan-apply', { concurrency: 1 })
export class TrainingPlanApplyProcessor extends WorkerHost {
  constructor(
    @Inject(forwardRef(() => TrainingPlanLibraryService))
    private readonly library: TrainingPlanLibraryService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<TrainingPlanApplyJobData>, error: Error) {
    reportJobFailure(this.analytics, job, error);
  }

  async process(job: Job<TrainingPlanApplyJobData>) {
    const results = [...job.data.results];
    const failures = [...(job.data.failures ?? [])];
    for (const target of job.data.targets) {
      const done = (entry: { athleteId: number }) =>
        entry.athleteId === target.athleteId;
      if (results.some(done) || failures.some(done)) continue;
      try {
        results.push(
          await this.library.applyToAthlete(
            job.data.plan,
            target,
            job.data.options,
            String(job.id),
          ),
        );
      } catch (error) {
        // A lasting refusal, such as a race deleted since queueing, or the
        // athlete themselves (Prisma's "record not found"), would fail every
        // retry: it is that athlete's result, the others go on
        if (!isLasting(error)) throw error;
        failures.push({ athleteId: target.athleteId, error: error.message });
      }
      await job.updateData({ ...job.data, results, failures });
    }
    return { results, failures };
  }
}

function isLasting(error: unknown): error is Error {
  return (
    error instanceof HttpException ||
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025')
  );
}
