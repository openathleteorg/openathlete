import { Job, Queue } from 'bullmq';

import { InjectQueue, OnWorkerEvent, Processor } from '@nestjs/bullmq';
import { Inject, Logger, OnModuleInit, forwardRef } from '@nestjs/common';

import { connector_provider } from '@openathlete/database';
import { CompressedActivityStream } from '@openathlete/shared';

import { uncompressActivityStream } from '../../core/helpers/activity-stream';
import { computeRecords } from '../../core/helpers/record';
import { PrismaService } from '../../prisma/services/prisma.service';
import { StravaProviderService } from '../../providers-sync/providers';
import { ActivityImportJobData, QueueService } from '../queue.service';

@Processor('activity-import', {
  concurrency: 3,
})
export class ActivityImportProcessor implements OnModuleInit {
  private readonly logger = new Logger(ActivityImportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StravaProviderService))
    private readonly stravaProviderService: StravaProviderService,
    private readonly queueService: QueueService,
    @InjectQueue('activity-import')
    private readonly activityImportQueue: Queue<ActivityImportJobData>,
  ) {}

  async onModuleInit() {
    if (process.env.ENABLE_ACTIVITY_IMPORT !== 'true') {
      return;
    }

    this.logger.log('ActivityImportProcessor ready');
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ActivityImportJobData>) {
    this.logger.log(
      `Completed activity import job ${job.id} (${job.data.activity.externalId})`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ActivityImportJobData>, error: Error) {
    this.logger.error(
      `Job ${job.id} (${job.data?.activity?.externalId || 'unknown'}) failed: ${error.message}`,
      error.stack,
    );
  }

  async process(job: Job<ActivityImportJobData>) {
    const { providerAccountId, activity, skipWeather } = job.data;
    const startTime = Date.now();

    this.logger.log(
      `Processing activity import job ${job.id} for activity ${activity.externalId}`,
    );

    try {
      await job.updateProgress(10);

      const account = await this.prisma.provider_account.findUnique({
        where: {
          provider_account_id: providerAccountId,
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

      if (account.provider !== connector_provider.STRAVA) {
        throw new Error(
          `Provider ${account.provider} does not support activity import yet`,
        );
      }

      await job.updateProgress(30);

      const savedActivity = await this.stravaProviderService.importActivity(
        account,
        activity,
      );

      this.logger.log(
        `Successfully imported activity ${activity.externalId} (eventActivityId: ${savedActivity.event_activity_id})`,
      );

      await job.updateProgress(60);

      // Compute and save records
      const activityWithStream = await this.prisma.event_activity.findUnique({
        where: { event_activity_id: savedActivity.event_activity_id },
        select: { stream: true, event: { select: { athlete_id: true } } },
      });

      if (activityWithStream?.stream && activityWithStream.event) {
        const compressedStream =
          activityWithStream.stream as CompressedActivityStream;
        const stream = uncompressActivityStream(compressedStream);

        if (stream) {
          const records = computeRecords(stream);

          if (records.length > 0 && activityWithStream.event.athlete_id) {
            await this.prisma.record.createMany({
              data: records.map((record) => ({
                ...record,
                event_activity_id: savedActivity.event_activity_id,
                athlete_id: activityWithStream.event.athlete_id!,
                date: new Date(),
              })),
              skipDuplicates: true,
            });

            this.logger.debug(
              `Created ${records.length} records for activity ${savedActivity.event_activity_id}`,
            );
          }
        }
      }

      await job.updateProgress(90);

      const totalDuration = Date.now() - startTime;
      this.logger.log(
        `Completed activity import job ${job.id} in ${totalDuration}ms`,
      );

      await this.queueService.addActivityProcessingJob(
        savedActivity.event_activity_id,
        savedActivity.event_id,
        skipWeather,
      );

      return {
        success: true,
        eventActivityId: savedActivity.event_activity_id,
        eventId: savedActivity.event_id,
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
