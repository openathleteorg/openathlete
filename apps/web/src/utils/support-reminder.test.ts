import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  shouldShowSupportReminder,
  shouldShowSupporterReminder,
  supporterNudgeAllowed,
} from './support-reminder';

const platform = vi.hoisted(() => ({ name: 'web' }));
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => platform.name,
    isNativePlatform: () => platform.name !== 'web',
  },
}));

const now = new Date('2026-10-29T12:00:00Z');
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

const selfHosted = {
  billingEnabled: false,
  dismissed: false,
  accountCreatedAt: daysAgo(1),
  fullImportsCompletedAt: [],
  now,
};

describe('shouldShowSupportReminder', () => {
  afterEach(() => {
    platform.name = 'web';
    vi.unstubAllEnvs();
  });

  it('waits for a reason to ask', () => {
    expect(shouldShowSupportReminder(selfHosted)).toBe(false);
  });

  it('asks once a sync went through', () => {
    expect(
      shouldShowSupportReminder({
        ...selfHosted,
        fullImportsCompletedAt: [null, '2026-10-28T08:00:00Z'],
      }),
    ).toBe(true);
  });

  it('asks after 30 days of use', () => {
    expect(
      shouldShowSupportReminder({
        ...selfHosted,
        accountCreatedAt: daysAgo(29),
      }),
    ).toBe(false);
    expect(
      shouldShowSupportReminder({
        ...selfHosted,
        accountCreatedAt: daysAgo(30),
      }),
    ).toBe(true);
  });

  it('never asks again once dismissed', () => {
    expect(
      shouldShowSupportReminder({
        ...selfHosted,
        accountCreatedAt: daysAgo(90),
        dismissed: true,
      }),
    ).toBe(false);
  });

  it('never asks on the hosted instance, which sells Supporter', () => {
    expect(
      shouldShowSupportReminder({
        ...selfHosted,
        accountCreatedAt: daysAgo(90),
        billingEnabled: true,
      }),
    ).toBe(false);
  });

  it('never asks in the mobile apps, nor in builds without payments', () => {
    const due = { ...selfHosted, accountCreatedAt: daysAgo(90) };
    platform.name = 'ios';
    expect(shouldShowSupportReminder(due)).toBe(false);
    platform.name = 'android';
    expect(shouldShowSupportReminder(due)).toBe(false);
    platform.name = 'web';
    vi.stubEnv('VITE_DISABLE_PAYMENTS', 'true');
    expect(shouldShowSupportReminder(due)).toBe(false);
  });
});

describe('shouldShowSupporterReminder', () => {
  const hosted = {
    billingEnabled: true,
    isSupporter: false,
    dismissedAt: null,
    dismissCount: 0,
    fullImportsCompletedAt: [daysAgo(31).toISOString()],
    now,
  };

  afterEach(() => {
    platform.name = 'web';
  });

  it('asks a month after the history came in', () => {
    expect(shouldShowSupporterReminder(hosted)).toBe(true);
    expect(
      shouldShowSupporterReminder({
        ...hosted,
        fullImportsCompletedAt: [null, daysAgo(10).toISOString()],
      }),
    ).toBe(false);
  });

  it('comes back 90 days after being dismissed', () => {
    const dismissed = { ...hosted, dismissCount: 1 };
    expect(
      shouldShowSupporterReminder({ ...dismissed, dismissedAt: daysAgo(89) }),
    ).toBe(false);
    expect(
      shouldShowSupporterReminder({ ...dismissed, dismissedAt: daysAgo(90) }),
    ).toBe(true);
  });

  it('stops for good after three dismissals', () => {
    expect(
      shouldShowSupporterReminder({
        ...hosted,
        dismissCount: 3,
        dismissedAt: daysAgo(365),
      }),
    ).toBe(false);
  });

  it('never asks Supporters nor self-hosters', () => {
    expect(shouldShowSupporterReminder({ ...hosted, isSupporter: true })).toBe(
      false,
    );
    expect(
      shouldShowSupporterReminder({ ...hosted, billingEnabled: false }),
    ).toBe(false);
  });

  it('asks in the iOS app, which sells Supporter, never in the Android app', () => {
    platform.name = 'ios';
    expect(shouldShowSupporterReminder(hosted)).toBe(true);
    platform.name = 'android';
    expect(shouldShowSupporterReminder(hosted)).toBe(false);
  });
});

describe('supporterNudgeAllowed', () => {
  const hosted = {
    billingEnabled: true,
    isSupporter: false,
    seenAt: null,
    now,
  };

  afterEach(() => {
    platform.name = 'web';
  });

  it('mentions Supporter once every two weeks at most', () => {
    expect(supporterNudgeAllowed(hosted)).toBe(true);
    expect(supporterNudgeAllowed({ ...hosted, seenAt: daysAgo(13) })).toBe(
      false,
    );
    expect(supporterNudgeAllowed({ ...hosted, seenAt: daysAgo(14) })).toBe(
      true,
    );
  });

  it('never to Supporters, on self-hosted instances or in the Android app', () => {
    expect(supporterNudgeAllowed({ ...hosted, isSupporter: true })).toBe(false);
    expect(supporterNudgeAllowed({ ...hosted, billingEnabled: false })).toBe(
      false,
    );
    platform.name = 'android';
    expect(supporterNudgeAllowed(hosted)).toBe(false);
    platform.name = 'ios';
    expect(supporterNudgeAllowed(hosted)).toBe(true);
  });
});
