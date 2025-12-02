import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accessibleBy } from 'src/modules/auth/services/casl-prisma';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class ActivityFeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

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

    // Get all questions for this activity
    const questions = await this.prisma.activity_feedback_question.findMany({
      where: {
        event_activity_id: eventActivityId,
      },
      orderBy: {
        created_at: 'asc',
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
}
