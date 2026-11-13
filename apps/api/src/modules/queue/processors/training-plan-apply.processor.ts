import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Optional, forwardRef } from '@nestjs/common';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';

import { TrainingPlanLibraryService } from '../../core/services/training-plan-library.service';
import { TrainingPlanApplyJobData } from '../queue.service';

/**
 * Applies a library plan to several athletes. Each athlete is its own
 * transaction, and the job records who is done: a retry applies the plan
 * to the others only, never twice to anyone. Access was checked when the
 * job was queued.
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
    for (const target of job.data.targets) {
      if (results.some((result) => result.athleteId === target.athleteId))
        continue;
      results.push(
        await this.library.applyToAthlete(
          job.data.plan,
          target,
          job.data.options,
        ),
      );
      await job.updateData({ ...job.data, results });
    }
    return { results };
  }
}
