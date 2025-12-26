import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { Prisma } from '@openathlete/database';
import { InputJsonValue } from '@openathlete/database/generated/client/runtime/library';
import { FeatureName } from '@openathlete/shared';

import { ActivityImportedEvent } from 'src/events';
import { postActivityFeedbackAgent } from 'src/mastra/agents';
import {
  buildMetricsContext,
  buildZonesContext,
  fetchAthleteMetrics,
  fetchAthleteZones,
  formatZonesByType,
  getLatestMetrics,
} from 'src/modules/agent/services/event-ai-helpers';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { FeatureAccessService } from 'src/modules/subscription';

@Injectable()
export class ActivityFeedbackListener {
  private readonly logger = new Logger(ActivityFeedbackListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly featureAccessService: FeatureAccessService,
  ) {}

  @OnEvent(ActivityImportedEvent.SLUG, { async: true })
  async handleActivityImport(event: ActivityImportedEvent) {
    const { eventActivityId, bulkImport } = event.payload;

    try {
      if (bulkImport) {
        this.logger.debug(
          `Skipping post-activity feedback generation for activity ${eventActivityId} (bulk import / bulkImport).`,
        );
        return;
      }

      this.logger.log(
        `Generating post-activity feedback questions for activity ${eventActivityId}...`,
      );

      const activity = await this.prisma.event_activity.findUnique({
        where: { event_activity_id: eventActivityId },
        include: {
          related_competition: true,
          related_training: true,
          feedback_questions: true,
          event: {
            include: {
              athlete: {
                include: {
                  metrics: true,
                  user: {
                    select: {
                      language: true,
                    },
                  },
                },
              },
            },
          },
          normalization: true,
          weather: true,
        },
      });

      if (!activity || !activity.event?.athlete_id || !activity.event.athlete) {
        this.logger.warn(
          `Activity ${eventActivityId} not found or has no athlete, skipping feedback question generation`,
        );
        return;
      }

      const athleteId = activity.event.athlete_id;
      const userLanguage = activity.event.athlete.user?.language ?? 'FR';

      const hasAIAccess =
        await this.featureAccessService.canAccessFeatureForAthlete(
          athleteId,
          FeatureName.AI_RPE_QUESTIONS,
        );

      if (!hasAIAccess) {
        this.logger.debug(
          `Athlete ${athleteId} and their coaches do not have access to AI RPE questions feature, skipping question generation`,
        );
        return;
      }

      const athleteSettings = await this.prisma.athlete_settings.findUnique({
        where: { athlete_id: athleteId },
      });

      if (
        !athleteSettings ||
        athleteSettings.require_feedback_questions === false
      ) {
        this.logger.debug(
          `Feedback questions disabled for athlete ${athleteId}, skipping question generation`,
        );
        return;
      }

      if (activity.feedback_questions.length > 0) {
        this.logger.debug(
          `Feedback questions already generated for activity ${eventActivityId}, skipping question generation`,
        );
        return;
      }

      // Fetch last metrics & zones for context
      const [metrics, zones] = await Promise.all([
        fetchAthleteMetrics(this.prisma, athleteId),
        fetchAthleteZones(this.prisma, athleteId),
      ]);

      // Fetch active injuries separately (new Prisma model)
      const injuries =
        (await this.prisma.athlete_injury?.findMany({
          where: { athlete_id: athleteId },
          orderBy: { created_at: 'desc' },
          take: 20,
        })) ?? [];

      const latestMetrics = getLatestMetrics(metrics);
      const athleteMetricsSummary = buildMetricsContext(latestMetrics);
      const zonesByType = formatZonesByType(zones);
      const trainingZonesSummary = buildZonesContext(zonesByType);

      const training = activity.related_training;
      const competition = activity.related_competition;
      const goalSummary = training
        ? `Target distance: ${training.goal_distance ?? 'n/a'} m, Target elevation gain: ${training.goal_elevation_gain ?? 'n/a'} m, Target duration: ${training.goal_duration ?? 'n/a'} s, Target RPE: ${training.goal_rpe ?? 'n/a'}`
        : competition
          ? `Target distance: ${competition.goal_distance ?? 'n/a'} m, Target elevation gain: ${competition.goal_elevation_gain ?? 'n/a'} m, Target duration: ${competition.goal_duration ?? 'n/a'} s, Target RPE: ${competition.goal_rpe ?? 'n/a'}`
          : 'No goals specified';

      const injuriesSummary =
        injuries.length === 0
          ? 'No active injuries reported.'
          : injuries
              .map(
                (injury) =>
                  `- ${injury.location} (pain score: ${injury.pain_score.toFixed(2)}, status: ${injury.status})`,
              )
              .join('\n');

      const plannedVsCompletedSummary = [
        `Event name: ${activity.event.name}`,
        `Sport: ${activity.sport}`,
        '',
        'PLANNED (if available):',
        training
          ? `- Target distance: ${training.goal_distance ?? 'n/a'} m\n- Target elevation gain: ${training.goal_elevation_gain ?? 'n/a'} m\n- Target duration: ${training.goal_duration ?? 'n/a'} s\n- Target RPE: ${training.goal_rpe ?? 'n/a'}`
          : 'No planned training linked to this activity.',
        '',
        'COMPLETED:',
        `- Distance: ${activity.distance} m`,
        `- Elevation gain: ${activity.elevation_gain} m`,
        `- Duration (moving_time): ${activity.moving_time} s`,
        `- Actual RPE: ${activity.rpe ?? 'n/a'}`,
        `- Average HR: ${activity.average_heartrate ?? 'n/a'} bpm`,
      ].join('\n');

      const targetLanguage = userLanguage === 'FR' ? 'French' : 'English';

      const context = [
        '=== ATHLETE PROFILE & CURRENT LOAD ===',
        athleteMetricsSummary,
        '',
        '=== TRAINING ZONES ===',
        trainingZonesSummary,
        '',
        '=== CURRENT INJURIES ===',
        injuriesSummary,
        '',
        '=== SESSION GOALS ===',
        goalSummary,
        '',
        '=== PLANNED VS COMPLETED COMPARISON ===',
        plannedVsCompletedSummary,
        '',
        `=== LANGUAGE REQUIREMENT ===`,
        `IMPORTANT: Generate all questions and QCM option labels in ${targetLanguage} (${userLanguage}).`,
        `Use ${targetLanguage === 'French' ? 'tu' : 'you'} form, direct and friendly coaching style.`,
      ].join('\n');

      const response = await postActivityFeedbackAgent.generate(context);

      if (!response.text) {
        this.logger.warn(
          `Post-activity feedback agent returned empty response for activity ${eventActivityId}`,
        );
        return;
      }

      let parsed: {
        questions?: Array<{
          text: string;
          qcmOptions?: Array<{ label: string }>;
        }>;
      };

      try {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(
          jsonMatch ? jsonMatch[0] : response.text,
        ) as typeof parsed;
      } catch (error) {
        this.logger.error(
          `Failed to parse post-activity feedback agent response for activity ${eventActivityId}: ${response.text}`,
          error instanceof Error ? error.stack : undefined,
        );
        return;
      }

      if (!parsed.questions || parsed.questions.length === 0) {
        this.logger.warn(
          `No questions returned by post-activity feedback agent for activity ${eventActivityId}`,
        );
        return;
      }

      const questionsToCreate = parsed.questions.slice(0, 4);

      await this.prisma.$transaction(
        questionsToCreate.map((question) =>
          this.prisma.activity_feedback_question.create({
            data: {
              event_activity_id: eventActivityId,
              question_text: question.text,
              qcm_options:
                question.qcmOptions && question.qcmOptions.length > 0
                  ? (question.qcmOptions as unknown as InputJsonValue)
                  : Prisma.DbNull,
            },
          }),
        ),
      );

      this.logger.log(
        `✓ Stored ${questionsToCreate.length} post-activity feedback questions for activity ${eventActivityId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error generating post-activity feedback questions for activity ${eventActivityId}:`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
