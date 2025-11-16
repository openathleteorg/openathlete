import { AxiosError } from 'axios';
import { createHash } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import type { NormalizedWorkout } from '@openathlete/shared/src/types/workout-normalized';

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

  constructor(private readonly prisma: PrismaService) {
    // For now, construct adapters directly; later inject via module
    this.adapters = {
      garmin: new GarminAdapter(),
      suunto: new SuuntoAdapter(),
      coros: new CorosAdapter(),
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

    const contentHash = this.computeHash(date, normalized);
    const payload = this.mapPayload(provider, date, normalized);

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
      const adapter = this.adapters[provider];
      const result = await adapter.upsertPlannedWorkout({
        athleteId,
        date,
        normalized,
        previousExternalId: record.external_id ?? params.previousExternalId,
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
        },
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
}
