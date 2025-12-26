import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { FeatureName } from '@openathlete/shared';

import { ActivityImportedEvent } from 'src/events';
import { PushNotificationService } from 'src/modules/notification/services/push-notification.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { FeatureAccessService } from 'src/modules/subscription';

@Injectable()
export class ActivityPushNotificationListener {
  private readonly logger = new Logger(ActivityPushNotificationListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly featureAccessService: FeatureAccessService,
  ) {}

  @OnEvent(ActivityImportedEvent.SLUG, { async: true })
  async handleActivityImported(event: ActivityImportedEvent) {
    const { eventActivityId, eventId, bulkImport } = event.payload;

    if (bulkImport) {
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const activity = await this.prisma.event_activity.findUnique({
        where: { event_activity_id: eventActivityId },
        include: {
          event: {
            include: {
              athlete: {
                include: {
                  user: {
                    select: {
                      user_id: true,
                      language: true,
                      push_token: true,
                    },
                  },
                },
              },
            },
          },
          feedback_questions: {
            select: {
              activity_feedback_question_id: true,
            },
          },
        },
      });

      if (
        !activity ||
        !activity.event?.athlete_id ||
        !activity.event.athlete?.user
      ) {
        this.logger.debug(
          `Activity ${eventActivityId} not found or has no user, skipping push notification`,
        );
        return;
      }

      const user = activity.event.athlete.user;
      const athleteId = activity.event.athlete_id;

      if (!user.push_token) {
        this.logger.debug(
          `User ${user.user_id} does not have a push token, skipping notification`,
        );
        return;
      }

      const hasAIAccess =
        await this.featureAccessService.canAccessFeatureForAthlete(
          athleteId,
          FeatureName.AI_RPE_QUESTIONS,
        );

      const athleteSettings = await this.prisma.athlete_settings.findUnique({
        where: { athlete_id: athleteId },
      });

      const feedbackQuestionsEnabled =
        hasAIAccess && athleteSettings?.require_feedback_questions !== false;

      const hasQuestions = activity.feedback_questions.length > 0;

      const language = user.language ?? 'FR';
      let title: string;
      let body: string;

      if (feedbackQuestionsEnabled && hasQuestions) {
        title = language === 'FR' ? 'Activité traitée' : 'Activity processed';
        body =
          language === 'FR'
            ? 'Votre activité a été analysée et des questions de feedback sont disponibles.'
            : 'Your activity has been analyzed and feedback questions are available.';
      } else {
        title = language === 'FR' ? 'Activité traitée' : 'Activity processed';
        body =
          language === 'FR'
            ? 'Votre activité a été analysée avec succès.'
            : 'Your activity has been successfully analyzed.';
      }

      await this.pushNotificationService.sendPushNotification({
        userId: user.user_id,
        title,
        body,
        data: {
          type: 'activity_processed',
          eventId: String(eventId),
          eventActivityId: String(eventActivityId),
          hasQuestions: String(hasQuestions),
        },
      });

      this.logger.log(
        `Push notification sent for activity ${eventActivityId} to user ${user.user_id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send push notification for activity ${eventActivityId}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
