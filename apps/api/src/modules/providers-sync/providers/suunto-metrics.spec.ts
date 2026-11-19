import { ConfigService } from '@nestjs/config';

import { MetricType } from '@openathlete/database';
import type { ApiEnvSchemaType } from '@openathlete/shared';

import { ActivityFileParserService } from '../../core/helpers/activity-file-parser.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { SuuntoMetricRecord } from '../mapping/suunto-health.mapper';
import { SuuntoProviderService } from './suunto.provider.service';

// The FIT SDK is ESM, which Jest cannot load
jest.mock('../../core/helpers/activity-file-parser.service', () => ({
  ActivityFileParserService: class {},
}));

function setup(profileBefore: string[], profileAfter: string[]) {
  const prisma = {
    athleteMetric: {
      upsert: jest.fn(),
      findMany: jest
        .fn()
        .mockResolvedValueOnce(profileBefore.map((type) => ({ type })))
        .mockResolvedValueOnce(profileAfter.map((type) => ({ type }))),
    },
    $transaction: jest.fn(),
  };
  const queue = { addTrainingLoadRecalcJob: jest.fn() };
  const service = new SuuntoProviderService(
    prisma as unknown as PrismaService,
    { get: () => undefined } as unknown as ConfigService<
      ApiEnvSchemaType,
      true
    >,
    queue as unknown as QueueService,
    {} as ActivityFileParserService,
  );
  const save = (metrics: SuuntoMetricRecord[]) =>
    service['saveMetrics'](9, metrics);
  return { save, prisma, queue };
}

const night: SuuntoMetricRecord[] = [
  { type: MetricType.SLEEP_DURATION, date: new Date('2026-11-17'), value: 7 },
  { type: MetricType.HR_REST, date: new Date('2026-11-17'), value: 49 },
];

describe('SuuntoProviderService.saveMetrics', () => {
  it('computes the loads again when the first resting HR joins an HR max', async () => {
    const { save, prisma, queue } = setup(['HR_MAX'], ['HR_MAX', 'HR_REST']);

    await save(night);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(queue.addTrainingLoadRecalcJob).toHaveBeenCalledWith(9);
  });

  it('leaves the loads alone on the following nights', async () => {
    const { save, queue } = setup(['HR_MAX', 'HR_REST'], ['HR_MAX', 'HR_REST']);

    await save(night);

    expect(queue.addTrainingLoadRecalcJob).not.toHaveBeenCalled();
  });

  it('leaves the loads alone while the athlete has no HR max', async () => {
    const { save, queue } = setup([], ['HR_REST']);

    await save(night);

    expect(queue.addTrainingLoadRecalcJob).not.toHaveBeenCalled();
  });
});
