import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AthleteInjury, Prisma } from '@openathlete/database';
import { InputJsonValue } from '@openathlete/database/generated/client/runtime/library';
import { AiTask } from '@openathlete/shared';

import { Language } from 'src/common/constants/languages.constant';
import { formatRpe } from 'src/common/utils/rpe';
import { ActivityImportedEvent } from 'src/events';
import {
  feedbackQuestionsOutputSchema,
  postActivityFeedbackAgent,
} from 'src/mastra/agents';
import {
  buildMetricsContext,
  buildZonesContext,
  fetchAthleteMetrics,
  fetchAthleteZones,
  formatZonesByType,
  getLatestMetrics,
} from 'src/modules/agent/services/event-ai-helpers';
import { AiModelResolverService, AiService } from 'src/modules/ai';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const rpeOrNa = (rpe: number | null | undefined) =>
  rpe === null || rpe === undefined ? 'n/a' : formatRpe(rpe);

@Injectable()
export class ActivityFeedbackListener {
  private readonly logger = new Logger(ActivityFeedbackListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiModelResolver: AiModelResolverService,
    private readonly aiService: AiService,
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

      const activity = await this.prisma.eventActivity.findUnique({
        where: { eventActivityId: eventActivityId },
        include: {
          relatedCompetition: true,
          relatedTraining: true,
          feedbackQuestions: true,
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

      if (!activity || !activity.event?.athleteId || !activity.event.athlete) {
        this.logger.warn(
          `Activity ${eventActivityId} not found or has no athlete, skipping feedback question generation`,
        );
        return;
      }

      const athleteId = activity.event.athleteId;
      const userLanguage = activity.event.athlete.user?.language ?? Language.FR;

      const model = await this.aiModelResolver.tryResolveForAthlete(
        AiTask.POST_ACTIVITY_QUESTIONS,
        athleteId,
      );

      if (!model) {
        this.logger.debug(
          `Neither athlete ${athleteId} nor their coaches have AI for feedback questions, skipping question generation`,
        );
        return;
      }

      const athleteSettings = await this.prisma.athleteSettings.findUnique({
        where: { athleteId: athleteId },
      });

      if (
        !athleteSettings ||
        athleteSettings.requireFeedbackQuestions === false
      ) {
        this.logger.debug(
          `Feedback questions disabled for athlete ${athleteId}, skipping question generation`,
        );
        return;
      }

      if (activity.feedbackQuestions.length > 0) {
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
        (await this.prisma.athleteInjury?.findMany({
          where: { athleteId: athleteId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })) ?? [];

      const injuryMap = new Map<string, AthleteInjury>();
      for (const injury of injuries) {
        if (!injuryMap.has(injury.location)) {
          injuryMap.set(injury.location, injury);
        }
      }

      const activeInjuries = Array.from(injuryMap.values()).filter(
        (injury) => injury.painScore > 0 && injury.status !== 'RESOLVED',
      );

      const latestMetrics = getLatestMetrics(metrics);
      const athleteMetricsSummary = buildMetricsContext(latestMetrics);
      const zonesByType = formatZonesByType(zones);
      const trainingZonesSummary = buildZonesContext(zonesByType);

      const training = activity.relatedTraining;
      const competition = activity.relatedCompetition;
      const goalSummary = training
        ? `Target distance: ${training.goalDistance ?? 'n/a'} m, Target elevation gain: ${training.goalElevationGain ?? 'n/a'} m, Target duration: ${training.goalDuration ?? 'n/a'} s, Target RPE: ${rpeOrNa(training.goalRpe)}`
        : competition
          ? `Target distance: ${competition.goalDistance ?? 'n/a'} m, Target elevation gain: ${competition.goalElevationGain ?? 'n/a'} m, Target duration: ${competition.goalDuration ?? 'n/a'} s, Target RPE: ${rpeOrNa(competition.goalRpe)}`
          : 'No goals specified';

      const injuriesSummary =
        activeInjuries.length === 0
          ? 'No active injuries reported.'
          : activeInjuries
              .map(
                (injury: {
                  location: string;
                  painScore: number;
                  status: string;
                }) =>
                  `- ${injury.location} (pain score: ${injury.painScore.toFixed(2)}, status: ${injury.status})`,
              )
              .join('\n');

      const plannedVsCompletedSummary = [
        `Event name: ${activity.event.name}`,
        `Sport: ${activity.sport}`,
        '',
        'PLANNED (if available):',
        training
          ? `- Target distance: ${training.goalDistance ?? 'n/a'} m\n- Target elevation gain: ${training.goalElevationGain ?? 'n/a'} m\n- Target duration: ${training.goalDuration ?? 'n/a'} s\n- Target RPE: ${rpeOrNa(training.goalRpe)}`
          : 'No planned training linked to this activity.',
        '',
        'COMPLETED:',
        `- Distance: ${activity.distance} m`,
        `- Elevation gain: ${activity.elevationGain} m`,
        `- Duration (moving_time): ${activity.movingTime} s`,
        `- Actual RPE: ${rpeOrNa(activity.rpe)}`,
        `- Average HR: ${activity.averageHeartrate ?? 'n/a'} bpm`,
      ].join('\n');

      const targetLanguage =
        { FR: 'French', EN: 'English', IT: 'Italian', ES: 'Spanish' }[
          userLanguage
        ] ?? 'English';

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
        `Use ${({ French: 'tu', Italian: 'tu', Spanish: 'tú', English: 'you' } as Record<string, string>)[targetLanguage]} form, direct and friendly coaching style.`,
      ].join('\n');

      const { questions } = await this.aiService.generateObject(
        postActivityFeedbackAgent,
        model,
        context,
        feedbackQuestionsOutputSchema,
      );

      if (questions.length === 0) {
        this.logger.warn(
          `No questions returned by post-activity feedback agent for activity ${eventActivityId}`,
        );
        return;
      }

      const questionsToCreate = questions.slice(0, 4);

      await this.prisma.$transaction(
        questionsToCreate.map((question) =>
          this.prisma.activityFeedbackQuestion.create({
            data: {
              eventActivityId: eventActivityId,
              questionText: question.text,
              qcmOptions:
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
