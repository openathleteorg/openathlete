import { afterEach, describe, expect, it, vi } from 'vitest';

import { shouldShowSupportReminder } from './support-reminder';

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
