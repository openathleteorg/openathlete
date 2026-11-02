import { Job, UnrecoverableError } from 'bullmq';

import { PrismaService } from '../../prisma/services/prisma.service';
import { GarminPersonalError } from './garmin-personal-client';
import {
  GarminPersonalProcessor,
  GarminPersonalScheduler,
} from './garmin-personal-processor';
import { GarminPersonalService, PersonalJob } from './garmin-personal-service';

jest.mock('@garmin/fitsdk', () => ({}));

describe('Garmin Personal scheduling', () => {
  afterEach(() => jest.useRealTimers());
  it('dispatches a worker job to the same receipt-aware import service', async () => {
    const run = jest.fn().mockResolvedValue({ imported: 1 });
    const processor = new GarminPersonalProcessor({
      run,
    } as unknown as GarminPersonalService);
    const data: PersonalJob = {
      connectionId: 12,
      version: 3,
      startDate: '2026-01-01',
      endDate: '2026-01-07',
    };
    expect(await processor.process({ data } as Job<PersonalJob>)).toEqual({
      imported: 1,
    });
    expect(run).toHaveBeenCalledWith(data);
  });
  it('does not retry a rejected key but preserves transient failures for BullMQ retries', async () => {
    const run = jest
      .fn()
      .mockRejectedValueOnce(new GarminPersonalError('key_required'))
      .mockRejectedValueOnce(new GarminPersonalError('rate_limited'));
    const processor = new GarminPersonalProcessor({
      run,
    } as unknown as GarminPersonalService);
    await expect(
      processor.process({ data: {} } as Job<PersonalJob>),
    ).rejects.toBeInstanceOf(UnrecoverableError);
    await expect(
      processor.process({ data: {} } as Job<PersonalJob>),
    ).rejects.toMatchObject({ code: 'rate_limited' });
  });
  it('pulls seven UTC days only for opted-in accounts and continues after one enqueue failure', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-02T00:05:00Z'));
    const findMany = jest
      .fn()
      .mockResolvedValue([
        { athlete: { userId: 1 } },
        { athlete: { userId: 2 } },
      ]);
    const enqueue = jest
      .fn()
      .mockRejectedValueOnce(new Error('disconnected'))
      .mockResolvedValueOnce({ queued: true });
    const scheduler = new GarminPersonalScheduler(
      { garminPersonalConnection: { findMany } } as unknown as PrismaService,
      { enqueue } as unknown as GarminPersonalService,
    );
    await scheduler.sync();
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          automatic: true,
          activities: true,
          encryptedCredentials: { not: null },
          status: { not: 'key_required' },
        },
      }),
    );
    expect(enqueue.mock.calls).toEqual([
      [1, { startDate: '2025-12-27', endDate: '2026-01-02' }],
      [2, { startDate: '2025-12-27', endDate: '2026-01-02' }],
    ]);
  });
});
