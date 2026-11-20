import { SubscriptionController } from '../controllers/subscription.controller';
import { SubscriptionService } from './subscription.service';

const VIEWER = 1;
const MY_ATHLETE = 2;
const STRANGER = 3;
const CLUB_MATE = 4;

const running = (userId: number, showSupporterBadge = true) => ({
  userId,
  plan: 'SUPPORTER',
  status: 'active',
  provider: 'stripe',
  showSupporterBadge,
});

function service(subscriptions: ReturnType<typeof running>[]) {
  const prisma = {
    coachAthlete: {
      findMany: jest.fn(async ({ where }: { where: { userId?: unknown } }) =>
        where.userId === VIEWER ? [{ athlete: { userId: MY_ATHLETE } }] : [],
      ),
    },
    clubMember: {
      findMany: jest.fn(async () => [{ userId: CLUB_MATE }]),
    },
    messageThreadParticipant: { findMany: jest.fn(async () => []) },
    subscription: {
      findMany: jest.fn(
        async ({
          where,
        }: {
          where: { userId: { in: number[] }; showSupporterBadge: boolean };
        }) =>
          subscriptions.filter(
            (subscription) =>
              where.userId.in.includes(subscription.userId) &&
              subscription.showSupporterBadge === where.showSupporterBadge,
          ),
      ),
    },
  };
  const subscriptionService = Object.create(
    SubscriptionService.prototype,
  ) as SubscriptionService;
  Object.assign(subscriptionService, { prisma });
  return { subscriptionService, prisma };
}

describe('Supporter badges', () => {
  it('shows only the badges of people the viewer sees in the app', async () => {
    const { subscriptionService, prisma } = service([
      running(MY_ATHLETE),
      running(STRANGER),
      running(CLUB_MATE, false),
    ]);
    const shown = await subscriptionService.supporterBadges(VIEWER, [
      MY_ATHLETE,
      STRANGER,
      CLUB_MATE,
    ]);
    expect(shown).toEqual([MY_ATHLETE]);
    // The stranger is never even looked up
    const asked = prisma.subscription.findMany.mock.calls[0][0].where.userId.in;
    expect(asked).not.toContain(STRANGER);
  });

  it('shows none without billing', async () => {
    const controller = new SubscriptionController(
      { supporterBadges: jest.fn() } as never,
      { billingEnabled: false } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { emit: jest.fn() } as never,
      { invalidate: jest.fn() } as never,
    );
    await expect(
      controller.getSupporterBadges({ userId: VIEWER } as never, {
        userIds: [MY_ATHLETE],
      }),
    ).resolves.toEqual({ userIds: [] });
  });
});
