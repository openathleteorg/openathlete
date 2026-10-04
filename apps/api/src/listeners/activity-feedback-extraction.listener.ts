import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AiTask } from '@openathlete/shared';

import { ActivityFeedbackCompletedEvent } from 'src/events';
import {
  extractInjuryAgent,
  extractRpeAgent,
  injuriesOutputSchema,
  rpeOutputSchema,
} from 'src/mastra/agents';
import { AiModelResolverService, AiService } from 'src/modules/ai';
import { isRetryableAiError } from 'src/modules/ai/ai.errors';
import { CalendarWebSocketService } from 'src/modules/calendar/services/calendar-websocket.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class ActivityFeedbackExtractionListener {
  private readonly logger = new Logger(ActivityFeedbackExtractionListener.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarWebSocketService: CalendarWebSocketService,
    private readonly aiModelResolver: AiModelResolverService,
    private readonly aiService: AiService,
  ) {}

  @OnEvent(ActivityFeedbackCompletedEvent.SLUG, { async: true })
  async handleActivityFeedbackCompleted(event: ActivityFeedbackCompletedEvent) {
    const { eventActivityId, trigger } = event.payload;

    try {
      this.logger.log(
        `Processing feedback extraction for activity ${eventActivityId} (trigger: ${trigger})...`,
      );

      // Fetch activity with questions, answers, and comment
      const activity = await this.prisma.eventActivity.findUnique({
        where: { eventActivityId: eventActivityId },
        include: {
          event: {
            select: {
              eventId: true,
              athleteId: true,
            },
          },
          feedbackQuestions: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!activity || !activity.event?.athleteId || !activity.event?.eventId) {
        this.logger.warn(
          `Activity ${eventActivityId} not found or has no athlete/event, skipping extraction`,
        );
        return;
      }

      const athleteId = activity.event.athleteId;
      const eventId = activity.event.eventId;

      // Same switch as question generation: with it off, answers and comments
      // stay out of the AI too (questions may predate the change).
      const settings = await this.prisma.athleteSettings.findUnique({
        where: { athleteId },
      });
      if (!settings?.requireFeedbackQuestions) {
        this.logger.debug(
          `Feedback questions disabled for athlete ${athleteId}, skipping extraction`,
        );
        return;
      }

      // Collect all answers and comment
      const questions = activity.feedbackQuestions;
      const allAnswered = questions.every(
        (q: { answerText: string | null }) => q.answerText !== null,
      );

      // Only process if all questions are answered OR if RPE+comment are present
      if (trigger === 'questions_completed' && !allAnswered) {
        this.logger.debug(
          `Not all questions answered for activity ${eventActivityId}, skipping extraction`,
        );
        return;
      }

      // Build feedback text: concatenate all answers + comment
      const answersText = questions
        .filter((q: { answerText: string | null }) => q.answerText)
        .map(
          (q: { questionText: string; answerText: string | null }) =>
            `${q.questionText}\n${q.answerText}`,
        )
        .join('\n\n');

      const commentText = activity.description?.trim() || '';
      const feedbackText = [answersText, commentText]
        .filter((t) => t.length > 0)
        .join('\n\n');

      if (!feedbackText || feedbackText.trim().length === 0) {
        this.logger.debug(
          `No feedback text available for activity ${eventActivityId}, skipping extraction`,
        );
        return;
      }

      const model = await this.aiModelResolver.tryResolveForAthlete(
        AiTask.FEEDBACK_EXTRACTION,
        athleteId,
      );
      if (!model) {
        this.logger.debug(
          `Neither athlete ${athleteId} nor their coaches have AI for feedback analysis, skipping extraction`,
        );
        return;
      }

      // Fetch recent injury logs (last 2 weeks)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const recentInjuries = await this.prisma.athleteInjury.findMany({
        where: {
          athleteId: athleteId,
          createdAt: {
            gte: twoWeeksAgo,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      const recentInjuriesContext =
        recentInjuries.length === 0
          ? 'No recent injuries logged in the last 2 weeks.'
          : recentInjuries
              .map(
                (inj: {
                  location: string;
                  painScore: number;
                  status: string;
                  createdAt: Date;
                }) =>
                  `- ${inj.location} (pain: ${inj.painScore.toFixed(2)}, status: ${inj.status}, date: ${inj.createdAt.toISOString().split('T')[0]})`,
              )
              .join('\n');

      // Build context for injury extraction agent
      const injuryContext = [
        '=== ATHLETE FEEDBACK ===',
        feedbackText,
        '',
        '=== RECENT INJURY LOGS (LAST 2 WEEKS) ===',
        recentInjuriesContext,
      ].join('\n');

      const { injuries } = await this.retryWithBackoff(
        () =>
          this.aiService.generateObject(
            extractInjuryAgent,
            model,
            injuryContext,
            injuriesOutputSchema,
          ),
        'injury extraction',
      );

      const { extractedRpe: rpeResult } = await this.retryWithBackoff(
        () =>
          this.aiService.generateObject(
            extractRpeAgent,
            model,
            feedbackText,
            rpeOutputSchema,
          ),
        'RPE extraction',
      );

      // Store everything in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Store injuries
        if (injuries.length > 0) {
          for (const injury of injuries) {
            await tx.athleteInjury.create({
              data: {
                athleteId: athleteId,
                sourceActivityId: eventActivityId,
                location: injury.location,
                painScore: Math.max(0, Math.min(1, injury.painScore)),
                context: injury.context,
                status: injury.status,
              },
            });
          }
          this.logger.log(
            `✓ Stored ${injuries.length} injuries for activity ${eventActivityId}`,
          );
        }

        // Update RPE if extracted (the schema bounds it to 0-1)
        if (rpeResult !== null) {
          await tx.eventActivity.update({
            where: { eventActivityId: eventActivityId },
            data: { rpe: rpeResult },
          });
          this.logger.log(
            `✓ Updated RPE to ${rpeResult} for activity ${eventActivityId}`,
          );

          // Notify calendar via WebSocket that activity was updated
          this.calendarWebSocketService.notifyActivityProcessed(
            eventId,
            athleteId,
          );
        }
      });

      this.logger.log(
        `✓ Completed feedback extraction for activity ${eventActivityId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing feedback extraction for activity ${eventActivityId}:`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    operation: string,
    retries = this.MAX_RETRIES,
  ): Promise<T> {
    let lastError: Error | unknown;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (!isRetryableAiError(error)) break;
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          this.logger.warn(
            `${operation} failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `${operation} failed after ${retries} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    );
  }
}
