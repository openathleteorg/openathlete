import { Job } from 'bullmq';

import { BadRequestException } from '@nestjs/common';

import { ConnectorProvider } from '@openathlete/database';

import { ProviderRateLimitError } from '../../providers-sync/errors/provider-rate-limit.error';
import {
  GARMIN_BACKFILL_WINDOW_SECONDS,
  GARMIN_HISTORY_FLOOR_SECONDS,
} from '../../providers-sync/providers/garmin-backfill';
import { GarminHistoryBackfillJobData, QueueService } from '../queue.service';
import { GarminHistoryBackfillProcessor } from './garmin-history-backfill.processor';

// The real provider services load ESM-only SDKs; the tests pass fakes
jest.mock('../../providers-sync/providers', () => ({
  GarminProviderService: class {},
}));

const WINDOW = GARMIN_BACKFILL_WINDOW_SECONDS;
const activeGarmin = {
  providerAccountId: 7,
  provider: ConnectorProvider.GARMIN,
  status: 'active',
  importActivitiesEnabled: true,
};

function setup(account: object | null = activeGarmin) {
  const prisma = {
    providerAccount: { findUnique: jest.fn().mockResolvedValue(account) },
  };
  const garmin = { requestHistoryWindow: jest.fn() };
  const queue = { addGarminHistoryBackfillJob: jest.fn() };
  const processor = new GarminHistoryBackfillProcessor(
    prisma as never,
    garmin as never,
    queue as never,
  );
  return { garmin, queue, processor };
}

function job(data: Partial<GarminHistoryBackfillJobData> = {}) {
  return {
    data: {
      providerAccountId: 7,
      start: 600 * WINDOW,
      end: 601 * WINDOW,
      window: 0,
      ...data,
    },
    attemptsMade: 0,
    opts: { attempts: 3 },
  } as unknown as Job<GarminHistoryBackfillJobData>;
}

describe('GarminHistoryBackfillProcessor', () => {
  it('requests the window, then queues the one before it', async () => {
    const { garmin, queue, processor } = setup();

    await processor.process(job({ window: 4 }));

    expect(garmin.requestHistoryWindow).toHaveBeenCalledWith(
      activeGarmin,
      600 * WINDOW,
      601 * WINDOW,
    );
    expect(queue.addGarminHistoryBackfillJob).toHaveBeenCalledWith(
      7,
      600 * WINDOW,
      5,
    );
  });

  it('stops without failing when Garmin refuses a window', async () => {
    const { garmin, queue, processor } = setup();
    garmin.requestHistoryWindow.mockRejectedValue(
      new BadRequestException('Garmin refused the backfill: too old'),
    );

    await expect(processor.process(job())).resolves.toEqual({
      stopped: 'refused',
    });
    expect(queue.addGarminHistoryBackfillJob).not.toHaveBeenCalled();
  });

  it('stops at the floor of the history', async () => {
    const { garmin, queue, processor } = setup();

    await expect(
      processor.process(
        job({
          start: GARMIN_HISTORY_FLOOR_SECONDS,
          end: GARMIN_HISTORY_FLOOR_SECONDS + WINDOW,
        }),
      ),
    ).resolves.toEqual({ completed: true });
    expect(garmin.requestHistoryWindow).toHaveBeenCalled();
    expect(queue.addGarminHistoryBackfillJob).not.toHaveBeenCalled();
  });

  it('stops once the account is disconnected', async () => {
    const { garmin, queue, processor } = setup({
      ...activeGarmin,
      status: 'revoked',
    });

    await processor.process(job());

    expect(garmin.requestHistoryWindow).not.toHaveBeenCalled();
    expect(queue.addGarminHistoryBackfillJob).not.toHaveBeenCalled();
  });

  it('waits out a rate limit and keeps the window', async () => {
    const { garmin, queue, processor } = setup();
    garmin.requestHistoryWindow.mockRejectedValue(
      new ProviderRateLimitError('Garmin', 30_000),
    );
    const rateLimit = jest.fn();
    Object.defineProperty(processor, 'worker', { value: { rateLimit } });

    const error = await processor.process(job()).catch((e: Error) => e);

    expect(rateLimit).toHaveBeenCalledWith(30_000);
    expect((error as Error).message).toBe('bullmq:rateLimitExceeded');
    expect(queue.addGarminHistoryBackfillJob).not.toHaveBeenCalled();
  });
});

describe('QueueService.addGarminHistoryBackfillJob', () => {
  function setupQueue(existingState?: string) {
    const existing = existingState
      ? {
          getState: jest.fn().mockResolvedValue(existingState),
          remove: jest.fn(),
        }
      : undefined;
    const historyQueue = {
      add: jest.fn(),
      getJob: jest.fn().mockResolvedValue(existing),
    };
    const queues = Array.from({ length: 10 }, () => ({}));
    // garmin-history-backfill is the fifth queue injected
    queues[4] = historyQueue;
    const service = new (
      QueueService as unknown as new (...args: unknown[]) => QueueService
    )(...queues);
    return { service, historyQueue, existing };
  }

  it('aligns the window on the 30-day grid', async () => {
    const { service, historyQueue } = setupQueue();
    const end = 600 * WINDOW + 1234;

    await service.addGarminHistoryBackfillJob(7, end, 0);

    expect(historyQueue.add).toHaveBeenCalledWith(
      'window',
      { providerAccountId: 7, start: 600 * WINDOW, end, window: 0 },
      { jobId: `garmin-history-7-${end}` },
    );
  });

  it('never goes below the floor of the history', async () => {
    const { service, historyQueue } = setupQueue();

    await service.addGarminHistoryBackfillJob(
      7,
      GARMIN_HISTORY_FLOOR_SECONDS + 10,
      3,
    );
    expect(historyQueue.add.mock.calls[0][1].start).toBe(
      GARMIN_HISTORY_FLOOR_SECONDS,
    );

    historyQueue.add.mockClear();
    await service.addGarminHistoryBackfillJob(
      7,
      GARMIN_HISTORY_FLOOR_SECONDS,
      4,
    );
    expect(historyQueue.add).not.toHaveBeenCalled();
  });

  it('joins a backfill already done instead of requesting it again', async () => {
    const { service, historyQueue } = setupQueue('completed');

    await service.addGarminHistoryBackfillJob(7, 600 * WINDOW, 1);

    expect(historyQueue.add).not.toHaveBeenCalled();
  });

  it('requests a failed window again', async () => {
    const { service, historyQueue, existing } = setupQueue('failed');

    await service.addGarminHistoryBackfillJob(7, 600 * WINDOW, 1);

    expect(existing?.remove).toHaveBeenCalled();
    expect(historyQueue.add).toHaveBeenCalled();
  });
});
