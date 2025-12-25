import { openai } from '@ai-sdk/openai';

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { ActivityFeedbackCompletedEvent } from 'src/events';
import { extractInjuryAgent, extractRpeAgent } from 'src/mastra/agents';
import { CalendarWebSocketService } from 'src/modules/calendar/services/calendar-websocket.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class ActivityFeedbackExtractionListener {
  private readonly logger = new Logger(ActivityFeedbackExtractionListener.name);
  private readonly embedder = openai.embedding('text-embedding-3-small');
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarWebSocketService: CalendarWebSocketService,
  ) {}

  @OnEvent(ActivityFeedbackCompletedEvent.SLUG, { async: true })
  async handleActivityFeedbackCompleted(event: ActivityFeedbackCompletedEvent) {
    const { eventActivityId, trigger } = event.payload;

    try {
      this.logger.log(
        `Processing feedback extraction for activity ${eventActivityId} (trigger: ${trigger})...`,
      );

      // Fetch activity with questions, answers, and comment
      const activity = await this.prisma.event_activity.findUnique({
        where: { event_activity_id: eventActivityId },
        include: {
          event: {
            select: {
              event_id: true,
              athlete_id: true,
            },
          },
          feedback_questions: {
            orderBy: { created_at: 'asc' },
          },
        },
      });

      if (
        !activity ||
        !activity.event?.athlete_id ||
        !activity.event?.event_id
      ) {
        this.logger.warn(
          `Activity ${eventActivityId} not found or has no athlete/event, skipping extraction`,
        );
        return;
      }

      const athleteId = activity.event.athlete_id;
      const eventId = activity.event.event_id;

      // Collect all answers and comment
      const questions = activity.feedback_questions;
      const allAnswered = questions.every(
        (q: { answer_text: string | null }) => q.answer_text !== null,
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
        .filter((q: { answer_text: string | null }) => q.answer_text)
        .map(
          (q: { question_text: string; answer_text: string | null }) =>
            `${q.question_text}\n${q.answer_text}`,
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

      // Fetch recent injury logs (last 2 weeks)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const recentInjuries = await this.prisma.athlete_injury.findMany({
        where: {
          athlete_id: athleteId,
          created_at: {
            gte: twoWeeksAgo,
          },
        },
        orderBy: { created_at: 'desc' },
        take: 20,
      });

      const recentInjuriesContext =
        recentInjuries.length === 0
          ? 'No recent injuries logged in the last 2 weeks.'
          : recentInjuries
              .map(
                (inj: {
                  location: string;
                  pain_score: number;
                  status: string;
                  created_at: Date;
                }) =>
                  `- ${inj.location} (pain: ${inj.pain_score.toFixed(2)}, status: ${inj.status}, date: ${inj.created_at.toISOString().split('T')[0]})`,
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

      // Extract injuries with retry
      const injuries = await this.retryWithBackoff(async () => {
        const response = await extractInjuryAgent.generate(injuryContext);
        if (!response.text) {
          throw new Error('Empty response from injury extraction agent');
        }
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response.text) as {
          injuries?: Array<{
            location: string;
            painScore: number;
            context: string;
            status: string;
          }>;
        };
        return parsed.injuries || [];
      }, 'injury extraction');

      // Extract RPE with retry
      const rpeResult = await this.retryWithBackoff(async () => {
        const response = await extractRpeAgent.generate(feedbackText);
        if (!response.text) {
          throw new Error('Empty response from RPE extraction agent');
        }
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response.text) as {
          extractedRpe?: number | null;
        };
        return parsed.extractedRpe ?? null;
      }, 'RPE extraction');

      // Create embeddings with retry
      const embedding = await this.retryWithBackoff(async () => {
        const result = await this.embedder.doEmbed({
          values: [feedbackText],
        });

        // doEmbed returns an object with embeddings property
        // Structure: { embeddings: number[][] }
        if (!result || typeof result !== 'object') {
          throw new Error(
            `Invalid embedding result: ${JSON.stringify(result)}`,
          );
        }

        if ('embeddings' in result && Array.isArray(result.embeddings)) {
          const embeddings = result.embeddings as number[][];
          if (embeddings.length === 0 || !Array.isArray(embeddings[0])) {
            throw new Error(
              `Invalid embeddings array: ${JSON.stringify(embeddings)}`,
            );
          }
          return embeddings[0];
        }

        // Fallback: check if result is directly an array
        if (
          Array.isArray(result) &&
          result.length > 0 &&
          Array.isArray(result[0])
        ) {
          return result[0];
        }

        throw new Error(
          `Unexpected embedding result structure: ${JSON.stringify(result)}`,
        );
      }, 'embedding creation');

      if (!embedding || !Array.isArray(embedding)) {
        this.logger.error(
          `Invalid embedding format: ${JSON.stringify(embedding)}`,
        );
        throw new Error(
          `Invalid embedding format: expected array, got ${typeof embedding}`,
        );
      }

      // Store everything in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Store injuries
        if (injuries.length > 0) {
          for (const injury of injuries) {
            // Validate status
            const validStatuses = [
              'WORSENING',
              'IMPROVING',
              'STABLE',
              'RESOLVED',
            ];
            const status = validStatuses.includes(injury.status)
              ? (injury.status as
                  | 'WORSENING'
                  | 'IMPROVING'
                  | 'STABLE'
                  | 'RESOLVED')
              : 'STABLE';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (tx as any).athlete_injury.create({
              data: {
                athlete_id: athleteId,
                source_activity_id: eventActivityId,
                location: injury.location,
                pain_score: Math.max(0, Math.min(1, injury.painScore)),
                context: injury.context,
                status: status,
              },
            });
          }
          this.logger.log(
            `✓ Stored ${injuries.length} injuries for activity ${eventActivityId}`,
          );
        }

        // Update RPE if extracted
        if (rpeResult !== null && rpeResult >= 0 && rpeResult <= 1) {
          await tx.event_activity.update({
            where: { event_activity_id: eventActivityId },
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

        // Store embedding using raw SQL (Prisma doesn't support vector type directly)
        if (embedding && Array.isArray(embedding) && embedding.length > 0) {
          await tx.$executeRawUnsafe(
            `
            INSERT INTO activity_feedback_embedding (event_activity_id, text_content, embedding, created_at, updated_at)
            VALUES ($1, $2, $3::vector, NOW(), NOW())
            ON CONFLICT (event_activity_id) 
            DO UPDATE SET 
              text_content = EXCLUDED.text_content,
              embedding = EXCLUDED.embedding,
              updated_at = NOW()
            `,
            eventActivityId,
            feedbackText,
            `[${embedding.join(',')}]`,
          );
          this.logger.log(`✓ Stored embedding for activity ${eventActivityId}`);
        } else {
          this.logger.warn(
            `Skipping embedding storage for activity ${eventActivityId}: invalid embedding format`,
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
