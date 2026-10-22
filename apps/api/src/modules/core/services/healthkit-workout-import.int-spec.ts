import { sign } from 'jsonwebtoken';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';

import { PassportModule } from '@nestjs/passport';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

import { ConnectorProvider, Prisma } from '@openathlete/database';
import {
  CompressedActivityStream,
  importHealthkitWorkoutDtoSchema,
} from '@openathlete/shared';

import { configureBodyParsers } from '../../../common/http/body-parsers';
import { AuthUser } from '../../auth/decorators/user.decorator';
import { AuthService } from '../../auth/services/auth.service';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { HealthkitWorkoutImportController } from '../controllers/healthkit-workout-import.controller';
import {
  ActivityRecording,
  healthkitRecording,
} from '../helpers/activity-recording';
import { uncompressActivityStream } from '../helpers/activity-stream';
import { ActivityReconciliationService } from './activity-reconciliation.service';
import { HealthkitWorkoutImportService } from './healthkit-workout-import.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable database',
  );
const SECRET = 'disposable-workout-test-secret';
const UUID = '11111111-1111-4111-8111-111111111111';
const payload = () => ({
  protocolVersion: 1,
  workoutUuid: UUID,
  revision: 1,
  name: 'Watch run',
  sport: 'RUNNING',
  startDate: '2026-10-20T08:00:00Z',
  endDate: '2026-10-20T09:00:00Z',
  elapsedDuration: { value: 3600, unit: 's' },
  activeDuration: { value: 3500, unit: 's' },
  distance: { value: 10000, unit: 'm' },
  energy: { value: 1800, unit: 'kJ' },
  source: {
    bundleIdentifier: 'com.apple.health',
    name: 'Apple Watch',
    original: true,
  },
  streams: {
    heartrate: {
      unit: 'bpm',
      samples: [0, 1, 2].map((i) => ({
        timestamp: new Date(
          Date.parse('2026-10-20T08:00:00Z') + i * 1000,
        ).toISOString(),
        value: 120 + i,
      })),
    },
  },
});

describe('HealthKit workouts and cross-provider reconciliation (HTTP/PostgreSQL)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let reconciliation: ActivityReconciliationService;
  let owner: AuthUser;
  let other: AuthUser;
  let coach: AuthUser;
  const queue = {
    addActivityProcessingJob: jest.fn().mockResolvedValue(undefined),
  };
  const emails = [
    'workout-owner@example.test',
    'workout-other@example.test',
    'workout-coach@example.test',
  ];

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [HealthkitWorkoutImportController],
      providers: [
        HealthkitWorkoutImportService,
        ActivityReconciliationService,
        { provide: PrismaService, useValue: prisma },
        { provide: QueueService, useValue: queue },
        {
          provide: JwtStrategy,
          useFactory: () =>
            new JwtStrategy(
              { getOrThrow: () => SECRET } as never,
              {
                validateUser: async (jwt: { userId: number }) =>
                  prisma.user.findUnique({
                    where: { userId: jwt.userId },
                    include: { athlete: true },
                  }),
              } as unknown as AuthService,
            ),
        },
      ],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>({
      rawBody: true,
    });
    configureBodyParsers(app);
    await app.init();
    reconciliation = module.get(ActivityReconciliationService);
  });

  async function cleanup() {
    const where = { athlete: { user: { email: { in: emails } } } };
    await prisma.activitySource.deleteMany({ where });
    await prisma.eventTraining.deleteMany({ where: { event: where } });
    await prisma.eventActivity.deleteMany({ where: { event: where } });
    await prisma.event.deleteMany({ where });
    await prisma.athlete.deleteMany({
      where: { user: { email: { in: emails } } },
    });
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
  }
  afterAll(async () => {
    await cleanup();
    await app.close();
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    await cleanup();
    queue.addActivityProcessingJob.mockReset().mockResolvedValue(undefined);
    const create = (email: string, athlete: boolean) =>
      prisma.user.create({
        data: {
          email,
          password: 'unused-test-hash',
          firstName: 'Test',
          lastName: 'Athlete',
          roles: athlete ? ['ATHLETE'] : ['COACH'],
          ...(athlete ? { athlete: { create: {} } } : {}),
        },
        include: { athlete: true },
      });
    owner = await create(emails[0], true);
    other = await create(emails[1], true);
    coach = await create(emails[2], false);
  });
  const post = (body: object = payload(), user = owner) =>
    request(app.getHttpServer())
      .post('/activity-import/healthkit')
      .auth(sign({ userId: user.userId }, SECRET), { type: 'bearer' })
      .send(body);
  const recording = (): ActivityRecording =>
    healthkitRecording(importHealthkitWorkoutDtoSchema.parse(payload()));
  const provider = (kind: ConnectorProvider, id: string, value = recording()) =>
    reconciliation.reconcile(owner.athlete!.athleteId, kind, id, {
      ...value,
      original: kind !== 'STRAVA',
    });

  it('authenticates, derives ownership from the session and rejects target accounts', async () => {
    await request(app.getHttpServer())
      .post('/activity-import/healthkit')
      .send(payload())
      .expect(401);
    await post(payload(), coach).expect(403);
    await post({ ...payload(), athleteId: other.athlete!.athleteId }).expect(
      400,
    );
    await post({ ...payload(), distance: { value: 10, unit: 'km' } }).expect(
      400,
    );
    expect(
      await prisma.eventActivity.count({
        where: { event: { athleteId: owner.athlete!.athleteId } },
      }),
    ).toBe(0);
  });

  it('creates one activity, retains raw events/source metadata, queues processing and acknowledges exact retries', async () => {
    const body = {
      ...payload(),
      events: [
        { type: 'PAUSE', timestamp: '2026-10-20T08:20:00Z' },
        { type: 'RESUME', timestamp: '2026-10-20T08:21:40Z' },
      ],
      laps: [
        {
          startDate: payload().startDate,
          endDate: payload().endDate,
          name: 'Lap 1',
        },
      ],
    };
    const first = (await post(body).expect(201)).body;
    expect(first).toMatchObject({
      status: 'created',
      revision: 1,
      processing: 'queued',
    });
    expect(queue.addActivityProcessingJob).toHaveBeenCalledWith(
      first.eventActivityId,
      first.eventId,
      true,
      `source-${first.receiptId}-1`,
    );
    const retry = (await post(body).expect(201)).body;
    expect(retry).toMatchObject({
      status: 'unchanged',
      receiptId: first.receiptId,
      eventActivityId: first.eventActivityId,
      processing: 'not_required',
    });
    expect(queue.addActivityProcessingJob).toHaveBeenCalledTimes(1);
    const source = await prisma.activitySource.findUniqueOrThrow({
      where: { activitySourceId: first.receiptId },
      include: { observations: true },
    });
    expect((source.payload as unknown as ActivityRecording).raw).toMatchObject({
      workoutUuid: UUID,
      events: body.events,
      source: body.source,
    });
    expect(source.observations).toHaveLength(1);
    expect(
      await prisma.activitySegment.count({
        where: { eventActivityId: first.eventActivityId },
      }),
    ).toBe(1);
  });

  it('scopes identical source IDs to different athletes and providers', async () => {
    const first = (await post().expect(201)).body;
    const second = (await post(payload(), other).expect(201)).body;
    expect(first.eventActivityId).not.toBe(second.eventActivityId);
    const differentTime = {
      ...recording(),
      startDate: '2026-10-20T10:00:00Z',
      endDate: '2026-10-20T11:00:00Z',
    };
    const third = await provider('STRAVA', UUID, differentTime);
    expect(third.created).toBe(true);
  });

  it('accepts the iOS mapper fixture and resolves a lost acknowledgement to the same durable activity', async () => {
    const contract = JSON.parse(
      readFileSync(
        join(
          __dirname,
          '../../../../../../libs/shared/test-fixtures/healthkit-workout-v1.json',
        ),
        'utf8',
      ),
    );
    // Commit the first upload, then deliberately discard its response as a
    // client would when the acknowledgement is lost in transit.
    await post(contract).expect(201);
    const stored = await reconciliation.findSource(
      owner.athlete!.athleteId,
      'APPLE_HEALTH',
      contract.workoutUuid,
    );
    const replay = (
      await post(JSON.parse(JSON.stringify(contract))).expect(201)
    ).body;
    expect(replay).toMatchObject({
      status: 'unchanged',
      receiptId: stored!.activitySourceId,
      revision: contract.revision,
      eventActivityId: stored!.eventActivityId,
      processing: 'not_required',
    });
    expect(
      await prisma.eventActivity.count({
        where: { event: { athleteId: owner.athlete!.athleteId } },
      }),
    ).toBe(1);
    expect(
      await prisma.activitySourceObservation.count({
        where: { source: { athleteId: owner.athlete!.athleteId } },
      }),
    ).toBe(1);
    expect(queue.addActivityProcessingJob).toHaveBeenCalledTimes(1);
    const value = stored!.eventActivity!;
    expect(value.averageHeartrate).toBeCloseTo(130.875);
    const stream = uncompressActivityStream(
      value.stream as unknown as CompressedActivityStream,
    );
    expect(stream.time).toEqual([0, 1800.333]);
    expect(stream.altitude).toEqual([-4, 10]);
    expect(
      await prisma.activitySegment.count({
        where: { eventActivityId: value.eventActivityId },
      }),
    ).toBe(2);
  });

  it.each(['STRAVA', 'GARMIN'] as const)(
    'enriches an existing %s activity while preserving edits, feedback fields and training links',
    async (kind) => {
      const existing = recording();
      existing.stream = {
        time: [0, 1, 2],
        latlng: [
          [50, 8],
          [50.001, 8.001],
          [50.002, 8.002],
        ],
        distance: [0, 3, 6],
      };
      delete existing.values.averageHeartrate;
      delete existing.values.maxHeartrate;
      const first = await provider(kind, 'provider-1', existing);
      await prisma.event.update({
        where: { eventId: first.activity!.eventId },
        data: { name: 'My edited title' },
      });
      await prisma.eventActivity.update({
        where: { eventActivityId: first.activity!.eventActivityId },
        data: { rpe: 0.7, feedbackSkipped: true },
      });
      const training = await prisma.event.create({
        data: {
          athleteId: owner.athlete!.athleteId,
          name: 'Planned run',
          type: 'TRAINING',
          startDate: new Date(payload().startDate),
          endDate: new Date(payload().endDate),
          training: {
            create: {
              sport: 'RUNNING',
              relatedActivityId: first.activity!.eventActivityId,
            },
          },
        },
      });
      const result = (await post().expect(201)).body;
      expect(result).toMatchObject({
        status: 'enriched',
        eventActivityId: first.activity!.eventActivityId,
      });
      const saved = await prisma.eventActivity.findUniqueOrThrow({
        where: { eventActivityId: result.eventActivityId },
        include: { event: true, relatedTraining: true, sources: true },
      });
      expect(saved.event.name).toBe('My edited title');
      expect(saved.rpe).toBe(0.7);
      expect(saved.feedbackSkipped).toBe(true);
      expect(saved.relatedTraining?.eventId).toBe(training.eventId);
      expect(saved.sources).toHaveLength(2);
      const stream = uncompressActivityStream(
        saved.stream as unknown as CompressedActivityStream,
      );
      expect(stream.heartrate).toEqual([120, 121, 122]);
      expect(stream.latlng).toEqual(existing.stream.latlng);
      expect(
        await prisma.eventActivity.count({
          where: { event: { athleteId: owner.athlete!.athleteId } },
        }),
      ).toBe(1);
    },
  );

  it.each(['STRAVA', 'GARMIN'] as const)(
    'attaches %s arriving after HealthKit and adds missing route data',
    async (kind) => {
      const first = (await post().expect(201)).body;
      const incoming = recording();
      incoming.stream = {
        time: [0, 1, 2],
        latlng: [[50, 8], [], [50.002, 8.002]],
      };
      delete incoming.values.averageHeartrate;
      delete incoming.values.maxHeartrate;
      const result = await provider(kind, 'later-provider', incoming);
      expect(result.status).toBe('enriched');
      expect(result.activity?.eventActivityId).toBe(first.eventActivityId);
      const stream = uncompressActivityStream(
        result.activity!.stream as unknown as CompressedActivityStream,
      );
      expect(stream.heartrate).toEqual([120, 121, 122]);
      expect(stream.latlng?.[1]).toEqual([]);
    },
  );

  it('serializes concurrent same-source and different-provider imports into one activity', async () => {
    const results = await Promise.all([
      post(),
      post(),
      provider('GARMIN', 'g1'),
      provider('STRAVA', 's1'),
    ]);
    const ids = results.map((result) =>
      'body' in result
        ? result.body.eventActivityId
        : result.activity?.eventActivityId,
    );
    expect(new Set(ids).size).toBe(1);
    expect(
      await prisma.activitySource.count({
        where: { athleteId: owner.athlete!.athleteId },
      }),
    ).toBe(3);
    expect(
      await prisma.eventActivity.count({
        where: { event: { athleteId: owner.athlete!.athleteId } },
      }),
    ).toBe(1);
    const source = await reconciliation.findSource(
      owner.athlete!.athleteId,
      'APPLE_HEALTH',
      UUID,
    );
    expect(
      await prisma.activitySourceObservation.count({
        where: { activitySourceId: source!.activitySourceId },
      }),
    ).toBe(1);
  });

  it.each([true, false])(
    'prefers original Watch sensor data over mirrored Strava values in either order (Watch first: %s)',
    async (watchFirst) => {
      const mirrored = recording();
      mirrored.stream.heartrate = [80, 81, 82];
      mirrored.values.averageHeartrate = 81;
      mirrored.values.maxHeartrate = 82;
      if (watchFirst) {
        await post().expect(201);
        await provider('STRAVA', 'mirror', mirrored);
      } else {
        await provider('STRAVA', 'mirror', mirrored);
        await post().expect(201);
      }
      const saved = await prisma.eventActivity.findFirstOrThrow({
        where: { event: { athleteId: owner.athlete!.athleteId } },
      });
      expect(saved.averageHeartrate).toBe(121);
      expect(
        uncompressActivityStream(
          saved.stream as unknown as CompressedActivityStream,
        ).heartrate,
      ).toEqual([120, 121, 122]);
      expect(
        await prisma.eventActivity.count({
          where: { event: { athleteId: owner.athlete!.athleteId } },
        }),
      ).toBe(1);
    },
  );

  it('retains an ambiguous recording without collapsing existing duplicate canonical activities', async () => {
    const base = recording();
    for (const id of ['duplicate-a', 'duplicate-b'])
      await prisma.event.create({
        data: {
          athleteId: owner.athlete!.athleteId,
          name: id,
          type: 'ACTIVITY',
          startDate: new Date(base.startDate),
          endDate: new Date(base.endDate),
          activity: {
            create: {
              ...base.values,
              provider: 'STRAVA',
              sourceAthleteId: owner.athlete!.athleteId,
              externalId: id,
            },
          },
        },
      });
    expect((await post().expect(201)).body).toMatchObject({
      status: 'needs_review',
      eventActivityId: null,
    });
    expect(
      await prisma.eventActivity.count({
        where: { event: { athleteId: owner.athlete!.athleteId } },
      }),
    ).toBe(2);
  });

  it('holds partial/ambiguous matches uncounted with an owner-only durable receipt', async () => {
    await provider('GARMIN', 'g1');
    const partial = {
      ...payload(),
      endDate: '2026-10-20T08:30:00Z',
      elapsedDuration: { value: 1800, unit: 's' },
      activeDuration: { value: 1800, unit: 's' },
    };
    const result = (await post(partial).expect(201)).body;
    expect(result).toMatchObject({
      status: 'needs_review',
      eventActivityId: null,
      processing: 'not_required',
    });
    expect(
      await prisma.eventActivity.count({
        where: { event: { athleteId: owner.athlete!.athleteId } },
      }),
    ).toBe(1);
    expect((await post(partial).expect(201)).body.receiptId).toBe(
      result.receiptId,
    );
    await request(app.getHttpServer())
      .get(`/activity-import/healthkit/receipts/${result.receiptId}`)
      .auth(sign({ userId: other.userId }, SECRET), { type: 'bearer' })
      .expect(404);
    const status = await request(app.getHttpServer())
      .get(`/activity-import/healthkit/receipts/${result.receiptId}`)
      .auth(sign({ userId: owner.userId }, SECRET), { type: 'bearer' })
      .expect(200);
    expect(status.body.status).toBe('needs_review');
    expect(status.body.candidateActivityIds).toHaveLength(1);
    expect(status.body.payload).toBeUndefined();
  });

  it('retains immutable revisions, rejects revision reuse, and cannot roll back a newer observation', async () => {
    await post().expect(201);
    await post({ ...payload(), name: 'Changed without revision' }).expect(409);
    const second = (
      await post({
        ...payload(),
        revision: 2,
        name: 'Corrected source title',
      }).expect(201)
    ).body;
    expect(second.eventActivityId).toBeTruthy();
    expect((await post().expect(201)).body).toMatchObject({
      status: 'unchanged',
      revision: 2,
    });
    expect(
      await prisma.activitySourceObservation.count({
        where: { source: { athleteId: owner.athlete!.athleteId } },
      }),
    ).toBe(2);
    const source = await prisma.activitySource.findFirstOrThrow({
      where: { athleteId: owner.athlete!.athleteId, provider: 'APPLE_HEALTH' },
    });
    expect((source.payload as unknown as ActivityRecording).name).toBe(
      'Corrected source title',
    );
  });

  it('keeps source channels and canonical user edits when newer observations conflict', async () => {
    const first = (await post().expect(201)).body;
    await prisma.eventActivity.update({
      where: { eventActivityId: first.eventActivityId },
      data: { averageHeartrate: 99 },
    });
    const changed = payload();
    changed.revision = 2;
    changed.streams.heartrate.samples.forEach((sample) => (sample.value += 20));
    await post(changed).expect(201);
    const saved = await prisma.eventActivity.findUniqueOrThrow({
      where: { eventActivityId: first.eventActivityId },
    });
    expect(saved.averageHeartrate).toBe(99);
    expect(
      uncompressActivityStream(
        saved.stream as unknown as CompressedActivityStream,
      ).heartrate,
    ).toEqual([140, 141, 142]);
  });

  it('leaves a durable pending receipt when queueing fails and dispatches the same job on retry', async () => {
    queue.addActivityProcessingJob.mockRejectedValueOnce(
      new Error('queue unavailable'),
    );
    await post().expect(500);
    const source = await prisma.activitySource.findFirstOrThrow({
      where: { athleteId: owner.athlete!.athleteId },
    });
    expect(source.processingPending).toBe(true);
    expect((await post().expect(201)).body).toMatchObject({
      status: 'unchanged',
      processing: 'queued',
    });
    expect(queue.addActivityProcessingJob.mock.calls[0]).toEqual(
      queue.addActivityProcessingJob.mock.calls[1],
    );
    expect(
      await prisma.eventActivity.count({
        where: { event: { athleteId: owner.athlete!.athleteId } },
      }),
    ).toBe(1);
  });

  it('does not revive a source whose canonical activity was explicitly deleted', async () => {
    const first = (await post().expect(201)).body;
    await prisma.eventActivity.delete({
      where: { eventActivityId: first.eventActivityId },
    });
    expect((await post().expect(201)).body).toMatchObject({
      status: 'needs_review',
      eventActivityId: null,
    });
    expect(
      await prisma.eventActivity.count({
        where: { event: { athleteId: owner.athlete!.athleteId } },
      }),
    ).toBe(0);
  });

  it('accepts bounded streams exceeding the default JSON parser limit', async () => {
    const body = payload();
    body.streams.heartrate.samples = Array.from({ length: 3000 }, (_, i) => ({
      timestamp: new Date(Date.parse(body.startDate) + i * 1000).toISOString(),
      value: 120,
    }));
    expect(Buffer.byteLength(JSON.stringify(body))).toBeGreaterThan(100 * 1024);
    await post(body).expect(201);
  });

  it('adopts legacy provider activity IDs without changing the canonical event', async () => {
    const base = recording();
    const event = await prisma.event.create({
      data: {
        athleteId: owner.athlete!.athleteId,
        name: 'Legacy Garmin',
        type: 'ACTIVITY',
        startDate: new Date(base.startDate),
        endDate: new Date(base.endDate),
        activity: {
          create: {
            ...base.values,
            externalId: 'legacy-id',
            provider: 'GARMIN',
            stream: Prisma.JsonNull,
          },
        },
      },
      include: { activity: true },
    });
    const result = await provider('GARMIN', 'legacy-id', base);
    expect(result.activity?.eventActivityId).toBe(
      event.activity?.eventActivityId,
    );
    expect(
      await prisma.eventActivity.count({
        where: { event: { athleteId: owner.athlete!.athleteId } },
      }),
    ).toBe(1);
  });
});
