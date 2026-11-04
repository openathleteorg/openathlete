import axios from 'axios';

import { SPORT_TYPE } from '@openathlete/shared';

import type { PrismaService } from 'src/modules/prisma/services/prisma.service';

import type { GarminProviderService } from '../providers/garmin.provider.service';
import { GarminAdapter } from './garmin.adapter';

jest.mock('../providers/garmin.provider.service', () => ({
  GarminProviderService: class {},
}));

const TRAINING_API = 'https://apis.garmin.com/training-api';

describe('GarminAdapter.upsertPlannedWorkout', () => {
  function setup() {
    const prisma = {
      providerAccount: {
        findFirst: jest.fn().mockResolvedValue({
          providerAccountId: 1,
          athleteId: 10,
          provider: 'GARMIN',
          status: 'active',
        }),
      },
      workout: {
        findUnique: jest.fn().mockResolvedValue({
          workoutId: 300,
          steps: [
            {
              workoutStepId: 1,
              orderIndex: 0,
              stepType: 'STEADY',
              name: 'Run',
              notes: null,
              durationType: 'TIME',
              durationValue: 1800,
              durationTarget: null,
              workoutId: 300,
              repeatParentId: null,
              targets: [],
              repeatBlock: null,
            },
          ],
        }),
      },
      athleteMetric: { findMany: jest.fn().mockResolvedValue([]) },
      trainingZone: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const garminProviderService = {
      getAccountPermissions: jest.fn().mockResolvedValue(['WORKOUT_IMPORT']),
      getValidAccessToken: jest.fn().mockResolvedValue('token'),
    };
    const adapter = new GarminAdapter(
      prisma as unknown as PrismaService,
      garminProviderService as unknown as GarminProviderService,
    );
    const input = {
      athleteId: 10,
      workoutId: 300,
      date: '2026-11-05',
      normalized: {
        sport: SPORT_TYPE.RUNNING,
        title: 'Easy run',
        description: null,
        steps: [],
      },
    };
    return { adapter, input };
  }

  afterEach(() => jest.restoreAllMocks());

  it('deletes the workout it just created when scheduling it fails', async () => {
    const { adapter, input } = setup();
    jest
      .spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: { workoutId: 555 } })
      .mockRejectedValueOnce(new Error('schedule failed'));
    const del = jest.spyOn(axios, 'delete').mockResolvedValue({ data: null });

    await expect(adapter.upsertPlannedWorkout(input)).rejects.toThrow(
      'schedule failed',
    );

    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith(
      `${TRAINING_API}/workout/v2/555`,
      expect.anything(),
    );
  });

  it('keeps the scheduling error when the cleanup fails too', async () => {
    const { adapter, input } = setup();
    jest
      .spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: { workoutId: 555 } })
      .mockRejectedValueOnce(new Error('schedule failed'));
    jest.spyOn(axios, 'delete').mockRejectedValue(new Error('delete failed'));

    await expect(adapter.upsertPlannedWorkout(input)).rejects.toThrow(
      'schedule failed',
    );
  });

  it('keeps a workout that already existed when scheduling it fails', async () => {
    const { adapter, input } = setup();
    jest.spyOn(axios, 'get').mockResolvedValue({ data: { ownerId: 7 } });
    jest.spyOn(axios, 'put').mockResolvedValue({ data: null });
    jest.spyOn(axios, 'post').mockRejectedValue(new Error('schedule failed'));
    const del = jest.spyOn(axios, 'delete');

    await expect(
      adapter.upsertPlannedWorkout({ ...input, previousExternalId: '444' }),
    ).rejects.toThrow('schedule failed');

    expect(del).not.toHaveBeenCalled();
  });

  it('returns the workout and schedule ids when both calls succeed', async () => {
    const { adapter, input } = setup();
    jest
      .spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: { workoutId: 555 } })
      .mockResolvedValueOnce({ data: 777 });
    const del = jest.spyOn(axios, 'delete');

    await expect(adapter.upsertPlannedWorkout(input)).resolves.toEqual({
      externalId: '555',
      scheduleId: '777',
    });
    expect(del).not.toHaveBeenCalled();
  });
});
