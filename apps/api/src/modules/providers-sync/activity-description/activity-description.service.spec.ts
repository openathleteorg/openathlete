import { AxiosError, AxiosHeaders } from 'axios';
import { UnrecoverableError } from 'bullmq';

import {
  ConnectorProvider,
  NormalizationFactor,
  SportType,
} from '@openathlete/database';

import { ActivityDescriptionService } from './activity-description.service';

const WRITE_SCOPES = 'read,activity:read_all,activity:write';

const account = (overrides: object = {}) => ({
  providerAccountId: 4,
  provider: ConnectorProvider.STRAVA,
  status: 'active',
  scopes: WRITE_SCOPES,
  activityDescriptionEnabled: true,
  activityDescriptionLanguage: null,
  athlete: { user: { language: 'EN' } },
  ...overrides,
});

const processedRun = {
  eventActivityId: 31,
  sport: SportType.RUNNING,
  distance: 10000,
  movingTime: 3000,
  elevationGain: 120,
  intensitySeconds: [2000, 700, 300],
  decouplingPercent: 4,
  kilojoules: null,
  event: { athleteId: 70, startDate: new Date('2026-11-03T07:00:00Z') },
  weather: { samples: [{ temperatureC: 14, humidityPct: 70 }] },
  normalization: {
    factors: [
      { factor: NormalizationFactor.SLOPE, timeSeconds: 40 },
      { factor: NormalizationFactor.TEMPERATURE, timeSeconds: 12 },
      { factor: NormalizationFactor.ALTITUDE, timeSeconds: 0 },
    ],
  },
  trainingLoadEntries: [{ value: 64 }],
};

function setup({
  providerAccount = account(),
  activity = processedRun as object | null,
  current = 'Legs felt good',
}: {
  providerAccount?: object | null;
  activity?: object | null;
  current?: string;
} = {}) {
  const prisma = {
    providerAccount: {
      findUnique: jest.fn().mockResolvedValue(providerAccount),
      findFirst: jest.fn().mockResolvedValue(providerAccount),
    },
    eventActivity: { findUnique: jest.fn().mockResolvedValue(activity) },
    record: {
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn(),
    },
  };
  const queue = { addStravaDescriptionJob: jest.fn() };
  const strava = {
    getActivityDescription: jest.fn().mockResolvedValue(current),
    updateActivityDescription: jest.fn(),
  };
  const service = new ActivityDescriptionService(
    prisma as never,
    queue as never,
    strava as never,
  );
  return { service, prisma, queue, strava };
}

const job = {
  providerAccountId: 4,
  stravaActivityId: '987654321',
  eventActivityId: 31,
};

const httpError = (status: number) =>
  new AxiosError('refused', String(status), undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  });

describe('ActivityDescriptionService.write', () => {
  it('writes the analysis after the athlete’s own words', async () => {
    const { service, strava } = setup();
    await expect(service.write(job)).resolves.toBe('written');
    const [, id, text] = strava.updateActivityDescription.mock.calls[0];
    expect(id).toBe('987654321');
    expect(text).toMatch(/^Legs felt good\n\n/);
    expect(text).toContain('🌡️ 14 °C');
    expect(text).toContain('⛰️ hills 40 s');
    expect(text).toContain('📈 Training load: 64 TRIMP');
    expect(text).toContain('⚡ Analysis by OpenAthlete · openathlete.org');
  });

  it('writes in the language chosen for the descriptions', async () => {
    const { service, strava } = setup({
      providerAccount: account({ activityDescriptionLanguage: 'IT' }),
    });
    await service.write(job);
    expect(strava.updateActivityDescription.mock.calls[0][2]).toContain(
      'Analisi di OpenAthlete',
    );
  });

  it('writes nothing once turned off, disconnected or without write access', async () => {
    for (const providerAccount of [
      null,
      account({ activityDescriptionEnabled: false }),
      account({ status: 'revoked' }),
      account({ scopes: 'read,activity:read_all' }),
    ]) {
      const { service, strava } = setup({ providerAccount });
      await expect(service.write(job)).resolves.toBe('disabled');
      expect(strava.getActivityDescription).not.toHaveBeenCalled();
    }
  });

  it('leaves an activity with too little to say alone', async () => {
    const { service, strava } = setup({
      activity: {
        ...processedRun,
        sport: SportType.YOGA,
        distance: 0,
        elevationGain: 0,
        intensitySeconds: [],
        decouplingPercent: null,
        weather: null,
        normalization: null,
        trainingLoadEntries: [],
      },
    });
    await expect(service.write(job)).resolves.toBe('nothing-to-say');
    expect(strava.getActivityDescription).not.toHaveBeenCalled();
  });

  it('never writes twice', async () => {
    const { service, strava } = setup({
      current:
        'Legs felt good\n\n✅ Nicely done\n\n⚡ Analysis by OpenAthlete · openathlete.org',
    });
    await expect(service.write(job)).resolves.toBe('already-written');
    expect(strava.updateActivityDescription).not.toHaveBeenCalled();
  });

  it('gives up when Strava refuses for good, retries otherwise', async () => {
    for (const status of [401, 403, 404]) {
      const { service, strava } = setup();
      strava.updateActivityDescription.mockRejectedValue(httpError(status));
      await expect(service.write(job)).rejects.toBeInstanceOf(
        UnrecoverableError,
      );
    }
    const { service, strava } = setup();
    strava.updateActivityDescription.mockRejectedValue(httpError(502));
    await expect(service.write(job)).rejects.not.toBeInstanceOf(
      UnrecoverableError,
    );
  });
});

describe('ActivityDescriptionService.schedule', () => {
  const params = {
    athleteId: 70,
    stravaActivityId: '987654321',
    eventActivityId: 31,
    startDate: new Date(),
    delayMs: 60_000,
  };

  it('queues a recent activity of an athlete who wants it', async () => {
    const { service, queue, prisma } = setup();
    await expect(service.schedule(params)).resolves.toBe(true);
    expect(prisma.providerAccount.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          athleteId: 70,
          provider: ConnectorProvider.STRAVA,
          activityDescriptionEnabled: true,
        }),
      }),
    );
    expect(queue.addStravaDescriptionJob).toHaveBeenCalledWith(
      {
        providerAccountId: 4,
        stravaActivityId: '987654321',
        eventActivityId: 31,
      },
      60_000,
    );
  });

  it('leaves old activities, and athletes without it, alone', async () => {
    const old = setup();
    await expect(
      old.service.schedule({
        ...params,
        startDate: new Date(Date.now() - 8 * 24 * 3600 * 1000),
      }),
    ).resolves.toBe(false);
    expect(old.queue.addStravaDescriptionJob).not.toHaveBeenCalled();

    const off = setup({ providerAccount: null });
    await expect(off.service.schedule(params)).resolves.toBe(false);

    const readOnly = setup({
      providerAccount: account({ scopes: 'read,activity:read_all' }),
    });
    await expect(readOnly.service.schedule(params)).resolves.toBe(false);
    expect(readOnly.queue.addStravaDescriptionJob).not.toHaveBeenCalled();
  });
});

describe('ActivityDescriptionService personal bests', () => {
  it('claims a best only over enough earlier efforts', async () => {
    const { service, prisma } = setup();
    prisma.record.findMany.mockResolvedValue([
      { type: 'SPEED', distance: 5000, duration: null, value: 4 },
      { type: 'SPEED', distance: 10000, duration: null, value: 3.6 },
    ]);
    prisma.record.aggregate
      // 5 km: faster than the 12 before
      .mockResolvedValueOnce({ _max: { value: 3.8 }, _count: 12 })
      // 10 km: only 2 before, too few to call it a record
      .mockResolvedValueOnce({ _max: { value: 3.0 }, _count: 2 });
    const facts = await service.buildFacts(31);
    expect(facts?.personalBests).toEqual([
      { kind: 'distance', distanceM: 5000, timeSec: 1250 },
    ]);
  });
});
