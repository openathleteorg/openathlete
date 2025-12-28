import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { TrainingLoadCalculationType } from '@openathlete/database';

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
      // Get the activity with event to get athleteId
      const activity = await this.prisma.eventActivity.findUnique({
        where: {
          eventActivityId: eventActivityId,
        },
        include: {
          event: {
            select: {
              athleteId: true,
            },
          },
        },
      });

      if (!activity || !activity.event?.athleteId) {
        this.logger.warn(
          `Activity ${eventActivityId} not found or has no athlete`,
        );
        return;
      }

      const athleteId = activity.event.athleteId;

      // Get athlete's user to create AuthUser context
      const athlete = await this.prisma.athlete.findUnique({
        where: {
          athleteId: athleteId,
        },
        include: {
          user: {
            select: {
              userId: true,
              email: true,
              firstName: true,
              lastName: true,
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
        userId: athlete.user.userId,
        email: athlete.user.email,
        athlete: {
          athleteId: athleteId,
        },
      };

      // Calculate Foster RPE if RPE is available
      if (activity.rpe) {
        try {
          await this.trainingLoadService.calculateActivityLoad(
            authUser,
            eventId,
            'FOSTER_RPE' as TrainingLoadCalculationType,
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
      if (activity.stream && activity.averageHeartrate) {
        // Get athlete's HR metrics
        const hrMax = await this.prisma.athleteMetric.findFirst({
          where: {
            athleteId: athleteId,
            type: 'HR_MAX',
          },
          orderBy: {
            date: 'desc',
          },
        });

        const hrRest = await this.prisma.athleteMetric.findFirst({
          where: {
            athleteId: athleteId,
            type: 'HR_REST',
          },
          orderBy: {
            date: 'desc',
          },
        });

        // Only calculate TRIMP if we have both HR metrics
        if (hrMax && hrRest) {
          // Try TRIMP
          try {
            await this.trainingLoadService.calculateActivityLoad(
              authUser,
              eventId,
              'TRIMP' as TrainingLoadCalculationType,
            );
            this.logger.log(
              `✓ TRIMP training load calculated for activity ${eventActivityId}`,
            );
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Failed to calculate TRIMP for activity ${eventActivityId}: ${message}`,
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
