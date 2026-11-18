import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EventType, MetricType, Prisma } from '@openathlete/database';
import {
  type Answer,
  type PendingQuestionnaire,
  QUESTIONNAIRE_RESPONSES_MAX_DAYS,
  QUESTIONNAIRE_STATUS,
  type Question,
  type QuestionnaireForm,
  type QuestionnaireOccurrence,
  type QuestionnaireResponses,
  type QuestionnaireResponsesQuery,
  type SubmitQuestionnaireAnswersDto,
  canAnswerQuestionnaire,
  checkAnswers,
  questionnaireEditableUntil,
  questionnaireScore,
  questionnaireStatus,
} from '@openathlete/shared';

import { zonedClock } from 'src/common/utils/time-zone';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { CalendarWebSocketService } from 'src/modules/calendar/services/calendar-websocket.service';
import { MetricService } from 'src/modules/core/services/metric.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { readableOccurrences } from './questionnaire-access';
import { closingDates } from './questionnaire-closing';
import {
  QUESTIONNAIRE_SELECT,
  toQuestion,
  toQuestionnaire,
} from './questionnaire-mappers';

const DAY_MS = 24 * 3600 * 1000;

const OCCURRENCE_SELECT = {
  eventQuestionnaireId: true,
  questionnaireId: true,
  answeredAt: true,
  score: true,
  event: {
    select: {
      eventId: true,
      athleteId: true,
      startDate: true,
      seriesId: true,
      athlete: { select: { user: { select: { timeZone: true } } } },
    },
  },
  answers: {
    select: {
      questionId: true,
      valueNumber: true,
      valueText: true,
      valueOptions: true,
    },
  },
} satisfies Prisma.EventQuestionnaireSelect;

type OccurrenceRow = Prisma.EventQuestionnaireGetPayload<{
  select: typeof OCCURRENCE_SELECT;
}>;

/** Answering questionnaires, and reading the answers */
@Injectable()
export class QuestionnaireResponseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metricService: MetricService,
    private readonly calendarWebSocketService: CalendarWebSocketService,
  ) {}

  /** The questionnaire of a calendar event, to answer or to read */
  async getForEvent(
    user: AuthUser,
    eventId: number,
    now = new Date(),
  ): Promise<QuestionnaireForm> {
    const row = await this.findReadable(user, eventId);
    const [occurrence] = await this.toOccurrences([row], now);
    const questionnaire = await this.prisma.questionnaire.findUniqueOrThrow({
      where: { questionnaireId: row.questionnaireId },
      select: {
        ...QUESTIONNAIRE_SELECT,
        coach: { select: { userId: true, firstName: true, lastName: true } },
      },
    });
    const { coach, ...questionnaireRow } = questionnaire;
    const current = await this.prisma.questionnaireQuestion.findMany({
      where: { questionnaireId: row.questionnaireId, archivedAt: null },
    });
    const isAthlete = row.event.athleteId === user.athlete?.athleteId;

    return {
      occurrence,
      questionnaire: toQuestionnaire(questionnaireRow, current),
      questions: await this.questionsOf(row, occurrence, current, now),
      canAnswer:
        isAthlete &&
        questionnaireRow.archivedAt === null &&
        canAnswerQuestionnaire({ ...occurrence, now }),
      coach,
    };
  }

  /**
   * Stores the athlete's answers, replacing earlier ones while they may
   * still change them. The day's metrics take the numbers that fill one.
   */
  async submit(
    user: AuthUser,
    eventId: number,
    dto: SubmitQuestionnaireAnswersDto,
    now = new Date(),
  ): Promise<QuestionnaireForm> {
    const row = await this.findReadable(user, eventId);
    if (row.event.athleteId !== user.athlete?.athleteId) {
      throw new ForbiddenException('Only the athlete answers');
    }
    const [occurrence] = await this.toOccurrences([row], now);
    const questionnaire = await this.prisma.questionnaire.findUniqueOrThrow({
      where: { questionnaireId: row.questionnaireId },
      select: { archivedAt: true, scoreKind: true, scoreMetricType: true },
    });
    if (
      questionnaire.archivedAt !== null ||
      !canAnswerQuestionnaire({ ...occurrence, now })
    ) {
      throw new BadRequestException('QUESTIONNAIRE_CLOSED');
    }

    const current = await this.prisma.questionnaireQuestion.findMany({
      where: { questionnaireId: row.questionnaireId, archivedAt: null },
    });
    const questions = await this.questionsOf(row, occurrence, current, now);
    const checked = checkAnswers(questions, dto.answers);
    if (
      Object.keys(checked.errors).length > 0 ||
      checked.unknownQuestionIds.length > 0
    ) {
      throw new BadRequestException({
        message: 'INVALID_ANSWERS',
        errors: checked.errors,
        unknownQuestionIds: checked.unknownQuestionIds,
      });
    }
    const score = questionnaireScore(
      questionnaire.scoreKind as Parameters<typeof questionnaireScore>[0],
      questions,
      checked.answers,
    );

    await this.prisma.$transaction([
      this.prisma.questionnaireAnswer.deleteMany({
        where: { eventQuestionnaireId: row.eventQuestionnaireId },
      }),
      this.prisma.questionnaireAnswer.createMany({
        data: checked.answers.map((answer) => ({
          eventQuestionnaireId: row.eventQuestionnaireId,
          ...answer,
        })),
      }),
      this.prisma.eventQuestionnaire.update({
        where: { eventQuestionnaireId: row.eventQuestionnaireId },
        // The first answer starts the day to change it; changes keep it
        data: { answeredAt: row.answeredAt ?? now, score },
      }),
    ]);

    await this.fillMetrics(
      row,
      questions,
      checked.answers,
      questionnaire.scoreMetricType,
      score,
    );
    this.calendarWebSocketService.notifyWeeklyLoadUpdated(
      row.event.athleteId!,
      { eventId, reason: 'event_updated' },
    );
    return this.getForEvent(user, eventId, now);
  }

  /** What waits for the athlete's answer now, the oldest first */
  async pending(
    user: AuthUser,
    now = new Date(),
  ): Promise<PendingQuestionnaire[]> {
    const athleteId = user.athlete?.athleteId;
    if (!athleteId) return [];
    const rows = await this.prisma.eventQuestionnaire.findMany({
      where: {
        answeredAt: null,
        questionnaire: { archivedAt: null },
        event: {
          athleteId,
          type: EventType.QUESTIONNAIRE,
          // None stays open longer than its week
          startDate: { lte: now, gt: new Date(now.getTime() - 7 * DAY_MS) },
        },
      },
      select: {
        ...OCCURRENCE_SELECT,
        event: {
          select: { ...OCCURRENCE_SELECT.event.select, name: true },
        },
        questionnaire: {
          select: {
            _count: { select: { questions: { where: { archivedAt: null } } } },
          },
        },
      },
      orderBy: { event: { startDate: 'asc' } },
    });
    const occurrences = await this.toOccurrences(rows, now);
    return rows
      .map((row, index) => ({ row, occurrence: occurrences[index] }))
      .filter(
        ({ occurrence }) => occurrence.status === QUESTIONNAIRE_STATUS.OPEN,
      )
      .map(({ row, occurrence }) => ({
        eventId: row.event.eventId,
        title: row.event.name,
        startDate: occurrence.startDate,
        closesAt: occurrence.closesAt,
        questionCount: row.questionnaire._count.questions,
      }));
  }

  /**
   * The answers over a span, for the analysis: of one athlete, of one
   * questionnaire, or both. Only what the user may read.
   */
  async responses(
    user: AuthUser,
    query: QuestionnaireResponsesQuery,
    now = new Date(),
  ): Promise<QuestionnaireResponses> {
    const { athleteId, questionnaireId, from, to } = query;
    if (to <= from) {
      throw new BadRequestException('The span ends before it starts');
    }
    if (
      to.getTime() - from.getTime() >
      QUESTIONNAIRE_RESPONSES_MAX_DAYS * DAY_MS
    ) {
      throw new BadRequestException(
        `At most ${QUESTIONNAIRE_RESPONSES_MAX_DAYS} days at once`,
      );
    }

    const rows = await this.prisma.eventQuestionnaire.findMany({
      where: {
        AND: [
          await readableOccurrences(this.prisma, user),
          {
            ...(questionnaireId && { questionnaireId }),
            event: {
              ...(athleteId && { athleteId }),
              startDate: { gte: from, lt: to },
            },
          },
        ],
      },
      select: OCCURRENCE_SELECT,
      orderBy: [
        { event: { startDate: 'asc' } },
        { eventQuestionnaireId: 'asc' },
      ],
    });
    const occurrences = await this.toOccurrences(rows, now);

    const questionnaireIds = [
      ...new Set(rows.map((row) => row.questionnaireId)),
    ];
    if (questionnaireId && !questionnaireIds.includes(questionnaireId)) {
      // The coach's own questionnaire, still unanswered over the span
      const own = await this.prisma.questionnaire.findFirst({
        where: { questionnaireId, coachUserId: user.userId },
        select: { questionnaireId: true },
      });
      if (own) questionnaireIds.push(questionnaireId);
    }
    const answeredQuestionIds = [
      ...new Set(
        rows.flatMap((row) => row.answers.map((answer) => answer.questionId)),
      ),
    ];
    const questionnaires = await this.prisma.questionnaire.findMany({
      where: { questionnaireId: { in: questionnaireIds } },
      select: {
        ...QUESTIONNAIRE_SELECT,
        questions: {
          // The current questions, and the replaced ones answered here
          where: {
            OR: [
              { archivedAt: null },
              { questionId: { in: answeredQuestionIds } },
            ],
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    const athleteIds = [
      ...new Set(rows.map((row) => row.event.athleteId).filter(isNumber)),
    ];
    const athletes = await this.prisma.athlete.findMany({
      where: { athleteId: { in: athleteIds } },
      select: {
        athleteId: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      questionnaires: questionnaires.map(({ questions, ...row }) =>
        toQuestionnaire(row, questions),
      ),
      athletes: athletes
        .map((athlete) => ({
          athleteId: athlete.athleteId,
          firstName: athlete.user.firstName,
          lastName: athlete.user.lastName,
        }))
        .sort(
          (a, b) =>
            a.lastName.localeCompare(b.lastName) ||
            a.firstName.localeCompare(b.firstName),
        ),
      occurrences,
    };
  }

  private async findReadable(user: AuthUser, eventId: number) {
    const row = await this.prisma.eventQuestionnaire.findFirst({
      where: {
        AND: [{ eventId }, await readableOccurrences(this.prisma, user)],
      },
      select: OCCURRENCE_SELECT,
    });
    if (!row) throw new NotFoundException('Questionnaire not found');
    return row;
  }

  /**
   * The questions to show. Answered: those answered, and while the answers
   * can change, the current ones too. Unanswered: the current ones.
   */
  private async questionsOf(
    row: OccurrenceRow,
    occurrence: QuestionnaireOccurrence,
    current: Parameters<typeof toQuestion>[0][],
    now: Date,
  ): Promise<Question[]> {
    if (!row.answeredAt) return current.map(toQuestion).sort(byPosition);
    const answeredIds = row.answers.map((answer) => answer.questionId);
    const answered = await this.prisma.questionnaireQuestion.findMany({
      where: { questionId: { in: answeredIds } },
    });
    const editable =
      occurrence.editableUntil !== null && now < occurrence.editableUntil;
    const extra = editable
      ? current.filter((question) => !answeredIds.includes(question.questionId))
      : [];
    return [...answered, ...extra].map(toQuestion).sort(byPosition);
  }

  /** Occurrences with when they close, from the next one of their series */
  private async toOccurrences(
    rows: OccurrenceRow[],
    now: Date,
  ): Promise<QuestionnaireOccurrence[]> {
    const closing = await closingDates(
      this.prisma,
      rows.map((row) => row.event),
    );
    return rows.map((row) => {
      const closesAt = closing.get(row.event.eventId)!;
      return {
        eventId: row.event.eventId,
        athleteId: row.event.athleteId!,
        questionnaireId: row.questionnaireId,
        startDate: row.event.startDate,
        closesAt,
        answeredAt: row.answeredAt,
        editableUntil: questionnaireEditableUntil(row.answeredAt),
        status: questionnaireStatus({
          startDate: row.event.startDate,
          closesAt,
          answeredAt: row.answeredAt,
          now,
        }),
        score: row.score,
        answers: row.answers as Answer[],
      };
    });
  }

  /** The metrics the answers fill, on the athlete's day of the occurrence */
  private async fillMetrics(
    row: OccurrenceRow,
    questions: Question[],
    answers: Answer[],
    scoreMetricType: MetricType | null,
    score: number | null,
  ) {
    const athleteId = row.event.athleteId!;
    const timeZone = row.event.athlete?.user.timeZone ?? 'UTC';
    // Metrics are stored by UTC midnight of the local day
    const date = new Date(
      `${zonedClock(row.event.startDate, timeZone).date}T00:00:00Z`,
    );
    for (const question of questions) {
      if (!question.metricType) continue;
      const value = answers.find(
        (answer) => answer.questionId === question.questionId,
      )?.valueNumber;
      if (value === null || value === undefined) continue;
      await this.metricService.recordAnswer(
        athleteId,
        question.metricType as MetricType,
        date,
        value,
      );
    }
    if (scoreMetricType && score !== null) {
      await this.metricService.recordAnswer(
        athleteId,
        scoreMetricType,
        date,
        score,
      );
    }
  }
}

const byPosition = (a: Question, b: Question) =>
  a.position - b.position || a.questionId - b.questionId;
const isNumber = (value: number | null): value is number => value !== null;
