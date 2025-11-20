import { Job } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger, forwardRef } from '@nestjs/common';

import { connector_provider } from '@openathlete/database';

import { PrismaService } from '../../prisma/services/prisma.service';
import { GarminProviderService } from '../../providers-sync/providers';
import { GarminBackfillJobData } from '../queue.service';

@Processor('garmin-backfill', {
  concurrency: 1,
})
export class GarminBackfillProcessor extends WorkerHost {
  private readonly logger = new Logger(GarminBackfillProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => GarminProviderService))
    private readonly garminProviderService: GarminProviderService,
  ) {
    super();
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<GarminBackfillJobData>, error: Error) {
    this.logger.warn(
      `Garmin backfill job ${job.id} (${job.data?.start ?? 'unknown'}-${job.data?.end ?? 'unknown'}) failed: ${error.message}`,
      error.stack,
    );
  }

  async process(job: Job<GarminBackfillJobData>) {
    const { providerAccountId, start, end } = job.data;

    const account = await this.prisma.provider_account.findUnique({
      where: {
        provider_account_id: providerAccountId,
      },
    });

    if (!account) {
      this.logger.warn(
        `Skipping Garmin backfill job ${job.id}: account ${providerAccountId} not found`,
      );
      return;
    }

    if (
      account.status !== 'active' ||
      account.provider !== connector_provider.GARMIN ||
      !account.import_activities_enabled
    ) {
      this.logger.debug(
        `Skipping Garmin backfill job ${job.id}: account inactive or import disabled`,
      );
      return;
    }

    await this.garminProviderService.requestActivityBackfillWindow(
      account,
      start,
      end,
    );

    this.logger.verbose(
      `Requested Garmin backfill for account ${providerAccountId} window ${start}-${end}`,
    );
  }
}
