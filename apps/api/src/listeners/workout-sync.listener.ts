import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import {
  SPORT_TYPE,
  mapPrismaWorkoutToDto,
  normalizeWorkoutForExport,
  startOfDay,
} from '@openathlete/shared';

import { WorkoutPlannedChangedEvent } from 'src/events';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { ProviderExportService } from 'src/modules/providers-sync/export.service';

type ProviderKey = 'garmin' | 'suunto' | 'coros';

@Injectable()
export class WorkoutSyncListener {
  private readonly logger = new Logger(WorkoutSyncListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exportService: ProviderExportService,
  ) {}

  @OnEvent(WorkoutPlannedChangedEvent.SLUG, { async: true })
  async handle(event: WorkoutPlannedChangedEvent) {
    const { eventId, athleteId, workoutId, startDate, sport } = event.payload;

    // Check if date is within next 7 days (UTC)
    const now = startOfDay(new Date());
    const endDate = new Date(now);
    endDate.setUTCDate(endDate.getUTCDate() + 7);
    endDate.setUTCHours(23, 59, 59, 999);

    const eventDate = new Date(startDate);
    eventDate.setUTCHours(0, 0, 0, 0);

    if (eventDate > endDate || eventDate < now) {
      this.logger.debug(
        `Skipping workout sync: event date ${eventDate.toISOString()} is outside 7-day window`,
      );

      if (workoutId) {
        try {
          await this.exportService.deleteExportsForWorkout({ workoutId });
          this.logger.debug(
            `Deleted planned exports for workout ${workoutId} that moved outside window`,
          );
        } catch (err) {
          this.logger.warn(
            `Failed to delete planned exports for workout ${workoutId}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      return;
    }

    // Get connected providers for this athlete
    const providerAccounts = await this.prisma.provider_account.findMany({
      where: {
        athlete_id: athleteId,
        provider: { in: ['GARMIN', 'SUUNTO', 'COROS'] },
        status: 'active',
        export_workouts_enabled: true,
      },
    });

    if (providerAccounts.length === 0) {
      this.logger.debug(`No active providers found for athlete ${athleteId}`);
      return;
    }

    // If workout was deleted, we skip (per requirements: don't delete from provider)
    if (!workoutId) {
      this.logger.debug(
        `Workout deleted for event ${eventId}, skipping export (not deleting from providers)`,
      );
      return;
    }

    // Load workout and normalize
    const workoutRecord = await this.prisma.workout.findUnique({
      where: { workout_id: workoutId },
      include: {
        steps: {
          include: {
            targets: true,
            repeat_block: {
              include: {
                child_steps: {
                  include: { targets: true },
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
      this.logger.warn(`Workout ${workoutId} not found for event ${eventId}`);
      return;
    }

    // Get event to retrieve name and description
    const eventEntity = await this.prisma.event.findUnique({
      where: { event_id: eventId },
      include: {
        training: true,
      },
    });

    const workoutDto = mapPrismaWorkoutToDto(workoutRecord);
    const normalized = normalizeWorkoutForExport({
      sport: sport as SPORT_TYPE,
      title: eventEntity?.name || null,
      description: eventEntity?.training?.description || null,
      workout: workoutDto,
    });

    const dateStr = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // Export to all connected providers
    const exportPromises = providerAccounts.map(async (account) => {
      const providerKey = account.provider.toLowerCase() as ProviderKey;
      try {
        await this.exportService.upsertPlannedExport({
          athleteId,
          provider: providerKey,
          workoutId,
          date: dateStr,
          normalized,
        });
        this.logger.debug(
          `Exported workout ${workoutId} to ${account.provider} for athlete ${athleteId}`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to export workout ${workoutId} to ${account.provider} for athlete ${athleteId}: ${err instanceof Error ? err.message : String(err)}`,
          err instanceof Error ? err.stack : undefined,
        );
      }
    });

    await Promise.allSettled(exportPromises);
  }
}
