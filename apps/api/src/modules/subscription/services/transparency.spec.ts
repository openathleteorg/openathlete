import { BillingInterval } from '@openathlete/shared';

import {
  VAT_RATE,
  monthlyRevenueEur,
  tierProgress,
  wallNames,
} from './transparency';

// Made-up thresholds: the real ones live only in the hosted environment
const LADDER = [100, 300, 600, 1000];

describe('monthlyRevenueEur', () => {
  it('takes VAT out of a monthly price', () => {
    expect(
      monthlyRevenueEur([
        { amountCents: 1200, billingInterval: BillingInterval.MONTH },
      ]),
    ).toBeCloseTo(12 / (1 + VAT_RATE));
  });

  it('counts a twelfth of a yearly price each month', () => {
    expect(
      monthlyRevenueEur([
        { amountCents: 12000, billingInterval: BillingInterval.YEAR },
      ]),
    ).toBeCloseTo(10 / (1 + VAT_RATE));
  });

  it('adds up subscriptions and prices old rows at the lowest tier', () => {
    const lowestMonthly = monthlyRevenueEur([
      { amountCents: null, billingInterval: BillingInterval.MONTH },
    ]);
    expect(lowestMonthly).toBeGreaterThan(0);
    expect(
      monthlyRevenueEur([
        { amountCents: null, billingInterval: BillingInterval.MONTH },
        { amountCents: 1200, billingInterval: BillingInterval.YEAR },
      ]),
    ).toBeCloseTo(lowestMonthly + 1 / (1 + VAT_RATE));
  });

  it('is zero without subscriptions', () => {
    expect(monthlyRevenueEur([])).toBe(0);
  });
});

describe('tierProgress', () => {
  it('marks reached tiers 100, the current one partly, the next ones 0', () => {
    expect(tierProgress(450, LADDER)).toEqual([100, 100, 50, 0]);
  });

  it('measures each tier within its own step', () => {
    expect(tierProgress(40, LADDER)).toEqual([40, 0, 0, 0]);
  });

  it('reaches a tier exactly at its threshold', () => {
    expect(tierProgress(300, LADDER)).toEqual([100, 100, 0, 0]);
  });

  it('never rounds a tier not yet reached up to 100', () => {
    expect(tierProgress(99.99, LADDER)).toEqual([99, 0, 0, 0]);
  });

  it('fills every tier past the last threshold', () => {
    expect(tierProgress(5000, LADDER)).toEqual([100, 100, 100, 100]);
  });

  it('starts at zero', () => {
    expect(tierProgress(0, LADDER)).toEqual([0, 0, 0, 0]);
  });

  it('is null when a threshold is missing', () => {
    expect(tierProgress(450, [100, undefined, 600, 1000])).toBeNull();
    expect(
      tierProgress(450, [undefined, undefined, undefined, undefined]),
    ).toBeNull();
    expect(tierProgress(450, [])).toBeNull();
  });

  it('is null when the thresholds do not increase', () => {
    expect(tierProgress(450, [100, 300, 300, 1000])).toBeNull();
    expect(tierProgress(450, [0, 300, 600, 1000])).toBeNull();
  });
});

describe('wallNames', () => {
  it('lists only those who agreed, by chosen name or first name', () => {
    expect(
      wallNames([
        { showOnSupporterWall: true, wallName: null, firstName: 'Julie' },
        { showOnSupporterWall: false, wallName: 'Hidden', firstName: 'Marc' },
        { showOnSupporterWall: true, wallName: ' TrailFox ', firstName: 'Léa' },
        { showOnSupporterWall: true, wallName: '  ', firstName: 'Tom' },
      ]),
    ).toEqual(['Julie', 'TrailFox', 'Tom']);
  });

  it('skips empty names and cuts long ones', () => {
    const names = wallNames([
      { showOnSupporterWall: true, wallName: null, firstName: ' ' },
      { showOnSupporterWall: true, wallName: 'x'.repeat(50), firstName: 'A' },
    ]);
    expect(names).toEqual(['x'.repeat(30)]);
  });
});
