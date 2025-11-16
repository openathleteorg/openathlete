import { Queue } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';

import { provider_account } from '@openathlete/database';

import { ImportedActivity } from '../providers-sync/base/provider-import.interface';

export interface ActivityImportJobData {
  providerAccountId: number;
  activity: ImportedActivity;
  skipWeather?: boolean;
}

export interface ActivityProcessingJobData {
  eventActivityId: number;
  eventId: number;
  skipWeather?: boolean;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('activity-import')
    private readonly activityImportQueue: Queue<ActivityImportJobData>,
    @InjectQueue('activity-processing')
    private readonly activityProcessingQueue: Queue<ActivityProcessingJobData>,
  ) {
    const isWorker =
      process.env.ENABLE_ACTIVITY_IMPORT === 'true' ||
      process.env.ENABLE_ACTIVITY_PROCESSING === 'true';

    if (!isWorker) {
      this.logger.log(
        'QueueService initialized in PRODUCER mode (API) - will only add jobs, not process them',
      );
    } else {
      this.logger.log(
        'QueueService initialized in WORKER mode - will process jobs',
      );
    }
  }

  async addActivityImportJob(
    account: provider_account,
    activity: ImportedActivity,
    skipWeather = false,
  ): Promise<void> {
    try {
      const priority = new Date(activity.startDate).getTime();
      const jobId = `import-${account.provider}-${activity.externalId}`;

      let existingJob;
      try {
        existingJob = await this.activityImportQueue.getJob(jobId);
      } catch (error) {
        this.logger.error(
          `Failed to check for existing job ${jobId}: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error;
      }

      if (existingJob) {
        try {
          const state = await existingJob.getState();
          if (state === 'completed' || state === 'failed') {
            await existingJob.remove();
            this.logger.debug(
              `Removed existing ${state} job ${jobId} to allow re-import`,
            );
          } else {
            this.logger.debug(
              `Job ${jobId} already exists with state ${state}, skipping`,
            );
            return;
          }
        } catch (error) {
          this.logger.error(
            `Failed to check/remove existing job ${jobId}: ${error instanceof Error ? error.message : String(error)}`,
          );
          throw error;
        }
      }

      const job = await this.activityImportQueue.add('import', {
        providerAccountId: account.provider_account_id,
        activity,
        skipWeather,
      }, {
        priority,
        jobId,
      });

      this.logger.log(
        `Added activity import job for ${activity.externalId} (jobId: ${jobId})`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to add activity import job for ${activity.externalId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async addActivityImportJobs(
    account: provider_account,
    activities: ImportedActivity[],
    skipWeather = false,
  ): Promise<void> {
    try {
      const sortedActivities = [...activities].sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );

      const jobsToAdd: Array<{
        name: string;
        data: ActivityImportJobData;
        opts: { priority: number; jobId: string };
      }> = [];

      for (const activity of sortedActivities) {
        const jobId = `import-${account.provider}-${activity.externalId}`;
        let existingJob;
        try {
          existingJob = await this.activityImportQueue.getJob(jobId);
        } catch (error) {
          this.logger.error(
            `Failed to check for existing job ${jobId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        if (existingJob) {
          try {
            const state = await existingJob.getState();
            if (state === 'completed' || state === 'failed') {
              await existingJob.remove();
            } else {
              continue;
            }
          } catch (error) {
            this.logger.error(
              `Failed to check/remove existing job ${jobId}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }

        const priority = -new Date(activity.startDate).getTime();
        jobsToAdd.push({
          name: 'import',
          data: {
            providerAccountId: account.provider_account_id,
            activity,
            skipWeather,
          },
          opts: {
            priority,
            jobId,
          },
        });
      }

      if (jobsToAdd.length === 0) {
        this.logger.log(
          `No new jobs to add for provider ${account.provider} (all already exist)`,
        );
        return;
      }

      await this.activityImportQueue.addBulk(jobsToAdd);

      this.logger.log(
        `Added ${jobsToAdd.length} activity import jobs to queue for provider ${account.provider}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to add activity import jobs for provider ${account.provider}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async addActivityProcessingJob(
    eventActivityId: number,
    eventId: number,
    skipWeather = false,
  ): Promise<void> {
    try {
      await this.activityProcessingQueue.add('process', {
        eventActivityId,
        eventId,
        skipWeather,
      });

      this.logger.debug(
        `Added activity processing job for eventActivityId ${eventActivityId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to add activity processing job for eventActivityId ${eventActivityId}: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getQueueStats() {
    const [importStats, processingStats] = await Promise.all([
      this.activityImportQueue.getJobCounts(),
      this.activityProcessingQueue.getJobCounts(),
    ]);

    return {
      'activity-import': importStats,
      'activity-processing': processingStats,
    };
  }
}
