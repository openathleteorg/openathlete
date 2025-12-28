import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import {
  SPORT_TYPE,
  mapPrismaWorkoutToDto,
  normalizeWorkoutForExport,
} from '@openathlete/shared';

import { PrismaService } from '../prisma/services/prisma.service';
import { ProviderExportService } from './export.service';

type ProviderKey = 'garmin' | 'suunto' | 'coros';
type ProviderEnum = 'GARMIN' | 'SUUNTO' | 'COROS';

function providerEnumToKey(provider: string): ProviderKey | null {
  switch (provider) {
    case 'GARMIN':
      return 'garmin';
    case 'SUUNTO':
      return 'suunto';
    case 'COROS':
      return 'coros';
    default:
      return null;
  }
}

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
export class ProviderExportScheduler {
  private readonly logger = new Logger(ProviderExportScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exportService: ProviderExportService,
  ) {}

  // Run daily at 00:10 UTC
  @Cron('10 0 * * *', { timeZone: 'UTC' })
  async syncDailyExports() {
    this.logger.log('Starting daily provider export sync');
    await this.syncExportsForWindow();
  }

  // Manual sync method (can be called from API endpoint)
  async syncExportsForWindow(
    startDate?: Date,
    endDate?: Date,
    athleteId?: number,
  ) {
    const now = new Date();
    const windowStart = startDate || now;
    windowStart.setUTCHours(0, 0, 0, 0);

    const windowEnd = endDate || new Date(now);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 6); // +6 to get +7 days total
    windowEnd.setUTCHours(23, 59, 59, 999);

    this.logger.debug(
      `Syncing exports for window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`,
    );

    // Get all athletes with active provider accounts (or specific athlete if provided)
    const providerAccounts = await this.prisma.providerAccount.findMany({
      where: {
        provider: { in: ['GARMIN', 'SUUNTO', 'COROS'] },
        status: 'active',
        exportWorkoutsEnabled: true,
        ...(athleteId && { athleteId: athleteId }),
      },
      select: {
        athleteId: true,
        provider: true,
      },
    });

    // Group by athlete
    const athletesByProvider = new Map<
      number,
      Set<'garmin' | 'suunto' | 'coros'>
    >();

    for (const account of providerAccounts) {
      const providerKey = providerEnumToKey(account.provider);
      if (!providerKey) continue;

      if (!athletesByProvider.has(account.athleteId)) {
        athletesByProvider.set(account.athleteId, new Set());
      }
      athletesByProvider.get(account.athleteId)!.add(providerKey);
    }

    if (athletesByProvider.size === 0) {
      this.logger.debug('No athletes with active providers found');
      return;
    }

    // For each athlete, find workouts in the date window
    for (const [athleteId, providers] of athletesByProvider.entries()) {
      try {
        const events = await this.prisma.event.findMany({
          where: {
            athleteId: athleteId,
            type: 'TRAINING',
            startDate: {
              gte: windowStart,
              lte: windowEnd,
            },
            training: {
              workout: {
                isNot: null,
              },
            },
          },
          include: {
            training: {
              include: {
                workout: {
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
                },
              },
            },
          },
        });

        const workoutIdsInWindow = new Set(
          events
            .map((event) => event.training?.workout?.workoutId)
            .filter((id): id is number => typeof id === 'number'),
        );

        const providerEnums = Array.from(providers).map((provider) =>
          providerKeyToEnum(provider),
        );

        if (providerEnums.length > 0) {
          const orphanExports =
            await this.prisma.providerWorkoutExport.findMany({
              where: {
                athleteId: athleteId,
                provider: { in: providerEnums },
                plannedDate: {
                  gte: windowStart,
                  lte: windowEnd,
                },
                ...(workoutIdsInWindow.size > 0 && {
                  workoutId: {
                    notIn: Array.from(workoutIdsInWindow),
                  },
                }),
              },
              select: {
                workoutId: true,
              },
            });

          const workoutsToDelete = new Set(
            orphanExports.map((exp) => exp.workoutId),
          );

          for (const workoutId of workoutsToDelete) {
            try {
              await this.exportService.deleteExportsForWorkout({ workoutId });
              this.logger.debug(
                `Deleted planned exports for workout ${workoutId} outside 7-day window for athlete ${athleteId}`,
              );
            } catch (err) {
              this.logger.warn(
                `Failed to delete planned exports for workout ${workoutId}: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
          }
        }

        for (const event of events) {
          if (!event.training?.workout) continue;

          const workoutDto = mapPrismaWorkoutToDto(event.training.workout);
          const normalized = normalizeWorkoutForExport({
            sport: event.training.sport as SPORT_TYPE,
            title: event.name,
            description: event.training.description,
            workout: workoutDto,
          });

          const eventDate = new Date(event.startDate);
          eventDate.setUTCHours(0, 0, 0, 0);
          const dateStr = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD

          // Export to all connected providers
          const exportPromises = Array.from(providers).map(async (provider) => {
            try {
              await this.exportService.upsertPlannedExport({
                athleteId,
                provider,
                workoutId: event.training!.workout!.workoutId,
                date: dateStr,
                normalized,
              });
              this.logger.debug(
                `Synced workout ${event.training!.workout!.workoutId} to ${provider} for athlete ${athleteId}`,
              );
            } catch (err: unknown) {
              this.logger.error(
                `Failed to sync workout ${event.training!.workout!.workoutId} to ${provider} for athlete ${athleteId}: ${err instanceof Error ? err.message : String(err)}`,
                err instanceof Error ? err.stack : undefined,
              );
            }
          });

          await Promise.allSettled(exportPromises);
        }
      } catch (err: unknown) {
        this.logger.error(
          `Error syncing exports for athlete ${athleteId}: ${err instanceof Error ? err.message : String(err)}`,
          err instanceof Error ? err.stack : undefined,
        );
      }
    }

    this.logger.log('Completed daily provider export sync');
  }
}
