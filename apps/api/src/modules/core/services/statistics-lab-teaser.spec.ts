import { SPORT_TYPE } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { StatisticsService } from './statistics.service';

const user = { userId: 1 } as AuthUser;
const now = new Date('2026-11-20T12:00:00Z');

const run = (day: number, factor: number) => ({
  eventId: day,
  name: 'Run',
  date: new Date(Date.UTC(2026, 9, day)),
  steady: true,
  factor,
  powerFactor: null,
  effectiveness: null,
  decoupling: null,
});

const bin = (slope: number, median: number, count = 5) => ({
  bin: slope,
  low: median * 0.9,
  median,
  high: median * 1.1,
  count,
});

function service(factors: number[], bins: ReturnType<typeof bin>[]) {
  const statistics = Object.create(
    StatisticsService.prototype,
  ) as StatisticsService;
  const getEfficiency = jest
    .spyOn(statistics, 'getEfficiency')
    .mockResolvedValue({
      runs: factors.map((factor, index) => run(1 + index * 7, factor)),
      hasWeight: false,
    });
  jest.spyOn(statistics, 'getTerrain').mockResolvedValue({ bins, classes: [] });
  return { statistics, getEfficiency };
}

const teaser = (statistics: StatisticsService, sport = SPORT_TYPE.RUNNING) =>
  statistics.getLabTeaser(user, { athleteId: 3, sport }, now);

describe('StatisticsService.getLabTeaser', () => {
  it('quotes a clear move of the efficiency of runs', async () => {
    const { statistics } = service([1, 1.02, 1.04], [bin(10, 600)]);
    await expect(teaser(statistics)).resolves.toMatchObject({
      kind: 'efficiency',
      weeks: 12,
    });
  });

  it('prefers a real climb to a flat efficiency line', async () => {
    const { statistics } = service([1, 1, 1.001], [bin(3, 300), bin(12, 640)]);
    await expect(teaser(statistics)).resolves.toEqual({
      kind: 'climb',
      value: 640,
      slope: 12,
      weeks: 12,
    });
  });

  it('keeps a flat efficiency line over a gentle slope', async () => {
    const { statistics } = service([1, 1, 1.001], [bin(2, 200)]);
    await expect(teaser(statistics)).resolves.toMatchObject({
      kind: 'efficiency',
    });
  });

  it('never quotes the running efficiency of another sport', async () => {
    const { statistics, getEfficiency } = service([1, 1.1, 1.2], [bin(6, 400)]);
    await expect(teaser(statistics, SPORT_TYPE.CYCLING)).resolves.toMatchObject(
      { kind: 'climb', slope: 6 },
    );
    expect(getEfficiency).not.toHaveBeenCalled();
  });

  it('skips slopes with too few activities, and gives up without data', async () => {
    const { statistics } = service([], [bin(15, 700, 2)]);
    await expect(teaser(statistics)).resolves.toBeNull();
  });
});
