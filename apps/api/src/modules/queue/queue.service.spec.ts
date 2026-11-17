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
  const service = Object.create(QueueService.prototype) as QueueService;
  Object.assign(service, { trainingLoadRecalcQueue: queue });
  return { service, queue, removed };
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
