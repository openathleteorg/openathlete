import { Job, UnrecoverableError, Worker } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import {
  HttpException,
  Inject,
  Logger,
  Optional,
  forwardRef,
} from '@nestjs/common';

import { ConnectorProvider, ProviderAccount } from '@openathlete/database';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';

import { PrismaService } from '../../prisma/services/prisma.service';
import {
  FullImportOptions,
  FullImportResult,
} from '../../providers-sync/base/base-provider.service';
import { ProviderRateLimitError } from '../../providers-sync/errors/provider-rate-limit.error';
import {
  CorosProviderService,
  GarminProviderService,
  StravaProviderService,
  SuuntoProviderService,
} from '../../providers-sync/providers';
import { ProviderFullImportJobData } from '../queue.service';

/**
 * Lists a provider account's activity history and queues one activity
 * import job per activity. Garmin instead requests a backfill, whose
 * activities arrive later through its webhooks.
 */
@Processor('provider-full-import', {
  concurrency: 2,
  // Spread out the history requests: Garmin answers 429 to a burst, such as
  // the backfill of every account at once (openathlete garmin-backfill)
  limiter: { max: 10, duration: 60_000 },
})
export class ProviderFullImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ProviderFullImportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => StravaProviderService))
    private readonly stravaProviderService: StravaProviderService,
    @Inject(forwardRef(() => GarminProviderService))
    private readonly garminProviderService: GarminProviderService,
    @Inject(forwardRef(() => SuuntoProviderService))
    private readonly suuntoProviderService: SuuntoProviderService,
    @Inject(forwardRef(() => CorosProviderService))
    private readonly corosProviderService: CorosProviderService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {
    super();
  }

  async process(job: Job<ProviderFullImportJobData>) {
    const { providerAccountId } = job.data;
    const since = job.data.since ? new Date(job.data.since) : undefined;
    const account = await this.prisma.providerAccount.findUnique({
      where: { providerAccountId },
    });

    // Disconnected or import turned off since the request: nothing to do
    if (
      !account ||
      account.status !== 'active' ||
      !account.importActivitiesEnabled
    ) {
      if (account) await this.resetRequest(providerAccountId);
      return { queuedActivities: 0, skipped: true };
    }

    let result: FullImportResult;
    try {
      result = await this.runProviderImport(account, { since });
    } catch (error) {
      // Out of quota: pause the whole queue, as the next accounts would be
      // refused too, and put the job back without spending an attempt
      if (error instanceof ProviderRateLimitError) {
        await this.worker.rateLimit(error.retryAfterMs);
        throw Worker.RateLimitError();
      }
      // A refused request (missing permission...) won't succeed on retry
      if (error instanceof HttpException && error.getStatus() < 500) {
        throw new UnrecoverableError(error.message);
      }
      throw error;
    }

    await this.prisma.providerAccount.update({
      where: { providerAccountId },
      data: result.partial
        ? // The recent months are in: the settings still offer the rest
          { fullImportRequestedAt: null }
        : {
            // A Garmin backfill completes later, through webhooks
            fullImportCompletedAt: result.backfillRequested ? null : new Date(),
          },
    });

    this.logger.log(
      `Historical ${account.provider} import for account ${providerAccountId}: ${
        result.backfillRequested
          ? 'backfill requested'
          : `${result.queuedActivities} activities queued`
      }`,
    );
    return result;
  }

  /** Once every attempt failed, let the user request the import again. */
  @OnWorkerEvent('failed')
  async onFailed(job: Job<ProviderFullImportJobData>, error: Error) {
    reportJobFailure(this.analytics, job, error);
    this.logger.error(
      `Historical import for account ${job.data.providerAccountId} failed (attempt ${job.attemptsMade}): ${error.message}`,
      error.stack,
    );
    if (
      error instanceof UnrecoverableError ||
      job.attemptsMade >= (job.opts.attempts ?? 1)
    ) {
      await this.resetRequest(job.data.providerAccountId);
    }
  }

  /**
   * Garmin and Suunto serve the last month at most: the limit only matters
   * to Strava and COROS, which go back years.
   */
  private runProviderImport(
    account: ProviderAccount,
    options: FullImportOptions,
  ): Promise<FullImportResult> {
    switch (account.provider) {
      case ConnectorProvider.STRAVA:
        return this.stravaProviderService.queueFullImport(account, options);
      case ConnectorProvider.GARMIN:
        return this.garminProviderService.queueFullImport(account);
      case ConnectorProvider.SUUNTO:
        return this.suuntoProviderService.queueFullImport(account);
      case ConnectorProvider.COROS:
        return this.corosProviderService.queueFullImport(account, options);
      default:
        throw new Error(
          `Historical import is not available for ${account.provider}`,
        );
    }
  }

  private async resetRequest(providerAccountId: number) {
    await this.prisma.providerAccount.updateMany({
      where: { providerAccountId, fullImportCompletedAt: null },
      data: { fullImportRequestedAt: null },
    });
  }
}
