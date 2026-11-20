import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ClubRole } from '@openathlete/database';
import {
  FEATURE_LOCKED_ERROR,
  Feature,
  OFFERS,
  Offer,
  OfferEntitlements,
} from '@openathlete/shared';

import { PrismaService } from '../../prisma/services/prisma.service';
import { FeatureAccessService } from './feature-access.service';
import { StripeService } from './stripe.service';
import { SubscriptionService } from './subscription.service';

const FREE_COACH = 1;
const SUPPORTER = 2;
const OWNER_FREE = 3;
const OWNER_SUPPORTER = 4;
const CLUB_OF_FREE_OWNER = 10;
const CLUB_OF_SUPPORTER = 20;

function build({
  billing = true,
  clock,
}: { billing?: boolean; clock?: string } = {}) {
  const offers: Record<number, Offer> = {
    [FREE_COACH]: Offer.FREE,
    [SUPPORTER]: Offer.SUPPORTER,
    [OWNER_FREE]: Offer.FREE,
    [OWNER_SUPPORTER]: Offer.SUPPORTER,
  };
  const getOrCreateSubscription = jest.fn(async (userId: number) => ({
    userId,
  }));
  const subscriptionService = {
    getOrCreateSubscription,
    entitlements: (subscription: { userId: number }): OfferEntitlements =>
      OFFERS[offers[subscription.userId]],
  } as unknown as SubscriptionService;
  const prisma = {
    clubMember: {
      findFirst: jest.fn(
        async ({ where }: { where: { clubId: number; role: ClubRole } }) =>
          ({
            [CLUB_OF_FREE_OWNER]: { userId: OWNER_FREE },
            [CLUB_OF_SUPPORTER]: { userId: OWNER_SUPPORTER },
          })[where.clubId] ?? null,
      ),
    },
  } as unknown as PrismaService;
  const config = {
    get: () => clock,
  } as unknown as ConfigService;
  const service = new FeatureAccessService(
    subscriptionService,
    { billingEnabled: billing } as StripeService,
    prisma,
    config as never,
  );
  return { service, getOrCreateSubscription };
}

describe('FeatureAccessService', () => {
  it('opens every feature without billing, without reading the subscription', async () => {
    const { service, getOrCreateSubscription } = build({ billing: false });
    const map = await service.accessMap(FREE_COACH);
    expect(Object.values(map).every((access) => access.available)).toBe(true);
    expect(await service.can(FREE_COACH, Feature.LAB)).toBe(true);
    expect(getOrCreateSubscription).not.toHaveBeenCalled();
  });

  it('follows the subscription with billing', async () => {
    const { service } = build();
    expect(await service.can(FREE_COACH, Feature.LAB)).toBe(false);
    expect(await service.can(FREE_COACH, Feature.COACH_COLUMNS)).toBe(false);
    expect(await service.can(SUPPORTER, Feature.LAB)).toBe(true);
    expect(await service.can(SUPPORTER, Feature.COACH_COLUMNS)).toBe(true);
  });

  it('gives club staff the coach tools of a Supporter owner, in the club only', async () => {
    const { service } = build();
    const inClub = { clubId: CLUB_OF_SUPPORTER };
    expect(await service.can(FREE_COACH, Feature.COACH_BROADCAST, inClub)).toBe(
      true,
    );
    // Not the owner's own Supporter perks
    expect(await service.can(FREE_COACH, Feature.LAB, inClub)).toBe(false);
    expect(await service.can(FREE_COACH, Feature.COACH_BROADCAST)).toBe(false);
    expect(
      await service.can(FREE_COACH, Feature.COACH_BROADCAST, {
        clubId: CLUB_OF_FREE_OWNER,
      }),
    ).toBe(false);
  });

  it('never gives less than the user’s own rights in a club', async () => {
    const { service } = build();
    expect(
      await service.can(SUPPORTER, Feature.COACH_COLUMNS, {
        clubId: CLUB_OF_FREE_OWNER,
      }),
    ).toBe(true);
  });

  it('throws FEATURE_LOCKED with the feature key', async () => {
    const { service } = build();
    await expect(service.assert(FREE_COACH, Feature.IMAGES)).rejects.toThrow(
      ForbiddenException,
    );
    try {
      await service.assert(FREE_COACH, Feature.IMAGES);
    } catch (error) {
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        code: FEATURE_LOCKED_ERROR,
        feature: Feature.IMAGES,
      });
    }
  });

  it('takes FEATURES_CLOCK as today', () => {
    expect(build({ clock: '2027-01-15' }).service.now().toISOString()).toBe(
      '2027-01-15T12:00:00.000Z',
    );
    expect(Math.abs(build().service.now().getTime() - Date.now())).toBeLessThan(
      1000,
    );
  });
});
