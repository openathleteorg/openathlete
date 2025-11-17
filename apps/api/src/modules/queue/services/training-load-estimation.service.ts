import { Queue } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/services/prisma.service';

export interface TrainingLoadEstimationJobData {
  eventId: number;
  eventTrainingId: number;
  athleteId: number;
}

@Injectable()
export class TrainingLoadEstimationService {
  private readonly logger = new Logger(TrainingLoadEstimationService.name);

  constructor(
    @InjectQueue('training-load-estimation')
    private readonly trainingLoadEstimationQueue: Queue<TrainingLoadEstimationJobData>,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Schedule training load estimation for a training event
   * - Plans execution 1 minute after the last update
   * - Ensures max 1 job per event (removes existing pending/delayed jobs)
   * - If a job is currently active, it will still add a new one to run after completion
   */
  async scheduleEstimation(
    eventId: number,
    eventTrainingId: number,
    athleteId: number,
  ): Promise<void> {
    try {
      const jobId = `training-load-estimation-${eventId}`;

      // Check for existing job
      const existingJob = await this.trainingLoadEstimationQueue.getJob(jobId);

      if (existingJob) {
        const state = await existingJob.getState();

        // If job is completed or failed, remove it
        if (state === 'completed' || state === 'failed') {
          await existingJob.remove();
        } else if (state === 'active') {
          // If job is currently running, we still add a new one to run after
          // The new job will be scheduled with delay
          this.logger.log(
            `Job for event ${eventId} is currently active, scheduling new job after completion`,
          );
        } else if (state === 'delayed' || state === 'waiting') {
          // If job is waiting or delayed, remove it and create a new one with updated delay
          await existingJob.remove();
          this.logger.log(
            `Removed existing ${state} job for event ${eventId}, scheduling new one`,
          );
        }
      }

      // Schedule job 1 minute from now
      const delay = 0 * 1000; // 1 minute in milliseconds

      await this.trainingLoadEstimationQueue.add(
        'estimate',
        {
          eventId,
          eventTrainingId,
          athleteId,
        },
        {
          jobId,
          delay,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 24 * 3600, // 24 hours
            count: 1000,
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // 7 days
          },
        },
      );

      this.logger.log(
        `Scheduled training load estimation for event ${eventId} (athlete ${athleteId}) in 1 minute`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule training load estimation for event ${eventId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Cancel estimation job for an event (if it's not already active)
   */
  async cancelEstimation(eventId: number): Promise<void> {
    try {
      const jobId = `training-load-estimation-${eventId}`;
      const job = await this.trainingLoadEstimationQueue.getJob(jobId);

      if (job) {
        const state = await job.getState();
        if (state !== 'active') {
          await job.remove();
          this.logger.log(
            `Cancelled training load estimation job for event ${eventId}`,
          );
        } else {
          this.logger.log(
            `Cannot cancel active job for event ${eventId}, it will complete`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to cancel training load estimation for event ${eventId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't throw, just log the error
    }
  }
}
