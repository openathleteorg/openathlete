import { Feature, SPORT_TYPE } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { FeatureAccessService } from 'src/modules/subscription/services/feature-access.service';

import { StatisticsService } from '../services/statistics.service';
import { StatisticsController } from './statistics.controller';

const user = { userId: 7 } as AuthUser;
const query = {
  athleteId: 3,
  sport: SPORT_TYPE.TRAIL_RUNNING,
  from: new Date('2026-08-01T00:00:00Z'),
  to: new Date('2026-11-01T00:00:00Z'),
};
const TEASER = {
  kind: 'efficiency' as const,
  value: 0.04,
  slope: null,
  weeks: 12,
};

function build(lab: boolean) {
  const statistics = {
    getTerrain: jest.fn().mockResolvedValue({ bins: [], classes: [] }),
    getCardiacCost: jest.fn().mockResolvedValue({ unit: 'speed', bins: [] }),
    getDurability: jest.fn().mockResolvedValue({ series: [], outings: [] }),
    getTrends: jest
      .fn()
      .mockResolvedValue({ granularity: 'week', buckets: [] }),
    getEfficiency: jest.fn().mockResolvedValue({ runs: [], hasWeight: false }),
    getLabTeaser: jest.fn().mockResolvedValue(TEASER),
  };
  const features = { can: jest.fn().mockResolvedValue(lab) };
  const controller = new StatisticsController(
    statistics as unknown as StatisticsService,
    features as unknown as FeatureAccessService,
  );
  return { controller, statistics, features };
}

const LAB = [
  'getTerrain',
  'getCardiacCost',
  'getDurability',
  'getTrends',
] as const;

describe('StatisticsController and the Lab', () => {
  it.each(LAB)('%s sends the teaser only, without the Lab', async (method) => {
    const { controller, statistics, features } = build(false);
    await expect(controller[method](user, query)).resolves.toEqual({
      locked: true,
      teaser: TEASER,
    });
    expect(features.can).toHaveBeenCalledWith(user.userId, Feature.LAB);
    expect(statistics[method]).not.toHaveBeenCalled();
    expect(statistics.getLabTeaser).toHaveBeenCalledWith(user, query);
  });

  it.each(LAB)('%s sends the full data with the Lab', async (method) => {
    // Without Stripe, FeatureAccessService answers true for everyone
    const { controller, statistics } = build(true);
    const result = await controller[method](user, query);
    expect(result).not.toHaveProperty('locked');
    expect(statistics[method]).toHaveBeenCalledWith(user, query);
    expect(statistics.getLabTeaser).not.toHaveBeenCalled();
  });

  it('keeps the efficiency of runs free: it moved to the Load view', async () => {
    const { controller, statistics, features } = build(false);
    await expect(controller.getEfficiency(user, query)).resolves.toEqual({
      runs: [],
      hasWeight: false,
    });
    expect(features.can).not.toHaveBeenCalled();
    expect(statistics.getEfficiency).toHaveBeenCalled();
  });
});
