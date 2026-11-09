import { Job, Worker } from 'bullmq';

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import {
  HttpException,
  Inject,
  Logger,
  Optional,
  forwardRef,
} from '@nestjs/common';

import { ConnectorProvider } from '@openathlete/database';

import { AnalyticsService } from 'src/modules/analytics/analytics.service';
import { reportJobFailure } from 'src/modules/analytics/job-failure';

import { PrismaService } from '../../prisma/services/prisma.service';
import { ProviderRateLimitError } from '../../providers-sync/errors/provider-rate-limit.error';
import { GarminProviderService } from '../../providers-sync/providers';
import { GARMIN_HISTORY_FLOOR_SECONDS } from '../../providers-sync/providers/garmin-backfill';
import { GarminHistoryBackfillJobData, QueueService } from '../queue.service';

/** About a year of windows between two progress logs */
const PROGRESS_EVERY = 12;

const day = (seconds: number) =>
  new Date(seconds * 1000).toISOString().slice(0, 10);

/**
 * Walks a Garmin account's history back, one 30-day backfill window per
 * job: each window queues the next one at the end of the queue, so the
 * accounts being backfilled take turns. A window Garmin refuses stops the
 * walk; nothing here touches the account's import state.
 */
@Processor('garmin-history-backfill', {
  concurrency: 1,
  // Garmin counts backfilled days per minute and answers 429 beyond:
  // leave room for the 30-day backfills of new connections
  limiter: { max: 2, duration: 60_000 },
})
export class GarminHistoryBackfillProcessor extends WorkerHost {
  private readonly logger = new Logger(GarminHistoryBackfillProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => GarminProviderService))
    private readonly garminProviderService: GarminProviderService,
    @Inject(forwardRef(() => QueueService))
    private readonly queueService: QueueService,
    @Optional() private readonly analytics?: AnalyticsService,
  ) {
    super();
  }

  async process(job: Job<GarminHistoryBackfillJobData>) {
    const { providerAccountId, start, end, window } = job.data;
    const label = `Garmin history backfill for account ${providerAccountId}`;
    const account = await this.prisma.providerAccount.findUnique({
      where: { providerAccountId },
    });
    if (
      account?.provider !== ConnectorProvider.GARMIN ||
      account.status !== 'active' ||
      !account.importActivitiesEnabled
    ) {
      this.logger.log(`${label} stopped: account disconnected or import off`);
      return { stopped: 'inactive' };
    }

    try {
      await this.garminProviderService.requestHistoryWindow(
        account,
        start,
        end,
      );
    } catch (error) {
      if (error instanceof ProviderRateLimitError) {
        await this.worker.rateLimit(error.retryAfterMs);
        throw Worker.RateLimitError();
      }
      // Garmin refuses this window (out of its history, permission
      // withdrawn): older windows would be refused too
      if (error instanceof HttpException && error.getStatus() < 500) {
        this.logger.warn(
          `${label} stopped at ${day(start)}..${day(end)} after ${window} windows: ${error.message}`,
        );
        return { stopped: 'refused' };
      }
      throw error;
    }

    if (start <= GARMIN_HISTORY_FLOOR_SECONDS) {
      this.logger.log(
        `${label} completed: ${window + 1} windows, back to ${day(start)}`,
      );
      return { completed: true };
    }
    if ((window + 1) % PROGRESS_EVERY === 0) {
      this.logger.log(
        `${label}: ${window + 1} windows requested, back to ${day(start)}`,
      );
    }
    await this.queueService.addGarminHistoryBackfillJob(
      providerAccountId,
      start,
      window + 1,
    );
    return { requested: [start, end] };
  }

  /** Network or Garmin errors, once retried: the walk stops there */
  @OnWorkerEvent('failed')
  onFailed(job: Job<GarminHistoryBackfillJobData>, error: Error) {
    const { providerAccountId, start, end, window } = job.data;
    if (job.attemptsMade < (job.opts.attempts ?? 1)) return;
    reportJobFailure(this.analytics, job, error);
    this.logger.error(
      `Garmin history backfill for account ${providerAccountId} failed at ${day(start)}..${day(end)} after ${window} windows: ${error.message}`,
      error.stack,
    );
  }
}
