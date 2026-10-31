import { AxiosError } from 'axios';
import { createHash } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import type { NormalizedWorkout } from '@openathlete/shared';

import { PrismaService } from '../prisma/services/prisma.service';
import { CorosAdapter, GarminAdapter, SuuntoAdapter } from './adapters';
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

    const staleExports = await this.prisma.providerWorkoutExport.findMany({
      where: {
        athleteId: athleteId,
        provider: providerEnum,
        workoutId: workoutId,
        NOT: { plannedDate: plannedDate },
      },
    });

    // The session moved to another day: remove it from the old one
    for (const stale of staleExports) {
      if (adapter.deletePlannedWorkout) {
        try {
          await adapter.deletePlannedWorkout({
            athleteId,
            externalId: stale.externalId,
            scheduleId: stale.scheduleId,
            date: stale.plannedDate.toISOString().split('T')[0],
          });
        } catch (err) {
          this.logger.warn(
            `Failed to delete stale planned workout for provider ${provider} workout ${workoutId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      await this.prisma.providerWorkoutExport.deleteMany({
        where: {
          providerWorkoutExportId: stale.providerWorkoutExportId,
        },
      });
    }

    // A session described in text only has nothing a watch could follow
    if (normalized.steps.length === 0) {
      this.logger.debug(
        `Skip export (no steps) athlete=${athleteId} provider=${provider} workout=${workoutId} date=${date}`,
      );
      return { skipped: true };
    }

    const key = {
      athleteId_provider_workoutId_plannedDate: {
        athleteId: athleteId,
        provider: providerEnum,
        workoutId: workoutId,
        plannedDate: plannedDate,
      },
    };

    // Unchanged since its last successful export: nothing to send. Checked
    // before the record is marked pending, which would hide the success
    const existing = await this.prisma.providerWorkoutExport.findUnique({
      where: key,
    });
    if (
      existing?.status === 'success' &&
      existing.contentHash === contentHash
    ) {
      this.logger.debug(
        `Skip export (unchanged) athlete=${athleteId} provider=${provider} workout=${workoutId} date=${date}`,
      );
      return { skipped: true, externalId: existing.externalId ?? undefined };
    }

    const record = await this.prisma.providerWorkoutExport.upsert({
      where: key,
      create: {
        athleteId: athleteId,
        provider: providerEnum,
        workoutId: workoutId,
        plannedDate: plannedDate,
        status: 'pending',
        contentHash: contentHash,
        rawPayload: payload as object,
      },
      update: {
        contentHash: contentHash,
        rawPayload: payload as object,
        status: 'pending',
        errorCode: null,
        errorMessage: null,
      },
    });

    try {
      const previousScheduleId = record.scheduleId ?? undefined;

      const result = await adapter.upsertPlannedWorkout({
        athleteId,
        workoutId,
        date,
        normalized,
        previousExternalId: record.externalId ?? params.previousExternalId,
        previousScheduleId,
      });

      // updateMany: a concurrent deletion of the export is not an error
      await this.prisma.providerWorkoutExport.updateMany({
        where: {
          providerWorkoutExportId: record.providerWorkoutExportId,
        },
        data: {
          externalId: result.externalId,
          status: 'success',
          lastSyncAt: new Date(),
          attemptCount: { increment: 1 },
          scheduleId: result.scheduleId ?? null,
        },
      });

      return { skipped: false, externalId: result.externalId };
    } catch (err) {
      await this.prisma.providerWorkoutExport.updateMany({
        where: {
          providerWorkoutExportId: record.providerWorkoutExportId,
        },
        data: {
          status: 'failed',
          lastSyncAt: new Date(),
          attemptCount: { increment: 1 },
          errorCode: err instanceof AxiosError ? err.code : null,
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        },
      });
      throw err;
    }
  }

  async deleteExportsForWorkout(params: { workoutId: number }): Promise<void> {
    const exports = await this.prisma.providerWorkoutExport.findMany({
      where: { workoutId: params.workoutId },
    });

    for (const exp of exports) {
      const providerKey = exp.provider.toLowerCase() as ProviderKey;
      const adapter = this.adapters[providerKey];

      if (adapter?.deletePlannedWorkout) {
        try {
          await adapter.deletePlannedWorkout({
            athleteId: exp.athleteId,
            externalId: exp.externalId,
            scheduleId: exp.scheduleId,
            date: exp.plannedDate.toISOString().split('T')[0],
          });
        } catch (err) {
          this.logger.warn(
            `Failed to delete planned workout for provider ${exp.provider} workout ${exp.workoutId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    await this.prisma.providerWorkoutExport.deleteMany({
      where: { workoutId: params.workoutId },
    });
  }
}
