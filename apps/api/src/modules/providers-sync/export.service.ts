import { AxiosError } from 'axios';
import { createHash } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import { Prisma } from '@openathlete/database';
import type { NormalizedWorkout } from '@openathlete/shared';

import { PrismaService } from '../prisma/services/prisma.service';
import { CorosAdapter } from './adapters/coros.adapter';
import { GarminAdapter } from './adapters/garmin.adapter';
import { SuuntoAdapter } from './adapters/suunto.adapter';
import { mapToCoros, mapToGarmin, mapToSuunto } from './mapping';
import type { ProviderAdapter } from './provider-adapter.interface';

type ProviderKey = 'garmin' | 'suunto' | 'coros';
type ProviderEnum = 'GARMIN' | 'SUUNTO' | 'COROS';

function providerKeyToEnum(provider: ProviderKey): ProviderEnum {
  switch (provider) {
    case 'garmin':
      return 'GARMIN';
    case 'suunto':
      return 'SUUNTO';
    case 'coros':
      return 'COROS';
  }
}

@Injectable()
export class ProviderExportService {
  private readonly logger = new Logger(ProviderExportService.name);

  private readonly adapters: Record<ProviderKey, ProviderAdapter>;

  constructor(
    private readonly prisma: PrismaService,
    garminAdapter: GarminAdapter,
    suuntoAdapter: SuuntoAdapter,
    corosAdapter: CorosAdapter,
  ) {
    this.adapters = {
      garmin: garminAdapter,
      suunto: suuntoAdapter,
      coros: corosAdapter,
    } as const;
  }

  private computeHash(date: string, normalized: NormalizedWorkout): string {
    const json = JSON.stringify({ date, normalized });
    return createHash('sha256').update(json).digest('hex');
  }

  private mapPayload(
    provider: ProviderKey,
    date: string,
    normalized: NormalizedWorkout,
  ) {
    switch (provider) {
      case 'garmin':
        return mapToGarmin(date, normalized);
      case 'suunto':
        return mapToSuunto(date, normalized);
      case 'coros':
        return mapToCoros(date, normalized);
    }
  }

  async upsertPlannedExport(params: {
    athleteId: number;
    provider: ProviderKey;
    workoutId: number;
    date: string; // YYYY-MM-DD (UTC)
    normalized: NormalizedWorkout;
    previousExternalId?: string;
  }): Promise<{ skipped: boolean; externalId?: string }> {
    const { athleteId, provider, workoutId, date, normalized } = params;
    const providerEnum = providerKeyToEnum(provider);
    const plannedDate = new Date(`${date}T00:00:00.000Z`);
    const adapter = this.adapters[provider];

    const contentHash = this.computeHash(date, normalized);
    const payload = this.mapPayload(provider, date, normalized);

    const staleExports = await this.prisma.provider_workout_export.findMany({
      where: {
        athlete_id: athleteId,
        provider: providerEnum,
        workout_id: workoutId,
        NOT: { planned_date: plannedDate },
      },
    });

    for (const stale of staleExports) {
      if (adapter.deletePlannedWorkout) {
        try {
          await adapter.deletePlannedWorkout({
            athleteId,
            externalId: stale.external_id,
            scheduleId: stale.schedule_id,
            date: stale.planned_date.toISOString().split('T')[0],
          });
        } catch (err) {
          this.logger.warn(
            `Failed to delete stale planned workout for provider ${provider} workout ${workoutId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      await this.prisma.provider_workout_export.delete({
        where: {
          provider_workout_export_id: stale.provider_workout_export_id,
        },
      });
    }

    const record = await this.prisma.provider_workout_export.upsert({
      where: {
        athlete_id_provider_workout_id_planned_date: {
          athlete_id: athleteId,
          provider: providerEnum,
          workout_id: workoutId,
          planned_date: plannedDate,
        },
      },
      create: {
        athlete_id: athleteId,
        provider: providerEnum,
        workout_id: workoutId,
        planned_date: plannedDate,
        status: 'pending',
        content_hash: contentHash,
        raw_payload: payload as object,
      },
      update: {
        content_hash: contentHash,
        raw_payload: payload as object,
        status: 'pending',
        last_sync_at: null,
        error_code: null,
        error_message: null,
      },
    });

    // Idempotency check: if unchanged and success, skip
    if (record.status === 'success' && record.content_hash === contentHash) {
      this.logger.debug(
        `Skip export (unchanged) athlete=${athleteId} provider=${provider} workout=${workoutId} date=${date}`,
      );
      return { skipped: true, externalId: record.external_id ?? undefined };
    }

    try {
      const previousScheduleId =
        (record as unknown as { schedule_id?: string | null }).schedule_id ??
        undefined;

      const result = await adapter.upsertPlannedWorkout({
        athleteId,
        workoutId,
        date,
        normalized,
        previousExternalId: record.external_id ?? params.previousExternalId,
        previousScheduleId,
      });

      await this.prisma.provider_workout_export.update({
        where: {
          provider_workout_export_id: record.provider_workout_export_id,
        },
        data: {
          external_id: result.externalId,
          status: 'success',
          last_sync_at: new Date(),
          attempt_count: { increment: 1 },
          ...(result.scheduleId !== undefined && {
            schedule_id: result.scheduleId,
          }),
        } as Prisma.provider_workout_exportUpdateInput,
      });

      return { skipped: false, externalId: result.externalId };
    } catch (err) {
      await this.prisma.provider_workout_export.update({
        where: {
          provider_workout_export_id: record.provider_workout_export_id,
        },
        data: {
          status: 'failed',
          last_sync_at: new Date(),
          attempt_count: { increment: 1 },
          error_code: err instanceof AxiosError ? err.code : null,
          error_message: err instanceof Error ? err.message : 'Unknown error',
        },
      });
      throw err;
    }
  }

  async deleteExportsForWorkout(params: { workoutId: number }): Promise<void> {
    const exports = await this.prisma.provider_workout_export.findMany({
      where: { workout_id: params.workoutId },
    });

    for (const exp of exports) {
      const providerKey = exp.provider.toLowerCase() as ProviderKey;
      const adapter = this.adapters[providerKey];

      if (adapter?.deletePlannedWorkout) {
        try {
          await adapter.deletePlannedWorkout({
            athleteId: exp.athlete_id,
            externalId: exp.external_id,
            scheduleId: exp.schedule_id,
            date: exp.planned_date.toISOString().split('T')[0],
          });
        } catch (err) {
          this.logger.warn(
            `Failed to delete planned workout for provider ${exp.provider} workout ${exp.workout_id}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    await this.prisma.provider_workout_export.deleteMany({
      where: { workout_id: params.workoutId },
    });
  }
}
