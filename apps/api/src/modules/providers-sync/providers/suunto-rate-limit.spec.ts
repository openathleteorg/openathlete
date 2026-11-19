import axios, { AxiosError, AxiosHeaders } from 'axios';

import { ConfigService } from '@nestjs/config';

import { ProviderAccount } from '@openathlete/database';
import type { ApiEnvSchemaType } from '@openathlete/shared';

import { ActivityFileParserService } from '../../core/helpers/activity-file-parser.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { ImportedActivity } from '../base/provider-import.interface';
import { ProviderRateLimitError } from '../errors/provider-rate-limit.error';
import {
  SuuntoProviderService,
  suuntoRateLimitDelayMs,
} from './suunto.provider.service';

// The FIT SDK is ESM, which Jest cannot load
jest.mock('../../core/helpers/activity-file-parser.service', () => ({
  ActivityFileParserService: class {},
}));

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    __esModule: true,
    ...actual,
    default: { ...actual, get: jest.fn(), post: jest.fn() },
  };
});

const mockedGet = axios.get as jest.Mock;
const mockedPost = axios.post as jest.Mock;

/** What Suunto's gateway answers once the quota is spent, seen in production */
function refusal(
  status: number,
  data: unknown,
  headers: Record<string, string> = {},
) {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, null, {
    status,
    statusText: 'General auth Error',
    headers: new AxiosHeaders(headers),
    config: { headers: new AxiosHeaders() },
    data,
  });
}

const rateLimitBody = Buffer.from(
  'Rate limit is exceeded (RateLimitExceeded)\nAPIM Url: https://cloudapi.suunto.com/v3/workouts/abc/fit',
);

describe('suuntoRateLimitDelayMs', () => {
  it('reads a 401 whose body says the rate limit is exceeded as a quota refusal', () => {
    expect(suuntoRateLimitDelayMs(refusal(401, rateLimitBody))).toBe(60_000);
  });

  it('follows Retry-After, then the delay given in the body', () => {
    expect(
      suuntoRateLimitDelayMs(refusal(429, '', { 'retry-after': '12' })),
    ).toBe(12_000);
    expect(
      suuntoRateLimitDelayMs(
        refusal(429, {
          message: 'Rate limit is exceeded. Try again in 30 seconds.',
        }),
      ),
    ).toBe(30_000);
  });

  it('leaves a real auth failure to the token refresh', () => {
    expect(
      suuntoRateLimitDelayMs(refusal(401, { message: 'Invalid token' })),
    ).toBeNull();
    expect(suuntoRateLimitDelayMs(new Error('network'))).toBeNull();
  });
});

describe('SuuntoProviderService.importActivity', () => {
  const account = {
    providerAccountId: 3,
    athleteId: 9,
    provider: 'SUUNTO',
    status: 'active',
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresAt: new Date(Date.now() + 3600_000),
    importActivitiesEnabled: true,
  } as unknown as ProviderAccount;

  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
  });

  it('waits for the quota instead of refreshing the token and dropping the file', async () => {
    const prisma = {
      providerAccount: { findUnique: jest.fn().mockResolvedValue(account) },
      // Saved before, without streams: only the FIT file is fetched
      eventActivity: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ eventActivityId: 5, stream: {} }),
      },
    };
    const service = new SuuntoProviderService(
      prisma as unknown as PrismaService,
      { get: () => undefined } as unknown as ConfigService<
        ApiEnvSchemaType,
        true
      >,
      {} as QueueService,
      {} as ActivityFileParserService,
    );
    mockedGet.mockRejectedValue(refusal(401, rateLimitBody));

    const activity = {
      externalId: 'abc',
      raw: { workoutKey: 'abc' },
    } as unknown as ImportedActivity;

    await expect(service.importActivity(account, activity)).rejects.toThrow(
      ProviderRateLimitError,
    );
    expect(mockedPost).not.toHaveBeenCalled();
  });
});
