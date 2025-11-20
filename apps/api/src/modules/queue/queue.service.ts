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

export interface GarminBackfillJobData {
  providerAccountId: number;
  start: number;
  end: number;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('activity-import')
    private readonly activityImportQueue: Queue<ActivityImportJobData>,
    @InjectQueue('activity-processing')
    private readonly activityProcessingQueue: Queue<ActivityProcessingJobData>,
    @InjectQueue('garmin-backfill')
    private readonly garminBackfillQueue: Queue<GarminBackfillJobData>,
  ) {}

  private calculatePriority(startDate: string | Date): number {
    const activityDate = new Date(startDate);
    const now = new Date();
    const daysDiff = Math.max(
      0,
      Math.floor(
        (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    return Math.min(2097152, Math.min(daysDiff, 200) * 10000);
  }

  async addActivityImportJob(
    account: provider_account,
    activity: ImportedActivity,
    skipWeather = false,
  ): Promise<void> {
    try {
      const priority = this.calculatePriority(activity.startDate);
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
          } else {
            return;
          }
        } catch (error) {
          this.logger.error(
            `Failed to check/remove existing job ${jobId}: ${error instanceof Error ? error.message : String(error)}`,
          );
          throw error;
        }
      }

      await this.activityImportQueue.add(
        'import',
        {
          providerAccountId: account.provider_account_id,
          activity,
          skipWeather,
        },
        {
          priority,
          jobId,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to add activity import job for ${activity.externalId}: ${error instanceof Error ? error.message : String(error)}`,
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

        const priority = this.calculatePriority(activity.startDate);
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
        return;
      }

      await this.activityImportQueue.addBulk(jobsToAdd);

      this.logger.log(
        `Added ${jobsToAdd.length} activity import jobs for provider ${account.provider}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to add activity import jobs for provider ${account.provider}: ${error instanceof Error ? error.message : String(error)}`,
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
    } catch (error) {
      this.logger.error(
        `Failed to add activity processing job for eventActivityId ${eventActivityId}: ${error instanceof Error ? error.message : String(error)}`,
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

  async addGarminBackfillJobs(
    account: provider_account,
    windows: Array<{ start: number; end: number }>,
    delayBetweenMs: number,
  ): Promise<number> {
    if (!this.garminBackfillQueue || windows.length === 0) {
      return 0;
    }

    const jobsToAdd: Array<{
      name: string;
      data: GarminBackfillJobData;
      opts: { jobId: string; delay: number };
    }> = [];

    for (const [index, window] of windows.entries()) {
      const jobId = `garmin-backfill-${account.provider_account_id}-${window.start}-${window.end}`;

      try {
        const existingJob = await this.garminBackfillQueue.getJob(jobId);
        if (existingJob) {
          const state = await existingJob.getState();
          if (state === 'completed') {
            continue;
          }
          if (state === 'failed') {
            await existingJob.remove();
          } else {
            continue;
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to inspect existing Garmin backfill job ${jobId}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }

      jobsToAdd.push({
        name: 'backfill',
        data: {
          providerAccountId: account.provider_account_id,
          start: window.start,
          end: window.end,
        },
        opts: {
          jobId,
          delay: index * delayBetweenMs,
        },
      });
    }

    if (jobsToAdd.length === 0) {
      return 0;
    }

    await this.garminBackfillQueue.addBulk(jobsToAdd);
    this.logger.log(
      `Scheduled ${jobsToAdd.length} Garmin backfill windows for provider_account ${account.provider_account_id}`,
    );
    return jobsToAdd.length;
  }
}
