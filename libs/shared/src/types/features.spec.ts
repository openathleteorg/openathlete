import { describe, expect, it } from 'vitest';

import { OFFERS, Offer, entitlementsOf } from './entitlements';
import {
  FEATURES,
  Feature,
  FeatureRule,
  featureAccess,
  featureAccessMap,
  staleEarlyAccess,
} from './features';

const FREE = { supporterPerks: false, coachTools: false };
const SUPPORTER = { supporterPerks: true, coachTools: true };
const SEAT = { supporterPerks: true, coachTools: false };
const STAFF = { supporterPerks: false, coachTools: true };

const at = (iso: string) => new Date(iso);

// A registry of its own, so the tests outlive the real entries
const registry: Record<string, FeatureRule> = {
  world: {
    perk: 'everyone',
    earlyAccess: { since: '2026-12-01' },
    teaser: 'preview',
    serverEnforced: true,
  },
  short: {
    perk: 'supporter',
    earlyAccess: { since: '2026-12-01', days: 7 },
    teaser: 'hidden',
    serverEnforced: true,
  },
  lab: { perk: 'supporter', teaser: 'preview', serverEnforced: true },
  tools: { perk: 'coachTools', teaser: 'locked-entry', serverEnforced: true },
};

const access = (
  feature: string,
  perks: typeof FREE,
  now: Date,
  billingEnabled = true,
) =>
  featureAccess(feature as Feature, { billingEnabled, perks, now }, registry);

describe('featureAccess', () => {
  it('opens everything without billing, whatever the rights', () => {
    for (const feature of Object.keys(registry)) {
      expect(access(feature, FREE, at('2026-12-02T12:00:00Z'), false)).toEqual({
        available: true,
        reason: 'free',
        availableToAllOn: null,
      });
    }
    for (const feature of Object.values(Feature)) {
      expect(
        featureAccess(feature, {
          billingEnabled: false,
          perks: FREE,
          now: new Date(),
        }).available,
      ).toBe(true);
    }
  });

  it('keeps an early access to Supporters, with its end date', () => {
    const now = at('2026-12-15T10:00:00Z');
    expect(access('world', FREE, now)).toEqual({
      available: false,
      reason: 'early-access',
      availableToAllOn: '2026-12-31',
    });
    expect(access('world', SUPPORTER, now).available).toBe(true);
    // A coach seat holds the Supporter perks
    expect(access('world', SEAT, now).available).toBe(true);
    // Club staff rights are coach tools only
    expect(access('world', STAFF, now).available).toBe(false);
  });

  it('opens an early access at the exact UTC day it ends', () => {
    expect(
      access('world', FREE, at('2026-12-30T23:59:59.999Z')).available,
    ).toBe(false);
    expect(access('world', FREE, at('2026-12-31T00:00:00Z'))).toEqual({
      available: true,
      reason: 'free',
      availableToAllOn: null,
    });
    expect(access('short', FREE, at('2026-12-08T00:00:00Z')).reason).toBe(
      'locked',
    );
    expect(access('short', FREE, at('2026-12-07T23:59:59Z')).reason).toBe(
      'early-access',
    );
  });

  it('does not depend on the timezone of the machine', () => {
    // Dates are absolute instants: the TZ of the test run must not move them
    const end = at('2026-12-31T00:00:00+01:00'); // 23:00 UTC on the 30th
    expect(access('world', FREE, end).available).toBe(false);
  });

  it('applies the perk once the early access is over', () => {
    const now = at('2027-03-01T00:00:00Z');
    expect(access('lab', FREE, now)).toEqual({
      available: false,
      reason: 'locked',
      availableToAllOn: null,
    });
    expect(access('lab', SUPPORTER, now).reason).toBe('perk');
    expect(access('tools', STAFF, now).reason).toBe('perk');
    expect(access('tools', SEAT, now).reason).toBe('locked');
    expect(access('lab', STAFF, now).reason).toBe('locked');
  });

  it('gives each offer the rights of the plan', () => {
    const perks = (offer: Offer, founder = false) => {
      const { supporterPerks, coachTools } = entitlementsOf(offer, founder);
      return { supporterPerks, coachTools };
    };
    expect(perks(Offer.FREE)).toEqual(FREE);
    expect(perks(Offer.SUPPORTER)).toEqual(SUPPORTER);
    expect(perks(Offer.SUPPORTER, true)).toEqual(SUPPORTER);
    expect(perks(Offer.COACH)).toEqual(SUPPORTER);
    expect(perks(Offer.COACH_PRO)).toEqual(SUPPORTER);
    expect(perks(Offer.CLUB)).toEqual(STAFF);
    expect(perks(Offer.CLUB_PLUS)).toEqual(STAFF);
    expect(perks(Offer.COACH_SEAT)).toEqual(SEAT);
    // Founders keep every Supporter perk
    expect(entitlementsOf(Offer.SUPPORTER, true).supporterPerks).toBe(
      OFFERS[Offer.SUPPORTER].supporterPerks,
    );
  });

  it('builds the map the API sends, one entry per feature', () => {
    const map = featureAccessMap({
      billingEnabled: true,
      perks: FREE,
      now: new Date(),
    });
    expect(Object.keys(map).sort()).toEqual(Object.values(Feature).sort());
  });
});

describe('FEATURES', () => {
  it('has no early access public for more than 60 days: remove the field', () => {
    expect(staleEarlyAccess(new Date())).toEqual([]);
  });

  it('flags a stale early access', () => {
    expect(staleEarlyAccess(at('2027-03-01T00:00:00Z'), registry)).toEqual([
      'world',
      'short',
    ]);
    expect(staleEarlyAccess(at('2027-02-28T00:00:00Z'), registry)).toEqual([
      'short',
    ]);
  });

  it('has valid dates', () => {
    for (const rule of Object.values(FEATURES)) {
      if (rule.earlyAccess) {
        expect(rule.earlyAccess.since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
