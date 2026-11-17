import { HeartRateProfileChangedEvent } from 'src/events';

import { MetricService } from './metric.service';

describe('MetricService and the heart rate profile', () => {
  const metric = (type: string) => ({
    athleteMetricId: 7,
    athleteId: 42,
    type,
    date: new Date('2026-11-14T00:00:00Z'),
    value: 183,
    notes: null,
  });

  const setup = (type: string) => {
    const prisma = {
      athlete: { findFirst: jest.fn().mockResolvedValue({ athleteId: 42 }) },
      athleteMetric: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue(metric(type)),
        update: jest.fn().mockResolvedValue(metric(type)),
        delete: jest.fn().mockResolvedValue(metric(type)),
      },
    };
    const abilities = {
      getFor: jest.fn().mockResolvedValue({ can: () => true }),
    };
    const events = { emit: jest.fn() };
    const service = new MetricService(
      prisma as never,
      abilities as never,
      events as never,
    );
    return { prisma, events, service };
  };
  const user = { userId: 1 } as never;
  const emitted = (events: { emit: jest.Mock }) =>
    events.emit.mock.calls.filter(
      ([slug]) => slug === HeartRateProfileChangedEvent.SLUG,
    );

  it.each(['HR_MAX', 'HR_REST'])(
    'asks for the loads again when %s is logged, changed or removed',
    async (type) => {
      const { prisma, events, service } = setup(type);
      prisma.athleteMetric.findUnique.mockResolvedValueOnce(null);
      await service.createMetric(user, {
        type,
        date: new Date('2026-11-14T00:00:00Z'),
        value: 183,
      } as never);
      prisma.athleteMetric.findUnique.mockResolvedValue(metric(type));
      await service.updateMetric(user, 7, { value: 185 } as never);
      await service.deleteMetric(user, 7);

      expect(emitted(events)).toHaveLength(3);
      expect(emitted(events)[0][1]).toEqual(
        new HeartRateProfileChangedEvent({ athleteId: 42 }),
      );
    },
  );

  it('leaves the loads alone for other metrics', async () => {
    const { prisma, events, service } = setup('WEIGHT');
    prisma.athleteMetric.findUnique.mockResolvedValueOnce(null);
    await service.createMetric(user, {
      type: 'WEIGHT',
      date: new Date('2026-11-14T00:00:00Z'),
      value: 70,
    } as never);
    expect(emitted(events)).toHaveLength(0);
  });
});
