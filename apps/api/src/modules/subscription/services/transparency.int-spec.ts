import { ConfigService } from '@nestjs/config';

import { Prisma } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { StripeService } from './stripe.service';
import { SubscriptionService } from './subscription.service';
import { TransparencyService } from './transparency.service';

// Integration test: needs a migrated, disposable PostgreSQL database.
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );
}

describe('Supporter wall (PostgreSQL)', () => {
  let prisma: PrismaService;
  let transparency: TransparencyService;
  let subscriptions: SubscriptionService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const config = {
      get: () => undefined,
    } as unknown as ConfigService<ApiEnvSchemaType, true>;
    transparency = new TransparencyService(prisma, config);
    subscriptions = new SubscriptionService(
      prisma,
      {} as unknown as StripeService,
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "user", subscription RESTART IDENTITY CASCADE',
    );
    transparency.invalidate();
  });

  async function member(
    firstName: string,
    data: Omit<Prisma.SubscriptionUncheckedCreateInput, 'userId'>,
  ): Promise<number> {
    const user = await prisma.user.create({
      data: {
        email: `${firstName.toLowerCase()}@example.com`,
        password: 'x',
        firstName,
        lastName: 'Lastname',
      },
    });
    await prisma.subscription.create({
      data: { userId: user.userId, ...data },
    });
    return user.userId;
  }

  it('lists running Supporters who agreed, and only them', async () => {
    const supporter = {
      plan: 'SUPPORTER',
      billingInterval: 'month',
      amountCents: 800,
    } as const;
    await member('Julie', {
      ...supporter,
      status: 'active',
      showOnSupporterWall: true,
    });
    await member('Marc', { ...supporter, status: 'active' });
    await member('Ines', {
      ...supporter,
      status: 'trialing',
      showOnSupporterWall: true,
      wallName: 'TrailFox',
    });
    await member('Paul', {
      ...supporter,
      status: 'canceled',
      showOnSupporterWall: true,
    });
    await member('Sara', {
      ...supporter,
      status: 'past_due',
      showOnSupporterWall: true,
    });
    await member('Free', {
      plan: 'FREE',
      status: 'active',
      showOnSupporterWall: true,
    });

    const result = await transparency.get();

    expect(result.supporters.count).toBe(3);
    expect(result.wall).toEqual(['Julie', 'TrailFox']);
    expect(result.tiers).toBeNull();
  });

  it('leaves the wall as soon as the box is unticked', async () => {
    const userId = await member('Julie', {
      plan: 'SUPPORTER',
      status: 'active',
      billingInterval: 'year',
      amountCents: 8000,
    });

    await subscriptions.updateSupporterWall(userId, { show: true, name: 'Ju' });
    transparency.invalidate();
    expect((await transparency.get()).wall).toEqual(['Ju']);

    await subscriptions.updateSupporterWall(userId, { show: false });
    transparency.invalidate();
    expect((await transparency.get()).wall).toEqual([]);

    // The chosen name is kept for next time; an empty one means the first name
    await subscriptions.updateSupporterWall(userId, { show: true });
    transparency.invalidate();
    expect((await transparency.get()).wall).toEqual(['Ju']);
    await subscriptions.updateSupporterWall(userId, { show: true, name: '' });
    transparency.invalidate();
    expect((await transparency.get()).wall).toEqual(['Julie']);
  });
});
