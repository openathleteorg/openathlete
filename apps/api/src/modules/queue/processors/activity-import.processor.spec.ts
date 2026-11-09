import { Job } from 'bullmq';

import { ConnectorProvider } from '@openathlete/database';

import { CoachActivityNoticeEvent } from '../../../events/coach-activity-notice.event';
import { ActivityImportJobData } from '../queue.service';
import { ActivityImportProcessor } from './activity-import.processor';

// The real provider services load ESM-only SDKs; the tests pass fakes
jest.mock('../../providers-sync/providers', () => ({
  GarminProviderService: class {},
  PolarProviderService: class {},
  StravaProviderService: class {},
  SuuntoProviderService: class {},
}));

jest.mock('../../core/services/activity-duplicate.service', () => ({
  ActivityDuplicateService: class {},
}));

jest.mock(
  '../../providers-sync/activity-description/activity-description.service',
  () => ({
    ActivityDescriptionService: class {},
    AFTER_DUPLICATE_DELAY_MS: 180000,
  }),
);

const saved = { eventActivityId: 31, eventId: 30 };

function setup(
  created: boolean,
  {
    known = false,
    copy = null,
    provider = ConnectorProvider.STRAVA,
  }: {
    known?: boolean;
    copy?: { eventId: number; eventActivityId: number } | null;
    provider?: ConnectorProvider;
  } = {},
) {
  const prisma = {
    providerAccount: {
      findUnique: jest.fn().mockResolvedValue({
        providerAccountId: 7,
        athleteId: 70,
        provider,
        status: 'active',
        importActivitiesEnabled: true,
      }),
    },
    eventActivity: {
      findUnique: jest
        .fn()
        // The same source's copy, looked up by its id first
        .mockResolvedValueOnce(known ? { eventActivityId: 31 } : null)
        .mockResolvedValue({ stream: {} }),
    },
  };
  const duplicates = { findDuplicate: jest.fn().mockResolvedValue(copy) };
  const strava = {
    importActivity: jest.fn().mockResolvedValue({ activity: saved, created }),
  };
  const queue = { addActivityProcessingJob: jest.fn() };
  const emitter = { emit: jest.fn() };
  const descriptions = { schedule: jest.fn().mockResolvedValue(true) };
  const processor = new ActivityImportProcessor(
    prisma as never,
    strava as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    queue as never,
    duplicates as never,
    emitter as never,
    undefined,
    descriptions as never,
  );
  return { processor, emitter, queue, strava, duplicates, descriptions };
}

const job = (bulkImport = false) =>
  ({
    data: {
      providerAccountId: 7,
      activity: {
        externalId: 'strava-1',
        startDate: '2026-01-06T07:00:00.000Z',
        endDate: '2026-01-06T08:00:00.000Z',
        duration: 3600,
      },
      bulkImport,
    },
    updateProgress: jest.fn(),
  }) as unknown as Job<ActivityImportJobData>;

describe('ActivityImportProcessor', () => {
  it('announces an activity to coaches when this import saved it', async () => {
    const { processor, emitter, queue } = setup(true);
    await expect(processor.process(job())).resolves.toMatchObject({
      success: true,
      eventId: 30,
    });
    expect(emitter.emit).toHaveBeenCalledWith(
      CoachActivityNoticeEvent.SLUG,
      expect.objectContaining({
        payload: { eventId: 30, kind: 'ACTIVITY', deliveryKey: 'import:30' },
      }),
    );
    expect(queue.addActivityProcessingJob).toHaveBeenCalledWith(31, 30, false);
  });

  it('stays silent for an activity that was already saved', async () => {
    const { processor, emitter, queue } = setup(false);
    await processor.process(job());
    expect(emitter.emit).not.toHaveBeenCalled();
    // It is still processed, as before
    expect(queue.addActivityProcessingJob).toHaveBeenCalled();
  });

  it('stays silent during a history import', async () => {
    const { processor, emitter } = setup(true);
    await processor.process(job(true));
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('skips an activity another source already saved', async () => {
    const { processor, strava, queue, emitter, duplicates } = setup(true, {
      copy: { eventId: 12, eventActivityId: 13 },
    });
    await expect(processor.process(job())).resolves.toMatchObject({
      success: true,
      skipped: 'duplicate',
      eventId: 12,
    });
    expect(duplicates.findDuplicate).toHaveBeenCalledWith(70, {
      source: ConnectorProvider.STRAVA,
      startDate: new Date('2026-01-06T07:00:00.000Z'),
      endDate: new Date('2026-01-06T08:00:00.000Z'),
      movingTime: 3600,
    });
    expect(strava.importActivity).not.toHaveBeenCalled();
    expect(queue.addActivityProcessingJob).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('describes a skipped Strava copy from the activity already saved', async () => {
    const { processor, descriptions } = setup(true, {
      copy: { eventId: 12, eventActivityId: 13 },
    });
    await processor.process(job());
    expect(descriptions.schedule).toHaveBeenCalledWith({
      athleteId: 70,
      stravaActivityId: 'strava-1',
      eventActivityId: 13,
      startDate: new Date('2026-01-06T07:00:00.000Z'),
      delayMs: 180000,
    });
  });

  it('describes no skipped copy from a history import or another provider', async () => {
    const copy = { eventId: 12, eventActivityId: 13 };
    const bulk = setup(true, { copy });
    await bulk.processor.process(job(true));
    expect(bulk.descriptions.schedule).not.toHaveBeenCalled();

    const garmin = setup(true, { copy, provider: ConnectorProvider.GARMIN });
    await garmin.processor.process(job());
    expect(garmin.descriptions.schedule).not.toHaveBeenCalled();
  });

  it('still skips the copy when its description cannot be queued', async () => {
    const { processor, descriptions } = setup(true, {
      copy: { eventId: 12, eventActivityId: 13 },
    });
    descriptions.schedule.mockRejectedValue(new Error('Redis down'));
    await expect(processor.process(job())).resolves.toMatchObject({
      skipped: 'duplicate',
    });
  });

  it('leaves an activity this source saved to its provider', async () => {
    const { processor, strava, duplicates } = setup(false, { known: true });
    await processor.process(job());
    expect(duplicates.findDuplicate).not.toHaveBeenCalled();
    expect(strava.importActivity).toHaveBeenCalled();
  });
});
