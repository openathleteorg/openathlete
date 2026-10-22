import { ProviderAccount } from '@openathlete/database';

import { ActivityReconciliationService } from '../../core/services/activity-reconciliation.service';
import { GarminProviderService } from './garmin.provider.service';
import { StravaProviderService } from './strava.provider.service';

jest.mock('../../core/helpers/activity-file-parser.service', () => ({
  ActivityFileParserService: class {},
}));

describe('provider reconciliation wiring', () => {
  const account = { athleteId: 42, providerAccountId: 7 } as ProviderAccount;
  const activity = {
    externalId: '123',
    name: 'Recorded run',
    sport: 'RUNNING',
    startDate: new Date('2026-10-20T08:00:00Z'),
    endDate: new Date('2026-10-20T09:00:00Z'),
    raw: {
      id: 123,
      activityId: '123',
      type: 'Run',
      sport_type: 'Run',
      activityType: 'RUNNING',
      moving_time: 3500,
      elapsed_time: 3600,
      durationInSeconds: 3500,
      distance: 10000,
      distanceInMeters: 10000,
      total_elevation_gain: 100,
      manual: false,
    },
  };
  function setup() {
    const prisma = {
      event: { create: jest.fn() },
      eventActivity: { create: jest.fn() },
    };
    const reconciliation = {
      findSource: jest.fn().mockResolvedValue(null),
      reconcile: jest.fn().mockResolvedValue({
        activity: { eventActivityId: 9, eventId: 10 },
        created: false,
        status: 'enriched',
        receiptId: 8,
        revision: 1,
        processingPending: true,
      }),
    };
    const config = { get: jest.fn(), getOrThrow: jest.fn() };
    const strava = new StravaProviderService(
      prisma as never,
      config as never,
      {} as never,
      reconciliation as unknown as ActivityReconciliationService,
    );
    const garmin = new GarminProviderService(
      prisma as never,
      config as never,
      {} as never,
      {} as never,
      reconciliation as unknown as ActivityReconciliationService,
    );
    jest
      .spyOn(
        garmin as unknown as { getPendingFile: () => Promise<unknown> },
        'getPendingFile',
      )
      .mockResolvedValue(null);
    return { prisma, reconciliation, strava, garmin };
  }

  it('fetches Strava streams then reconciles, without creating a provisional activity', async () => {
    const { strava, prisma, reconciliation } = setup();
    jest
      .spyOn(
        strava as unknown as {
          makeAuthenticatedRequest: () => Promise<unknown>;
        },
        'makeAuthenticatedRequest',
      )
      .mockResolvedValue([
        { type: 'time', data: [0, 1, 2] },
        { type: 'heartrate', data: [120, 121, 122] },
      ]);
    expect((await strava.importActivity(account, activity)).created).toBe(
      false,
    );
    expect(reconciliation.reconcile).toHaveBeenCalledWith(
      42,
      'STRAVA',
      '123',
      expect.objectContaining({
        original: false,
        startDate: activity.startDate.toISOString(),
        stream: { time: [0, 1, 2], heartrate: [120, 121, 122] },
      }),
    );
    expect(prisma.event.create).not.toHaveBeenCalled();
    expect(prisma.eventActivity.create).not.toHaveBeenCalled();
  });

  it('reconciles Garmin summaries and distinguishes multisport legs', async () => {
    const { garmin, reconciliation, prisma } = setup();
    await garmin.importActivity(account, {
      ...activity,
      raw: { ...activity.raw, parentSummaryId: 'parent-1' },
    });
    expect(reconciliation.reconcile).toHaveBeenCalledWith(
      42,
      'GARMIN',
      '123',
      expect.objectContaining({
        original: true,
        recordingKind: 'multisport_leg',
      }),
    );
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it.each(['strava', 'garmin'] as const)(
    'returns a known %s source and its pending dispatch without creating anything',
    async (kind) => {
      const setupResult = setup();
      setupResult.reconciliation.findSource.mockResolvedValue({
        activitySourceId: 8,
        revision: 2,
        processingPending: true,
        eventActivity: { eventActivityId: 9, eventId: 10 },
      });
      expect(
        await setupResult[kind].importActivity(account, activity),
      ).toMatchObject({
        created: false,
        receiptId: 8,
        revision: 2,
        processingPending: true,
      });
      expect(setupResult.reconciliation.reconcile).not.toHaveBeenCalled();
    },
  );
});
