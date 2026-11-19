import { QueueService } from './queue.service';

type State = 'waiting' | 'delayed' | 'active' | 'completed' | 'failed';

/** A queue holding jobs in these states, by id */
function setup(states: Record<string, State>) {
  const removed: string[] = [];
  const queue = {
    getJob: jest.fn(async (id: string) =>
      states[id]
        ? {
            getState: async () => states[id],
            remove: async () => {
              removed.push(id);
            },
          }
        : undefined,
    ),
    add: jest.fn(async () => undefined),
  };
  const logger = { error: jest.fn() };
  const service = Object.create(QueueService.prototype) as QueueService;
  Object.assign(service, { trainingLoadRecalcQueue: queue, logger });
  return { service, queue, removed, logger };
}

const BASE = 'training-load-recalc-9';
const NEXT = `${BASE}-next`;
const added = (queue: ReturnType<typeof setup>['queue']) =>
  queue.add.mock.calls.map(
    (call) =>
      (call as unknown as [string, unknown, { jobId: string }])[2].jobId,
  );

describe('addTrainingLoadRecalcJob', () => {
  it('queues a run a minute later when there is none', async () => {
    const { service, queue } = setup({});
    await service.addTrainingLoadRecalcJob(9);
    expect(queue.add).toHaveBeenCalledWith(
      'recalc',
      { athleteId: 9 },
      { jobId: BASE, delay: 60_000 },
    );
  });

  it.each(['waiting', 'delayed'] as const)(
    'lets a %s run take the request',
    async (state) => {
      const { service, queue } = setup({ [BASE]: state });
      await service.addTrainingLoadRecalcJob(9);
      expect(queue.add).not.toHaveBeenCalled();
    },
  );

  it('queues one follow-up behind a run under way', async () => {
    const { service, queue } = setup({ [BASE]: 'active' });
    await service.addTrainingLoadRecalcJob(9);
    expect(added(queue)).toEqual([NEXT]);
  });

  it('lets the follow-up take further requests', async () => {
    const { service, queue } = setup({ [BASE]: 'active', [NEXT]: 'delayed' });
    await service.addTrainingLoadRecalcJob(9);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it.each(['completed', 'failed'] as const)(
    'takes over the id of a %s run',
    async (state) => {
      const { service, queue, removed } = setup({ [BASE]: state });
      await service.addTrainingLoadRecalcJob(9);
      expect(removed).toEqual([BASE]);
      expect(added(queue)).toEqual([BASE]);
    },
  );

  it('logs instead of failing the caller when Redis is unreachable', async () => {
    const { service, queue, logger } = setup({});
    queue.getJob.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
    await expect(service.addTrainingLoadRecalcJob(9)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('ECONNREFUSED'),
    );
  });

  it('queues behind the follow-up when that one is running', async () => {
    const { service, queue, removed } = setup({
      [BASE]: 'completed',
      [NEXT]: 'active',
    });
    await service.addTrainingLoadRecalcJob(9);
    expect(removed).toEqual([BASE]);
    expect(added(queue)).toEqual([BASE]);
  });
});

describe('addTrainingPlanApplyJob', () => {
  it('gives each job an id of its own, not the queue counter', async () => {
    const add = jest.fn(
      async (_name: string, _data: unknown, opts: { jobId: string }) => ({
        id: opts.jobId,
      }),
    );
    const service = Object.create(QueueService.prototype) as QueueService;
    Object.assign(service, { trainingPlanApplyQueue: { add } });
    const data = {
      userId: 1,
      plan: {},
      targets: [],
      options: {},
    } as unknown as Parameters<QueueService['addTrainingPlanApplyJob']>[0];

    const first = await service.addTrainingPlanApplyJob(data);
    const second = await service.addTrainingPlanApplyJob(data);

    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(second).not.toBe(first);
    expect(add.mock.calls[0][1]).toMatchObject({ results: [], failures: [] });
  });
});
