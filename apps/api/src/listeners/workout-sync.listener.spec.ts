import { SPORT_TYPE } from '@openathlete/shared';

import { WorkoutPlannedChangedEvent } from 'src/events';

import { WorkoutSyncListener } from './workout-sync.listener';

// An ESM package Jest cannot load, pulled in through the export service
jest.mock('@garmin/fitsdk', () => ({}));

function setup(storedSport: SPORT_TYPE) {
  const prisma = {
    providerAccount: {
      findMany: jest.fn().mockResolvedValue([{ provider: 'GARMIN' }]),
    },
    workout: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ workoutId: 7, eventTrainingId: 3, steps: [] }),
    },
    event: {
      findUnique: jest.fn().mockResolvedValue({
        name: 'Endurance ride',
        training: { sport: storedSport, description: null },
      }),
    },
  };
  const exportService = {
    upsertPlannedExport: jest.fn().mockResolvedValue(undefined),
    deleteExportsForWorkout: jest.fn().mockResolvedValue(undefined),
  };
  const listener = new WorkoutSyncListener(
    prisma as never,
    exportService as never,
  );
  return { listener, exportService };
}

describe('WorkoutSyncListener', () => {
  it('exports the sport saved on the session, not the one in the event', async () => {
    const { listener, exportService } = setup(SPORT_TYPE.CYCLING);

    await listener.handle(
      new WorkoutPlannedChangedEvent({
        eventId: 1,
        athleteId: 9,
        workoutId: 7,
        startDate: new Date(Date.now() + 86400_000),
        sport: SPORT_TYPE.RUNNING,
      }),
    );

    expect(exportService.upsertPlannedExport).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'garmin',
        normalized: expect.objectContaining({ sport: SPORT_TYPE.CYCLING }),
      }),
    );
  });
});
