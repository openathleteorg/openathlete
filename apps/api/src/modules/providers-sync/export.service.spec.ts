import type { NormalizedWorkout } from '@openathlete/shared';

import { ProviderExportService } from './export.service';

jest.mock('./adapters', () => ({
  GarminAdapter: class {},
  SuuntoAdapter: class {},
  CorosAdapter: class {},
}));

const normalized = {
  sport: 'RUNNING',
  title: 'Intervals',
  steps: [{ orderIndex: 0 }],
} as unknown as NormalizedWorkout;

function setup(existing: Record<string, unknown> | null) {
  const record = {
    providerWorkoutExportId: 9,
    externalId: '55',
    scheduleId: '77',
  };
  const prisma = {
    providerWorkoutExport: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(existing),
      upsert: jest.fn().mockResolvedValue(record),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const garmin = {
    upsertPlannedWorkout: jest
      .fn()
      .mockResolvedValue({ externalId: '55', scheduleId: '77' }),
    deletePlannedWorkout: jest.fn(),
  };
  const service = new ProviderExportService(
    prisma as never,
    garmin as never,
    {} as never,
    {} as never,
  );
  return { service, prisma, garmin };
}

const params = {
  athleteId: 1,
  provider: 'garmin' as const,
  workoutId: 3,
  date: '2026-10-28',
  normalized,
};

describe('ProviderExportService.upsertPlannedExport', () => {
  it('sends nothing for a workout exported unchanged', async () => {
    const { service, prisma, garmin } = setup(null);
    await service.upsertPlannedExport(params);
    const contentHash =
      prisma.providerWorkoutExport.upsert.mock.calls[0][0].create.contentHash;

    const again = setup({ status: 'success', contentHash, externalId: '55' });
    const result = await again.service.upsertPlannedExport(params);

    expect(garmin.upsertPlannedWorkout).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ skipped: true, externalId: '55' });
    expect(again.garmin.upsertPlannedWorkout).not.toHaveBeenCalled();
    expect(again.prisma.providerWorkoutExport.upsert).not.toHaveBeenCalled();
  });

  it('skips a session without steps, which is no failure', async () => {
    const { service, prisma, garmin } = setup(null);

    const result = await service.upsertPlannedExport({
      ...params,
      normalized: { ...normalized, steps: [] },
    });

    expect(result).toEqual({ skipped: true });
    expect(garmin.upsertPlannedWorkout).not.toHaveBeenCalled();
    expect(prisma.providerWorkoutExport.upsert).not.toHaveBeenCalled();
  });

  it('only treats exports of other days as stale', async () => {
    const { service, prisma, garmin } = setup(null);
    await service.upsertPlannedExport(params);

    expect(prisma.providerWorkoutExport.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        NOT: { plannedDate: new Date('2026-10-28T00:00:00.000Z') },
      }),
    });
    expect(garmin.upsertPlannedWorkout).toHaveBeenCalledWith(
      expect.objectContaining({
        previousExternalId: '55',
        previousScheduleId: '77',
      }),
    );
  });
});
