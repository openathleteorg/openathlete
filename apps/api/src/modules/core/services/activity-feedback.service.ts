import OpenAI, { Uploadable } from 'openai';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { UserLanguage } from '@openathlete/database';
import { ApiEnvSchemaType } from '@openathlete/shared';

import { ActivityFeedbackCompletedEvent } from 'src/events';
import { AiConsentRequiredException } from 'src/modules/ai/ai.errors';
import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { CoachActivityNoticeEvent } from '../../../events/coach-activity-notice.event';

/**
 * Whisper's ISO 639-1 code for each app language. The user's language, which
 * the web app keeps in sync with its interface, beats auto-detection on the
 * short voice notes athletes record.
 */
export const WHISPER_LANGUAGE: Record<UserLanguage, string> = {
  FR: 'fr',
  EN: 'en',
  IT: 'it',
  ES: 'es',
  PT_BR: 'pt',
};

@Injectable()
export class ActivityFeedbackService {
  private openaiClient: OpenAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService<ApiEnvSchemaType, true>,
  ) {}

  /**
   * OpenAI is optional (self-hosted instances may run without it), so the
   * client is only created when audio transcription is actually used.
   */
  private get openai(): OpenAI {
    if (!this.openaiClient) {
      const apiKey = this.configService.get('OPENAI_API_KEY');
      if (!apiKey) {
        throw new ServiceUnavailableException(
          'Audio transcription is not configured on this instance',
        );
      }
      this.openaiClient = new OpenAI({ apiKey });
    }
    return this.openaiClient;
  }

  async getActivityFeedbackQuestions(user: AuthUser, eventActivityId: number) {
    const ability = await this.abilities.getFor({ user });

    const activity = await this.prisma.eventActivity.findUnique({
      where: {
        eventActivityId: eventActivityId,
      },
      include: {
        event: {
          select: {
            eventId: true,
            athleteId: true,
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
          { eventId: activity.event.eventId },
          accessibleBy(ability, 'read').Event,
        ],
      },
    });

    if (!event) {
      throw new ForbiddenException('Access denied to this activity');
    }

    const questions = await this.prisma.activityFeedbackQuestion.findMany({
      where: {
        eventActivityId: eventActivityId,
      },
      orderBy: {
        activityFeedbackQuestionId: 'asc',
      },
    });

    const activityWithSkip = await this.prisma.eventActivity.findUnique({
      where: {
        eventActivityId: eventActivityId,
      },
      select: {
        feedbackSkipped: true,
      },
    });

    return {
      questions: questions.map((q) => ({
        questionId: q.activityFeedbackQuestionId,
        questionText: q.questionText,
        qcmOptions: q.qcmOptions as Array<{ label: string }> | null,
        answerText: q.answerText,
      })),
      feedbackSkipped: activityWithSkip?.feedbackSkipped ?? false,
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
    const activity = await this.prisma.eventActivity.findUnique({
      where: {
        eventActivityId: eventActivityId,
      },
      include: {
        event: {
          select: {
            eventId: true,
            athleteId: true,
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
          { eventId: activity.event.eventId },
          accessibleBy(ability, 'update').Event,
        ],
      },
    });

    if (!event) {
      throw new ForbiddenException('Access denied to this activity');
    }

    if (!user.athlete || user.athlete.athleteId !== event.athleteId) {
      throw new ForbiddenException(
        'Only the athlete who owns this activity can submit feedback answers',
      );
    }

    // Verify question exists and belongs to this activity
    const question = await this.prisma.activityFeedbackQuestion.findFirst({
      where: {
        activityFeedbackQuestionId: questionId,
        eventActivityId: eventActivityId,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Update the answer
    const updated = await this.prisma.activityFeedbackQuestion.update({
      where: {
        activityFeedbackQuestionId: questionId,
      },
      data: {
        answerText: answerText,
      },
    });

    if (question.answerText !== answerText)
      this.eventEmitter.emit(
        CoachActivityNoticeEvent.SLUG,
        new CoachActivityNoticeEvent({
          eventId: activity.event.eventId,
          actorUserId: user.userId,
          kind: 'COMMENT',
          deliveryKey: `answer:${questionId}:${updated.updatedAt.toISOString()}`,
        }),
      );
    const allQuestions = await this.prisma.activityFeedbackQuestion.findMany({
      where: {
        eventActivityId: eventActivityId,
      },
    });

    const allAnswered = allQuestions.every((q) => q.answerText !== null);

    if (allAnswered) {
      this.eventEmitter.emit(
        ActivityFeedbackCompletedEvent.SLUG,
        new ActivityFeedbackCompletedEvent({
          eventActivityId,
          eventId: activity.event.eventId,
          trigger: 'questions_completed',
        }),
      );
    }

    return {
      questionId: updated.activityFeedbackQuestionId,
      answerText: updated.answerText,
    };
  }

  async skipFeedback(user: AuthUser, eventActivityId: number) {
    const ability = await this.abilities.getFor({ user });

    const activity = await this.prisma.eventActivity.findUnique({
      where: {
        eventActivityId: eventActivityId,
      },
      include: {
        event: {
          select: {
            eventId: true,
            athleteId: true,
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
          { eventId: activity.event.eventId },
          accessibleBy(ability, 'update').Event,
        ],
      },
    });

    if (!event) {
      throw new ForbiddenException('Access denied to this activity');
    }

    // Only the athlete who owns the activity can skip feedback
    if (!user.athlete || user.athlete.athleteId !== event.athleteId) {
      throw new ForbiddenException(
        'Only the athlete who owns this activity can skip feedback',
      );
    }

    await this.prisma.eventActivity.update({
      where: {
        eventActivityId: eventActivityId,
      },
      data: {
        feedbackSkipped: true,
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
    const activity = await this.prisma.eventActivity.findUnique({
      where: {
        eventActivityId: eventActivityId,
      },
      include: {
        event: {
          select: {
            eventId: true,
            athleteId: true,
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
          { eventId: activity.event.eventId },
          accessibleBy(ability, 'update').Event,
        ],
      },
    });

    if (!event) {
      throw new ForbiddenException('Access denied to this activity');
    }

    // Only the athlete who owns the activity can unskip feedback
    if (!user.athlete || user.athlete.athleteId !== event.athleteId) {
      throw new ForbiddenException(
        'Only the athlete who owns this activity can unskip feedback',
      );
    }

    // Update feedback_skipped to false
    await this.prisma.eventActivity.update({
      where: {
        eventActivityId: eventActivityId,
      },
      data: {
        feedbackSkipped: false,
      },
    });

    return { success: true };
  }

  async transcribeAudio(
    user: AuthUser,
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname?: string;
    },
  ): Promise<{ text: string }> {
    // The recording goes to OpenAI: only with the user's permission
    const { aiDataSharingConsentAt, language } =
      await this.prisma.user.findUniqueOrThrow({
        where: { userId: user.userId },
        select: { aiDataSharingConsentAt: true, language: true },
      });
    if (!aiDataSharingConsentAt) throw new AiConsentRequiredException();

    try {
      let fileForOpenAI: File | Buffer;

      // Determine MIME type from file extension for OpenAI compatibility
      // OpenAI Whisper checks the actual file format, so we need to match
      // the MIME type to the file extension
      // For .m4a files, OpenAI expects the file to be in M4A format
      // The MIME type should match what OpenAI expects for that extension
      let mimeTypeForOpenAI = file.mimetype;
      const fileName = file.originalname || 'audio.webm';
      const extension = fileName.split('.').pop()?.toLowerCase();

      // Map extensions to OpenAI-supported MIME types
      // OpenAI supports: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
      // For .m4a files, use audio/mp4 (M4A is MPEG-4 Audio, which uses audio/mp4 MIME type)
      // But OpenAI will check the actual file format based on extension
      if (extension === 'm4a') {
        mimeTypeForOpenAI = 'audio/mp4';
      } else if (extension === 'mp3' || extension === 'mpga') {
        mimeTypeForOpenAI = 'audio/mpeg';
      } else if (extension === 'ogg' || extension === 'oga') {
        mimeTypeForOpenAI = 'audio/ogg';
      } else if (extension === 'wav') {
        mimeTypeForOpenAI = 'audio/wav';
      } else if (extension === 'webm') {
        mimeTypeForOpenAI = 'audio/webm';
      } else if (extension === 'mp4') {
        mimeTypeForOpenAI = 'audio/mp4';
      } else if (extension === 'flac') {
        mimeTypeForOpenAI = 'audio/flac';
      }

      if (typeof File !== 'undefined') {
        fileForOpenAI = new File(
          [file.buffer as unknown as ArrayBuffer],
          fileName,
          {
            type: mimeTypeForOpenAI,
          },
        );
      } else {
        fileForOpenAI = file.buffer;
      }

      const transcription = await this.openai.audio.transcriptions.create({
        file: fileForOpenAI as Uploadable,
        model: 'whisper-1',
        language: WHISPER_LANGUAGE[language],
      });

      return { text: transcription.text };
    } catch (error) {
      throw new Error(
        `Failed to transcribe audio: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
