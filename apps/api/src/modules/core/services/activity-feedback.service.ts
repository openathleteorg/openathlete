import OpenAI, { Uploadable } from 'openai';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { ActivityFeedbackCompletedEvent } from 'src/events';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class ActivityFeedbackService {
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY') ?? '',
    });
  }

  async getActivityFeedbackQuestions(user: AuthUser, eventActivityId: number) {
    const ability = await this.abilities.getFor({ user });

    const activity = await this.prisma.event_activity.findUnique({
      where: {
        event_activity_id: eventActivityId,
      },
      include: {
        event: {
          select: {
            event_id: true,
            athlete_id: true,
          },
        },
      },
    });

    if (!activity || !activity.event) {
      throw new NotFoundException('Activity not found');
    }

    const event = await this.prisma.event.findFirst({
      where: {
        AND: [
          { event_id: activity.event.event_id },
          accessibleBy(ability, 'read').event,
        ],
      },
    });

    if (!event) {
      throw new ForbiddenException('Access denied to this activity');
    }

    const questions = await this.prisma.activity_feedback_question.findMany({
      where: {
        event_activity_id: eventActivityId,
      },
      orderBy: {
        activity_feedback_question_id: 'asc',
      },
    });

    const activityWithSkip = await this.prisma.event_activity.findUnique({
      where: {
        event_activity_id: eventActivityId,
      },
      select: {
        feedback_skipped: true,
      },
    });

    return {
      questions: questions.map((q) => ({
        questionId: q.activity_feedback_question_id,
        questionText: q.question_text,
        qcmOptions: q.qcm_options as Array<{ label: string }> | null,
        answerText: q.answer_text,
      })),
      feedbackSkipped: activityWithSkip?.feedback_skipped ?? false,
    };
  }

  async submitQuestionAnswer(
    user: AuthUser,
    eventActivityId: number,
    questionId: number,
    answerText: string,
  ) {
    const ability = await this.abilities.getFor({ user });

    // Verify activity exists and get its event
    const activity = await this.prisma.event_activity.findUnique({
      where: {
        event_activity_id: eventActivityId,
      },
      include: {
        event: {
          select: {
            event_id: true,
            athlete_id: true,
          },
        },
      },
    });

    if (!activity || !activity.event) {
      throw new NotFoundException('Activity not found');
    }

    // Verify user has access to the event (CASL permissions are on event, not event_activity)
    const event = await this.prisma.event.findFirst({
      where: {
        AND: [
          { event_id: activity.event.event_id },
          accessibleBy(ability, 'update').event,
        ],
      },
    });

    if (!event) {
      throw new ForbiddenException('Access denied to this activity');
    }

    if (!user.athlete || user.athlete.athlete_id !== event.athlete_id) {
      throw new ForbiddenException(
        'Only the athlete who owns this activity can submit feedback answers',
      );
    }

    // Verify question exists and belongs to this activity
    const question = await this.prisma.activity_feedback_question.findFirst({
      where: {
        activity_feedback_question_id: questionId,
        event_activity_id: eventActivityId,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Update the answer
    const updated = await this.prisma.activity_feedback_question.update({
      where: {
        activity_feedback_question_id: questionId,
      },
      data: {
        answer_text: answerText,
      },
    });

    const allQuestions = await this.prisma.activity_feedback_question.findMany({
      where: {
        event_activity_id: eventActivityId,
      },
    });

    const allAnswered = allQuestions.every((q) => q.answer_text !== null);

    if (allAnswered) {
      this.eventEmitter.emit(
        ActivityFeedbackCompletedEvent.SLUG,
        new ActivityFeedbackCompletedEvent({
          eventActivityId,
          eventId: activity.event.event_id,
          trigger: 'questions_completed',
        }),
      );
    }

    return {
      questionId: updated.activity_feedback_question_id,
      answerText: updated.answer_text,
    };
  }

  async skipFeedback(user: AuthUser, eventActivityId: number) {
    const ability = await this.abilities.getFor({ user });

    const activity = await this.prisma.event_activity.findUnique({
      where: {
        event_activity_id: eventActivityId,
      },
      include: {
        event: {
          select: {
            event_id: true,
            athlete_id: true,
          },
        },
      },
    });

    if (!activity || !activity.event) {
      throw new NotFoundException('Activity not found');
    }

    // Verify user has access to the event
    const event = await this.prisma.event.findFirst({
      where: {
        AND: [
          { event_id: activity.event.event_id },
          accessibleBy(ability, 'update').event,
        ],
      },
    });

    if (!event) {
      throw new ForbiddenException('Access denied to this activity');
    }

    // Only the athlete who owns the activity can skip feedback
    if (!user.athlete || user.athlete.athlete_id !== event.athlete_id) {
      throw new ForbiddenException(
        'Only the athlete who owns this activity can skip feedback',
      );
    }

    await this.prisma.event_activity.update({
      where: {
        event_activity_id: eventActivityId,
      },
      data: {
        feedback_skipped: true,
      },
    });

    return { success: true };
  }

  /**
   * Unskip feedback for an activity (reopen feedback flow)
   */
  async unskipFeedback(user: AuthUser, eventActivityId: number) {
    const ability = await this.abilities.getFor({ user });

    // Verify activity exists and get its event
    const activity = await this.prisma.event_activity.findUnique({
      where: {
        event_activity_id: eventActivityId,
      },
      include: {
        event: {
          select: {
            event_id: true,
            athlete_id: true,
          },
        },
      },
    });

    if (!activity || !activity.event) {
      throw new NotFoundException('Activity not found');
    }

    // Verify user has access to the event
    const event = await this.prisma.event.findFirst({
      where: {
        AND: [
          { event_id: activity.event.event_id },
          accessibleBy(ability, 'update').event,
        ],
      },
    });

    if (!event) {
      throw new ForbiddenException('Access denied to this activity');
    }

    // Only the athlete who owns the activity can unskip feedback
    if (!user.athlete || user.athlete.athlete_id !== event.athlete_id) {
      throw new ForbiddenException(
        'Only the athlete who owns this activity can unskip feedback',
      );
    }

    // Update feedback_skipped to false
    await this.prisma.event_activity.update({
      where: {
        event_activity_id: eventActivityId,
      },
      data: {
        feedback_skipped: false,
      },
    });

    return { success: true };
  }

  async transcribeAudio(file: {
    buffer: Buffer;
    mimetype: string;
    originalname?: string;
  }): Promise<{ text: string }> {
    try {
      let fileForOpenAI: File | Buffer;

      if (typeof File !== 'undefined') {
        fileForOpenAI = new File(
          [file.buffer as unknown as ArrayBuffer],
          file.originalname || 'audio.webm',
          {
            type: file.mimetype,
          },
        );
      } else {
        fileForOpenAI = file.buffer;
      }

      const transcription = await this.openai.audio.transcriptions.create({
        file: fileForOpenAI as Uploadable,
        model: 'whisper-1',
        language: 'fr',
      });

      return { text: transcription.text };
    } catch (error) {
      throw new Error(
        `Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
