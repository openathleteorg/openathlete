import axios from 'axios';
import { createHmac } from 'node:crypto';

import { ConfigService } from '@nestjs/config';

import type { ProviderAccount } from '@openathlete/database';
import type { ApiEnvSchemaType } from '@openathlete/shared';

import { ActivityFileParserService } from '../../core/helpers/activity-file-parser.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { ProviderRateLimitError } from '../errors/provider-rate-limit.error';
import { PolarProviderService } from './polar.provider.service';

// The FIT SDK is ESM, which Jest cannot load
jest.mock('../../core/helpers/activity-file-parser.service', () => ({
  ActivityFileParserService: class {},
}));
jest.mock('axios', () => ({
  __esModule: true,
  ...jest.requireActual('axios'),
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const http = jest.mocked(axios);

const WEBHOOK_URL = 'https://api.example.com/provider/polar/webhook';

const account = {
  providerAccountId: 4,
  athleteId: 9,
  provider: 'POLAR',
  status: 'active',
  accessToken: 'token',
  externalUserId: '475',
  importActivitiesEnabled: true,
  importMetricsEnabled: true,
} as ProviderAccount;

/** The sample of Polar's documentation */
const documentedExercise = {
  id: '2AC312F',
  upload_time: '2008-10-13T10:40:02.000Z',
  start_time: '2008-10-13T10:40:02',
  start_time_utc_offset: 180,
  duration: 'PT2H44M',
  calories: 530,
  distance: 1600,
  heart_rate: { average: 129, maximum: 147 },
  sport: 'OTHER',
  detailed_sport_info: 'WATERSPORTS_WATERSKI',
};

function setup(env: Record<string, unknown> = {}, storedSecret?: string) {
  const prisma = {
    providerAccount: {
      findFirst: jest.fn().mockResolvedValue(account),
      findUnique: jest.fn().mockResolvedValue(account),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
    eventActivity: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        eventActivityId: 1,
        eventId: 2,
        externalId: '2AC312F',
      }),
      update: jest.fn(),
    },
    event: { create: jest.fn().mockResolvedValue({ eventId: 2 }) },
    athleteMetric: { upsert: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((run) => run(prisma));
  const queue = {
    addPolarExerciseJob: jest.fn(),
    addPolarMetricsJob: jest.fn(),
    addPolarSyncJob: jest.fn(),
    addActivityImportJobs: jest.fn(),
    getPolarWebhookSecret: jest.fn().mockResolvedValue(storedSecret ?? null),
    setPolarWebhookSecret: jest.fn(),
  };
  const config = { get: (key: string) => env[key] };
  const service = new PolarProviderService(
    prisma as unknown as PrismaService,
    config as unknown as ConfigService<ApiEnvSchemaType, true>,
    queue as unknown as QueueService,
    {} as ActivityFileParserService,
  );
  return { service, prisma, queue };
}

const httpError = (status: number, headers = {}) =>
  Object.assign(new Error(`HTTP ${status}`), {
    isAxiosError: true,
    response: { status, headers, data: {} },
  });

const sign = (body: Buffer, secret: string) =>
  createHmac('sha256', secret).update(body).digest('hex');

beforeEach(() => jest.resetAllMocks());

describe('PolarProviderService webhooks', () => {
  // Spaced as Polar's examples: re-serializing the parsed body would differ
  const body = Buffer.from(
    '{\n  "event": "EXERCISE", "user_id": 475, "entity_id": "aQlC83",\n  "timestamp": "2018-05-15T14:22:24Z"\n}',
  );
  const payload = JSON.parse(body.toString());

  it('answers the creation ping before any key exists', async () => {
    const { service } = setup();
    await expect(
      service.handleWebhook({
        event: 'PING',
        timestamp: '2019-01-11T08:25:10.02Z',
      }),
    ).resolves.toBeUndefined();
  });

  it('queues a signed exercise, verified over the raw bytes', async () => {
    const { service, queue } = setup({ POLAR_WEBHOOK_SECRET_KEY: 'secret' });
    await service.handleWebhook(payload, body, sign(body, 'secret'));
    expect(queue.addPolarExerciseJob).toHaveBeenCalledWith(4, 'aQlC83');
    expect(http.get).not.toHaveBeenCalled();
  });

  it('accepts the key of a webhook the instance created', async () => {
    const { service, queue } = setup(
      { POLAR_WEBHOOK_SECRET_KEY: 'stale' },
      'created',
    );
    await service.handleWebhook(payload, body, sign(body, 'created'));
    expect(queue.addPolarExerciseJob).toHaveBeenCalled();
  });

  it.each([
    ['a wrong signature', 'ab'.repeat(32)],
    ['a short signature', 'ab'],
    ['no signature', undefined],
  ])('refuses %s', async (_, signature) => {
    const { service, queue } = setup({ POLAR_WEBHOOK_SECRET_KEY: 'secret' });
    await expect(
      service.handleWebhook(payload, body, signature),
    ).rejects.toThrow('Invalid webhook signature');
    expect(queue.addPolarExerciseJob).not.toHaveBeenCalled();
  });

  it('refuses everything but pings without a key', async () => {
    const { service } = setup();
    await expect(
      service.handleWebhook(payload, body, sign(body, 'secret')),
    ).rejects.toThrow('Invalid webhook signature');
  });

  it('queues a metrics sync for daily events', async () => {
    const { service, queue } = setup({ POLAR_WEBHOOK_SECRET_KEY: 'secret' });
    const sleep = Buffer.from('{"event":"SLEEP","user_id":475}');
    await service.handleWebhook(
      JSON.parse(sleep.toString()),
      sleep,
      sign(sleep, 'secret'),
    );
    expect(queue.addPolarMetricsJob).toHaveBeenCalledWith(4);
  });
});

describe('PolarProviderService.ensureWebhook', () => {
  const env = {
    POLAR_WEBHOOK_URL: WEBHOOK_URL,
    POLAR_CLIENT_ID: 'id',
    POLAR_CLIENT_SECRET: 'secret',
  };
  const events = [
    'EXERCISE',
    'SLEEP',
    'ACTIVITY_SUMMARY',
    'PHYSICAL_INFORMATION',
  ];

  it('creates it with events Polar accepts and keeps the key', async () => {
    const { service, queue } = setup(env);
    http.get.mockResolvedValue({ data: { data: [] } });
    http.post.mockResolvedValue({
      data: { data: { id: 'abdf33', signature_secret_key: 'key' } },
    });

    await service.ensureWebhook();

    expect(http.post).toHaveBeenCalledWith(
      'https://www.polaraccesslink.com/v3/webhooks',
      { events, url: WEBHOOK_URL },
      expect.anything(),
    );
    expect(queue.setPolarWebhookSecret).toHaveBeenCalledWith('key');
  });

  it('reactivates a webhook Polar turned off', async () => {
    const { service } = setup(env, 'key');
    http.get.mockResolvedValue({
      data: {
        data: [{ id: 'abdf33', events, url: WEBHOOK_URL, active: false }],
      },
    });
    await service.ensureWebhook();
    expect(http.post).toHaveBeenCalledWith(
      'https://www.polaraccesslink.com/v3/webhooks/activate',
      null,
      expect.anything(),
    );
    expect(http.patch).not.toHaveBeenCalled();
  });

  it('updates a webhook pointing elsewhere', async () => {
    const { service } = setup(env, 'key');
    http.get.mockResolvedValue({
      data: {
        data: [{ id: 'abdf33', events, url: 'https://old', active: true }],
      },
    });
    await service.ensureWebhook();
    expect(http.patch).toHaveBeenCalledWith(
      'https://www.polaraccesslink.com/v3/webhooks/abdf33',
      { events, url: WEBHOOK_URL },
      expect.anything(),
    );
  });

  it('recreates a webhook whose key is lost', async () => {
    const { service, queue } = setup(env);
    http.get.mockResolvedValue({
      data: {
        data: [{ id: 'abdf33', events, url: WEBHOOK_URL, active: true }],
      },
    });
    http.post.mockResolvedValue({
      data: { data: { id: 'new', signature_secret_key: 'fresh' } },
    });
    await service.ensureWebhook();
    expect(http.delete).toHaveBeenCalled();
    expect(queue.setPolarWebhookSecret).toHaveBeenCalledWith('fresh');
  });

  it('leaves a healthy webhook alone', async () => {
    const { service } = setup(env, 'key');
    http.get.mockResolvedValue({
      data: {
        data: [
          { id: 'abdf33', events: [...events].reverse(), url: WEBHOOK_URL },
        ],
      },
    });
    await service.ensureWebhook();
    expect(http.post).not.toHaveBeenCalled();
    expect(http.patch).not.toHaveBeenCalled();
  });

  it('does not call Polar for an instance it cannot reach', async () => {
    const { service } = setup({ APP_URL: 'http://localhost:5173' });
    await service.ensureWebhook();
    expect(http.get).not.toHaveBeenCalled();
  });

  it('never throws: the connection and the sync go on', async () => {
    const { service } = setup(env);
    http.get.mockRejectedValue(httpError(500));
    await expect(service.ensureWebhook()).resolves.toBeUndefined();
  });
});

describe('PolarProviderService.registerUser', () => {
  it('returns the id of a new user', async () => {
    const { service } = setup();
    http.post.mockResolvedValue({
      status: 200,
      data: { 'polar-user-id': 2278512 },
    });
    await expect(service.registerUser('token', 1, 99)).resolves.toBe(2278512);
  });

  it('falls back on the token id for an already registered user', async () => {
    const { service } = setup();
    http.post.mockResolvedValue({ status: 409, data: '' });
    await expect(service.registerUser('token', 1, 99)).resolves.toBe(99);
  });

  it('reports missing consents', async () => {
    const { service } = setup();
    http.post.mockResolvedValue({ status: 403, data: '' });
    await expect(service.registerUser('token', 1, 99)).rejects.toThrow(
      'POLAR_CONSENT_REQUIRED',
    );
  });
});

describe('PolarProviderService import', () => {
  it('maps the documented exercise', async () => {
    const { service } = setup();
    http.get.mockResolvedValue({ status: 200, data: [documentedExercise] });

    const [activity] = await service.importActivities(account);

    expect(http.get).toHaveBeenCalledWith(
      'https://www.polaraccesslink.com/v3/exercises',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token' }),
      }),
    );
    expect(activity).toMatchObject({
      externalId: '2AC312F',
      duration: 9840,
      distance: 1600,
    });
    expect(activity.startDate.toISOString()).toBe('2008-10-13T07:40:02.000Z');
    expect(activity.endDate.toISOString()).toBe('2008-10-13T10:24:02.000Z');
  });

  it('syncs only the exercises not saved yet', async () => {
    const { service, prisma, queue } = setup();
    http.get.mockResolvedValue({
      status: 200,
      data: [documentedExercise, { ...documentedExercise, id: 'known' }],
    });
    prisma.eventActivity.findMany.mockResolvedValue([{ externalId: 'known' }]);

    await service.syncAccount(4);

    const [, activities] = queue.addActivityImportJobs.mock.calls[0];
    expect(activities.map((a: { externalId: string }) => a.externalId)).toEqual(
      ['2AC312F'],
    );
  });

  it('saves the session even without its file', async () => {
    const { service, prisma } = setup();
    http.get.mockResolvedValueOnce({ status: 200, data: [documentedExercise] });
    const [activity] = await service.importActivities(account);
    http.get.mockRejectedValue(httpError(404));

    const result = await service.importActivity(
      account,
      // As it comes back from the queue
      JSON.parse(JSON.stringify(activity)),
    );

    expect(result.created).toBe(true);
    expect(prisma.event.create.mock.calls[0][0].data.startDate).toEqual(
      new Date('2008-10-13T07:40:02.000Z'),
    );
    expect(prisma.eventActivity.create.mock.calls[0][0].data).toMatchObject({
      externalId: '2AC312F',
      movingTime: 9840,
      // 530 kcal
      kilojoules: 2217.5,
      averageHeartrate: 129,
      maxHeartrate: 147,
    });
    expect(prisma.eventActivity.update).not.toHaveBeenCalled();
  });

  it('does not import an exercise twice', async () => {
    const { service, prisma } = setup();
    prisma.eventActivity.findFirst.mockResolvedValue({ eventActivityId: 1 });
    const result = await service.importActivity(account, {
      externalId: '2AC312F',
      name: 'Run',
      startDate: new Date(),
      endDate: new Date(),
      sport: 'RUNNING',
      raw: documentedExercise,
    });
    expect(result.created).toBe(false);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('marks an account revoked when Polar refuses its token', async () => {
    const { service, prisma } = setup();
    http.get.mockRejectedValue(httpError(401));
    await expect(service.importActivities(account)).rejects.toThrow();
    expect(prisma.providerAccount.update).toHaveBeenCalledWith({
      where: { providerAccountId: 4 },
      data: { status: 'revoked' },
    });
  });

  it('waits for the short-term quota on a 429', async () => {
    const { service } = setup();
    http.get.mockRejectedValue(
      httpError(429, { 'ratelimit-reset': '120,3600' }),
    );
    await expect(service.importActivities(account)).rejects.toMatchObject({
      name: ProviderRateLimitError.name,
      retryAfterMs: 120_000,
    });
  });
});

describe('PolarProviderService metrics', () => {
  it('reads each current endpoint, skipping an empty one', async () => {
    const { service, prisma } = setup();
    http.get.mockImplementation((url: string) => {
      if (url.endsWith('/users/activities')) {
        return Promise.resolve({ status: 204, data: '' });
      }
      if (url.endsWith('/users/sleep')) {
        return Promise.resolve({
          status: 200,
          data: { nights: [{ date: '2020-01-01', sleep_score: 80 }] },
        });
      }
      if (url.endsWith('/users/nightly-recharge')) {
        return Promise.reject(httpError(500));
      }
      return Promise.resolve({ status: 200, data: { weight: 70 } });
    });

    await service.syncAccountMetrics(4);

    expect(prisma.athleteMetric.upsert).toHaveBeenCalledTimes(2);
  });

  it('retries when every endpoint fails', async () => {
    const { service } = setup();
    http.get.mockRejectedValue(httpError(500));
    await expect(service.syncAccountMetrics(4)).rejects.toThrow('HTTP 500');
  });
});

describe('PolarProviderService schedule', () => {
  it('runs on the importing container only', async () => {
    const { service, prisma } = setup({ ENABLE_ACTIVITY_IMPORT: false });
    await service.queueHourlySync();
    expect(prisma.providerAccount.findMany).not.toHaveBeenCalled();
  });

  it('queues a sync per account', async () => {
    const { service, prisma, queue } = setup({
      ENABLE_ACTIVITY_IMPORT: true,
      POLAR_CLIENT_ID: 'id',
    });
    prisma.providerAccount.findMany.mockResolvedValue([
      { providerAccountId: 1 },
      { providerAccountId: 2 },
    ]);
    await service.queueHourlySync();
    expect(queue.addPolarSyncJob).toHaveBeenCalledTimes(2);
  });
});
