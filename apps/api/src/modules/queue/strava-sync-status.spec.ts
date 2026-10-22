import { NotFoundException } from '@nestjs/common';

import { ProviderRecentSyncJobData, QueueService } from './queue.service';

describe('Strava import progress', () => {
  function setup(state = 'completed', ids: string[] | undefined = ['a', 'b']) {
    const parent = {
      data: {
        providerAccountId: 7,
        activityJobIds: ids,
      } as ProviderRecentSyncJobData,
      getState: jest.fn().mockResolvedValue(state),
      returnvalue: {},
    };
    const children = new Map([
      [
        'a',
        {
          data: { providerAccountId: 7 },
          getState: jest.fn().mockResolvedValue('completed'),
          returnvalue: { success: true },
        },
      ],
      [
        'b',
        {
          data: { providerAccountId: 7 },
          getState: jest.fn().mockResolvedValue('active'),
          returnvalue: { success: true },
        },
      ],
    ]);
    const imports = { getJob: jest.fn(async (id: string) => children.get(id)) };
    const recent = {
      getJob: jest.fn().mockResolvedValue(parent),
      add: jest.fn().mockResolvedValue({ id: '12' }),
    };
    return {
      parent,
      children,
      recent,
      service: new QueueService(
        imports as never,
        {} as never,
        {} as never,
        recent as never,
      ),
    };
  }

  it('returns the deduplicated queue job id to follow', async () => {
    const { service, recent } = setup();
    await expect(service.addRecentStravaSyncJob(7)).resolves.toBe('12');
    expect(recent.add).toHaveBeenCalledWith(
      'strava-recent-sync',
      { providerAccountId: 7 },
      {
        deduplication: { id: 'strava-recent-7', ttl: 60000 },
      },
    );
  });
  it('does not claim completion when listing finished but an activity is still importing', async () => {
    const { service } = setup();
    await expect(
      service.getRecentStravaSyncStatus(7, '12'),
    ).resolves.toMatchObject({
      state: 'running',
      total: 2,
      imported: 1,
      pending: 1,
    });
  });
  it('reports an actual import failure after the listing completed', async () => {
    const { service, children } = setup();
    children.get('b')!.getState.mockResolvedValue('failed');
    await expect(
      service.getRecentStravaSyncStatus(7, '12'),
    ).resolves.toMatchObject({
      state: 'failed',
      imported: 1,
      failed: 1,
      pending: 0,
    });
  });
  it('distinguishes needs-review from a successful visible import', async () => {
    const { service, children } = setup();
    children.get('b')!.getState.mockResolvedValue('completed');
    children.get('b')!.returnvalue = {
      success: true,
      status: 'needs_review',
    } as never;
    await expect(
      service.getRecentStravaSyncStatus(7, '12'),
    ).resolves.toMatchObject({
      state: 'completed',
      imported: 1,
      needsReview: 1,
    });
  });
  it('reports a successful empty sync only with an explicit empty manifest', async () => {
    const { service } = setup('completed', []);
    await expect(
      service.getRecentStravaSyncStatus(7, '12'),
    ).resolves.toMatchObject({ state: 'completed', total: 0 });
  });
  it('never turns an old worker result or pruned child into false success', async () => {
    const old = setup();
    old.parent.data.activityJobIds = undefined;
    await expect(
      old.service.getRecentStravaSyncStatus(7, '12'),
    ).resolves.toMatchObject({ state: 'unavailable' });
    const pruned = setup();
    pruned.children.delete('b');
    await expect(
      pruned.service.getRecentStravaSyncStatus(7, '12'),
    ).resolves.toMatchObject({ state: 'unavailable' });
  });
  it('keeps scheduled retries running', async () => {
    const { service, children } = setup();
    children.get('b')!.getState.mockResolvedValue('delayed');
    await expect(
      service.getRecentStravaSyncStatus(7, '12'),
    ).resolves.toMatchObject({ state: 'running', retrying: true });
  });
  it('does not reveal another account’s result', async () => {
    const { service, recent } = setup();
    await expect(
      service.getRecentStravaSyncStatus(8, '12'),
    ).rejects.toBeInstanceOf(NotFoundException);
    recent.getJob.mockResolvedValue(undefined);
    await expect(
      service.getRecentStravaSyncStatus(7, 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
  it('reports connection removal while queued as failure rather than no new activities', async () => {
    const { service, parent } = setup('completed', []);
    parent.returnvalue = { skipped: true };
    await expect(
      service.getRecentStravaSyncStatus(7, '12'),
    ).resolves.toMatchObject({ state: 'failed' });
  });
});
