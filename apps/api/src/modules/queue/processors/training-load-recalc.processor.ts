import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Optional, forwardRef } from '@nestjs/common';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';

import { TrainingLoadService } from '../../core/services/training-load.service';
import { TrainingLoadRecalcJobData } from '../queue.service';

/**
 * Computes the TRIMP of every activity of an athlete again, after their HR
 * max or resting HR changed. Each entry is overwritten, so a retry is safe.
 */
@Processor('training-load-recalc', { concurrency: 1 })
export class TrainingLoadRecalcProcessor extends WorkerHost {
  constructor(
    @Inject(forwardRef(() => TrainingLoadService))
    private readonly trainingLoad: TrainingLoadService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<TrainingLoadRecalcJobData>, error: Error) {
    reportJobFailure(this.analytics, job, error);
  }

  async process(job: Job<TrainingLoadRecalcJobData>) {
    return this.trainingLoad.recalculateAthleteTrimp(job.data.athleteId);
  }
}
