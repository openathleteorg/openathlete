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

    const staleExports = await this.prisma.providerWorkoutExport.findMany({
      where: {
        athleteId: athleteId,
        provider: providerEnum,
        workoutId: workoutId,
        NOT: { plannedDate: { not: plannedDate } },
      },
    });

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

      await this.prisma.providerWorkoutExport.delete({
        where: {
          providerWorkoutExportId: stale.providerWorkoutExportId,
        },
      });
    }

    const record = await this.prisma.providerWorkoutExport.upsert({
      where: {
        athleteId_provider_workoutId_plannedDate: {
          athleteId: athleteId,
          provider: providerEnum,
          workoutId: workoutId,
          plannedDate: plannedDate,
        },
      },
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
        lastSyncAt: null,
        errorCode: null,
        errorMessage: null,
      },
    });

    // Idempotency check: if unchanged and success, skip
    if (record.status === 'success' && record.contentHash === contentHash) {
      this.logger.debug(
        `Skip export (unchanged) athlete=${athleteId} provider=${provider} workout=${workoutId} date=${date}`,
      );
      return { skipped: true, externalId: record.externalId ?? undefined };
    }

    try {
      const previousScheduleId =
        (record as unknown as { scheduleId?: string | null }).scheduleId ??
        undefined;

      const result = await adapter.upsertPlannedWorkout({
        athleteId,
        workoutId,
        date,
        normalized,
        previousExternalId: record.externalId ?? params.previousExternalId,
        previousScheduleId,
      });

      await this.prisma.providerWorkoutExport.update({
        where: {
          providerWorkoutExportId: record.providerWorkoutExportId,
        },
        data: {
          externalId: result.externalId,
          status: 'success',
          lastSyncAt: new Date(),
          attemptCount: { increment: 1 },
          ...(result.scheduleId !== undefined && {
            scheduleId: result.scheduleId,
          }),
        } as Prisma.ProviderWorkoutExportUpdateInput,
      });

      return { skipped: false, externalId: result.externalId };
    } catch (err) {
      await this.prisma.providerWorkoutExport.update({
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
