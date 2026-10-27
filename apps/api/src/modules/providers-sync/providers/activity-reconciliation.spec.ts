import { ProviderAccount } from '@openathlete/database';

import { ActivityReconciliationService } from '../../core/services/activity-reconciliation.service';
import { GarminProviderService } from './garmin.provider.service';
import { StravaProviderService } from './strava.provider.service';

jest.mock('../../core/helpers/activity-file-parser.service', () => ({
  ActivityFileParserService: class {},
}));

describe('provider reconciliation wiring', () => {
  const account = {
    athleteId: 42,
    providerAccountId: 7,
    importActivitiesEnabled: true,
  } as ProviderAccount;
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
      markDispatched: jest.fn(),
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
    const parser = {
      parseByFileType: jest.fn().mockResolvedValue({
        stream: { time: [0, 1], heartrate: [120, 121] },
        segments: [{ startTimeSeconds: 0, endTimeSeconds: 1, name: 'Lap' }],
      }),
    };
    const queue = { addActivityProcessingJob: jest.fn() };
    const garmin = new GarminProviderService(
      prisma as never,
      config as never,
      queue as never,
      parser as never,
      reconciliation as unknown as ActivityReconciliationService,
    );
    return { prisma, reconciliation, strava, garmin, parser, queue };
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
  function recording() {
    return {
      name: activity.name,
      startDate: activity.startDate.toISOString(),
      endDate: activity.endDate.toISOString(),
      values: { sport: 'RUNNING', distance: 10000 },
      stream: { time: [0, 1], heartrate: [100, 101] },
      original: true,
      recordingKind: 'single',
    };
  }

  it('reconciles manual Garmin updates while retaining the recorded file channels', async () => {
    const { garmin, reconciliation } = setup();
    reconciliation.findSource.mockResolvedValue({ payload: recording() });
    await garmin.importActivity(account, activity, true);
    expect(reconciliation.reconcile).toHaveBeenCalledWith(
      42,
      'GARMIN',
      '123',
      expect.objectContaining({
        stream: recording().stream,
        values: expect.objectContaining({ distance: 10000 }),
      }),
    );
  });

  it.each([false, true])(
    'answers a file notification and reconciles its stored source (pending review: %s)',
    async (review) => {
      const { garmin, reconciliation, queue } = setup();
      reconciliation.findSource.mockResolvedValue({
        payload: recording(),
        eventActivityId: review ? null : 9,
      });
      if (review)
        reconciliation.reconcile.mockResolvedValue({
          activity: null,
          created: false,
          receiptId: 8,
          revision: 2,
          processingPending: false,
        });
      const pull = jest
        .spyOn(garmin as never, 'pullCallback')
        .mockResolvedValue(new ArrayBuffer(1) as never);
      await (
        garmin as unknown as {
          processActivityFile: (
            notification: unknown,
            account: ProviderAccount,
            last: boolean,
          ) => Promise<void>;
        }
      ).processActivityFile(
        {
          callbackURL: 'https://apis.garmin.com/file?token=example',
          entry: { activityId: '123', fileType: 'FIT' },
        },
        account,
        false,
      );
      expect(pull).toHaveBeenCalledTimes(1);
      expect(reconciliation.reconcile).toHaveBeenCalledWith(
        42,
        'GARMIN',
        '123',
        expect.objectContaining({
          stream: { time: [0, 1], heartrate: [120, 121] },
          laps: [
            {
              startDate: activity.startDate.toISOString(),
              endDate: '2026-10-20T08:00:01.000Z',
              name: 'Lap',
            },
          ],
        }),
      );
      if (review) expect(queue.addActivityProcessingJob).not.toHaveBeenCalled();
      else expect(reconciliation.markDispatched).toHaveBeenCalledWith(8, 1);
    },
  );

  it('answers ignored-source file notifications without reopening review or creating an activity', async () => {
    const { garmin, reconciliation, parser } = setup();
    reconciliation.findSource.mockResolvedValue({
      eventActivityId: null,
      reviewDecision: { action: 'ignore' },
    });
    const pull = jest
      .spyOn(garmin as never, 'pullCallback')
      .mockResolvedValue(new ArrayBuffer(1) as never);
    await (
      garmin as unknown as {
        processActivityFile: (
          notification: unknown,
          account: ProviderAccount,
          last: boolean,
        ) => Promise<void>;
      }
    ).processActivityFile(
      {
        callbackURL: 'https://apis.garmin.com/file?token=example',
        entry: { activityId: '123', fileType: 'FIT' },
      },
      account,
      false,
    );
    expect(pull).toHaveBeenCalledTimes(1);
    expect(parser.parseByFileType).not.toHaveBeenCalled();
    expect(reconciliation.reconcile).not.toHaveBeenCalled();
  });
});
