import { Job, UnrecoverableError } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, Optional, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ConnectorProvider } from '@openathlete/database';

import { CoachActivityNoticeEvent } from '../../../events/coach-activity-notice.event';
import { ActivityReconciliationService } from '../../core/services/activity-reconciliation.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { ImportResult } from '../../providers-sync/base/provider-import.interface';
import {
  GarminProviderService,
  PolarProviderService,
  StravaProviderService,
  SuuntoProviderService,
} from '../../providers-sync/providers';
import { ActivityImportJobData, QueueService } from '../queue.service';

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
    private readonly reconciliation: ActivityReconciliationService,
    @Optional() private readonly emitter?: EventEmitter2,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ActivityImportJobData>, error: Error) {
    this.logger.error(
      `Job ${job.id} (${job.data?.activity?.externalId || 'unknown'}) failed: ${error.message}`,
      error.stack,
    );
  }

  async process(job: Job<ActivityImportJobData>) {
    const { providerAccountId, bulkImport } = job.data;
    // BullMQ persists dates as JSON strings. Providers consume real Dates,
    // regardless of whether a job came from a webhook or a catch-up import.
    const activity = {
      ...job.data.activity,
      startDate: new Date(job.data.activity.startDate),
      endDate: new Date(job.data.activity.endDate),
    };

    try {
      if (
        !Number.isFinite(activity.startDate.getTime()) ||
        !Number.isFinite(activity.endDate.getTime()) ||
        activity.endDate < activity.startDate
      )
        throw new UnrecoverableError('Invalid activity timestamps');
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
      if (!savedActivity)
        return {
          success: true,
          status: result.ignored ? 'ignored' : 'needs_review',
          receiptId: result.receiptId,
        };
      if (result.receiptId && !result.processingPending)
        return {
          success: true,
          eventActivityId: savedActivity.eventActivityId,
          eventId: savedActivity.eventId,
        };

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
        bulkImport || (result.receiptId !== undefined && !created),
        result.receiptId
          ? `source-${result.receiptId}-${result.revision}`
          : undefined,
      );
      if (result.receiptId && result.revision)
        await this.reconciliation.markDispatched(
          result.receiptId,
          result.revision,
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
