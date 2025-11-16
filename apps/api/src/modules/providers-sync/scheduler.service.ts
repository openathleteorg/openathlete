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
    const providerAccounts = await this.prisma.provider_account.findMany({
      where: {
        provider: { in: ['GARMIN', 'SUUNTO', 'COROS'] },
        status: 'active',
        ...(athleteId && { athlete_id: athleteId }),
      },
      select: {
        athlete_id: true,
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

      if (!athletesByProvider.has(account.athlete_id)) {
        athletesByProvider.set(account.athlete_id, new Set());
      }
      athletesByProvider.get(account.athlete_id)!.add(providerKey);
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
            athlete_id: athleteId,
            type: 'TRAINING',
            start_date: {
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
                },
              },
            },
          },
        });

        for (const event of events) {
          if (!event.training?.workout) continue;

          const workoutDto = mapPrismaWorkoutToDto(event.training.workout);
          const normalized = normalizeWorkoutForExport({
            sport: event.training.sport as SPORT_TYPE,
            title: null,
            description: null,
            workout: workoutDto,
          });

          const eventDate = new Date(event.start_date);
          eventDate.setUTCHours(0, 0, 0, 0);
          const dateStr = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD

          // Export to all connected providers
          const exportPromises = Array.from(providers).map(async (provider) => {
            try {
              await this.exportService.upsertPlannedExport({
                athleteId,
                provider,
                workoutId: event.training!.workout!.workout_id,
                date: dateStr,
                normalized,
              });
              this.logger.debug(
                `Synced workout ${event.training!.workout!.workout_id} to ${provider} for athlete ${athleteId}`,
              );
            } catch (err: unknown) {
              this.logger.error(
                `Failed to sync workout ${event.training!.workout!.workout_id} to ${provider} for athlete ${athleteId}: ${err instanceof Error ? err.message : String(err)}`,
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
