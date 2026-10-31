import { PostHog } from 'posthog-node';

import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { PrismaService } from '../prisma/services/prisma.service';
import { AnalyticsService, stableUuid } from './analytics.service';

const capture = jest.fn();
const captureException = jest.fn();

jest.mock('posthog-node', () => ({
  PostHog: jest.fn(() => ({ capture, captureException, shutdown: jest.fn() })),
}));

const config = (token?: string) =>
  ({ get: () => token }) as unknown as ConfigService<ApiEnvSchemaType, true>;

const prisma = (analyticsConsentAt: Date | null) =>
  ({
    user: { findUnique: jest.fn().mockResolvedValue({ analyticsConsentAt }) },
  }) as unknown as PrismaService;

describe('AnalyticsService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates no client and sends nothing without a token', async () => {
    const service = new AnalyticsService(prisma(new Date()), config());

    await service.capture(1, 'event');
    service.captureException(new Error('boom'));

    expect(PostHog).not.toHaveBeenCalled();
  });

  it('sends nothing about a user who did not consent', async () => {
    const service = new AnalyticsService(prisma(null), config('phc_test'));

    await service.capture(1, 'event');

    expect(capture).not.toHaveBeenCalled();
  });

  it('uses the distinct id of the web app for a user who consented', async () => {
    const service = new AnalyticsService(
      prisma(new Date()),
      config('phc_test'),
    );

    await service.capture(42, 'event', { a: 1 });

    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({
        distinctId: '42',
        event: 'event',
        properties: { a: 1 },
      }),
    );
  });

  it('keeps errors away from any person profile', () => {
    const service = new AnalyticsService(prisma(null), config('phc_test'));

    service.captureException(new Error('boom'), { queue: 'import' });

    expect(captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(String),
      { queue: 'import', $process_person_profile: false },
    );
  });

  it('never fails the work it observes', async () => {
    const broken = {
      user: { findUnique: jest.fn().mockRejectedValue(new Error('db')) },
    } as unknown as PrismaService;
    const service = new AnalyticsService(broken, config('phc_test'));

    await expect(service.capture(1, 'event')).resolves.toBeUndefined();
  });

  it('gives a webhook retry the same uuid', () => {
    expect(stableUuid('evt_1')).toBe(stableUuid('evt_1'));
    expect(stableUuid('evt_1')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
