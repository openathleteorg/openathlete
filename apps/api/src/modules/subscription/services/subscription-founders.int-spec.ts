import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

// Integration test: needs a migrated, disposable PostgreSQL database.
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );
}

const MIGRATIONS = join(
  __dirname,
  '../../../../../../libs/database/prisma/schema/migrations',
);

/** The data statements of the migration that shipped the Supporter tiers. */
function founderStatements(): string[] {
  const folder = readdirSync(MIGRATIONS).find((name) =>
    name.endsWith('_pricing_v2_supporter'),
  );
  const sql = readFileSync(join(MIGRATIONS, folder!, 'migration.sql'), 'utf8');
  return sql
    .split(';')
    .map((statement) =>
      statement
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter((statement) => statement.startsWith('UPDATE'));
}

const DAY = 24 * 60 * 60 * 1000;

describe('Founders of the Supporter tiers (PostgreSQL)', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "user", subscription RESTART IDENTITY CASCADE',
    );
  });

  async function subscriber(
    email: string,
    data: Record<string, unknown>,
  ): Promise<number> {
    const user = await prisma.user.create({
      data: { email, password: 'x', firstName: 'A', lastName: 'B' },
    });
    await prisma.subscription.create({
      data: { userId: user.userId, plan: 'SUPPORTER', ...data },
    });
    return user.userId;
  }

  it('makes every running paid subscription a founder, once', async () => {
    const now = Date.now();
    const created = new Date('2026-10-19T08:00:00Z');
    const stripe = await subscriber('stripe@example.com', {
      provider: 'stripe',
      status: 'active',
      billingInterval: 'year',
      stripeSubscriptionId: 'sub_1',
      createdAt: created,
    });
    const leaving = await subscriber('leaving@example.com', {
      provider: 'stripe',
      status: 'active',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(now + 4 * DAY),
      stripeSubscriptionId: 'sub_2',
    });
    const pastDue = await subscriber('late@example.com', {
      provider: 'stripe',
      status: 'past_due',
      stripeSubscriptionId: 'sub_3',
    });
    const apple = await subscriber('apple@example.com', {
      provider: 'apple',
      status: 'active',
      billingInterval: 'year',
      currentPeriodEnd: new Date(now + 300 * DAY),
      appleOriginalTransactionId: '100',
    });
    const appleExpired = await subscriber('expired@example.com', {
      provider: 'apple',
      status: 'active',
      billingInterval: 'month',
      currentPeriodEnd: new Date(now - DAY),
      appleOriginalTransactionId: '200',
    });
    const canceled = await subscriber('gone@example.com', {
      provider: 'stripe',
      status: 'canceled',
      currentPeriodEnd: new Date(now - 30 * DAY),
      stripeSubscriptionId: 'sub_4',
    });
    // Granted by hand, never paid
    const granted = await subscriber('granted@example.com', {
      status: 'active',
    });
    const free = await prisma.user.create({
      data: {
        email: 'free@example.com',
        password: 'x',
        firstName: 'A',
        lastName: 'B',
        subscription: { create: { plan: 'FREE', status: 'active' } },
      },
    });

    const statements = founderStatements();
    expect(statements).toHaveLength(2);
    for (let run = 0; run < 2; run++) {
      for (const statement of statements) {
        await prisma.$executeRawUnsafe(statement);
      }
    }

    const founders = await prisma.subscription.findMany({
      where: { isFounder: true },
      select: { userId: true, founderSince: true },
      orderBy: { userId: 'asc' },
    });
    expect(founders.map((row) => row.userId)).toEqual([
      stripe,
      leaving,
      pastDue,
      apple,
    ]);
    expect(founders[0].founderSince).toEqual(created);
    const notFounders = await prisma.subscription.findMany({
      where: { userId: { in: [appleExpired, canceled, granted, free.userId] } },
    });
    expect(notFounders.every((row) => !row.isFounder)).toBe(true);
  });

  it('gives App Store subscriptions the amount of the lowest tier', async () => {
    const apple = await subscriber('apple@example.com', {
      provider: 'apple',
      status: 'active',
      billingInterval: 'year',
      currentPeriodEnd: new Date(Date.now() + 100 * DAY),
      appleOriginalTransactionId: '100',
    });
    const monthly = await subscriber('monthly@example.com', {
      provider: 'apple',
      status: 'active',
      billingInterval: 'month',
      currentPeriodEnd: new Date(Date.now() + 10 * DAY),
      appleOriginalTransactionId: '101',
    });

    for (const statement of founderStatements()) {
      await prisma.$executeRawUnsafe(statement);
    }

    await expect(
      prisma.subscription.findUniqueOrThrow({ where: { userId: apple } }),
    ).resolves.toMatchObject({ amountCents: 5000, currency: 'eur' });
    await expect(
      prisma.subscription.findUniqueOrThrow({ where: { userId: monthly } }),
    ).resolves.toMatchObject({ amountCents: 500 });
  });
});
