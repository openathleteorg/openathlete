import { Queue } from 'bull';

import { InjectQueue } from '@nestjs/bull';
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
  ) {}

  /**
   * Add an activity import job to the queue
   * Jobs are prioritized by activity start date (most recent first)
   */
  async addActivityImportJob(
    account: provider_account,
    activity: ImportedActivity,
    skipWeather = false,
  ): Promise<void> {
    // Use negative timestamp as priority (Bull uses higher priority first)
    // Most recent activities (higher timestamp) get higher priority
    const priority = -new Date(activity.startDate).getTime();
    const jobId = `import-${account.provider}-${activity.externalId}`;

    // Check if job already exists
    const existingJob = await this.activityImportQueue.getJob(jobId);
    if (existingJob) {
      const state = await existingJob.getState();
      if (state === 'completed' || state === 'failed') {
        // Remove old job to allow re-import
        await existingJob.remove();
        this.logger.debug(
          `Removed existing ${state} job ${jobId} to allow re-import`,
        );
      } else {
        // Job is already active or waiting, skip
        this.logger.debug(
          `Job ${jobId} already exists with state ${state}, skipping`,
        );
        return;
      }
    }

    const job = await this.activityImportQueue.add(
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

    this.logger.log(
      `Added activity import job for ${activity.externalId} (jobId: ${jobId}, priority: ${priority}, queueJobId: ${job.id})`,
    );
  }

  /**
   * Add multiple activity import jobs to the queue
   * Activities are sorted by date (most recent first) before being added
   */
  async addActivityImportJobs(
    account: provider_account,
    activities: ImportedActivity[],
    skipWeather = false,
  ): Promise<void> {
    // Sort activities by start date (most recent first)
    const sortedActivities = [...activities].sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

    // Check and clean up existing jobs before adding
    const jobsToAdd: Array<{
      name: string;
      data: ActivityImportJobData;
      opts: { priority: number; jobId: string };
    }> = [];
    for (const activity of sortedActivities) {
      const jobId = `import-${account.provider}-${activity.externalId}`;
      const existingJob = await this.activityImportQueue.getJob(jobId);

      if (existingJob) {
        const state = await existingJob.getState();
        if (state === 'completed' || state === 'failed') {
          await existingJob.remove();
          this.logger.debug(
            `Removed existing ${state} job ${jobId} to allow re-import`,
          );
        } else {
          // Job is already active or waiting, skip
          this.logger.debug(
            `Job ${jobId} already exists with state ${state}, skipping`,
          );
          continue;
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

    const addedJobs = await this.activityImportQueue.addBulk(jobsToAdd);

    this.logger.log(
      `Added ${addedJobs.length} activity import jobs to queue for provider ${account.provider}`,
    );
  }

  /**
   * Add an activity processing job to the queue
   */
  async addActivityProcessingJob(
    eventActivityId: number,
    eventId: number,
    skipWeather = false,
  ): Promise<void> {
    await this.activityProcessingQueue.add({
      eventActivityId,
      eventId,
      skipWeather,
    });

    this.logger.debug(
      `Added activity processing job for eventActivityId ${eventActivityId}`,
    );
  }

  /**
   * Get queue statistics
   */
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
