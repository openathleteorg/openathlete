import { Queue } from 'bullmq';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { ProviderAccount } from '@openathlete/database';
import { ProviderSyncStatus } from '@openathlete/shared';

import { ImportedActivity } from '../providers-sync/base/provider-import.interface';

export interface ActivityImportJobData {
  providerAccountId: number;
  activity: ImportedActivity<Date | string>;
  bulkImport?: boolean;
}

export interface ProviderRecentSyncJobData {
  providerAccountId: number;
  activityJobIds?: string[];
}

export interface ProviderFullImportJobData {
  providerAccountId: number;
}

export interface ActivityProcessingJobData {
  eventActivityId: number;
  eventId: number;
  bulkImport?: boolean;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('activity-import')
    private readonly activityImportQueue: Queue<ActivityImportJobData>,
    @InjectQueue('activity-processing')
    private readonly activityProcessingQueue: Queue<ActivityProcessingJobData>,
    @InjectQueue('provider-full-import')
    private readonly fullImportQueue: Queue<ProviderFullImportJobData>,
    @InjectQueue('provider-recent-sync')
    private readonly recentSyncQueue: Queue<ProviderRecentSyncJobData>,
  ) {}

  /**
   * Queue the historical import of a provider account. Listing years of
   * activities takes minutes and many rate-limited provider calls, so it runs
   * in the worker rather than in the HTTP request.
   */
  async addFullImportJob(providerAccountId: number): Promise<void> {
    const jobId = `full-import-${providerAccountId}`;
    // A finished job keeps its id until it expires: remove it so a new
    // import can be queued (an active one is left alone)
    const existing = await this.fullImportQueue.getJob(jobId);
    if (existing) {
      const state = await existing.getState();
      if (state !== 'completed' && state !== 'failed') {
        return;
      }
      await existing.remove();
    }
    await this.fullImportQueue.add(
      'full-import',
      { providerAccountId },
      { jobId },
    );
  }

  /** Separate from one-time history imports; coalesce taps and concurrent requests. */
  async addRecentStravaSyncJob(providerAccountId: number): Promise<string> {
    const job = await this.recentSyncQueue.add(
      'strava-recent-sync',
      { providerAccountId },
      {
        deduplication: {
          id: `strava-recent-${providerAccountId}`,
          ttl: 60_000,
        },
      },
    );
    return job.id!;
  }

  async getRecentStravaSyncStatus(
    providerAccountId: number,
    syncId: string,
  ): Promise<ProviderSyncStatus> {
    const job = await this.recentSyncQueue.getJob(syncId);
    // Never expose another athlete's job, counts, or provider failures.
    if (!job || job.data.providerAccountId !== providerAccountId)
      throw new NotFoundException('Sync not found');
    const state = await job.getState();
    const ids = job.data.activityJobIds;
    const result: ProviderSyncStatus = {
      state: 'running',
      total: ids?.length ?? 0,
      imported: 0,
      needsReview: 0,
      failed: 0,
      pending: 0,
      retrying: state === 'delayed',
    };
    let unavailable = false;
    await Promise.all(
      (ids ?? []).map(async (id) => {
        const child = await this.activityImportQueue.getJob(id);
        if (!child || child.data.providerAccountId !== providerAccountId) {
          unavailable = true;
          return;
        }
        const childState = await child.getState();
        if (childState === 'completed') {
          if (child.returnvalue?.status === 'needs_review')
            result.needsReview++;
          else if (child.returnvalue?.success === true) result.imported++;
          else unavailable = true;
        } else if (childState === 'failed') result.failed++;
        else if (childState === 'unknown') unavailable = true;
        else {
          result.pending++;
          if (childState === 'delayed') result.retrying = true;
        }
      }),
    );
    if (state === 'failed' || job.returnvalue?.skipped) result.state = 'failed';
    else if (state === 'completed') {
      // Old workers and expired child jobs cannot prove a successful import.
      if (!ids || unavailable) result.state = 'unavailable';
      else if (!result.pending)
        result.state = result.failed ? 'failed' : 'completed';
    } else if (state === 'waiting' || state === 'prioritized')
      result.state = 'queued';
    return result;
  }

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
    account: ProviderAccount,
    activity: ImportedActivity,
    bulkImport = false,
  ): Promise<void> {
    try {
      const priority = this.calculatePriority(activity.startDate);
      const jobId = `import-${account.athleteId}-${account.provider}-${activity.externalId}`;

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
          providerAccountId: account.providerAccountId,
          activity,
          bulkImport,
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
    account: ProviderAccount,
    activities: ImportedActivity[],
    bulkImport = false,
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
        const jobId = `import-${account.athleteId}-${account.provider}-${activity.externalId}`;
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
            providerAccountId: account.providerAccountId,
            activity,
            bulkImport,
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
    bulkImport = false,
    idempotencyKey?: string,
  ): Promise<void> {
    try {
      await this.activityProcessingQueue.add(
        'process',
        {
          eventActivityId,
          eventId,
          bulkImport,
        },
        idempotencyKey ? { jobId: idempotencyKey } : undefined,
      );
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
}
