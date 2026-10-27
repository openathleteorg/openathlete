import { sign } from 'jsonwebtoken';
import request from 'supertest';

import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';

import { METRIC_TYPE, importHealthMetricsDtoSchema } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { CaslAbilityFactory } from 'src/modules/auth/services/casl-ability.factory';
import { JwtStrategy } from 'src/modules/auth/strategies/jwt.strategy';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { MetricController } from '../controllers/metric.controller';
import { MetricService } from './metric.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );
const SECRET = 'health-import-disposable-test-secret';
const date = '2026-10-19';
const payload = {
  source: 'APPLE_HEALTH',
  timeZone: 'Europe/Berlin',
  metrics: [
    { type: 'HRV_SDNN', date, unit: 'ms', value: 42.5, sampleCount: 12 },
    { type: 'HR_REST', date, unit: 'bpm', value: 55 },
    { type: 'SLEEP_DURATION', date, unit: 'h', value: 7.5 },
  ],
};

describe('Apple Health daily imports (HTTP and PostgreSQL)', () => {
  let prisma: PrismaService;
  let app: INestApplication;
  let service: MetricService;
  let user: AuthUser;
  let other: AuthUser;
  let token: string;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [MetricController],
      providers: [
        MetricService,
        CaslAbilityFactory,
        {
          provide: JwtStrategy,
          useFactory: () =>
            new JwtStrategy(
              { getOrThrow: () => SECRET } as unknown as ConstructorParameters<
                typeof JwtStrategy
              >[0],
              {
                validateUser: async (jwt: { sub: number }) =>
                  prisma.user.findUnique({
                    where: { userId: jwt.sub },
                    include: { athlete: true },
                  }),
              } as unknown as AuthService,
            ),
        },
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { getOrThrow: () => SECRET } },
        {
          provide: AuthService,
          useValue: {
            validateUser: async (jwt: { sub: number }) =>
              prisma.user.findUnique({
                where: { userId: jwt.sub },
                include: { athlete: true },
              }),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    service = module.get(MetricService);
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  beforeEach(async () => {
    // Only this fixture's accounts are touched; the URL must be disposable.
    await prisma.athlete.deleteMany({
      where: {
        user: {
          email: {
            in: ['health-import@example.test', 'health-other@example.test'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['health-import@example.test', 'health-other@example.test'],
        },
      },
    });
    const create = (email: string) =>
      prisma.user.create({
        data: {
          email,
          password: 'unused-test-hash',
          firstName: 'Test',
          lastName: 'Athlete',
          roles: ['ATHLETE'],
          athlete: { create: {} },
        },
        include: { athlete: true },
      });
    user = await create('health-import@example.test');
    other = await create('health-other@example.test');
    token = sign({ sub: user.userId }, SECRET, { expiresIn: '5m' });
  });

  const post = (body: object = payload) =>
    request(app.getHttpServer())
      .post('/metric/import')
      .auth(token, { type: 'bearer' })
      .send(body);

  it('requires authentication and rejects malformed units before writing', async () => {
    await request(app.getHttpServer())
      .post('/metric/import')
      .send(payload)
      .expect(401);
    await post({
      ...payload,
      metrics: [{ ...payload.metrics[0], unit: 's' }],
    }).expect(400);
    expect(
      await prisma.athleteMetric.count({
        where: { athleteId: user.athlete!.athleteId },
      }),
    ).toBe(0);
  });

  it('imports all metrics with provenance and supports ordinary metric reads', async () => {
    expect((await post().expect(201)).body).toEqual({
      imported: 3,
      skipped: 0,
    });
    const rows = await service.getMetrics(user);
    expect(rows).toHaveLength(3);
    const sdnn = rows.find((row) => row.type === 'HRV_SDNN')!;
    expect(sdnn).toMatchObject({
      value: 42.5,
      source: 'APPLE_HEALTH',
      sourceMetadata: {
        timeZone: 'Europe/Berlin',
        unit: 'ms',
        sampleCount: 12,
      },
    });
    expect(sdnn.date.toISOString()).toBe(`${date}T00:00:00.000Z`);
    expect((await service.getLatestMetrics(user)).HR_REST.value).toBe(55);
    expect(await service.getMetricHistory(user, 'SLEEP_DURATION')).toHaveLength(
      1,
    );
  });

  it('retries and corrects imports without duplicates, including simultaneous requests', async () => {
    await Promise.all([post().expect(201), post().expect(201)]);
    await post({
      ...payload,
      metrics: [{ ...payload.metrics[0], value: 48 }],
    }).expect(201);
    expect(
      await prisma.athleteMetric.count({
        where: { athleteId: user.athlete!.athleteId },
      }),
    ).toBe(3);
    expect((await service.getMetrics(user, 'HRV_SDNN'))[0].value).toBe(48);
  });

  it('does not overwrite manual or other-provider values', async () => {
    await prisma.athleteMetric.createMany({
      data: [
        {
          athleteId: user.athlete!.athleteId,
          type: 'HR_REST',
          date: new Date(date),
          value: 50,
        },
        {
          athleteId: user.athlete!.athleteId,
          type: 'SLEEP_DURATION',
          date: new Date(date),
          value: 8,
          source: 'GARMIN',
        },
      ],
    });
    expect((await post().expect(201)).body).toEqual({
      imported: 1,
      skipped: 2,
    });
    expect((await service.getLatestMetrics(user)).HR_REST.value).toBe(50);
    expect((await service.getLatestMetrics(user)).SLEEP_DURATION.value).toBe(8);
  });

  it.each(['create', 'update'])(
    'protects a manual %s correction from subsequent background imports',
    async (method) => {
      await post().expect(201);
      const sdnn = (await service.getMetrics(user, 'HRV_SDNN'))[0];
      if (method === 'update') {
        await service.updateMetric(user, sdnn.athleteMetricId, { value: 60 });
      } else {
        await service.createMetric(user, {
          type: METRIC_TYPE.HRV_SDNN,
          date: new Date(date),
          value: 60,
        });
      }
      expect((await post().expect(201)).body).toEqual({
        imported: 2,
        skipped: 1,
      });
      expect((await service.getMetrics(user, 'HRV_SDNN'))[0]).toMatchObject({
        value: 60,
        source: null,
        sourceMetadata: null,
      });
    },
  );

  it('cannot target another account through the query string or body', async () => {
    await request(app.getHttpServer())
      .post(`/metric/import?athleteId=${other.athlete!.athleteId}`)
      .auth(token, { type: 'bearer' })
      .send(payload)
      .expect(201);
    expect(await service.getMetrics(other)).toEqual([]);
    await post({ ...payload, athleteId: other.athlete!.athleteId }).expect(400);
  });

  it('rejects users without an athlete profile or permission to import', async () => {
    const noAthlete = await prisma.user.update({
      where: { userId: user.userId },
      data: { athlete: { delete: true } },
    });
    await post().expect(404);
    await expect(
      service.importHealthMetrics(
        { ...other, athlete: null, userId: other.userId },
        importHealthMetricsDtoSchema.parse(payload),
      ),
    ).rejects.toThrow('Not allowed to import metrics');
    expect(noAthlete.userId).toBe(user.userId);
  });

  it('rolls back the whole batch if a database operation fails', async () => {
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION reject_health_test_metric() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.type = 'SLEEP_DURATION' THEN RAISE EXCEPTION 'synthetic failure'; END IF; RETURN NEW; END $$`,
    );
    try {
      await prisma.$executeRawUnsafe(
        `CREATE TRIGGER reject_health_test_metric BEFORE UPDATE ON athlete_metric FOR EACH ROW EXECUTE FUNCTION reject_health_test_metric()`,
      );
      await expect(
        service.importHealthMetrics(
          user,
          importHealthMetricsDtoSchema.parse(payload),
        ),
      ).rejects.toThrow();
      expect(await service.getMetrics(user)).toEqual([]);
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER IF EXISTS reject_health_test_metric ON athlete_metric',
      );
      await prisma.$executeRawUnsafe(
        'DROP FUNCTION reject_health_test_metric()',
      );
    }
  });
});
