import { Job, UnrecoverableError } from 'bullmq';

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

const saved = { eventActivityId: 31, eventId: 30 };

function setup(created: boolean) {
  const prisma = {
    providerAccount: {
      findUnique: jest.fn().mockResolvedValue({
        providerAccountId: 7,
        provider: ConnectorProvider.STRAVA,
        status: 'active',
        importActivitiesEnabled: true,
      }),
    },
    eventActivity: {
      findUnique: jest.fn().mockResolvedValue({ stream: {} }),
    },
  };
  const strava = {
    importActivity: jest.fn().mockResolvedValue({ activity: saved, created }),
  };
  const queue = { addActivityProcessingJob: jest.fn() };
  const emitter = { emit: jest.fn() };
  const processor = new ActivityImportProcessor(
    prisma as never,
    strava as never,
    {} as never,
    {} as never,
    {} as never,
    queue as never,
    { markDispatched: jest.fn() } as never,
    emitter as never,
  );
  return { processor, emitter, queue, strava, prisma };
}

const job = (bulkImport = false) =>
  ({
    data: {
      providerAccountId: 7,
      activity: {
        externalId: 'strava-1',
        startDate: '2026-10-22T10:00:00Z',
        endDate: '2026-10-22T11:00:00Z',
      },
      bulkImport,
    },
    updateProgress: jest.fn(),
  }) as unknown as Job<ActivityImportJobData>;

describe('ActivityImportProcessor', () => {
  it('restores provider timestamps after the real queue JSON serialization boundary', async () => {
    const { processor, strava } = setup(true);
    const queued = job();
    queued.data.activity.startDate = new Date('2026-10-22T12:00:00+02:00');
    queued.data.activity.endDate = new Date('2026-10-22T13:00:00+02:00');
    queued.data = JSON.parse(JSON.stringify(queued.data));
    await processor.process(queued);
    const activity = strava.importActivity.mock.calls[0][1];
    expect(activity.startDate).toBeInstanceOf(Date);
    expect(activity.endDate).toBeInstanceOf(Date);
    expect(activity.startDate.toISOString()).toBe('2026-10-22T10:00:00.000Z');
    expect(activity.endDate.toISOString()).toBe('2026-10-22T11:00:00.000Z');
  });

  it('rejects malformed queue dates before loading accounts or calling providers', async () => {
    const { processor, prisma, strava } = setup(true);
    const queued = job();
    queued.data.activity.startDate = 'invalid';
    await expect(processor.process(queued)).rejects.toBeInstanceOf(
      UnrecoverableError,
    );
    expect(prisma.providerAccount.findUnique).not.toHaveBeenCalled();
    expect(strava.importActivity).not.toHaveBeenCalled();
  });
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
    expect(queue.addActivityProcessingJob).toHaveBeenCalledWith(
      31,
      30,
      false,
      undefined,
    );
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
});
