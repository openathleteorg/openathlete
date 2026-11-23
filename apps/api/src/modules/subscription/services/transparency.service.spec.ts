import { ConfigService } from '@nestjs/config';

import {
  BillingInterval,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import { TransparencyService } from './transparency.service';

type FindManyArgs = {
  where: { plan: { in: string[] }; status: { in: string[] } };
};

const rows = [
  {
    plan: SubscriptionPlan.SUPPORTER,
    amountCents: 1200,
    billingInterval: BillingInterval.month,
    showOnSupporterWall: true,
    wallName: null,
    user: {
      firstName: 'Julie',
      lastName: 'Martin',
      email: 'julie.martin@example.com',
    },
  },
  {
    plan: SubscriptionPlan.SUPPORTER,
    amountCents: 8000,
    billingInterval: BillingInterval.year,
    showOnSupporterWall: false,
    wallName: 'Hidden',
    user: {
      firstName: 'Marc',
      lastName: 'Durand',
      email: 'marc.durand@example.com',
    },
  },
];

function build(env: Record<string, string | undefined>) {
  const findMany = jest.fn((args: FindManyArgs) => {
    void args;
    return Promise.resolve(rows);
  });
  const prisma = {
    subscription: { findMany },
  } as unknown as PrismaService;
  const config = {
    get: (key: string) => env[key],
  } as unknown as ConfigService<ApiEnvSchemaType, true>;
  return { service: new TransparencyService(prisma, config), findMany };
}

const TIERS = {
  TRANSPARENCY_TIER_1_EUR: '10',
  TRANSPARENCY_TIER_2_EUR: '20',
  TRANSPARENCY_TIER_3_EUR: '40',
  TRANSPARENCY_TIER_4_EUR: '80',
};

describe('TransparencyService', () => {
  it('reads running subscriptions only', async () => {
    const { service, findMany } = build({});
    await service.get();
    const { where } = findMany.mock.calls[0][0];
    expect(where.status.in.sort()).toEqual(
      [SubscriptionStatus.active, SubscriptionStatus.trialing].sort(),
    );
    expect(where.plan.in).toContain(SubscriptionPlan.SUPPORTER);
  });

  it('gives the count, the tiers and the wall', async () => {
    const { service } = build(TIERS);
    // 12 € + 80 €/12, VAT taken out: about 15.56 €
    expect(await service.get()).toEqual({
      supporters: { count: 2, goal: expect.any(Number) },
      tiers: [100, 55, 0, 0],
      wall: ['Julie'],
    });
  });

  it('adds the small team as a fifth tier once its threshold is set', async () => {
    const { service } = build({ ...TIERS, TRANSPARENCY_TIER_5_EUR: '160' });
    expect((await service.get()).tiers).toEqual([100, 55, 0, 0, 0]);
  });

  it('keeps four tiers when the fifth does not top the fourth', async () => {
    const { service } = build({ ...TIERS, TRANSPARENCY_TIER_5_EUR: '50' });
    expect((await service.get()).tiers).toEqual([100, 55, 0, 0]);
  });

  it('gives no tiers without the thresholds', async () => {
    const { service } = build({
      TRANSPARENCY_TIER_1_EUR: '10',
      TRANSPARENCY_TIER_5_EUR: '160',
    });
    expect((await service.get()).tiers).toBeNull();
  });

  it('never returns an amount, an email or a last name', async () => {
    const { service } = build(TIERS);
    const body = JSON.stringify(await service.get());
    expect(body).not.toMatch(/@/);
    expect(body).not.toMatch(/amount|cents|eur|revenue|threshold/i);
    expect(body).not.toContain('Martin');
    expect(body).not.toContain('Durand');
    expect(body).not.toContain('Hidden');
    // No threshold or price value either
    for (const value of [...Object.values(TIERS), '1200', '8000', '15']) {
      expect(body).not.toMatch(new RegExp(`\\b${value}\\b`));
    }
  });

  it('caches for an hour, and forgets on a wall change', async () => {
    const { service, findMany } = build({});
    await service.get(0);
    await service.get(59 * 60 * 1000);
    expect(findMany).toHaveBeenCalledTimes(1);
    await service.get(61 * 60 * 1000);
    expect(findMany).toHaveBeenCalledTimes(2);
    service.invalidate();
    await service.get(62 * 60 * 1000);
    expect(findMany).toHaveBeenCalledTimes(3);
  });
});
