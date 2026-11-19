import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@openathlete/database';
import {
  type Questionnaire,
  type QuestionnaireInput,
  type QuestionnaireSummary,
  isQuestionEditCompatible,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import {
  QUESTIONNAIRE_SELECT,
  questionData,
  toQuestion,
  toQuestionnaire,
} from './questionnaire-mappers';

type Tx = Prisma.TransactionClient;

/** A coach's library of questionnaires: only its author reads and edits it */
@Injectable()
export class QuestionnaireService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    user: AuthUser,
    { archived = false } = {},
  ): Promise<QuestionnaireSummary[]> {
    const rows = await this.prisma.questionnaire.findMany({
      where: {
        coachUserId: user.userId,
        archivedAt: archived ? { not: null } : null,
      },
      select: {
        ...QUESTIONNAIRE_SELECT,
        _count: {
          select: {
            questions: { where: { archivedAt: null } },
            events: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { questionnaireId: 'desc' }],
    });
    const answered = await this.prisma.eventQuestionnaire.groupBy({
      by: ['questionnaireId'],
      where: {
        questionnaireId: { in: rows.map((row) => row.questionnaireId) },
        answeredAt: { not: null },
      },
      _count: { _all: true },
      _max: { answeredAt: true },
    });
    const answeredBy = new Map(
      answered.map((group) => [group.questionnaireId, group]),
    );

    return rows.map(({ _count, coachUserId, ...row }) => {
      const group = answeredBy.get(row.questionnaireId);
      return {
        ...row,
        hasCoach: coachUserId !== null,
        questionCount: _count.questions,
        placedCount: _count.events,
        answeredCount: group?._count._all ?? 0,
        lastAnsweredAt: group?._max.answeredAt ?? null,
        // Prisma's enums carry the same values as the shared ones
      } as QuestionnaireSummary;
    });
  }

  async get(user: AuthUser, questionnaireId: number): Promise<Questionnaire> {
    const row = await this.findOwn(user, questionnaireId);
    const questions = await this.prisma.questionnaireQuestion.findMany({
      where: { questionnaireId, archivedAt: null },
    });
    return toQuestionnaire(row, questions);
  }

  async create(
    user: AuthUser,
    input: QuestionnaireInput,
  ): Promise<Questionnaire> {
    const { questionnaireId } = await this.prisma.questionnaire.create({
      data: {
        coachUserId: user.userId,
        title: input.title,
        description: input.description,
        scoreKind: input.scoreKind,
        scoreMetricType: input.scoreMetricType,
        questions: {
          create: input.questions.map((question, index) =>
            questionData(question, index),
          ),
        },
      },
      select: { questionnaireId: true },
    });
    return this.get(user, questionnaireId);
  }

  /**
   * Replaces the questionnaire's questions with the ones given, in their
   * order. A question answered already is edited in place when its meaning
   * holds, and replaced otherwise: the old one is archived with its answers.
   * One unanswered is edited, or deleted when left out.
   */
  async update(
    user: AuthUser,
    questionnaireId: number,
    input: QuestionnaireInput,
  ): Promise<Questionnaire> {
    await this.findOwn(user, questionnaireId);

    await this.prisma.$transaction(async (tx) => {
      const current = await tx.questionnaireQuestion.findMany({
        where: { questionnaireId, archivedAt: null },
        include: { _count: { select: { answers: true } } },
      });
      const byId = new Map(current.map((row) => [row.questionId, row]));
      const kept = new Set<number>();
      const now = new Date();

      for (const [position, question] of input.questions.entries()) {
        const existing =
          question.questionId !== undefined
            ? byId.get(question.questionId)
            : undefined;
        if (question.questionId !== undefined && !existing) {
          throw new NotFoundException(
            `Question ${question.questionId} is not in this questionnaire`,
          );
        }
        const data = questionData(question, position);
        if (
          existing &&
          (existing._count.answers === 0 ||
            isQuestionEditCompatible(toQuestion(existing), question))
        ) {
          kept.add(existing.questionId);
          await tx.questionnaireQuestion.update({
            where: { questionId: existing.questionId },
            data,
          });
          continue;
        }
        if (existing) {
          kept.add(existing.questionId);
          await tx.questionnaireQuestion.update({
            where: { questionId: existing.questionId },
            data: { archivedAt: now },
          });
        }
        await tx.questionnaireQuestion.create({
          data: { ...data, questionnaireId },
        });
      }

      const left = current.filter((row) => !kept.has(row.questionId));
      await tx.questionnaireQuestion.updateMany({
        where: {
          questionId: {
            in: left
              .filter((row) => row._count.answers > 0)
              .map((row) => row.questionId),
          },
        },
        data: { archivedAt: now },
      });
      await tx.questionnaireQuestion.deleteMany({
        where: {
          questionId: {
            in: left
              .filter((row) => row._count.answers === 0)
              .map((row) => row.questionId),
          },
        },
      });

      await tx.questionnaire.update({
        where: { questionnaireId },
        data: {
          title: input.title,
          description: input.description,
          scoreKind: input.scoreKind,
          scoreMetricType: input.scoreMetricType,
        },
      });
      // Coming occurrences read the questionnaire's title in the calendar
      await tx.event.updateMany({
        where: {
          questionnaire: { questionnaireId, answeredAt: null },
          startDate: { gt: now },
        },
        data: { name: input.title.slice(0, 100) },
      });
    });

    return this.get(user, questionnaireId);
  }

  /**
   * Takes the questionnaire out of the library. The coming occurrences
   * leave the calendars; the answers given stay.
   */
  async archive(
    user: AuthUser,
    questionnaireId: number,
  ): Promise<{ removedOccurrences: number }> {
    await this.findOwn(user, questionnaireId);
    return this.prisma.$transaction(async (tx) => {
      const removed = await this.removeUnanswered(tx, questionnaireId, {
        comingOnly: true,
      });
      await tx.questionnaire.update({
        where: { questionnaireId },
        data: { archivedAt: new Date() },
      });
      return { removedOccurrences: removed };
    });
  }

  async restore(user: AuthUser, questionnaireId: number) {
    await this.findOwn(user, questionnaireId);
    await this.prisma.questionnaire.update({
      where: { questionnaireId },
      data: { archivedAt: null },
    });
    return this.get(user, questionnaireId);
  }

  /**
   * Deletes a questionnaire never answered, with its occurrences in the
   * calendars. One answered is archived instead: the answers are the
   * athletes'.
   */
  async remove(user: AuthUser, questionnaireId: number): Promise<void> {
    await this.findOwn(user, questionnaireId);
    await this.prisma.$transaction(async (tx) => {
      const answered = await tx.eventQuestionnaire.count({
        where: { questionnaireId, answeredAt: { not: null } },
      });
      if (answered > 0) {
        throw new ConflictException('QUESTIONNAIRE_HAS_ANSWERS');
      }
      await this.removeUnanswered(tx, questionnaireId, { comingOnly: false });
      // Questions cascade
      await tx.questionnaire.delete({ where: { questionnaireId } });
    });
  }

  private async removeUnanswered(
    tx: Tx,
    questionnaireId: number,
    { comingOnly }: { comingOnly: boolean },
  ): Promise<number> {
    const events = await tx.event.findMany({
      where: {
        questionnaire: { questionnaireId, answeredAt: null },
        ...(comingOnly && { startDate: { gt: new Date() } }),
      },
      select: { eventId: true },
    });
    const eventIds = events.map((event) => event.eventId);
    if (eventIds.length === 0) return 0;
    await tx.eventQuestionnaire.deleteMany({
      where: { eventId: { in: eventIds } },
    });
    await tx.event.deleteMany({ where: { eventId: { in: eventIds } } });
    return eventIds.length;
  }

  private async findOwn(user: AuthUser, questionnaireId: number) {
    const row = await this.prisma.questionnaire.findFirst({
      where: { questionnaireId, coachUserId: user.userId },
      select: QUESTIONNAIRE_SELECT,
    });
    if (!row) throw new NotFoundException('Questionnaire not found');
    return row;
  }
}
