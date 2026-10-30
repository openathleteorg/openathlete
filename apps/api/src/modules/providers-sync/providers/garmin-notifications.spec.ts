import axios from 'axios';

import { ProviderAccount } from '@openathlete/database';

import {
  GarminProviderService,
  parseGarminNotifications,
  toImportedGarminActivity,
} from './garmin.provider.service';

// The FIT SDK is ESM, which Jest cannot load
jest.mock('../../core/helpers/activity-file-parser.service', () => ({
  ActivityFileParserService: class {},
}));

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    __esModule: true,
    ...actual,
    default: { ...actual, get: jest.fn() },
  };
});

const mockedGet = axios.get as jest.Mock;

describe('parseGarminNotifications', () => {
  it('queues pings and pushes, but not deregistrations', () => {
    const jobs = parseGarminNotifications({
      dailies: [
        { userId: 'u1', callbackURL: 'https://apis.garmin.com/x?token=t' },
      ],
      sleeps: [{ userId: 'u1', summaryId: 's1', durationInSeconds: 3600 }],
      deregistrations: [{ userId: 'u2' }],
      epochs: [{ userId: 'u1', summaryId: 'e1', steps: 12 }],
      activities: [{ callbackURL: 'https://apis.garmin.com/y' }],
    });

    expect(jobs.map((job) => job.summaryType)).toEqual([
      'dailies',
      'sleeps',
      'epochs',
    ]);
    expect(jobs[0].callbackURL).toBe('https://apis.garmin.com/x?token=t');
    expect(jobs[1].entry).toMatchObject({ durationInSeconds: 3600 });
    // Pushed data that is never saved is not kept in the queue
    expect(jobs[2].entry).toEqual({});
  });
});

describe('toImportedGarminActivity', () => {
  it('keeps the UTC start time, not the device local time', () => {
    const activity = toImportedGarminActivity({
      summaryId: '1',
      activityId: '123',
      activityType: 'RUNNING',
      activityName: 'Morning run',
      startTimeInSeconds: 1_700_000_000,
      startTimeOffsetInSeconds: 7200,
      durationInSeconds: 1800,
    });

    expect(activity?.externalId).toBe('123');
    expect(activity?.startDate.toISOString()).toBe('2023-11-14T22:13:20.000Z');
    expect(activity?.endDate.getTime()).toBe(1_700_001_800_000);
  });
});

describe('GarminProviderService.processNotification', () => {
  const account = {
    providerAccountId: 1,
    athleteId: 7,
    status: 'active',
    externalUserId: 'u1',
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresAt: new Date(Date.now() + 3600_000),
    importActivitiesEnabled: true,
    importMetricsEnabled: true,
  } as unknown as ProviderAccount;

  function setup(accounts: ProviderAccount[]) {
    const prisma = {
      providerAccount: {
        findMany: jest.fn().mockResolvedValue(accounts),
        update: jest.fn(),
      },
      athleteMetric: { upsert: jest.fn((args) => args) },
      $transaction: jest.fn(),
    };
    const config = { get: jest.fn() };
    const queue = { addActivityImportJobs: jest.fn() };
    const service = new GarminProviderService(
      prisma as never,
      config as never,
      queue as never,
      {} as never,
    );
    return { service, prisma };
  }

  beforeEach(() => mockedGet.mockReset());

  it('pulls the callback as Garmin built it, with the access token', async () => {
    const { service, prisma } = setup([account]);
    mockedGet.mockResolvedValue({
      data: [{ summaryId: 'd', calendarDate: '2026-10-27', steps: 1000 }],
    });

    await service.processNotification(
      {
        summaryType: 'dailies',
        userId: 'u1',
        callbackURL:
          'https://apis.garmin.com/wellness-api/rest/dailies?uploadStartTimeInSeconds=1&uploadEndTimeInSeconds=2&token=abc',
        entry: {},
      },
      { lastAttempt: false },
    );

    expect(mockedGet).toHaveBeenCalledTimes(1);
    const [url, options] = mockedGet.mock.calls[0];
    expect(url).toContain('token=abc');
    expect(options.headers).toEqual({ Authorization: 'Bearer access' });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('fails the job when Garmin refuses the pull, instead of dropping the data', async () => {
    const { service, prisma } = setup([account]);
    mockedGet.mockRejectedValue(
      Object.assign(new Error('Request failed with status code 400'), {
        isAxiosError: true,
        response: { status: 400, data: { errorMessage: 'bad request' } },
      }),
    );

    await expect(
      service.processNotification(
        {
          summaryType: 'activities',
          userId: 'u1',
          callbackURL:
            'https://apis.garmin.com/wellness-api/rest/activities?token=abc',
          entry: {},
        },
        { lastAttempt: false },
      ),
    ).rejects.toThrow('status code 400');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('answers pings of unknown users without saving anything', async () => {
    const { service, prisma } = setup([]);
    mockedGet.mockResolvedValue({ data: [] });

    await service.processNotification(
      {
        summaryType: 'sleeps',
        userId: 'gone',
        callbackURL: 'https://apis.garmin.com/wellness-api/rest/sleeps?token=t',
        entry: {},
      },
      { lastAttempt: false },
    );

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('saves pushed data without pulling anything', async () => {
    const { service, prisma } = setup([account]);

    await service.processNotification(
      {
        summaryType: 'dailies',
        userId: 'u1',
        entry: { summaryId: 'd', calendarDate: '2026-10-27', steps: 1000 },
      },
      { lastAttempt: false },
    );

    expect(mockedGet).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('drops pushed data of unknown users, with nothing left to answer', async () => {
    const { service, prisma } = setup([]);

    await service.processNotification(
      {
        summaryType: 'dailies',
        userId: 'gone',
        entry: { summaryId: 'd', calendarDate: '2026-10-27', steps: 1000 },
      },
      { lastAttempt: false },
    );

    expect(mockedGet).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuses callback URLs outside Garmin', async () => {
    const { service } = setup([account]);

    await expect(
      service.processNotification(
        {
          summaryType: 'dailies',
          userId: 'u1',
          callbackURL: 'https://evil.example/steal?token=t',
          entry: {},
        },
        { lastAttempt: false },
      ),
    ).rejects.toThrow('Invalid Garmin callbackURL');
    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('advances past a conflicting window when Garmin answers 409', async () => {
    const conflictStart = new Date(Date.now() - 33 * 24 * 3600 * 1000);
    const conflictEnd = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    const garminAccount = {
      ...account,
      scopes: 'permissions:ACTIVITY_EXPORT',
    } as unknown as ProviderAccount;
    const { service } = setup([garminAccount]);

    mockedGet
      .mockRejectedValueOnce(
        Object.assign(new Error('Conflict'), {
          isAxiosError: true,
          response: {
            status: 409,
            data: {
              errorMessage: `[1cf00fd8-6c33-4b7f-8e81-4991aa8473bb]duplicate backfill processed at ${conflictEnd.toISOString()} [${conflictStart.toISOString()} to ${conflictEnd.toISOString()}]`,
            },
          },
        }),
      )
      .mockResolvedValueOnce({ status: 202, data: '' });

    await expect(service.queueFullImport(garminAccount)).resolves.toEqual({
      queuedActivities: 0,
      backfillRequested: true,
    });

    expect(mockedGet).toHaveBeenCalledTimes(2);
    expect(mockedGet.mock.calls[1][1].params.summaryStartTimeInSeconds).toBe(
      Math.floor(conflictEnd.getTime() / 1000),
    );
  });
});
