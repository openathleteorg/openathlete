import axios, { AxiosError, isAxiosError } from 'axios';

import { Injectable, Logger } from '@nestjs/common';

import {
  ConnectorProvider,
  MetricType,
  ProviderAccount,
} from '@openathlete/database';
import { mapPrismaWorkoutToDto } from '@openathlete/shared';

import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { ProviderRateLimitError } from '../errors/provider-rate-limit.error';
import type { GarminMetrics, GarminZone } from '../mapping/garmin-helpers';
import {
  GARMIN_MAX_STEPS,
  mapWorkoutDtoToGarmin,
} from '../mapping/garmin.mapper';
import type { GarminStep, GarminWorkout } from '../mapping/garmin.types';
import type {
  DeletePlannedWorkoutInput,
  ProviderAdapter,
  UpsertPlannedWorkoutInput,
  UpsertPlannedWorkoutResult,
} from '../provider-adapter.interface';
import { GarminProviderService } from '../providers/garmin.provider.service';

const TRAINING_API = 'https://apis.garmin.com/training-api';
// Garmin documents workout creation under another path than the other calls
const CREATE_WORKOUT_URL = 'https://apis.garmin.com/workoutportal/workout/v2';

/** Metrics that percentage targets refer to */
const REFERENCE_METRICS: MetricType[] = [
  MetricType.VMA,
  MetricType.FTP_RUNNING,
  MetricType.FTP_CYCLING,
  MetricType.CRITICAL_POWER_RUNNING,
  MetricType.CRITICAL_POWER_CYCLING,
  MetricType.HR_MAX,
  MetricType.HR_REST,
  MetricType.HR_RESERVE,
];

/**
 * Garmin Training API: a planned session becomes a workout plus a schedule
 * that puts it on the athlete's Garmin calendar and watch.
 */
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

  private async getAccount(athleteId: number): Promise<ProviderAccount | null> {
    return this.prisma.providerAccount.findFirst({
      where: {
        athleteId,
        provider: ConnectorProvider.GARMIN,
        status: 'active',
      },
    });
  }

  private async getMetrics(athleteId: number): Promise<GarminMetrics> {
    const metrics = await this.prisma.athleteMetric.findMany({
      where: {
        athleteId,
        type: { in: REFERENCE_METRICS },
      },
      orderBy: [{ type: 'asc' }, { date: 'desc' }],
      distinct: ['type'],
      select: { type: true, value: true },
    });
    return Object.fromEntries(
      metrics.map((metric) => [metric.type, { value: metric.value }]),
    );
  }

  private async getZones(athleteId: number): Promise<GarminZone[]> {
    const zones = await this.prisma.trainingZone.findMany({
      where: { athleteId },
      select: {
        trainingZoneId: true,
        type: true,
        values: { select: { min: true, max: true, sports: true } },
      },
    });
    return zones as GarminZone[];
  }

  async upsertPlannedWorkout(
    input: UpsertPlannedWorkoutInput,
  ): Promise<UpsertPlannedWorkoutResult> {
    const account = await this.getAccount(input.athleteId);
    if (!account) {
      throw new Error('No active Garmin account found for athlete');
    }

    const permissions =
      await this.garminProviderService.getAccountPermissions(account);
    if (!permissions.includes('WORKOUT_IMPORT')) {
      throw new Error(
        'The athlete has not allowed workout imports in Garmin Connect',
      );
    }

    const workoutRecord = await this.prisma.workout.findUnique({
      where: { workoutId: input.workoutId },
      include: {
        steps: {
          include: {
            targets: true,
            repeatBlock: {
              include: {
                childSteps: {
                  include: { targets: true },
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!workoutRecord) {
      throw new Error('Workout not found');
    }

    const [metrics, zones] = await Promise.all([
      this.getMetrics(input.athleteId),
      this.getZones(input.athleteId),
    ]);
    const garminWorkout = mapWorkoutDtoToGarmin(
      mapPrismaWorkoutToDto(workoutRecord),
      input.normalized.sport,
      input.normalized.title,
      input.normalized.description,
      { metrics, zones },
    );
    this.validateWorkout(garminWorkout);

    const accessToken =
      await this.garminProviderService.getValidAccessToken(account);
    const previousWorkoutId = numericId(input.previousExternalId);
    let previousScheduleId = numericId(input.previousScheduleId);

    let workoutId = previousWorkoutId
      ? await this.updateWorkout(accessToken, previousWorkoutId, garminWorkout)
      : null;
    let created = false;
    if (!workoutId) {
      // New, or deleted in Garmin Connect meanwhile: its schedule went too
      workoutId = await this.createWorkout(accessToken, garminWorkout);
      previousScheduleId = null;
      created = true;
    }

    // The schedule only changes with the workout id: the date is part of
    // the export, and another date is another export
    if (previousScheduleId) {
      return { externalId: workoutId, scheduleId: previousScheduleId };
    }
    try {
      const scheduleId = await this.createSchedule(
        accessToken,
        workoutId,
        input.date,
      );
      return { externalId: workoutId, scheduleId };
    } catch (error) {
      // A failed export keeps no workout id: the next attempt would create
      // the workout again, leaving this one in the athlete's library
      if (created) await this.deleteCreatedWorkout(accessToken, workoutId);
      throw error;
    }
  }

  private async deleteCreatedWorkout(
    accessToken: string,
    workoutId: string,
  ): Promise<void> {
    try {
      await this.request(
        () =>
          axios.delete(`${TRAINING_API}/workout/v2/${workoutId}`, {
            headers: authHeaders(accessToken),
          }),
        { notFound: null },
      );
    } catch (error) {
      this.logger.warn(
        `Could not delete unscheduled Garmin workout ${workoutId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private validateWorkout(workout: GarminWorkout): void {
    const steps = workout.segments.reduce(
      (sum, segment) => sum + countSteps(segment.steps),
      0,
    );
    if (steps === 0) {
      throw new Error('Workout has no steps to send to Garmin');
    }
    if (steps > GARMIN_MAX_STEPS) {
      throw new Error(
        `Workout has ${steps} steps; Garmin accepts ${GARMIN_MAX_STEPS} at most`,
      );
    }
  }

  private async createWorkout(
    accessToken: string,
    workout: GarminWorkout,
  ): Promise<string> {
    const data = await this.request<{ workoutId?: number }>(() =>
      axios.post(CREATE_WORKOUT_URL, workout, {
        headers: authHeaders(accessToken),
      }),
    );
    if (!data?.workoutId) {
      throw new Error('Garmin did not return the created workout id');
    }
    return String(data.workoutId);
  }

  /**
   * Replaces a workout. Garmin wants the full workout, with its owner, which
   * only Garmin knows. Returns null when the workout no longer exists.
   */
  private async updateWorkout(
    accessToken: string,
    workoutId: string,
    workout: GarminWorkout,
  ): Promise<string | null> {
    const existing = await this.request<GarminWorkout | null>(
      () =>
        axios.get(`${TRAINING_API}/workout/v2/${workoutId}`, {
          headers: authHeaders(accessToken),
        }),
      { notFound: null },
    );
    if (!existing) return null;

    await this.request(
      () =>
        axios.put(
          `${TRAINING_API}/workout/v2/${workoutId}`,
          {
            ...workout,
            workoutId: Number(workoutId),
            ownerId: existing.ownerId,
          },
          { headers: authHeaders(accessToken) },
        ),
      { notFound: null },
    );
    return workoutId;
  }

  private async createSchedule(
    accessToken: string,
    workoutId: string,
    date: string,
  ): Promise<string> {
    const data = await this.request<unknown>(() =>
      axios.post(
        `${TRAINING_API}/schedule/`,
        { workoutId: Number(workoutId), date },
        { headers: authHeaders(accessToken) },
      ),
    );
    // Garmin answers with the bare schedule id
    const scheduleId =
      typeof data === 'number' || typeof data === 'string'
        ? data
        : (data as { scheduleId?: number } | null)?.scheduleId;
    if (scheduleId === undefined || scheduleId === null || scheduleId === '') {
      throw new Error(
        `Garmin did not return the schedule id of workout ${workoutId} on ${date}`,
      );
    }
    return String(scheduleId);
  }

  async deletePlannedWorkout(input: DeletePlannedWorkoutInput): Promise<void> {
    const account = await this.getAccount(input.athleteId);
    if (!account) {
      this.logger.warn(
        `No active Garmin account for athlete ${input.athleteId}; nothing deleted`,
      );
      return;
    }
    const accessToken =
      await this.garminProviderService.getValidAccessToken(account);

    // Deleting the workout deletes its schedules too
    const workoutId = numericId(input.externalId);
    const scheduleId = numericId(input.scheduleId);
    if (workoutId) {
      await this.request(
        () =>
          axios.delete(`${TRAINING_API}/workout/v2/${workoutId}`, {
            headers: authHeaders(accessToken),
          }),
        { notFound: null },
      );
    } else if (scheduleId) {
      await this.request(
        () =>
          axios.delete(`${TRAINING_API}/schedule/${scheduleId}`, {
            headers: authHeaders(accessToken),
          }),
        { notFound: null },
      );
    }
  }

  private async request<T>(
    send: () => Promise<{ data: T }>,
    options: { notFound?: T } = {},
  ): Promise<T> {
    try {
      return (await send()).data;
    } catch (error) {
      if (
        isAxiosError(error) &&
        error.response?.status === 404 &&
        'notFound' in options
      ) {
        return options.notFound as T;
      }
      if (isAxiosError(error)) this.handleApiError(error);
      throw error;
    }
  }

  private handleApiError(error: AxiosError): never {
    const status = error.response?.status;
    const data = error.response?.data as
      { message?: string; errorMessage?: string } | undefined;
    const message = data?.errorMessage || data?.message || error.message;

    switch (status) {
      case 400:
        throw new Error(`Invalid workout data: ${message}`);
      case 401:
        throw new Error('Garmin access token invalid or expired');
      case 403:
        throw new Error(`Garmin refused the request: ${message}`);
      case 412:
        throw new Error(
          'The athlete has not allowed workout imports in Garmin Connect',
        );
      case 429:
        throw new ProviderRateLimitError('Garmin');
      default:
        throw new Error(
          `Garmin API error (${status ?? 'network'}): ${message}`,
        );
    }
  }
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

function numericId(id?: string | null): string | null {
  return id && /^\d+$/.test(id) ? id : null;
}

function countSteps(steps: GarminStep[]): number {
  return steps.reduce(
    (count, step) =>
      count +
      (step.type === 'WorkoutRepeatStep' ? 1 + countSteps(step.steps) : 1),
    0,
  );
}
