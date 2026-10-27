import { Job } from 'bullmq';

import { ProviderRecentSyncJobData } from '../queue.service';
import { ProviderRecentSyncProcessor } from './provider-recent-sync.processor';

jest.mock('../../providers-sync/providers', () => ({
  StravaProviderService: class {},
}));

describe('Strava catch-up worker', () => {
  const account = {
    providerAccountId: 7,
    provider: 'STRAVA',
    status: 'active',
    importActivitiesEnabled: true,
  };
  const job = {
    data: { providerAccountId: 7 },
    timestamp: Date.parse('2026-10-22T12:00:00Z'),
  } as Job<ProviderRecentSyncJobData>;
  function setup(value: object | null = account) {
    const prisma = {
      providerAccount: { findUnique: jest.fn().mockResolvedValue(value) },
    };
    const strava = {
      queueRecentImport: jest.fn().mockResolvedValue({ queuedActivities: 2 }),
    };
    return {
      prisma,
      strava,
      processor: new ProviderRecentSyncProcessor(
        prisma as never,
        strava as never,
      ),
    };
  }
  it('uses the queued request’s date and does not touch historical import state', async () => {
    const { processor, strava, prisma } = setup();
    await expect(processor.process(job)).resolves.toEqual({
      queuedActivities: 2,
    });
    expect(strava.queueRecentImport).toHaveBeenCalledWith(
      account,
      new Date(job.timestamp),
      expect.any(Function),
    );
    expect(Object.keys(prisma.providerAccount)).toEqual(['findUnique']);
  });
  it.each([
    null,
    { ...account, status: 'inactive' },
    { ...account, importActivitiesEnabled: false },
  ])(
    'checks current connection and consent before reading Strava (%j)',
    async (value) => {
      const { processor, strava } = setup(value);
      await expect(processor.process(job)).resolves.toEqual({
        queuedActivities: 0,
        skipped: true,
      });
      expect(strava.queueRecentImport).not.toHaveBeenCalled();
    },
  );
  it('persists child ids before enqueue and retains completed children across listing retries', async () => {
    const { processor, strava } = setup();
    const retryJob = {
      ...job,
      data: { providerAccountId: 7, activityJobIds: ['previous'] },
      updateData: jest.fn(),
    };
    strava.queueRecentImport.mockImplementation(
      async (_account, _date, record) => {
        await record(['next', 'previous']);
        return { queuedActivities: 1 };
      },
    );
    await processor.process(retryJob as never);
    expect(retryJob.updateData).toHaveBeenCalledWith({
      providerAccountId: 7,
      activityJobIds: ['previous', 'next'],
    });
  });

  it('leaves transient failures retryable', async () => {
    const { processor, strava } = setup();
    strava.queueRecentImport.mockRejectedValue(new Error('Temporary failure'));
    await expect(processor.process(job)).rejects.toThrow('Temporary failure');
  });
});
