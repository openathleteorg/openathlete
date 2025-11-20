import axios, { AxiosError, isAxiosError } from 'axios';

import { Injectable, Logger } from '@nestjs/common';

import { connector_provider } from '@openathlete/database';
import { mapPrismaWorkoutToDto } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { mapWorkoutDtoToGarmin } from '../mapping/garmin.mapper';
import type { GarminStep, GarminWorkout } from '../mapping/garmin.types';
import type {
  DeletePlannedWorkoutInput,
  ProviderAdapter,
  UpsertPlannedWorkoutInput,
  UpsertPlannedWorkoutResult,
} from '../provider-adapter.interface';
import { GarminProviderService } from '../providers/garmin.provider.service';

@Injectable()
export class GarminAdapter implements ProviderAdapter {
  private readonly logger = new Logger(GarminAdapter.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly garminProviderService: GarminProviderService,
  ) {}

  getProvider(): 'garmin' {
    return 'garmin';
  }

  async upsertPlannedWorkout(
    input: UpsertPlannedWorkoutInput,
  ): Promise<UpsertPlannedWorkoutResult> {
    const account = await this.prisma.provider_account.findFirst({
      where: {
        athlete_id: input.athleteId,
        provider: connector_provider.GARMIN,
        status: 'active',
      },
    });

    if (!account) {
      throw new Error('No active Garmin account found for athlete');
    }

    const accessToken =
      await this.garminProviderService.getValidAccessToken(account);
    const permissions =
      await this.garminProviderService.getUserPermissions(accessToken);

    if (!permissions.includes('WORKOUT_IMPORT')) {
      throw new Error('User has not granted WORKOUT_IMPORT permission');
    }

    const ownerId = this.getNumericUserId(account.external_user_id);

    const workoutRecord = await this.prisma.workout.findUnique({
      where: { workout_id: input.workoutId },
      include: {
        steps: {
          include: {
            targets: true,
            repeat_block: {
              include: {
                child_steps: {
                  include: {
                    targets: true,
                  },
                  orderBy: { order_index: 'asc' },
                },
              },
            },
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!workoutRecord) {
      throw new Error('Workout not found');
    }

    const workoutDto = mapPrismaWorkoutToDto(workoutRecord);
    const garminWorkout = mapWorkoutDtoToGarmin(
      ownerId,
      workoutDto,
      input.normalized.sport,
      input.normalized.title,
      input.normalized.description,
    );

    this.validateWorkout(garminWorkout);

    const existingWorkoutId = this.getNumericExternalId(
      input.previousExternalId,
    );

    const workoutId = existingWorkoutId
      ? await this.updateWorkout(accessToken, existingWorkoutId, garminWorkout)
      : await this.createWorkout(accessToken, garminWorkout);

    const scheduleId = await this.upsertSchedule(accessToken, {
      workoutId,
      date: input.date,
      scheduleId: input.previousScheduleId,
    });

    return {
      externalId: workoutId,
      scheduleId,
    };
  }

  private async createWorkout(
    accessToken: string,
    workout: GarminWorkout,
  ): Promise<string> {
    try {
      const { data } = await axios.post<GarminWorkout & { workoutId: number }>(
        'https://apis.garmin.com/workoutportal/workout/v2',
        workout,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return data.workoutId.toString();
    } catch (error) {
      if (isAxiosError(error)) {
        this.handleApiError(error);
      }
      throw error;
    }
  }

  private async updateWorkout(
    accessToken: string,
    workoutId: string,
    workout: GarminWorkout,
  ): Promise<string> {
    try {
      await axios.put(
        `https://apis.garmin.com/training-api/workout/v2/${workoutId}`,
        workout,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return workoutId;
    } catch (error) {
      if (isAxiosError(error)) {
        this.handleApiError(error);
      }
      throw error;
    }
  }

  private validateWorkout(workout: GarminWorkout): void {
    const totalSteps = workout.segments.reduce(
      (sum, seg) => sum + this.countSteps(seg.steps),
      0,
    );

    if (workout.sport === 'MULTI_SPORT') {
      if (workout.segments.length > 25) {
        throw new Error('Multisport workout exceeds 25 segments limit');
      }
      if (totalSteps > 250) {
        throw new Error('Multisport workout exceeds 250 steps limit');
      }
    } else {
      if (totalSteps > 100) {
        throw new Error('Single sport workout exceeds 100 steps limit');
      }
    }
  }

  private countSteps(steps: GarminStep[]): number {
    return steps.reduce((count, step) => {
      if (step.type === 'WorkoutRepeatStep') {
        return count + 1 + this.countSteps(step.steps);
      }
      return count + 1;
    }, 0);
  }

  private getNumericExternalId(externalId?: string): string | null {
    if (!externalId) {
      return null;
    }

    return /^\d+$/.test(externalId) ? externalId : null;
  }

  private getNumericUserId(externalUserId?: string | null): number | null {
    if (!externalUserId || !/^\d+$/.test(externalUserId)) {
      return null;
    }

    const parsed = Number(externalUserId);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private async upsertSchedule(
    accessToken: string,
    params: { workoutId: string; date: string; scheduleId?: string },
  ): Promise<string | undefined> {
    const numericWorkoutId = Number(params.workoutId);
    if (Number.isNaN(numericWorkoutId)) {
      throw new Error('Invalid Garmin workout ID for scheduling');
    }

    const existingScheduleId = this.getNumericExternalId(params.scheduleId);
    if (existingScheduleId) {
      await this.updateSchedule(
        accessToken,
        existingScheduleId,
        numericWorkoutId,
        params.date,
      );
      return existingScheduleId;
    }

    return this.createSchedule(accessToken, numericWorkoutId, params.date);
  }

  private async createSchedule(
    accessToken: string,
    workoutId: number,
    date: string,
  ): Promise<string | undefined> {
    try {
      const { data } = await axios.post<{ scheduleId: number }>(
        'https://apis.garmin.com/training-api/schedule/',
        {
          workoutId,
          date,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!data?.scheduleId) {
        this.logger.warn(
          `Garmin schedule response missing scheduleId for workout ${workoutId} on ${date}`,
        );
        return undefined;
      }

      return data.scheduleId.toString();
    } catch (error) {
      if (isAxiosError(error)) {
        this.handleApiError(error);
      }
      throw error;
    }
  }

  private async updateSchedule(
    accessToken: string,
    scheduleId: string,
    workoutId: number,
    date: string,
  ): Promise<void> {
    try {
      await axios.put(
        `https://apis.garmin.com/training-api/schedule/${scheduleId}`,
        {
          workoutId,
          date,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      if (isAxiosError(error)) {
        this.handleApiError(error);
      }
      throw error;
    }
  }

  async deletePlannedWorkout(input: DeletePlannedWorkoutInput): Promise<void> {
    const account = await this.prisma.provider_account.findFirst({
      where: {
        athlete_id: input.athleteId,
        provider: connector_provider.GARMIN,
        status: 'active',
      },
    });

    if (!account) {
      this.logger.warn(
        `No active Garmin account found for athlete ${input.athleteId}, skipping delete`,
      );
      return;
    }

    const accessToken =
      await this.garminProviderService.getValidAccessToken(account);

    const scheduleId = this.getNumericExternalId(input.scheduleId ?? undefined);
    if (scheduleId) {
      await this.deleteSchedule(accessToken, scheduleId);
    }

    const workoutId = this.getNumericExternalId(input.externalId ?? undefined);
    if (workoutId) {
      await this.deleteWorkout(accessToken, workoutId);
    }
  }

  private async deleteSchedule(
    accessToken: string,
    scheduleId: string,
  ): Promise<void> {
    try {
      await axios.delete(
        `https://apis.garmin.com/training-api/schedule/${scheduleId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    } catch (error) {
      if (isAxiosError(error)) {
        // treat 404 as already deleted
        if (error.response?.status === 404) {
          return;
        }
        this.handleApiError(error);
      }
      throw error;
    }
  }

  private async deleteWorkout(
    accessToken: string,
    workoutId: string,
  ): Promise<void> {
    try {
      await axios.delete(
        `https://apis.garmin.com/training-api/workout/v2/${workoutId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          return;
        }
        this.handleApiError(error);
      }
      throw error;
    }
  }

  private handleApiError(error: AxiosError): void {
    const status = error.response?.status;
    const message =
      (error.response?.data as { message?: string })?.message || error.message;

    switch (status) {
      case 400:
        throw new Error(`Invalid workout data: ${message}`);
      case 401:
        throw new Error('Garmin access token invalid or expired');
      case 403:
        throw new Error('Not allowed to create/update workout');
      case 412:
        throw new Error('User has not granted WORKOUT_IMPORT permission');
      case 429:
        throw new Error('Rate limit exceeded. Please try again later');
      default:
        throw new Error(`Garmin API error: ${message}`);
    }
  }
}
