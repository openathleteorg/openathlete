import { Job, UnrecoverableError } from 'bullmq';

import { BadRequestException } from '@nestjs/common';

import { ConnectorProvider } from '@openathlete/database';
import {
  FULL_IMPORT_STALE_AFTER_MS,
  isFullImportInProgress,
} from '@openathlete/shared';

import { ProviderRateLimitError } from '../../providers-sync/errors/provider-rate-limit.error';
import { ProviderFullImportJobData } from '../queue.service';
import { ProviderFullImportProcessor } from './provider-full-import.processor';

// The real provider services load ESM-only SDKs; the tests pass fakes
jest.mock('../../providers-sync/providers', () => ({
  GarminProviderService: class {},
  StravaProviderService: class {},
  SuuntoProviderService: class {},
}));

const activeStrava = {
  providerAccountId: 7,
  provider: ConnectorProvider.STRAVA,
  status: 'active',
  importActivitiesEnabled: true,
};

function setup(account: object | null = activeStrava) {
  const prisma = {
    providerAccount: {
      findUnique: jest.fn().mockResolvedValue(account),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const strava = { queueFullImport: jest.fn() };
  const garmin = { queueFullImport: jest.fn() };
  const processor = new ProviderFullImportProcessor(
    prisma as never,
    strava as never,
    garmin as never,
    { queueFullImport: jest.fn() } as never,
  );
  return { prisma, strava, garmin, processor };
}

function job(attemptsMade = 0) {
  return {
    data: { providerAccountId: 7 },
    attemptsMade,
    opts: { attempts: 3 },
  } as unknown as Job<ProviderFullImportJobData>;
}

describe('ProviderFullImportProcessor', () => {
  it('pauses the queue on a rate limit, without spending an attempt', async () => {
    const { prisma, garmin, processor } = setup({
      ...activeStrava,
      provider: ConnectorProvider.GARMIN,
    });
    garmin.queueFullImport.mockRejectedValue(
      new ProviderRateLimitError('Garmin', 30_000),
    );
    const rateLimit = jest.fn();
    Object.defineProperty(processor, 'worker', { value: { rateLimit } });

    const error = await processor.process(job()).catch((e: Error) => e);

    expect(rateLimit).toHaveBeenCalledWith(30_000);
    expect((error as Error).message).toBe('bullmq:rateLimitExceeded');
    expect(prisma.providerAccount.updateMany).not.toHaveBeenCalled();
  });

  it('queues the history and marks the import completed', async () => {
    const { prisma, strava, processor } = setup();
    strava.queueFullImport.mockResolvedValue({ queuedActivities: 42 });

    await expect(processor.process(job())).resolves.toEqual({
      queuedActivities: 42,
    });

    expect(prisma.providerAccount.update).toHaveBeenCalledWith({
      where: { providerAccountId: 7 },
      data: { fullImportCompletedAt: expect.any(Date) },
    });
  });

  it('leaves a Garmin backfill open until its webhooks arrive', async () => {
    const { prisma, garmin, processor } = setup({
      ...activeStrava,
      provider: ConnectorProvider.GARMIN,
    });
    garmin.queueFullImport.mockResolvedValue({
      queuedActivities: 0,
      backfillRequested: true,
    });

    await processor.process(job());

    expect(prisma.providerAccount.update).toHaveBeenCalledWith({
      where: { providerAccountId: 7 },
      data: { fullImportCompletedAt: null },
    });
  });

  it('skips and clears the request when import was turned off', async () => {
    const { prisma, strava, processor } = setup({
      ...activeStrava,
      importActivitiesEnabled: false,
    });

    await processor.process(job());

    expect(strava.queueFullImport).not.toHaveBeenCalled();
    expect(prisma.providerAccount.updateMany).toHaveBeenCalledWith({
      where: { providerAccountId: 7, fullImportCompletedAt: null },
      data: { fullImportRequestedAt: null },
    });
  });

  it('does not retry a request the provider refused', async () => {
    const { strava, processor } = setup();
    strava.queueFullImport.mockRejectedValue(
      new BadRequestException('Permission missing'),
    );

    await expect(processor.process(job())).rejects.toBeInstanceOf(
      UnrecoverableError,
    );
  });

  it('lets the user retry only once every attempt failed', async () => {
    const { prisma, processor } = setup();

    await processor.onFailed(job(1), new Error('Strava 429'));
    expect(prisma.providerAccount.updateMany).not.toHaveBeenCalled();

    await processor.onFailed(job(3), new Error('Strava 429'));
    expect(prisma.providerAccount.updateMany).toHaveBeenCalledTimes(1);
  });
});

describe('isFullImportInProgress', () => {
  const now = new Date('2026-10-04T12:00:00Z');

  it('is in progress between the request and its completion', () => {
    expect(
      isFullImportInProgress(
        {
          fullImportRequestedAt: new Date(now.getTime() - 60_000),
          fullImportCompletedAt: null,
        },
        now,
      ),
    ).toBe(true);
  });

  it('is over once completed or never requested', () => {
    expect(
      isFullImportInProgress(
        { fullImportRequestedAt: now, fullImportCompletedAt: now },
        now,
      ),
    ).toBe(false);
    expect(
      isFullImportInProgress(
        { fullImportRequestedAt: null, fullImportCompletedAt: null },
        now,
      ),
    ).toBe(false);
  });

  it('gives up on a request older than a day so it can be retried', () => {
    expect(
      isFullImportInProgress(
        {
          fullImportRequestedAt: new Date(
            now.getTime() - FULL_IMPORT_STALE_AFTER_MS - 1,
          ).toISOString(),
          fullImportCompletedAt: null,
        },
        now,
      ),
    ).toBe(false);
  });
});
