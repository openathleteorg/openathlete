import axios from 'axios';

import {
  ConnectorProvider,
  ProviderAccount,
  SportType,
} from '@openathlete/database';

import { StravaProviderService } from './strava.provider.service';

describe('Strava full import', () => {
  const account = {
    providerAccountId: 1,
    athleteId: 7,
    provider: ConnectorProvider.STRAVA,
  } as ProviderAccount;

  function setup(existing: object[]) {
    const prisma = {
      activitySource: { findMany: jest.fn().mockResolvedValue([]) },
      eventActivity: {
        findMany: jest.fn().mockResolvedValue(existing),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const queue = { addActivityImportJobs: jest.fn() };
    const config = { get: jest.fn(), getOrThrow: jest.fn() };
    const service = new StravaProviderService(
      prisma as never,
      config as never,
      queue as never,
      {} as never,
    );
    return { service, prisma, queue };
  }

  const fetched = (externalId: string, sport: SportType) => ({
    externalId,
    name: 'Morning Trail Run',
    startDate: new Date('2026-10-02T07:00:00Z'),
    endDate: new Date('2026-10-02T11:00:00Z'),
    sport,
    distance: 35700,
    duration: 14400,
    raw: {},
  });

  it('catches up only a bounded date range and skips existing source links', async () => {
    const { service, prisma, queue } = setup([]);
    prisma.activitySource.findMany.mockResolvedValue([
      { externalId: 's1' },
    ] as never);
    const listing = jest
      .spyOn(service, 'importActivities')
      .mockResolvedValue([
        fetched('s1', SportType.CYCLING),
        fetched('s2', SportType.CYCLING),
      ]);
    const endDate = new Date('2026-10-22T12:00:00Z');
    const record = jest.fn().mockResolvedValue(undefined);
    await expect(
      service.queueRecentImport(account, endDate, record),
    ).resolves.toEqual({
      queuedActivities: 1,
    });
    expect(record).toHaveBeenCalledWith(['import-7-STRAVA-s2']);
    expect(record.mock.invocationCallOrder[0]).toBeLessThan(
      queue.addActivityImportJobs.mock.invocationCallOrder[0],
    );
    expect(listing).toHaveBeenCalledWith(account, {
      startDate: new Date('2026-09-22T12:00:00Z'),
      endDate,
      limit: 1000,
    });
    expect(queue.addActivityImportJobs.mock.calls[0][1]).toEqual([
      fetched('s2', SportType.CYCLING),
    ]);
  });

  it('asks Strava to filter the date range instead of scanning the whole history', async () => {
    const { service } = setup([]);
    jest
      .spyOn(service, 'getValidAccessToken')
      .mockResolvedValue('synthetic-token');
    const request = jest.spyOn(axios, 'get').mockResolvedValue({ data: [] });
    try {
      const startDate = new Date('2026-09-22T12:00:00Z');
      const endDate = new Date('2026-10-22T12:00:00Z');
      await service.importActivities(account, {
        startDate,
        endDate,
        limit: 1000,
      });
      expect(request).toHaveBeenCalledWith(
        expect.stringContaining('per_page=200'),
        expect.objectContaining({
          params: {
            after: startDate.getTime() / 1000,
            before: endDate.getTime() / 1000,
          },
        }),
      );
      expect(request).toHaveBeenCalledTimes(1);
    } finally {
      jest.restoreAllMocks();
    }
  });

  it('files known trail runs under trail running, and queues the new ones', async () => {
    const { service, prisma, queue } = setup([
      // Imported when only `type` was read
      {
        eventActivityId: 1,
        externalId: 's1',
        sport: SportType.RUNNING,
        provider: ConnectorProvider.STRAVA,
      },
      {
        eventActivityId: 2,
        externalId: 's2',
        sport: SportType.RUNNING,
        provider: ConnectorProvider.STRAVA,
      },
    ]);
    jest
      .spyOn(service, 'importActivities')
      .mockResolvedValue([
        fetched('s1', SportType.TRAIL_RUNNING),
        fetched('s2', SportType.RUNNING),
        fetched('s3', SportType.TRAIL_RUNNING),
      ]);

    const result = await service.queueFullImport(account);

    expect(prisma.eventActivity.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.eventActivity.updateMany).toHaveBeenCalledWith({
      where: { eventActivityId: { in: [1] } },
      data: { sport: SportType.TRAIL_RUNNING },
    });
    expect(result).toEqual({ queuedActivities: 1 });
    expect(
      queue.addActivityImportJobs.mock.calls[0][1].map(
        (a: { externalId: string }) => a.externalId,
      ),
    ).toEqual(['s3']);
  });

  it('leaves the sport the athlete set on activities from elsewhere, and unknown sports', async () => {
    const { service, prisma } = setup([
      {
        eventActivityId: 1,
        externalId: 's1',
        sport: SportType.RUNNING,
        provider: ConnectorProvider.GARMIN,
      },
      {
        eventActivityId: 2,
        externalId: 's2',
        sport: SportType.YOGA,
        provider: ConnectorProvider.STRAVA,
      },
    ]);
    jest
      .spyOn(service, 'importActivities')
      .mockResolvedValue([
        fetched('s1', SportType.TRAIL_RUNNING),
        fetched('s2', SportType.OTHER),
      ]);

    await service.queueFullImport(account);

    expect(prisma.eventActivity.updateMany).not.toHaveBeenCalled();
  });
});
