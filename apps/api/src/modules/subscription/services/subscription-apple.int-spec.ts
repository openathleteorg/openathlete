import Stripe from 'stripe';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  appleRenewalInfo,
  appleTransaction,
} from '../apple/apple-store.fixture';
import { SubscriptionService } from './subscription.service';

// Integration test: needs a migrated, disposable PostgreSQL database.
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );
}

const DAY = 24 * 60 * 60 * 1000;
const transaction = (overrides: Record<string, unknown> = {}) =>
  appleTransaction(overrides) as never;

describe('SubscriptionService with App Store purchases (PostgreSQL)', () => {
  let prisma: PrismaService;
  let service: SubscriptionService;
  let userId: number;
  let otherUserId: number;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
    const stripe = {
      billingEnabled: true,
      intervalOfPrice: () => null,
    };
    service = new SubscriptionService(prisma, stripe as never);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "user", subscription RESTART IDENTITY CASCADE',
    );
    const user = (email: string) =>
      prisma.user.create({
        data: { email, password: 'x', firstName: 'A', lastName: 'B' },
      });
    userId = (await user('supporter@example.com')).userId;
    otherUserId = (await user('other@example.com')).userId;
  });

  /** A purchase made in the iOS app by the given user */
  async function purchase(
    buyerId = userId,
    overrides: Record<string, unknown> = {},
  ) {
    const appAccountToken = await service.getOrCreateAppleAccountToken(buyerId);
    return service.linkAppleTransaction(
      buyerId,
      transaction({ appAccountToken, ...overrides }),
    );
  }

  it('gives one stable account token per user', async () => {
    const token = await service.getOrCreateAppleAccountToken(userId);
    expect(token).toMatch(/^[0-9a-f-]{36}$/);
    expect(await service.getOrCreateAppleAccountToken(userId)).toBe(token);
    expect(await service.getOrCreateAppleAccountToken(otherUserId)).not.toBe(
      token,
    );
  });

  it('makes the buyer a Supporter billed by the App Store', async () => {
    const subscription = await purchase();

    expect(subscription).toMatchObject({
      plan: 'SUPPORTER',
      provider: 'apple',
      status: 'active',
      appleOriginalTransactionId: '2000000000000001',
    });
    expect(await service.hasAIFeaturesAccess(userId)).toBe(true);
    expect(await service.getMaxAthletesForUser(userId)).toBeNull();
  });

  it("refuses a purchase made with another user's account token", async () => {
    const othersToken = await service.getOrCreateAppleAccountToken(otherUserId);
    await service.getOrCreateAppleAccountToken(userId);

    await expect(
      service.linkAppleTransaction(
        userId,
        transaction({ appAccountToken: othersToken }),
      ),
    ).rejects.toThrow('APPLE_PURCHASE_OF_ANOTHER_ACCOUNT');
  });

  it('refuses to restore a purchase another user already owns', async () => {
    await purchase(otherUserId);

    await expect(
      service.linkAppleTransaction(userId, transaction()),
    ).rejects.toThrow('APPLE_PURCHASE_OF_ANOTHER_ACCOUNT');
  });

  it('refuses an App Store purchase while a Stripe subscription runs', async () => {
    await prisma.subscription.create({
      data: {
        userId,
        plan: 'SUPPORTER',
        provider: 'stripe',
        status: 'active',
        stripeSubscriptionId: 'sub_1',
      },
    });

    await expect(purchase()).rejects.toThrow('ALREADY_SUPPORTER');
  });

  it('applies renewals, cancellations and refunds from notifications', async () => {
    await purchase();

    const renewed = await service.applyAppleNotification(
      transaction({ expiresDate: Date.now() + 59 * DAY }),
      appleRenewalInfo({ autoRenewStatus: 0 }) as never,
    );
    expect(renewed).toMatchObject({
      status: 'active',
      cancelAtPeriodEnd: true,
    });

    const refunded = await service.applyAppleNotification(
      transaction({ revocationDate: Date.now() }),
      null,
    );
    expect(refunded?.status).toBe('canceled');
    expect(await service.hasAIFeaturesAccess(userId)).toBe(false);
  });

  it('keeps the latest period when an older notification arrives late', async () => {
    await purchase(userId, { expiresDate: Date.now() + 59 * DAY });

    const late = await service.applyAppleNotification(
      transaction({ expiresDate: Date.now() + 29 * DAY }),
      appleRenewalInfo({ autoRenewStatus: 0 }) as never,
    );

    expect(late?.currentPeriodEnd?.getTime()).toBeGreaterThan(
      Date.now() + 58 * DAY,
    );
    expect(late?.cancelAtPeriodEnd).toBe(true);
  });

  it('skips notifications for purchases no user recorded', async () => {
    await expect(
      service.applyAppleNotification(
        transaction({ originalTransactionId: '9' }),
        null,
      ),
    ).resolves.toBeNull();
  });

  it('finds a purchase by account token before the app recorded it', async () => {
    const appAccountToken = await service.getOrCreateAppleAccountToken(userId);

    const subscription = await service.applyAppleNotification(
      transaction({ appAccountToken }),
      appleRenewalInfo() as never,
    );

    expect(subscription).toMatchObject({ userId, provider: 'apple' });
  });

  it('keeps App Store billing when an old Stripe subscription ends', async () => {
    await prisma.subscription.create({
      data: {
        userId,
        plan: 'SUPPORTER',
        provider: 'stripe',
        status: 'canceled',
        stripeSubscriptionId: 'sub_old',
        stripeCustomerId: 'cus_1',
      },
    });
    await purchase();

    await service.updateSubscriptionFromWebhook({
      id: 'sub_old',
      customer: 'cus_1',
      status: 'canceled',
      cancel_at_period_end: false,
      trial_end: null,
      items: { data: [] },
    } as unknown as Stripe.Subscription);

    expect(await service.getCurrentSubscription(userId)).toMatchObject({
      provider: 'apple',
      status: 'active',
    });
  });

  it('sends App Store subscribers to iOS settings to change their subscription', async () => {
    await purchase();

    await expect(service.cancelSubscription(userId)).rejects.toThrow(
      'MANAGED_BY_APP_STORE',
    );
    await expect(service.assertBilledByStripe(userId)).rejects.toThrow(
      'MANAGED_BY_APP_STORE',
    );
  });

  it('lets a lapsed App Store subscriber subscribe on the web', async () => {
    await purchase(userId, { expiresDate: Date.now() - DAY });

    expect(await service.getCurrentSubscription(userId)).toMatchObject({
      provider: 'apple',
      status: 'canceled',
    });
    await expect(service.assertBilledByStripe(userId)).resolves.toBeUndefined();
  });

  it('ends access at the end of the period even without a notification', async () => {
    await purchase();
    await prisma.subscription.update({
      where: { userId },
      data: { currentPeriodEnd: new Date(Date.now() - DAY) },
    });

    expect(await service.hasAIFeaturesAccess(userId)).toBe(false);
  });
});
