import { AiFeatureTask, AiTask, Offer } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { AiPolicyService } from './ai-policy.service';
import { AiUsageOwner, AiUsageService } from './ai-usage.service';

// Integration test: needs a migrated, disposable PostgreSQL database.
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );
}

// Monday 16 to Sunday 22 November 2026
const WEDNESDAY = new Date('2026-11-18T12:00:00Z');
const NEXT_WEDNESDAY = new Date('2026-11-25T12:00:00Z');

describe('AiUsageService (PostgreSQL)', () => {
  let prisma: PrismaService;
  // Arbitrary allowance in US dollars a week; undefined: no limit
  const policy: { weeklyAllowanceUsd: () => number | undefined } = {
    weeklyAllowanceUsd: () => undefined,
  };
  const subscriptions = {
    offerForUser: jest
      .fn()
      .mockResolvedValue({ offer: Offer.SUPPORTER, isFounder: false }),
  };
  const analytics = { enabled: true, send: jest.fn() };
  let service: AiUsageService;
  let userId: number;
  let otherUserId: number;

  // $0.20 per million input tokens, $1.20 per million output tokens
  const hosted = (): AiUsageOwner => ({
    userId,
    task: AiTask.EVENT_GENERATION,
    source: 'hosted',
    provider: 'openai',
    modelId: 'gpt-5.6-luna',
  });
  const ownKey = (
    task: AiFeatureTask = AiTask.EVENT_GENERATION,
  ): AiUsageOwner => ({
    userId,
    task,
    source: 'own_key',
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-5',
  });
  const allow = (usd: number | undefined) => {
    policy.weeklyAllowanceUsd = () => usd;
  };

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    service = new AiUsageService(
      prisma,
      policy as unknown as AiPolicyService,
      subscriptions as never,
      analytics as never,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "user", ai_usage RESTART IDENTITY CASCADE',
    );
    allow(undefined);
    analytics.send.mockClear();
    const user = (email: string, timeZone: string) =>
      prisma.user.create({
        data: {
          email,
          password: 'x',
          firstName: 'A',
          lastName: 'B',
          timeZone,
        },
      });
    userId = (await user('athlete@example.com', 'Europe/Paris')).userId;
    otherUserId = (await user('other@example.com', 'America/New_York')).userId;
  });

  it('counts each day, and tells only the tokens of own keys', async () => {
    await service.record(
      hosted(),
      { inputTokens: 100, outputTokens: 20 },
      WEDNESDAY,
    );
    await service.record(
      hosted(),
      { inputTokens: 50, outputTokens: 5 },
      WEDNESDAY,
    );
    await service.record(
      ownKey(AiTask.FEEDBACK_EXTRACTION),
      { inputTokens: 7, outputTokens: 3 },
      WEDNESDAY,
    );

    const usage = await service.describe(userId, WEDNESDAY);
    expect(usage).toEqual({
      ownKeyTokens: 10,
      hostedBudgetUsed: null,
      // Monday 23 November, midnight in Paris
      resetsAt: '2026-11-22T23:00:00.000Z',
    });
    expect(usage).not.toHaveProperty('hostedTokens');
    const rows = await prisma.aiUsage.findMany({ orderBy: { task: 'asc' } });
    expect(rows).toEqual([
      // 150 input tokens at $0.20/M and 25 output tokens at $1.20/M
      expect.objectContaining({
        day: new Date('2026-11-18T00:00:00Z'),
        source: 'HOSTED',
        calls: 2,
        inputTokens: 150,
        costMicroUsd: 60,
      }),
      expect.objectContaining({ source: 'OWN_KEY', calls: 1, costMicroUsd: 0 }),
    ]);
  });

  it('counts concurrent calls without losing any', async () => {
    await Promise.all(
      Array.from({ length: 10 }, () =>
        service.record(
          hosted(),
          { inputTokens: 10, outputTokens: 1 },
          WEDNESDAY,
        ),
      ),
    );

    const row = await prisma.aiUsage.findFirstOrThrow();
    expect(row).toMatchObject({
      calls: 10,
      inputTokens: 100,
      outputTokens: 10,
    });
  });

  it('refills on Monday at midnight in the user’s time zone', async () => {
    allow(1);
    // $0.50, on Sunday 23:30 in Paris
    await service.record(
      hosted(),
      { inputTokens: 2_500_000 },
      new Date('2026-11-22T22:30:00Z'),
    );

    await expect(
      service.describe(userId, new Date('2026-11-22T22:50:00Z')),
    ).resolves.toMatchObject({ hostedBudgetUsed: 0.5 });
    // Monday 00:10 in Paris, Sunday 23:10 in UTC
    await expect(
      service.describe(userId, new Date('2026-11-22T23:10:00Z')),
    ).resolves.toEqual({
      ownKeyTokens: 0,
      hostedBudgetUsed: 0,
      resetsAt: '2026-11-29T23:00:00.000Z',
    });
  });

  it('keeps the week of a user west of UTC until their own Monday', async () => {
    allow(1);
    const sundayEveningInNewYork = new Date('2026-11-23T03:00:00Z');
    await service.record(
      { ...hosted(), userId: otherUserId },
      { inputTokens: 2_500_000 },
      sundayEveningInNewYork,
    );

    await expect(
      service.describe(otherUserId, sundayEveningInNewYork),
    ).resolves.toEqual({
      ownKeyTokens: 0,
      hostedBudgetUsed: 0.5,
      // Monday midnight in New York
      resetsAt: '2026-11-23T05:00:00.000Z',
    });
    await expect(
      prisma.aiUsage.findFirstOrThrow({ where: { userId: otherUserId } }),
    ).resolves.toMatchObject({ day: new Date('2026-11-22T00:00:00Z') });
  });

  it('enforces the weekly allowance on the instance keys only', async () => {
    allow(3);
    await service.record(
      ownKey(),
      { inputTokens: 50_000_000, outputTokens: 0 },
      WEDNESDAY,
    );
    await expect(
      service.hasHostedAllowanceLeft(userId, WEDNESDAY),
    ).resolves.toBe(true);

    // $2.00 of input and $1.20 of output: over the allowance by one call
    await service.record(
      hosted(),
      { inputTokens: 10_000_000, outputTokens: 1_000_000 },
      WEDNESDAY,
    );

    await expect(
      service.hasHostedAllowanceLeft(userId, WEDNESDAY),
    ).resolves.toBe(false);
    await expect(service.describe(userId, WEDNESDAY)).resolves.toMatchObject({
      hostedBudgetUsed: 1,
    });
    await expect(
      service.hasHostedAllowanceLeft(otherUserId, WEDNESDAY),
    ).resolves.toBe(true);
    await expect(
      service.hasHostedAllowanceLeft(userId, NEXT_WEDNESDAY),
    ).resolves.toBe(true);
  });

  it('gives nothing when the allowance is zero', async () => {
    allow(0);

    await expect(
      service.hasHostedAllowanceLeft(userId, WEDNESDAY),
    ).resolves.toBe(false);
    await expect(service.describe(userId, WEDNESDAY)).resolves.toMatchObject({
      hostedBudgetUsed: 1,
    });
  });

  it('tells analytics when the allowance runs low, then runs out, once each', async () => {
    allow(1);
    // $0.50, $0.40 (90%), $0.04 (94%), $0.10 (over)
    for (const inputTokens of [2_500_000, 2_000_000, 200_000, 500_000]) {
      await service.record(hosted(), { inputTokens }, WEDNESDAY);
    }

    expect(analytics.send.mock.calls).toEqual([
      [
        userId,
        'ai_allowance_warning',
        { offer: Offer.SUPPORTER, founder: false, week: '2026-11-16' },
      ],
      [
        userId,
        'ai_allowance_exhausted',
        { offer: Offer.SUPPORTER, founder: false, week: '2026-11-16' },
      ],
    ]);
    // Nothing tells what the allowance or the calls cost
    expect(JSON.stringify(analytics.send.mock.calls)).not.toMatch(
      /cost|usd|token/i,
    );
  });

  it('counts voice notes on the allowance, without blocking them', async () => {
    allow(1);

    // 60 seconds of Whisper: $0.006
    await service.recordTranscription(userId, 60, WEDNESDAY);

    await expect(prisma.aiUsage.findFirstOrThrow()).resolves.toMatchObject({
      task: 'VOICE_TRANSCRIPTION',
      source: 'HOSTED',
      costMicroUsd: 6000,
      calls: 1,
    });
    await expect(service.describe(userId, WEDNESDAY)).resolves.toMatchObject({
      hostedBudgetUsed: 0.006,
    });
  });

  it('charges a model missing from the price table like a flagship', async () => {
    await service.record(
      { ...hosted(), modelId: 'gpt-unknown' },
      { inputTokens: 1000, outputTokens: 1000 },
      WEDNESDAY,
    );

    // $5/M input and $30/M output
    await expect(prisma.aiUsage.findFirstOrThrow()).resolves.toMatchObject({
      costMicroUsd: 35_000,
    });
  });

  it('counts a call whose provider reported no tokens', async () => {
    await service.record(hosted(), undefined, WEDNESDAY);

    await expect(prisma.aiUsage.findFirstOrThrow()).resolves.toMatchObject({
      calls: 1,
      inputTokens: 0,
      outputTokens: 0,
    });
  });

  it("is deleted with the user's account", async () => {
    await service.record(
      hosted(),
      { inputTokens: 1, outputTokens: 1 },
      WEDNESDAY,
    );

    await prisma.user.delete({ where: { userId } });

    await expect(prisma.aiUsage.count()).resolves.toBe(0);
  });
});
