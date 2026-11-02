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
    {} as never,
    queue as never,
    emitter as never,
  );
  return { processor, emitter, queue };
}

const job = (bulkImport = false) =>
  ({
    data: {
      providerAccountId: 7,
      activity: { externalId: 'strava-1' },
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
});
