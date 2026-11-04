import axios from 'axios';

import { ConfigService } from '@nestjs/config';

import { ConnectorProvider, ProviderAccount } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { ActivityFileParserService } from '../../core/helpers/activity-file-parser.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { GarminProviderService } from './garmin.provider.service';

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    __esModule: true,
    ...actual,
    default: { ...actual, get: jest.fn(), delete: jest.fn() },
  };
});

jest.mock('@garmin/fitsdk', () => {
  const sdk = process.getBuiltinModule('module').createRequire(__filename)(
    '@garmin/fitsdk',
  );
  class Decoder extends sdk.Decoder {
    read(options: unknown) {
      const result = super.read(options);
      for (const messages of Object.values(result.messages ?? {})) {
        if (!Array.isArray(messages)) continue;
        for (const message of messages) {
          for (const [key, value] of Object.entries(message)) {
            if (Object.prototype.toString.call(value) === '[object Date]') {
              message[key] = new Date((value as Date).getTime());
            }
          }
        }
      }
      return result;
    }
  }
  return { ...sdk, Decoder };
});

const sdk = process.getBuiltinModule('module').createRequire(__filename)(
  '@garmin/fitsdk',
);

function buildFitBuffer(workoutRpe?: number): ArrayBuffer {
  const encoder = new sdk.Encoder();
  const start =
    (Date.parse('2026-11-03T09:00:00Z') - Date.UTC(1989, 11, 31)) / 1000;
  encoder.onMesg(0, {
    type: 'activity',
    manufacturer: 'garmin',
    product: 1,
    timeCreated: start,
  });
  for (let i = 0; i < 3; i++) {
    encoder.onMesg(20, {
      timestamp: start + i,
      distance: i * 4,
      heartRate: 140 + i,
    });
  }
  encoder.onMesg(18, {
    startTime: start,
    timestamp: start + 2,
    totalElapsedTime: 2,
    totalTimerTime: 2,
    totalDistance: 8,
    sport: 'running',
    ...(workoutRpe !== undefined ? { workoutRpe } : {}),
  });
  return Uint8Array.from(encoder.close()).buffer;
}

const mockedGet = axios.get as jest.Mock;

const activeAccount = {
  providerAccountId: 10,
  athleteId: 4,
  provider: ConnectorProvider.GARMIN,
  externalUserId: 'garmin-user-1',
  accessToken: 'valid-token',
  refreshToken: 'refresh-token',
  expiresAt: new Date(Date.now() + 3_600_000),
  status: 'active',
  importActivitiesEnabled: true,
  importMetricsEnabled: true,
} as unknown as ProviderAccount;

function setup(existingRpe: number | null = null) {
  const activityRecord = {
    eventActivityId: 55,
    eventId: 44,
    externalId: '123456',
    provider: ConnectorProvider.GARMIN,
    rpe: existingRpe,
  };

  const prisma = {
    providerAccount: {
      findMany: jest.fn().mockResolvedValue([activeAccount]),
    },
    eventActivity: {
      findFirst: jest.fn().mockResolvedValue(activityRecord),
      findUnique: jest.fn().mockResolvedValue({ corrections: null }),
      update: jest.fn().mockImplementation(async ({ data }) => ({
        ...activityRecord,
        ...data,
      })),
    },
    $transaction: jest.fn().mockImplementation(async (cb) => cb(prisma)),
  };

  const config = {
    get: jest.fn().mockReturnValue(''),
  };

  const queue = {
    addActivityProcessingJob: jest.fn().mockResolvedValue(undefined),
  };

  const service = new GarminProviderService(
    prisma as unknown as PrismaService,
    config as unknown as ConfigService<ApiEnvSchemaType, true>,
    queue as unknown as QueueService,
    new ActivityFileParserService(),
  );

  return { prisma, queue, service };
}

describe('GarminProviderService watch RPE import', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('sets activity RPE from the Garmin FIT file', async () => {
    const { prisma, queue, service } = setup(null);
    mockedGet.mockResolvedValue({ data: buildFitBuffer(70) });

    await service.processNotification(
      {
        summaryType: 'activityFiles',
        userId: 'garmin-user-1',
        callbackURL:
          'https://apis.garmin.com/wellness-api/rest/activityFile?id=1&token=t',
        entry: {
          fileType: 'FIT',
          activityId: 123456,
        },
      },
      { lastAttempt: false },
    );

    expect(prisma.eventActivity.update).toHaveBeenCalledWith({
      where: { eventActivityId: 55 },
      data: expect.objectContaining({
        rpe: 0.7,
      }),
    });
    expect(queue.addActivityProcessingJob).toHaveBeenCalledWith(55, 44);
  });

  it('keeps an existing RPE on the activity', async () => {
    const { prisma, service } = setup(0.4);
    mockedGet.mockResolvedValue({ data: buildFitBuffer(80) });

    await service.processNotification(
      {
        summaryType: 'activityFiles',
        userId: 'garmin-user-1',
        callbackURL:
          'https://apis.garmin.com/wellness-api/rest/activityFile?id=1&token=t',
        entry: {
          fileType: 'FIT',
          activityId: 123456,
        },
      },
      { lastAttempt: false },
    );

    const updateData = prisma.eventActivity.update.mock.calls[0][0].data;
    expect(updateData.rpe).toBeUndefined();
  });
});
