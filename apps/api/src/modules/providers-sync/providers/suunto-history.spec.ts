import axios from 'axios';

import { ConfigService } from '@nestjs/config';

import { ProviderAccount } from '@openathlete/database';
import type { ApiEnvSchemaType } from '@openathlete/shared';

import { ActivityFileParserService } from '../../core/helpers/activity-file-parser.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { SuuntoProviderService } from './suunto.provider.service';

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

const account = {
  providerAccountId: 3,
  athleteId: 9,
  provider: 'SUUNTO',
  status: 'active',
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresAt: new Date(Date.now() + 3600_000),
  importActivitiesEnabled: true,
  importMetricsEnabled: false,
} as unknown as ProviderAccount;

const workout = (key: string, startTime: string) => ({
  workoutKey: key,
  workoutName: `Run ${key}`,
  activityId: 3,
  startTime: new Date(startTime).getTime(),
  totalTime: 1800,
  totalDistance: 5000,
});

function setup() {
  const prisma = {
    // Requests read the account again for its latest token
    providerAccount: { findUnique: jest.fn().mockResolvedValue(account) },
    eventActivity: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const queue = { addActivityImportJobs: jest.fn() };
  const config = { get: () => undefined };
  const service = new SuuntoProviderService(
    prisma as unknown as PrismaService,
    config as unknown as ConfigService<ApiEnvSchemaType, true>,
    queue as unknown as QueueService,
    {} as ActivityFileParserService,
  );
  return { service, queue };
}

describe('SuuntoProviderService.queueFullImport', () => {
  beforeEach(() => mockedGet.mockReset());

  it('lists the whole history, years back, not only the last month', async () => {
    const { service, queue } = setup();
    mockedGet.mockResolvedValue({
      data: {
        error: null,
        payload: [
          workout('recent', '2026-11-10T07:00:00Z'),
          workout('old', '2011-05-01T07:00:00Z'),
        ],
        metadata: {},
      },
    });

    const result = await service.queueFullImport(account);

    expect(mockedGet.mock.calls[0][1].params.since).toBe(0);
    const queued = queue.addActivityImportJobs.mock.calls[0][1];
    expect(queued.map((a: { externalId: string }) => a.externalId)).toEqual([
      'recent',
      'old',
    ]);
    expect(result).toMatchObject({ queuedActivities: 2 });
    expect(result.partial).toBeUndefined();
  });

  it('stops at the months the user asked for, leaving the rest to offer', async () => {
    const { service, queue } = setup();
    mockedGet.mockResolvedValue({
      data: {
        error: null,
        payload: [
          workout('recent', '2026-11-10T07:00:00Z'),
          workout('old', '2011-05-01T07:00:00Z'),
        ],
        metadata: {},
      },
    });
    const since = new Date('2026-08-16T00:00:00Z');

    const result = await service.queueFullImport(account, { since });

    expect(mockedGet.mock.calls[0][1].params.since).toBe(since.getTime());
    const queued = queue.addActivityImportJobs.mock.calls[0][1];
    expect(queued.map((a: { externalId: string }) => a.externalId)).toEqual([
      'recent',
    ]);
    expect(result).toMatchObject({ queuedActivities: 1, partial: true });
  });
});
