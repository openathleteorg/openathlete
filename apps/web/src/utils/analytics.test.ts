import { beforeEach, describe, expect, it, vi } from 'vitest';

import { analyticsPersonProperties, analyticsPlatform } from './analytics';

const { getPlatform } = vi.hoisted(() => ({
  getPlatform: vi.fn(() => 'web'),
}));
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform, isNativePlatform: () => false },
}));

const user = {
  roles: ['ATHLETE' as const, 'COACH' as const],
  language: 'FR' as const,
  onboardingCompleted: true,
  createdAt: new Date('2026-11-01T08:00:00Z'),
};

describe('analyticsPlatform', () => {
  beforeEach(() => getPlatform.mockReturnValue('web'));

  it('names the native apps and treats anything else as the web', () => {
    expect(analyticsPlatform()).toBe('web');
    getPlatform.mockReturnValue('ios');
    expect(analyticsPlatform()).toBe('ios');
    getPlatform.mockReturnValue('android');
    expect(analyticsPlatform()).toBe('android');
    getPlatform.mockReturnValue('electron');
    expect(analyticsPlatform()).toBe('web');
  });
});

describe('analyticsPersonProperties', () => {
  it('keeps categories and the signup date, never the identity', () => {
    const { set, setOnce } = analyticsPersonProperties(
      { ...user, acquisitionSource: 'REDDIT' },
      'SUPPORTER',
    );
    expect(set).toEqual({
      roles: ['ATHLETE', 'COACH'],
      is_coach: true,
      language: 'FR',
      onboarding_completed: true,
      platform: 'web',
      plan: 'SUPPORTER',
      acquisition_source: 'REDDIT',
    });
    expect(setOnce).toEqual({ signed_up_at: '2026-11-01T08:00:00.000Z' });
  });

  it('leaves out what is not known yet', () => {
    const { set } = analyticsPersonProperties({
      ...user,
      roles: ['ATHLETE'],
      acquisitionSource: null,
    });
    expect(set).not.toHaveProperty('plan');
    expect(set).not.toHaveProperty('acquisition_source');
    expect(set.is_coach).toBe(false);
  });
});
