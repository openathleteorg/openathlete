import { Job, Queue } from 'bullmq';

import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Inject, Logger, forwardRef } from '@nestjs/common';

import { ConnectorProvider, EventActivity } from '@openathlete/database';
import { CompressedActivityStream } from '@openathlete/shared';

import { uncompressActivityStream } from '../../core/helpers/activity-stream';
import { computeRecords } from '../../core/helpers/record';
import { PrismaService } from '../../prisma/services/prisma.service';
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
    @InjectQueue('activity-import')
    private readonly activityImportQueue: Queue<ActivityImportJobData>,
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

      let savedActivity: EventActivity;
      if (account.provider === ConnectorProvider.STRAVA) {
        savedActivity = await this.stravaProviderService.importActivity(
          account,
          activity,
        );
      } else if (account.provider === ConnectorProvider.GARMIN) {
        savedActivity = await this.garminProviderService.importActivity(
          account,
          activity,
        );
      } else if (account.provider === ConnectorProvider.POLAR) {
        savedActivity = await this.polarProviderService.importActivity(
          account,
          activity,
        );
      } else if (account.provider === ConnectorProvider.SUUNTO) {
        savedActivity = await this.suuntoProviderService.importActivity(
          account,
          activity,
        );
      } else {
        throw new Error(
          `Provider ${account.provider} does not support activity import yet`,
        );
      }

      await job.updateProgress(60);

      const activityWithStream = await this.prisma.eventActivity.findUnique({
        where: { eventActivityId: savedActivity.eventActivityId },
        select: {
          stream: true,
          event: { select: { athleteId: true } },
          provider: true,
        },
      });

      if (activityWithStream?.stream && activityWithStream.event) {
        const compressedStream =
          activityWithStream.stream as CompressedActivityStream;
        const stream = uncompressActivityStream(compressedStream);

        if (stream) {
          const records = computeRecords(stream);

          if (records.length > 0 && activityWithStream.event.athleteId) {
            await this.prisma.record.createMany({
              data: records.map((record) => ({
                ...record,
                eventActivityId: savedActivity.eventActivityId,
                athleteId: activityWithStream.event.athleteId!,
                date: new Date(),
              })),
              skipDuplicates: true,
            });
          }
        }
      }

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
