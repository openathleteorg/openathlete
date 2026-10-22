import { Job, UnrecoverableError } from 'bullmq';

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { HttpException, Inject, forwardRef } from '@nestjs/common';

import { ConnectorProvider } from '@openathlete/database';

import { PrismaService } from '../../prisma/services/prisma.service';
import { StravaProviderService } from '../../providers-sync/providers';
import { ProviderRecentSyncJobData } from '../queue.service';

/** A separate queue prevents older history workers from consuming catch-up jobs. */
@Processor('provider-recent-sync', { concurrency: 1 })
export class ProviderRecentSyncProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StravaProviderService))
    private readonly strava: StravaProviderService,
  ) {
    super();
  }

  async process(job: Job<ProviderRecentSyncJobData>) {
    const account = await this.prisma.providerAccount.findUnique({
      where: { providerAccountId: job.data.providerAccountId },
    });
    // Consent/connection may have changed while this request was waiting.
    if (
      !account ||
      account.status !== 'active' ||
      !account.importActivitiesEnabled
    )
      return { queuedActivities: 0, skipped: true };
    if (account.provider !== ConnectorProvider.STRAVA)
      throw new UnrecoverableError('Recent sync only supports Strava');
    try {
      return await this.strava.queueRecentImport(
        account,
        new Date(job.timestamp),
        async (ids) => {
          await job.updateData({
            ...job.data,
            activityJobIds: [
              ...new Set([...(job.data.activityJobIds ?? []), ...ids]),
            ],
          });
        },
      );
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() < 500 &&
        error.getStatus() !== 429
      )
        throw new UnrecoverableError('Strava connection requires attention');
      throw error;
    }
  }
}
