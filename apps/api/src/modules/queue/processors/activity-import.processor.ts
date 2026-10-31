import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, Optional, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ConnectorProvider, EventType } from '@openathlete/database';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';

import { CoachActivityNoticeEvent } from '../../../events/coach-activity-notice.event';
import { PrismaService } from '../../prisma/services/prisma.service';
import { ImportResult } from '../../providers-sync/base/provider-import.interface';
import {
  GarminProviderService,
  PolarProviderService,
  StravaProviderService,
  SuuntoProviderService,
} from '../../providers-sync/providers';
import { ActivityImportJobData, QueueService } from '../queue.service';

const FIRST_ACTIVITIES_REPORTED = 5;

@Processor('activity-import', {
  concurrency: 3,
})
export class ActivityImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivityImportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StravaProviderService))
    private readonly stravaProviderService: StravaProviderService,
    @Inject(forwardRef(() => GarminProviderService))
    private readonly garminProviderService: GarminProviderService,
    @Inject(forwardRef(() => PolarProviderService))
    private readonly polarProviderService: PolarProviderService,
    @Inject(forwardRef(() => SuuntoProviderService))
    private readonly suuntoProviderService: SuuntoProviderService,
    private readonly queueService: QueueService,
    @Optional() private readonly emitter?: EventEmitter2,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ActivityImportJobData>, error: Error) {
    reportJobFailure(this.analytics, job, error);
    this.logger.error(
      `Job ${job.id} (${job.data?.activity?.externalId || 'unknown'}) failed: ${error.message}`,
      error.stack,
    );
  }

  // A history import brings thousands of activities: only its first ones say
  // something, that the account works
  private async reportImport(
    account: { athleteId: number; provider: string },
    bulkImport?: boolean,
  ) {
    if (!this.analytics?.enabled) return;
    if (bulkImport) {
      const imported = await this.prisma.event.count({
        where: { athleteId: account.athleteId, type: EventType.ACTIVITY },
      });
      if (imported > FIRST_ACTIVITIES_REPORTED) return;
    }
    await this.analytics.captureForAthlete(
      account.athleteId,
      'activity_imported',
      { provider: account.provider, bulk: Boolean(bulkImport) },
    );
  }

  async process(job: Job<ActivityImportJobData>) {
    const { providerAccountId, activity, bulkImport } = job.data;

    try {
      await job.updateProgress(10);

      const account = await this.prisma.providerAccount.findUnique({
        where: {
          providerAccountId: providerAccountId,
        },
      });

      if (!account) {
        throw new Error(`Provider account ${providerAccountId} not found`);
      }

      if (account.status !== 'active') {
        throw new Error(
          `Provider account ${providerAccountId} is not active (status: ${account.status})`,
        );
      }

      if (!account.importActivitiesEnabled) {
        this.logger.debug(
          `Skipping import for provider account ${providerAccountId}: import disabled`,
        );
        return;
      }

      await job.updateProgress(30);

      let result: ImportResult;
      if (account.provider === ConnectorProvider.STRAVA) {
        result = await this.stravaProviderService.importActivity(
          account,
          activity,
        );
      } else if (account.provider === ConnectorProvider.GARMIN) {
        result = await this.garminProviderService.importActivity(
          account,
          activity,
        );
      } else if (account.provider === ConnectorProvider.POLAR) {
        result = await this.polarProviderService.importActivity(
          account,
          activity,
        );
      } else if (account.provider === ConnectorProvider.SUUNTO) {
        result = await this.suuntoProviderService.importActivity(
          account,
          activity,
        );
      } else {
        throw new Error(
          `Provider ${account.provider} does not support activity import yet`,
        );
      }

      const { activity: savedActivity, created } = result;

      // Only the import that saved the activity announces it: a webhook
      // retry or a later sync of the same activity finds it already there
      if (!bulkImport && created && this.emitter) {
        this.emitter.emit(
          CoachActivityNoticeEvent.SLUG,
          new CoachActivityNoticeEvent({
            eventId: savedActivity.eventId,
            kind: 'ACTIVITY',
            deliveryKey: `import:${savedActivity.eventId}`,
          }),
        );
      }
      if (created) await this.reportImport(account, bulkImport);
      await job.updateProgress(60);

      const activityWithStream = await this.prisma.eventActivity.findUnique({
        where: { eventActivityId: savedActivity.eventActivityId },
        select: { stream: true },
      });

      // Records are computed by the processing pipeline queued below
      await job.updateProgress(90);

      if (
        account.provider === ConnectorProvider.GARMIN &&
        !activityWithStream?.stream
      ) {
        return {
          success: true,
          eventActivityId: savedActivity.eventActivityId,
          eventId: savedActivity.eventId,
          waitingForStream: true,
        };
      }

      await this.queueService.addActivityProcessingJob(
        savedActivity.eventActivityId,
        savedActivity.eventId,
        bulkImport,
      );

      return {
        success: true,
        eventActivityId: savedActivity.eventActivityId,
        eventId: savedActivity.eventId,
      };
    } catch (error) {
      this.logger.error(
        `Job ${job.id} failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
