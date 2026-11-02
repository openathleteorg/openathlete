import AdmZip from 'adm-zip';
import { Queue } from 'bullmq';

import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Test } from '@nestjs/testing';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { ActivityReviewController } from '../../activity-review/activity-review.controller';
import { ActivityReviewService } from '../../activity-review/activity-review.service';
import {
  COACH_USER_ID,
  DELETED_USER_ID,
  accountFixtureSql,
} from '../../auth/services/account-deletion.fixture';
import { AccountDeletionService } from '../../auth/services/account-deletion.service';
import { AccountExportService } from '../../auth/services/account-export.service';
import { ActivityRecording } from '../../core/helpers/activity-recording';
import { ActivityReconciliationService } from '../../core/services/activity-reconciliation.service';
import { InstanceController } from '../../instance/instance.controller';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import {
  GarminPersonalClient,
  GarminPersonalError,
} from './garmin-personal-client';
import { GarminPersonalController } from './garmin-personal-controller';
import { GarminPersonalService, PersonalJob } from './garmin-personal-service';

jest.mock('@garmin/fitsdk', () => {
  const sdk = process.getBuiltinModule('module').createRequire(__filename)(
    '@garmin/fitsdk',
  );
  class Decoder extends sdk.Decoder {
    read(options: unknown) {
      const result = super.read(options);
      for (const messages of Object.values(result.messages ?? {})) {
        if (!Array.isArray(messages)) continue;
        for (const message of messages)
          for (const [key, value] of Object.entries(message)) {
            if (Object.prototype.toString.call(value) === '[object Date]')
              message[key] = new Date((value as Date).getTime());
          }
      }
      return result;
    }
  }
  return { ...sdk, Decoder };
});

function activityZip(sport = 'cycling', fileType = 'activity') {
  const sdk = process.getBuiltinModule('module').createRequire(__filename)(
    '@garmin/fitsdk',
  );
  const encoder = new sdk.Encoder();
  const start =
    (Date.parse('2020-01-02T09:00:00Z') - Date.UTC(1989, 11, 31)) / 1000;
  encoder.onMesg(0, {
    type: fileType,
    manufacturer: 'development',
    product: 1,
    timeCreated: start,
  });
  for (let i = 0; i < 3; i++)
    encoder.onMesg(20, {
      timestamp: start + i,
      distance: i * 3,
      power: 200,
      heartRate: 120,
    });
  encoder.onMesg(18, {
    startTime: start,
    timestamp: start + 2,
    totalElapsedTime: 2,
    totalTimerTime: 2,
    totalDistance: 6,
    totalAscent: 0,
    sport,
  });
  const zip = new AdmZip();
  zip.addFile('synthetic-ride.fit', Buffer.from(encoder.close()));
  return zip.toBuffer();
}

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl) throw new Error('Use a disposable integration database');
const dto = {
  apiKey: 'synthetic-personal-key',
  activities: true,
  automatic: false,
};
const range = { startDate: '2020-01-01', endDate: '2020-01-28' };

describe('Garmin Personal ownership and sync (PostgreSQL + HTTP)', () => {
  let prisma: PrismaService;
  let service: GarminPersonalService;
  let shared: ActivityReviewService;
  let reconciliation: ActivityReconciliationService;
  let app: INestApplication;
  let origin: string;
  let enabled = true;
  const config = {
    get: (key: string) =>
      key === 'GARMIN_PERSONAL_API_ENABLED' ? enabled : undefined,
    getOrThrow: () => 'test-only-instance-pepper',
  };
  const jobs = new Map<
    string,
    { data: PersonalJob; getState: () => Promise<string> }
  >();
  const queue = {
    getJob: jest.fn(async (id: string) => jobs.get(id)),
    add: jest.fn(async (_name, data, opts) => {
      const job = { data, getState: async () => 'waiting' };
      jobs.set(opts.jobId, job);
      return job;
    }),
  };
  const processing = {
    addActivityProcessingJob: jest.fn().mockResolvedValue({}),
  };
  const client = {
    authorize: jest.fn(),
    get: jest.fn(),
    activities: jest.fn(),
    download: jest.fn(),
  };
  const send = (
    path: string,
    method = 'GET',
    body?: unknown,
    userId = DELETED_USER_ID,
  ) =>
    fetch(origin + '/provider/garmin-personal' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-test-user': String(userId) } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const connection = () =>
    prisma.garminPersonalConnection.findFirstOrThrow({
      where: { athlete: { userId: DELETED_USER_ID } },
    });
  const run = async () => {
    const c = await connection();
    return service.run({ connectionId: c.id, version: c.version, ...range });
  };

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    service = new GarminPersonalService(
      prisma,
      client as unknown as GarminPersonalClient,
      config as unknown as ConfigService<ApiEnvSchemaType, true>,
      queue as unknown as Queue<PersonalJob>,
      processing as unknown as QueueService,
    );
    reconciliation = new ActivityReconciliationService(prisma);
    shared = new ActivityReviewService(
      prisma,
      service,
      reconciliation,
      processing as unknown as QueueService,
    );
    const module = await Test.createTestingModule({
      controllers: [
        GarminPersonalController,
        ActivityReviewController,
        InstanceController,
      ],
      providers: [
        { provide: ConfigService, useValue: config },
        { provide: PrismaService, useValue: prisma },
        { provide: GarminPersonalService, useValue: service },
        { provide: ActivityReviewService, useValue: shared },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          if (!req.headers['x-test-user']) throw new UnauthorizedException();
          req.user = { userId: Number(req.headers['x-test-user']) };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    origin = await app.getUrl();
  });
  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    enabled = true;
    const tables = await prisma.$queryRaw<
      { table_name: string }[]
    >`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((v) => `"${v.table_name}"`).join(',')} RESTART IDENTITY CASCADE`,
    );
    for (const sql of accountFixtureSql) await prisma.$executeRawUnsafe(sql);
    jest.clearAllMocks();
    jobs.clear();
    client.authorize.mockResolvedValue({
      apiKey: dto.apiKey,
      token: 'synthetic-bearer',
      expiresAt: Date.now() + 86400000,
    });
    client.get.mockResolvedValue({ timeZone: 'UTC' });
    client.activities.mockResolvedValue([
      { activityId: '987654', activityName: 'Synthetic ride' },
    ]);
    client.download.mockResolvedValue(activityZip());
    processing.addActivityProcessingJob.mockReset().mockResolvedValue({});
  });
  it('hides the capability and rejects every connection route when disabled', async () => {
    enabled = false;
    const instance = await fetch(origin + '/instance').then((r) => r.json());
    expect(instance.garminPersonalApi).toBe(false);
    for (const [path, method] of [
      ['', 'GET'],
      ['', 'POST'],
      ['', 'PATCH'],
      ['', 'DELETE'],
      ['/sync', 'POST'],
    ]) {
      const response = await send(
        path,
        method,
        method === 'POST' || method === 'PATCH' ? {} : undefined,
      );
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({
        message: 'PROVIDER_NOT_CONFIGURED',
      });
    }
    expect(client.authorize).not.toHaveBeenCalled();
    expect(await prisma.garminPersonalConnection.count()).toBe(0);
  });
  it('advertises the capability only when enabled', async () => {
    expect(
      (await fetch(origin + '/instance').then((r) => r.json()))
        .garminPersonalApi,
    ).toBe(true);
  });
  it('does not claim work when disabled, even for previously queued jobs', async () => {
    await service.connect(DELETED_USER_ID, dto);
    enabled = false;
    await expect(run()).resolves.toBeUndefined();
    expect(client.activities).not.toHaveBeenCalled();
    expect((await connection()).leaseId).toBeNull();
  });
  it('treats a held lease as a no-op without fetching Garmin or changing its owner', async () => {
    await service.connect(DELETED_USER_ID, dto);
    const c = await connection();
    await prisma.garminPersonalConnection.update({
      where: { id: c.id },
      data: {
        leaseId: 'other-worker',
        leaseUntil: new Date(Date.now() + 60000),
        status: 'running',
      },
    });
    await expect(run()).resolves.toBeUndefined();
    expect(client.activities).not.toHaveBeenCalled();
    expect((await connection()).leaseId).toBe('other-worker');
  });
  it('bounds queued work without a worker, unlocks it, and invalidates a lost Redis job', async () => {
    await service.connect(DELETED_USER_ID, dto);
    await service.enqueue(DELETED_USER_ID, range);
    const job = [...jobs.values()][0].data;
    const c = await connection();
    expect((await service.status(DELETED_USER_ID)).activeUntil).not.toBeNull();
    await expect(
      service.preferences(DELETED_USER_ID, {
        activities: false,
        automatic: false,
      }),
    ).rejects.toThrow('sync_in_progress');
    await prisma.garminPersonalConnection.update({
      where: { id: c.id },
      data: { queuedAt: new Date(Date.now() - 6 * 60000) },
    });
    jobs.clear();
    expect(await service.status(DELETED_USER_ID)).toMatchObject({
      status: 'failed',
      error: 'unavailable',
      activeUntil: null,
    });
    await expect(service.run(job)).resolves.toBeUndefined();
    expect(client.activities).not.toHaveBeenCalled();
    await service.enqueue(DELETED_USER_ID, range);
    const replacement = [...jobs.values()][0].data;
    expect(replacement.version).toBeGreaterThan(job.version);
    await expect(service.run(replacement)).resolves.toMatchObject({
      imported: 1,
    });
  });
  it.each(['queued', 'running'] as const)(
    'recovers stale %s directly through PATCH without requiring a status visit',
    async (status) => {
      await service.connect(DELETED_USER_ID, dto);
      const c = await connection();
      await prisma.garminPersonalConnection.update({
        where: { id: c.id },
        data: {
          status,
          queuedAt: new Date(Date.now() - 6 * 60000),
          leaseId: status === 'running' ? 'crashed-worker' : null,
          leaseUntil: status === 'running' ? new Date(Date.now() - 1000) : null,
        },
      });
      const response = await send('', 'PATCH', {
        activities: false,
        automatic: false,
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        status: 'idle',
        activeUntil: null,
        preferences: { activities: false },
      });
      expect((await connection()).version).toBeGreaterThan(c.version);
      expect((await connection()).encryptedCredentials).toBe(
        c.encryptedCredentials,
      );
    },
  );
  it('preserves a live heartbeat when status and preferences are read', async () => {
    await service.connect(DELETED_USER_ID, dto);
    const c = await connection();
    const leaseUntil = new Date(Date.now() + 60000);
    await prisma.garminPersonalConnection.update({
      where: { id: c.id },
      data: { status: 'running', leaseId: 'live-worker', leaseUntil },
    });
    expect(await service.status(DELETED_USER_ID)).toMatchObject({
      status: 'running',
      activeUntil: leaseUntil.toISOString(),
    });
    await expect(
      service.preferences(DELETED_USER_ID, {
        activities: false,
        automatic: false,
      }),
    ).rejects.toThrow('sync_in_progress');
    expect((await connection()).version).toBe(c.version);
  });
  it('prevents an expired worker from writing after recovery and a preference change', async () => {
    await service.connect(DELETED_USER_ID, dto);
    let release: (value: Buffer) => void = () => {};
    let started: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    client.download.mockImplementationOnce(() => {
      started();
      return new Promise<Buffer>((resolve) => {
        release = resolve;
      });
    });
    const running = run();
    await ready;
    const c = await connection();
    await prisma.garminPersonalConnection.update({
      where: { id: c.id },
      data: { leaseUntil: new Date(Date.now() - 1000) },
    });
    try {
      expect(await service.status(DELETED_USER_ID)).toMatchObject({
        status: 'failed',
        activeUntil: null,
      });
      await service.preferences(DELETED_USER_ID, {
        activities: false,
        automatic: false,
      });
    } finally {
      release(activityZip());
    }
    await expect(running).rejects.toMatchObject({ code: 'key_required' });
    expect(await prisma.garminPersonalItem.count()).toBe(0);
    expect(await service.status(DELETED_USER_ID)).toMatchObject({
      status: 'idle',
      error: null,
      preferences: { activities: false },
    });
  });
  it('requires a replacement key after decryption failure and refuses another queued pull', async () => {
    await service.connect(DELETED_USER_ID, dto);
    const c = await connection();
    await prisma.garminPersonalConnection.update({
      where: { id: c.id },
      data: { encryptedCredentials: 'v1:corrupt:credential:value' },
    });
    await expect(run()).rejects.toMatchObject({ code: 'key_required' });
    expect(client.activities).not.toHaveBeenCalled();
    expect(await service.status(DELETED_USER_ID)).toMatchObject({
      status: 'key_required',
      error: 'key_required',
    });
    expect((await connection()).leaseId).toBeNull();
    await expect(service.enqueue(DELETED_USER_ID, range)).rejects.toThrow(
      'key_required',
    );
    await service.connect(DELETED_USER_ID, dto);
    await expect(run()).resolves.toMatchObject({ imported: 1 });
  });
  it('requires authentication, rejects client-selected owners and stores credentials only encrypted', async () => {
    expect((await send('', 'GET', undefined, 0)).status).toBe(401);
    expect((await send('', 'POST', { ...dto, athleteId: 2002 })).status).toBe(
      400,
    );
    expect((await send('', 'POST', dto)).status).toBe(201);
    const stored = await connection();
    expect(stored.encryptedCredentials).not.toContain(dto.apiKey);
    const own = await (await send('')).text();
    expect(own).not.toContain(dto.apiKey);
    expect(own).not.toContain('synthetic-bearer');
    expect(
      await (await send('', 'GET', undefined, COACH_USER_ID)).json(),
    ).toMatchObject({ connected: false });
    expect((await send('/sync', 'POST', range, COACH_USER_ID)).status).toBe(
      400,
    );
    await send('', 'DELETE', undefined, COACH_USER_ID);
    expect((await connection()).encryptedCredentials).toBe(
      stored.encryptedCredentials,
    );
  });
  it('imports a real synthetic FIT once and retries processing after a lost enqueue acknowledgement', async () => {
    await service.connect(DELETED_USER_ID, dto);
    processing.addActivityProcessingJob.mockRejectedValueOnce(
      new Error('Queue unavailable'),
    );
    expect(await run()).toMatchObject({ imported: 1, pending: 1, failed: 0 });
    expect(await run()).toMatchObject({ imported: 0, matched: 1, pending: 0 });
    const records = await prisma.garminPersonalItem.findMany({
      include: { eventActivity: { include: { event: true } } },
    });
    expect(records).toHaveLength(1);
    expect(records[0].eventActivity?.event.athleteId).toBe(2001);
    expect(records[0].eventActivity?.provider).toBe('GARMIN');
    expect(records[0].processingPending).toBe(false);
    expect(client.download).toHaveBeenCalledTimes(1);
  });
  it('isolates receipts and imported activities when two users supply the same Garmin activity ID', async () => {
    await service.connect(DELETED_USER_ID, dto);
    await service.connect(COACH_USER_ID, dto);
    const other = await prisma.garminPersonalConnection.findUniqueOrThrow({
      where: { athleteId: 2002 },
    });
    await run();
    await service.run({
      connectionId: other.id,
      version: other.version,
      ...range,
    });
    const receipts = await prisma.garminPersonalItem.findMany({
      include: { eventActivity: { include: { event: true } } },
    });
    expect(receipts).toHaveLength(2);
    expect(new Set(receipts.map((v) => v.eventActivity?.externalId)).size).toBe(
      2,
    );
    expect(
      receipts.map((v) => v.eventActivity?.event.athleteId).sort(),
    ).toEqual([2001, 2002]);
  });

  it('does not restore an activity deleted locally', async () => {
    await service.connect(DELETED_USER_ID, dto);
    await run();
    const item = await prisma.garminPersonalItem.findFirstOrThrow();
    await prisma.eventActivity.delete({
      where: { eventActivityId: item.eventActivityId! },
    });
    expect(await run()).toMatchObject({ imported: 0, matched: 1 });
    expect(
      (await prisma.garminPersonalItem.findFirstOrThrow()).eventActivityId,
    ).toBeNull();
  });
  it('keeps concurrent sync attempts from creating duplicate activities', async () => {
    await service.connect(DELETED_USER_ID, dto);
    const outcomes = await Promise.allSettled([run(), run()]);
    expect(outcomes.some((v) => v.status === 'fulfilled')).toBe(true);
    expect(await prisma.garminPersonalItem.count()).toBe(1);
  });
  it.each([
    ['multisport', 'activity', 'FIT_MULTISPORT_UNSUPPORTED'],
    ['cycling', 'course', 'FIT_NOT_ACTIVITY'],
  ])(
    'retains unsupported %s/%s files without re-downloading or counting them as matched',
    async (sport, fileType, reason) => {
      client.download.mockResolvedValue(activityZip(sport, fileType));
      await service.connect(DELETED_USER_ID, dto);
      expect(await run()).toMatchObject({
        imported: 0,
        matched: 0,
        failed: 0,
        skipped: 1,
      });
      expect(await run()).toMatchObject({
        imported: 0,
        matched: 0,
        failed: 0,
        skipped: 1,
      });
      expect(client.download).toHaveBeenCalledTimes(1);
      const item = await prisma.garminPersonalItem.findFirstOrThrow();
      expect(item).toMatchObject({
        skipReason: reason,
        eventActivityId: null,
        needsReview: false,
        processingPending: false,
      });
      expect((await connection()).status).toBe('completed');
    },
  );
  it('keeps malformed/truncated archives retryable without a permanent receipt', async () => {
    await service.connect(DELETED_USER_ID, dto);
    client.download
      .mockResolvedValueOnce(Buffer.from('truncated ZIP'))
      .mockResolvedValue(activityZip());
    expect(await run()).toMatchObject({ imported: 0, failed: 1, skipped: 0 });
    expect(await prisma.garminPersonalItem.count()).toBe(0);
    expect(await run()).toMatchObject({ imported: 1, failed: 0, skipped: 0 });
    expect(client.download).toHaveBeenCalledTimes(2);
  });
  it('keeps transient download failures retryable without a permanent receipt', async () => {
    await service.connect(DELETED_USER_ID, dto);
    client.download.mockRejectedValueOnce(
      new GarminPersonalError('unavailable'),
    );
    await expect(run()).rejects.toMatchObject({ code: 'unavailable' });
    expect(await prisma.garminPersonalItem.count()).toBe(0);
    expect(await run()).toMatchObject({ imported: 1 });
  });
  it('continues after a download access denial and permits a later successful retry without replacing the key', async () => {
    await service.connect(DELETED_USER_ID, dto);
    client.activities.mockResolvedValue([
      { activityId: 'denied' },
      { activityId: 'allowed' },
    ]);
    client.download.mockRejectedValueOnce(
      new GarminPersonalError('access_denied'),
    );
    expect(await run()).toMatchObject({ imported: 1, failed: 1, skipped: 0 });
    expect((await connection()).status).toBe('partial');
    expect((await connection()).error).toBeNull();
    expect(
      await prisma.garminPersonalItem.findFirst({
        where: { externalId: 'denied' },
      }),
    ).toBeNull();
    expect(await run()).toMatchObject({ matched: 2, failed: 0 });
    expect(client.authorize).toHaveBeenCalledTimes(1);
    expect(client.download).toHaveBeenCalledTimes(3);
  });
  it('allows an activity write to take longer than the default five-second transaction', async () => {
    await service.connect(DELETED_USER_ID, dto);
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION test_slow_personal_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_sleep(5.2); RETURN NEW; END $$`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER test_slow_personal_insert BEFORE INSERT ON event_activity FOR EACH ROW EXECUTE FUNCTION test_slow_personal_insert()`,
    );
    try {
      expect(await run()).toMatchObject({ imported: 1, failed: 0 });
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER test_slow_personal_insert ON event_activity',
      );
      await prisma.$executeRawUnsafe(
        'DROP FUNCTION test_slow_personal_insert()',
      );
    }
  }, 20000);
  it('rejects preference changes during an active import without aborting it', async () => {
    await service.connect(DELETED_USER_ID, dto);
    const original = await connection();
    let release: (value: Buffer) => void = () => {};
    let started: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    client.download.mockImplementationOnce(() => {
      started();
      return new Promise<Buffer>((resolve) => {
        release = resolve;
      });
    });
    const running = run();
    await ready;
    try {
      const response = await send('', 'PATCH', {
        activities: false,
        automatic: false,
      });
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({
        message: 'sync_in_progress',
      });
      expect((await connection()).version).toBe(original.version);
    } finally {
      release(activityZip());
    }
    await expect(running).resolves.toMatchObject({ imported: 1 });
    await expect(
      service.preferences(DELETED_USER_ID, {
        activities: false,
        automatic: false,
      }),
    ).resolves.toMatchObject({ preferences: { activities: false } });
  });
  it('matches an existing Strava recording without changing edits or training links', async () => {
    await service.connect(DELETED_USER_ID, dto);
    const activity = await prisma.eventActivity.findUniqueOrThrow({
      where: { eventActivityId: 3501 },
    });
    await prisma.event.update({
      where: { eventId: activity.eventId },
      data: {
        name: 'My edited ride',
        startDate: new Date('2020-01-02T09:00:00Z'),
        endDate: new Date('2020-01-02T09:00:02Z'),
      },
    });
    await prisma.eventActivity.update({
      where: { eventActivityId: 3501 },
      data: {
        provider: 'STRAVA',
        sport: 'CYCLING',
        distance: 6,
        movingTime: 2,
      },
    });
    expect(await run()).toMatchObject({ imported: 0, matched: 1 });
    expect(
      (
        await prisma.event.findUniqueOrThrow({
          where: { eventId: activity.eventId },
        })
      ).name,
    ).toBe('My edited ride');
    expect(
      (
        await prisma.eventTraining.findUniqueOrThrow({
          where: { eventTrainingId: 3101 },
        })
      ).relatedActivityId,
    ).toBe(3501);
    expect(
      (await prisma.garminPersonalItem.findFirstOrThrow()).eventActivityId,
    ).toBe(3501);
  });
  it('does not guess when an overlapping activity is incompatible', async () => {
    await service.connect(DELETED_USER_ID, dto);
    await prisma.event.update({
      where: { eventId: 3002 },
      data: {
        startDate: new Date('2020-01-02T09:00:00Z'),
        endDate: new Date('2020-01-02T10:00:00Z'),
      },
    });
    expect(await run()).toMatchObject({ imported: 0, needsReview: 1 });
    expect((await connection()).status).toBe('partial');
  });
  it('stops in-flight imports after disconnect and deletes the key', async () => {
    await service.connect(DELETED_USER_ID, dto);
    let release: (value: Buffer) => void = () => {};
    let started: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    client.download.mockImplementationOnce(() => {
      started();
      return new Promise<Buffer>((resolve) => {
        release = resolve;
      });
    });
    const running = run();
    await ready;
    await service.disconnect(DELETED_USER_ID);
    release(activityZip());
    await expect(running).rejects.toMatchObject({ code: 'key_required' });
    expect(await prisma.garminPersonalItem.count()).toBe(0);
    expect(await service.status(DELETED_USER_ID)).toMatchObject({
      connected: false,
      status: 'disconnected',
    });
  });
  it('replaces an expired token and retries a revoked bearer only once', async () => {
    client.authorize
      .mockResolvedValueOnce({
        apiKey: dto.apiKey,
        token: 'expired-soon',
        expiresAt: 1,
      })
      .mockResolvedValue({
        apiKey: dto.apiKey,
        token: 'renewed',
        expiresAt: Date.now() + 86400000,
      });
    await service.connect(DELETED_USER_ID, dto);
    client.activities
      .mockRejectedValueOnce(new GarminPersonalError('key_required'))
      .mockResolvedValue([]);
    await run();
    expect(client.authorize).toHaveBeenCalledTimes(3);
    expect(client.activities).toHaveBeenCalledTimes(2);
  });
  it('keeps credentials out of exports and cascades personal connection state on account deletion', async () => {
    await service.connect(DELETED_USER_ID, dto);
    await run();
    const chunks: string[] = [];
    await new AccountExportService(prisma).export(
      DELETED_USER_ID,
      { write: (v) => chunks.push(v), end: () => {} },
      { includeStreams: false },
    );
    const exported = chunks.join('');
    expect(exported).not.toContain(dto.apiKey);
    expect(exported).not.toContain('synthetic-bearer');
    expect(exported).not.toContain('encryptedCredentials');
    expect(
      JSON.parse(exported).athlete.garminPersonalConnection.activities,
    ).toBe(true);
    await new AccountDeletionService(prisma, {
      cancelSubscriptionNow: jest.fn(),
    } as never).deleteAccount(DELETED_USER_ID);
    expect(await prisma.garminPersonalConnection.count()).toBe(0);
    expect(await prisma.garminPersonalItem.count()).toBe(0);
    expect(
      await prisma.user.findUnique({ where: { userId: COACH_USER_ID } }),
    ).not.toBeNull();
  });
  it('validates date windows and coalesces repeated sync requests without key material in the queue', async () => {
    await service.connect(DELETED_USER_ID, dto);
    expect(
      (
        await send('/sync', 'POST', {
          startDate: '2020-01-01',
          endDate: '2020-02-28',
        })
      ).status,
    ).toBe(400);
    await service.enqueue(DELETED_USER_ID, range);
    await service.enqueue(DELETED_USER_ID, range);
    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(JSON.stringify([...jobs.values()])).not.toContain(dto.apiKey);
    await expect(
      service.preferences(DELETED_USER_ID, {
        activities: false,
        automatic: false,
      }),
    ).rejects.toThrow('sync_in_progress');
    await run();
    await service.preferences(DELETED_USER_ID, {
      activities: false,
      automatic: false,
    });
    expect((await send('/sync', 'POST', range)).status).toBe(400);
  });
  const pendingReview = async () => {
    await service.connect(DELETED_USER_ID, dto);
    await prisma.event.update({
      where: { eventId: 3002 },
      data: {
        name: 'Edited existing activity',
        startDate: new Date('2020-01-02T09:00:00Z'),
        endDate: new Date('2020-01-02T10:00:00Z'),
      },
    });
    await run();
    return prisma.garminPersonalItem.findFirstOrThrow({
      where: { needsReview: true },
    });
  };
  it('lists owned pending comparisons without credentials and hides them from other users', async () => {
    const item = await pendingReview();
    const page = await (await send('/reviews')).json();
    expect(page.total).toBe(1);
    expect(page.items[0]).toMatchObject({
      id: item.id,
      summary: { sport: 'CYCLING', distance: 6 },
      candidates: [
        {
          eventActivityId: 3501,
          name: 'Edited existing activity',
          sport: 'RUNNING',
        },
      ],
    });
    expect(JSON.stringify(page)).not.toContain(dto.apiKey);
    expect(JSON.stringify(page)).not.toContain('encryptedCredentials');
    expect(
      (await (await send('/reviews', 'GET', undefined, COACH_USER_ID)).json())
        .total,
    ).toBe(0);
    expect(
      (
        await send(
          `/reviews/${item.id}/resolve`,
          'POST',
          { action: 'ignore' },
          COACH_USER_ID,
        )
      ).status,
    ).toBe(404);
    expect(
      (await send(`/reviews/${item.id}/preview`, 'POST', {}, COACH_USER_ID))
        .status,
    ).toBe(404);
    expect((await send('/reviews?cursor=-1')).status).toBe(400);
  });
  it('links explicitly without modifying edits, streams or training links and accepts a lost-ack retry', async () => {
    const item = await pendingReview();
    const before = await prisma.eventActivity.findUniqueOrThrow({
      where: { eventActivityId: 3501 },
      include: { event: true },
    });
    const decision = { action: 'link', eventActivityId: 3501 };
    expect(
      (await send(`/reviews/${item.id}/resolve`, 'POST', decision)).status,
    ).toBe(200);
    expect(
      (await send(`/reviews/${item.id}/resolve`, 'POST', decision)).status,
    ).toBe(200);
    expect(
      (await send(`/reviews/${item.id}/resolve`, 'POST', { action: 'ignore' }))
        .status,
    ).toBe(409);
    expect(
      await prisma.eventActivity.findUniqueOrThrow({
        where: { eventActivityId: 3501 },
        include: { event: true },
      }),
    ).toEqual(before);
    expect(
      (
        await prisma.eventTraining.findUniqueOrThrow({
          where: { eventTrainingId: 3101 },
        })
      ).relatedActivityId,
    ).toBe(3501);
    expect((await service.reviews(DELETED_USER_ID)).total).toBe(0);
    expect(await run()).toMatchObject({ matched: 1, needsReview: 0 });
  });
  it('refuses linking to an activity now owned by another athlete', async () => {
    const item = await pendingReview();
    await prisma.event.update({
      where: { eventId: 3002 },
      data: { athleteId: 2002 },
    });
    expect(
      (
        await send(`/reviews/${item.id}/resolve`, 'POST', {
          action: 'link',
          eventActivityId: 3501,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await prisma.garminPersonalItem.findUniqueOrThrow({
          where: { id: item.id },
        })
      ).needsReview,
    ).toBe(true);
  });
  it('imports separately once and retries scheduling after a lost processing acknowledgement', async () => {
    const item = await pendingReview();
    const before = await prisma.eventActivity.count();
    processing.addActivityProcessingJob.mockRejectedValueOnce(
      new Error('Lost acknowledgement'),
    );
    expect(
      await service.resolveReview(DELETED_USER_ID, item.id, {
        action: 'import',
      }),
    ).toEqual({ resolved: true, pending: true });
    expect(
      await service.resolveReview(DELETED_USER_ID, item.id, {
        action: 'import',
      }),
    ).toEqual({ resolved: true, pending: false });
    expect(await prisma.eventActivity.count()).toBe(before + 1);
    expect(
      (
        await prisma.eventTraining.findUniqueOrThrow({
          where: { eventTrainingId: 3101 },
        })
      ).relatedActivityId,
    ).toBe(3501);
    expect((await service.reviews(DELETED_USER_ID)).total).toBe(0);
    expect(await run()).toMatchObject({
      imported: 0,
      matched: 1,
      needsReview: 0,
    });
  });
  it('serializes concurrent separate-import choices and keeps ignored recordings excluded', async () => {
    const item = await pendingReview();
    const before = await prisma.eventActivity.count();
    await Promise.all([
      service.resolveReview(DELETED_USER_ID, item.id, { action: 'import' }),
      service.resolveReview(DELETED_USER_ID, item.id, { action: 'import' }),
    ]);
    expect(await prisma.eventActivity.count()).toBe(before + 1);
    const c = await connection();
    client.activities.mockResolvedValue([{ activityId: '999999' }]);
    await run();
    const ignored = await prisma.garminPersonalItem.findUniqueOrThrow({
      where: {
        connectionId_externalId: { connectionId: c.id, externalId: '999999' },
      },
    });
    expect(ignored.needsReview).toBe(true);
    await service.resolveReview(DELETED_USER_ID, ignored.id, {
      action: 'ignore',
    });
    await service.resolveReview(DELETED_USER_ID, ignored.id, {
      action: 'ignore',
    });
    expect(await run()).toMatchObject({
      imported: 0,
      matched: 1,
      needsReview: 0,
    });
    expect(await prisma.eventActivity.count()).toBe(before + 1);
  });
  it('loads old review details without importing and respects consent revoked during a download', async () => {
    const item = await pendingReview();
    await prisma.$executeRaw`UPDATE garmin_personal_item SET review_summary = NULL WHERE id = ${item.id}`;
    const before = await prisma.eventActivity.count();
    expect(
      (await service.reviews(DELETED_USER_ID)).items[0].summary,
    ).toBeNull();
    await service.previewReview(DELETED_USER_ID, item.id);
    expect(
      (await service.reviews(DELETED_USER_ID)).items[0].summary?.sport,
    ).toBe('CYCLING');
    expect(await prisma.eventActivity.count()).toBe(before);
    let release!: (value: Buffer) => void;
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    client.download.mockImplementationOnce(
      () =>
        new Promise<Buffer>((resolve) => {
          release = resolve;
          started();
        }),
    );
    const resolving = service.resolveReview(DELETED_USER_ID, item.id, {
      action: 'import',
    });
    const outcome = resolving.catch((error) => error);
    await ready;
    await service.preferences(DELETED_USER_ID, {
      activities: false,
      automatic: false,
    });
    release(activityZip());
    expect(await outcome).toMatchObject({ status: 409 });
    expect(await prisma.eventActivity.count()).toBe(before);
    expect(
      (
        await prisma.garminPersonalItem.findUniqueOrThrow({
          where: { id: item.id },
        })
      ).needsReview,
    ).toBe(true);
  });
  it('paginates pending reviews within the current account', async () => {
    const item = await pendingReview();
    await prisma.garminPersonalItem.createMany({
      data: Array.from({ length: 21 }, (_, i) => ({
        connectionId: item.connectionId,
        externalId: String(100000 + i),
        needsReview: true,
        reviewSummary: item.reviewSummary!,
      })),
    });
    const first = await service.reviews(DELETED_USER_ID);
    const second = await service.reviews(DELETED_USER_ID, first.nextCursor!);
    expect(first.total).toBe(22);
    expect(first.items).toHaveLength(20);
    expect(second.items).toHaveLength(2);
    expect(second.nextCursor).toBeNull();
  });
  it('allows exactly one of two concurrent conflicting review choices', async () => {
    const item = await pendingReview();
    const results = await Promise.allSettled([
      service.resolveReview(DELETED_USER_ID, item.id, {
        action: 'link',
        eventActivityId: 3501,
      }),
      service.resolveReview(DELETED_USER_ID, item.id, { action: 'ignore' }),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const rejected = results.find(
      (result) => result.status === 'rejected',
    ) as PromiseRejectedResult;
    expect(rejected.reason.status).toBe(409);
    expect((await service.reviews(DELETED_USER_ID)).total).toBe(0);
  });

  it('keeps review download access denials retryable without rejecting the saved key', async () => {
    const item = await pendingReview();
    await prisma.$executeRaw`UPDATE garmin_personal_item SET review_summary = NULL WHERE id = ${item.id}`;
    client.download.mockRejectedValueOnce(
      new GarminPersonalError('access_denied'),
    );
    await expect(
      service.previewReview(DELETED_USER_ID, item.id),
    ).rejects.toMatchObject({ message: 'access_denied' });
    expect((await connection()).status).not.toBe('key_required');
    await expect(
      service.previewReview(DELETED_USER_ID, item.id),
    ).resolves.toEqual({ loaded: true });
    expect(client.authorize).toHaveBeenCalledTimes(1);
  });
  it('marks the connection key as rejected only when Garmin actually rejects renewal during review', async () => {
    const item = await pendingReview();
    await prisma.$executeRaw`UPDATE garmin_personal_item SET review_summary = NULL WHERE id = ${item.id}`;
    client.download.mockRejectedValueOnce(
      new GarminPersonalError('key_required'),
    );
    client.authorize.mockRejectedValueOnce(
      new GarminPersonalError('key_required'),
    );
    await expect(
      service.previewReview(DELETED_USER_ID, item.id),
    ).rejects.toMatchObject({ status: 400 });
    expect((await connection()).status).toBe('key_required');
    expect(
      (
        await prisma.garminPersonalItem.findUniqueOrThrow({
          where: { id: item.id },
        })
      ).needsReview,
    ).toBe(true);
  });
  const nativePending = async (
    provider: 'APPLE_HEALTH' | 'STRAVA' = 'APPLE_HEALTH',
    externalId = 'native-review',
  ) => {
    await prisma.event.update({
      where: { eventId: 3002 },
      data: {
        name: 'Edited canonical activity',
        startDate: new Date('2020-01-02T09:00:00Z'),
        endDate: new Date('2020-01-02T10:00:00Z'),
      },
    });
    const recording: ActivityRecording = {
      name: `${provider} recording`,
      startDate: '2020-01-02T09:00:00Z',
      endDate: '2020-01-02T10:00:00Z',
      values: {
        sport: 'RUNNING',
        distance: 20000,
        movingTime: 3600,
        elevationGain: 0,
        averageSpeed: 5,
        maxSpeed: 6,
      },
      stream: { time: [0, 3600], heartrate: [100, 120] },
      original: provider === 'APPLE_HEALTH',
      recordingKind: 'single',
      raw: { privateRaw: 'do-not-send-in-review-list' },
    };
    const result = await reconciliation.reconcile(
      2001,
      provider,
      externalId,
      recording,
      1,
    );
    expect(result.status).toBe('needs_review');
    return { id: result.receiptId, recording, externalId, provider };
  };
  const sharedSend = (
    path = '',
    method = 'GET',
    body?: unknown,
    userId = DELETED_USER_ID,
  ) =>
    fetch(origin + '/activity-import/reviews' + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-test-user': String(userId) } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  it('shares Garmin, Strava and Apple Health comparisons without exposing streams or another athlete’s rows', async () => {
    const personal = await pendingReview();
    await nativePending('APPLE_HEALTH', 'watch-review');
    await nativePending('STRAVA', 'strava-review');
    const page = await (await sharedSend()).json();
    expect(page.total).toBe(3);
    expect(page.counts).toMatchObject({
      GARMIN_PERSONAL: 1,
      APPLE_HEALTH: 1,
      STRAVA: 1,
    });
    expect(
      new Set(page.items.map((item: { id: string }) => item.id)).size,
    ).toBe(3);
    expect(
      page.items.find(
        (item: { provider: string }) => item.provider === 'APPLE_HEALTH',
      ).summary,
    ).toMatchObject({ distance: 20000, sport: 'RUNNING' });
    expect(JSON.stringify(page)).not.toContain('do-not-send-in-review-list');
    expect(JSON.stringify(page)).not.toContain('heartrate');
    expect(
      (await (await sharedSend('', 'GET', undefined, COACH_USER_ID)).json())
        .total,
    ).toBe(0);
    expect((await sharedSend('', 'GET', undefined, 0)).status).toBe(401);
    expect(
      (
        await sharedSend(
          `/garmin-personal:${personal.id}/prepare`,
          'POST',
          {},
          COACH_USER_ID,
        )
      ).status,
    ).toBe(404);
  });
  it('prepares remaining Garmin reviews independently after resolving one, without running another import', async () => {
    const first = await pendingReview();
    await prisma.$executeRaw`UPDATE garmin_personal_item SET review_summary=NULL WHERE id=${first.id}`;
    const second = await prisma.garminPersonalItem.create({
      data: {
        connectionId: first.connectionId,
        externalId: '888888',
        needsReview: true,
      },
    });
    await shared.prepare(DELETED_USER_ID, `garmin-personal:${first.id}`);
    await shared.resolve(DELETED_USER_ID, `garmin-personal:${first.id}`, {
      action: 'ignore',
      revision: 1,
    });
    await shared.prepare(DELETED_USER_ID, `garmin-personal:${second.id}`);
    const page = await shared.list(DELETED_USER_ID);
    expect(page.total).toBe(1);
    expect(page.items[0].summary).not.toBeNull();
    expect(queue.add).not.toHaveBeenCalled();
    await service.disconnect(DELETED_USER_ID);
    const disconnected = await shared.list(DELETED_USER_ID);
    expect(disconnected.total).toBe(1);
    expect(disconnected.items[0].summary).not.toBeNull();
    expect(disconnected.items[0].canImport).toBe(false);
  });
  it('links a native source without modifying edits, streams or training links, including later source revisions', async () => {
    const source = await nativePending();
    const before = await prisma.eventActivity.findUniqueOrThrow({
      where: { eventActivityId: 3501 },
      include: { event: true },
    });
    const decision = {
      action: 'link' as const,
      eventActivityId: 3501,
      revision: 1,
    };
    await shared.resolve(DELETED_USER_ID, `source:${source.id}`, decision);
    await shared.resolve(DELETED_USER_ID, `source:${source.id}`, decision);
    await reconciliation.reconcile(
      2001,
      source.provider,
      source.externalId,
      { ...source.recording, name: 'New provider title' },
      2,
    );
    expect(
      await prisma.eventActivity.findUniqueOrThrow({
        where: { eventActivityId: 3501 },
        include: { event: true },
      }),
    ).toEqual(before);
    expect(
      (
        await prisma.eventTraining.findUniqueOrThrow({
          where: { eventTrainingId: 3101 },
        })
      ).relatedActivityId,
    ).toBe(3501);
    expect((await shared.list(DELETED_USER_ID)).total).toBe(0);
  });
  it('rejects a stale native review and keeps ignored Apple Health recordings suppressed on newer uploads', async () => {
    const source = await nativePending();
    await reconciliation.reconcile(
      2001,
      source.provider,
      source.externalId,
      { ...source.recording, name: 'Updated recording' },
      2,
    );
    expect(
      (
        await sharedSend(`/source:${source.id}/resolve`, 'POST', {
          action: 'ignore',
          revision: 1,
        })
      ).status,
    ).toBe(409);
    await shared.resolve(DELETED_USER_ID, `source:${source.id}`, {
      action: 'ignore',
      revision: 2,
    });
    const next = await reconciliation.reconcile(
      2001,
      source.provider,
      source.externalId,
      { ...source.recording, name: 'Newer recording' },
      3,
    );
    expect(next.status).toBe('unchanged');
    expect(next.activity).toBeNull();
    expect((await shared.list(DELETED_USER_ID)).total).toBe(0);
    await shared.resolve(DELETED_USER_ID, `source:${source.id}`, {
      action: 'ignore',
      revision: 2,
    });
  });
  it('imports a stored Strava recording exactly once under concurrent decisions and retries failed processing dispatch', async () => {
    const source = await nativePending('STRAVA');
    const before = await prisma.eventActivity.count();
    processing.addActivityProcessingJob.mockRejectedValueOnce(
      new Error('queue unavailable'),
    );
    const decision = { action: 'import' as const, revision: 1 };
    await Promise.all([
      shared.resolve(DELETED_USER_ID, `source:${source.id}`, decision),
      shared.resolve(DELETED_USER_ID, `source:${source.id}`, decision),
    ]);
    expect(await prisma.eventActivity.count()).toBe(before + 1);
    await shared.resolve(DELETED_USER_ID, `source:${source.id}`, decision);
    expect(
      (
        await prisma.activitySource.findUniqueOrThrow({
          where: { activitySourceId: source.id },
        })
      ).processingPending,
    ).toBe(false);
    expect(
      processing.addActivityProcessingJob.mock.calls.every(
        (call) => call[3] === `source-${source.id}-1`,
      ),
    ).toBe(true);
    expect(
      (
        await sharedSend(`/source:${source.id}/resolve`, 'POST', {
          action: 'ignore',
          revision: 1,
        })
      ).status,
    ).toBe(409);
  });
  it('rejects foreign sources and link targets and excludes locally deleted canonical sources from review', async () => {
    const source = await nativePending();
    expect(
      (
        await sharedSend(
          `/source:${source.id}/resolve`,
          'POST',
          { action: 'ignore', revision: 1 },
          COACH_USER_ID,
        )
      ).status,
    ).toBe(404);
    await prisma.event.update({
      where: { eventId: 3002 },
      data: { athleteId: 2002 },
    });
    expect(
      (
        await sharedSend(`/source:${source.id}/resolve`, 'POST', {
          action: 'link',
          eventActivityId: 3501,
          revision: 1,
        })
      ).status,
    ).toBe(404);
    const recording = {
      ...source.recording,
      startDate: '2020-02-02T09:00:00Z',
      endDate: '2020-02-02T10:00:00Z',
    };
    const canonical = await reconciliation.reconcile(
      2001,
      'APPLE_HEALTH',
      'deleted-recording',
      recording,
      1,
    );
    await prisma.eventActivity.delete({
      where: { eventActivityId: canonical.activity!.eventActivityId },
    });
    expect((await shared.list(DELETED_USER_ID)).total).toBe(1);
  });
  it.each([20, 21])(
    'paginates a mixed queue with %s Garmin rows across the source boundary',
    async (number) => {
      const personal = await pendingReview();
      await prisma.garminPersonalItem.createMany({
        data: Array.from({ length: number - 1 }, (_, i) => ({
          connectionId: personal.connectionId,
          externalId: String(100000 + i),
          needsReview: true,
          reviewSummary: personal.reviewSummary!,
        })),
      });
      await nativePending();
      const first = await shared.list(DELETED_USER_ID);
      const second = await shared.list(DELETED_USER_ID, first.nextCursor!);
      expect(first.items).toHaveLength(20);
      expect(second.items).toHaveLength(number - 19);
      expect(second.items.at(-1)?.provider).toBe('APPLE_HEALTH');
      expect(second.nextCursor).toBeNull();
      expect(
        new Set([...first.items, ...second.items].map((item) => item.id)).size,
      ).toBe(number + 1);
    },
  );
});
