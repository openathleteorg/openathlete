import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { training_load_calculation_type } from '@openathlete/database';

import { ActivityImportedEvent } from 'src/events';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { TrainingLoadService } from '../modules/core/services/training-load.service';

/**
 * Listener that automatically calculates training load when an activity is imported or updated
 */
@Injectable()
export class TrainingLoadListener {
  private readonly logger = new Logger(TrainingLoadListener.name);

  constructor(
    private readonly trainingLoadService: TrainingLoadService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handle activity import event
   * Automatically calculates training load for all applicable calculation types
   */
  @OnEvent(ActivityImportedEvent.SLUG, { async: true })
  async handleActivityImport(event: ActivityImportedEvent) {
    const { eventActivityId, eventId } = event.payload;

    this.logger.log(
      `Processing training load for activity ${eventActivityId}...`,
    );

    try {
      // Get the activity with event to get athlete_id
      const activity = await this.prisma.event_activity.findUnique({
        where: {
          event_activity_id: eventActivityId,
        },
        include: {
          event: {
            select: {
              athlete_id: true,
            },
          },
        },
      });

      if (!activity || !activity.event?.athlete_id) {
        this.logger.warn(
          `Activity ${eventActivityId} not found or has no athlete`,
        );
        return;
      }

      const athleteId = activity.event.athlete_id;

      // Get athlete's user to create AuthUser context
      const athlete = await this.prisma.athlete.findUnique({
        where: {
          athlete_id: athleteId,
        },
        include: {
          user: {
            select: {
              user_id: true,
              email: true,
              first_name: true,
              last_name: true,
              roles: true,
            },
          },
        },
      });

      if (!athlete) {
        this.logger.warn(`Athlete ${athleteId} not found`);
        return;
      }

      // Create AuthUser context
      const authUser = {
        user_id: athlete.user.user_id,
        email: athlete.user.email,
        first_name: athlete.user.first_name,
        last_name: athlete.user.last_name,
        roles: athlete.user.roles,
        athlete: {
          athlete_id: athleteId,
        },
      };

      // Calculate Foster RPE if RPE is available
      if (activity.rpe) {
        try {
          await this.trainingLoadService.calculateActivityLoad(
            authUser,
            eventId,
            'FOSTER_RPE' as training_load_calculation_type,
          );
          this.logger.log(
            `✓ Foster RPE training load calculated for activity ${eventActivityId}`,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to calculate Foster RPE for activity ${eventActivityId}: ${message}`,
          );
        }
      }

      // Calculate TRIMP if heart rate data is available
      if (activity.stream && activity.average_heartrate) {
        // Get athlete's HR metrics
        const hrMax = await this.prisma.athlete_metric.findFirst({
          where: {
            athlete_id: athleteId,
            type: 'HR_MAX',
          },
          orderBy: {
            date: 'desc',
          },
        });

        const hrRest = await this.prisma.athlete_metric.findFirst({
          where: {
            athlete_id: athleteId,
            type: 'HR_REST',
          },
          orderBy: {
            date: 'desc',
          },
        });

        // Only calculate TRIMP if we have both HR metrics
        if (hrMax && hrRest) {
          // Try TRIMP Edwards
          try {
            await this.trainingLoadService.calculateActivityLoad(
              authUser,
              eventId,
              'TRIMP_EDWARDS' as training_load_calculation_type,
            );
            this.logger.log(
              `✓ TRIMP Edwards training load calculated for activity ${eventActivityId}`,
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Failed to calculate TRIMP Edwards for activity ${eventActivityId}: ${message}`,
            );
          }

          // Try TRIMP Banister
          try {
            await this.trainingLoadService.calculateActivityLoad(
              authUser,
              eventId,
              'TRIMP_BANISTER' as training_load_calculation_type,
            );
            this.logger.log(
              `✓ TRIMP Banister training load calculated for activity ${eventActivityId}`,
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Failed to calculate TRIMP Banister for activity ${eventActivityId}: ${message}`,
            );
          }
        } else {
          this.logger.debug(
            `HR metrics (HR_MAX: ${!!hrMax}, HR_REST: ${!!hrRest}) not available for athlete ${athleteId}, skipping TRIMP calculations`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing training load for activity ${eventActivityId}:`,
        error,
      );
    }
  }
}
