import { Queue } from 'bullmq';
import { createHash } from 'node:crypto';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';

import { ProviderAccount } from '@openathlete/database';

import { ImportedActivity } from '../providers-sync/base/provider-import.interface';

export const GARMIN_PULL_DELAY_MS = 5_000;

export interface ActivityImportJobData {
  providerAccountId: number;
  activity: ImportedActivity;
  bulkImport?: boolean;
}

export interface ProviderFullImportJobData {
  providerAccountId: number;
}

/** One entry of a Garmin ping or push notification */
export interface GarminNotificationJobData {
  /** The list key of the notification: activities, dailies, activityFiles... */
  summaryType: string;
  userId: string;
  /** Ping: where to pull the data. Push: absent, the entry is the data. */
  callbackURL?: string;
  entry: Record<string, unknown>;
}

/** A Suunto webhook, handled out of the request: Suunto waits 2 seconds */
export type SuuntoNotificationJobData =
  | { kind: 'workout'; username: string | null; workoutKey: string }
  | {
      kind: 'metrics';
      providerAccountId: number;
      /** Epoch milliseconds; the sync runs up to now */
      from: number;
    };

/** Polar work, out of the webhook and spread away from Polar's quota */
export type PolarNotificationJobData =
  | { kind: 'exercise'; providerAccountId: number; exerciseId: string }
  | { kind: 'sync'; providerAccountId: number }
  | { kind: 'metrics'; providerAccountId: number };

const POLAR_WEBHOOK_SECRET_KEY = 'openathlete:polar:webhook-secret';

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
    @InjectQueue('garmin-notification')
    private readonly garminNotificationQueue: Queue<GarminNotificationJobData>,
    @InjectQueue('suunto-notification')
    private readonly suuntoNotificationQueue: Queue<SuuntoNotificationJobData>,
    @InjectQueue('polar-notification')
    private readonly polarNotificationQueue: Queue<PolarNotificationJobData>,
  ) {}

  /** Polar may notify an exercise twice: import it once */
  async addPolarExerciseJob(
    providerAccountId: number,
    exerciseId: string,
  ): Promise<void> {
    await this.polarNotificationQueue.add(
      'exercise',
      { kind: 'exercise', providerAccountId, exerciseId },
      { jobId: `polar-exercise-${exerciseId}` },
    );
  }

  async addPolarSyncJob(providerAccountId: number, delayMs = 0): Promise<void> {
    await this.polarNotificationQueue.add(
      'sync',
      { kind: 'sync', providerAccountId },
      {
        jobId: `polar-sync-${providerAccountId}-${Math.floor(Date.now() / 3_600_000)}-${delayMs}`,
        delay: delayMs,
      },
    );
  }

  /** The delay gathers the events of a watch sync into one request set */
  async addPolarMetricsJob(
    providerAccountId: number,
    delayMs = 60_000,
  ): Promise<void> {
    await this.polarNotificationQueue.add(
      'metrics',
      { kind: 'metrics', providerAccountId },
      {
        jobId: `polar-metrics-${providerAccountId}-${Math.floor((Date.now() + delayMs) / 60_000)}`,
        delay: delayMs,
      },
    );
  }

  /**
   * Polar shows a webhook's signing key once. The API verifies with what the
   * worker may have created, so the key lives in Redis, which both share.
   */
  async getPolarWebhookSecret(): Promise<string | null> {
    const redis = await this.polarNotificationQueue.client;
    return redis.get(POLAR_WEBHOOK_SECRET_KEY);
  }

  async setPolarWebhookSecret(secret: string): Promise<void> {
    const redis = await this.polarNotificationQueue.client;
    await redis.set(POLAR_WEBHOOK_SECRET_KEY, secret);
  }

  /** Suunto retries a webhook it thinks failed: import the workout once */
  async addSuuntoWorkoutJob(
    username: string | null,
    workoutKey: string,
  ): Promise<void> {
    await this.suuntoNotificationQueue.add(
      'workout',
      { kind: 'workout', username, workoutKey },
      { jobId: `suunto-workout-${workoutKey}` },
    );
  }

  /**
   * Sync an account's 24/7 data. Suunto sends a webhook per batch of
   * samples: the delay gathers a burst into one sync, which waiting jobs
   * with the same id join.
   */
  async addSuuntoMetricsJob(
    providerAccountId: number,
    from: number,
    delayMs = 60_000,
  ): Promise<void> {
    await this.suuntoNotificationQueue.add(
      'metrics',
      { kind: 'metrics', providerAccountId, from },
      {
        jobId: `suunto-metrics-${providerAccountId}-${Math.floor((Date.now() + delayMs) / 60_000)}`,
        delay: delayMs,
      },
    );
  }

  /**
   * Queue Garmin notifications, so the webhook answers within Garmin's 30
   * seconds and a restart loses none: callback URLs stay valid for 7 days
   * (activity files: 24 hours).
   */
  async addGarminNotificationJobs(
    notifications: GarminNotificationJobData[],
  ): Promise<void> {
    if (notifications.length === 0) return;
    await this.garminNotificationQueue.addBulk(
      notifications.map((data) => ({
        name: data.summaryType,
        data,
        opts: {
          // Garmin ties a pull to a ping it has seen answered: a pull that
          // overtakes our 200 counts as unprompted, and the ping as unanswered
          delay: GARMIN_PULL_DELAY_MS,
          // Garmin resends a notification it thinks failed: process it once
          jobId: `garmin-${createHash('sha256')
            .update(
              JSON.stringify([
                data.summaryType,
                data.userId,
                data.callbackURL ?? data.entry,
              ]),
            )
            .digest('hex')}`,
        },
      })),
    );
  }

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
  ): Promise<void> {
    try {
      await this.activityProcessingQueue.add('process', {
        eventActivityId,
        eventId,
        bulkImport,
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
}
