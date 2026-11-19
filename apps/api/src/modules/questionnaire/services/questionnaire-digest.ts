import { Prisma } from '@openathlete/database';
import {
  type Answer,
  QUESTIONNAIRE_STATUS,
  QUESTION_TYPE,
  type Question,
  questionnaireStatus,
} from '@openathlete/shared';

import { zonedClock } from 'src/common/utils/time-zone';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { readableOccurrences } from './questionnaire-access';
import { closingDates } from './questionnaire-closing';
import { toQuestion } from './questionnaire-mappers';

/** One questionnaire sent to the athlete, as an AI agent reads it */
export type QuestionnaireDigest = {
  eventId: number;
  questionnaire: string;
  /** The day it opened, in the athlete's time zone (YYYY-MM-DD) */
  date: string;
  status: 'answered' | 'open' | 'missed' | 'upcoming';
  /** Sum or mean of the scored scale questions */
  score?: { value: number; kind: 'sum' | 'average'; range: string };
  answers: { question: string; answer: string }[];
};

const STATUS = {
  [QUESTIONNAIRE_STATUS.ANSWERED]: 'answered',
  [QUESTIONNAIRE_STATUS.OPEN]: 'open',
  [QUESTIONNAIRE_STATUS.MISSED]: 'missed',
  [QUESTIONNAIRE_STATUS.UPCOMING]: 'upcoming',
} as const;

const plain = (value: number) => String(Math.round(value * 100) / 100);

/**
 * An answer in words, with what reading it needs: where a scale goes and
 * what its ends mean, the unit of a number.
 */
export function answerText(question: Question, answer: Answer): string | null {
  switch (question.type) {
    case QUESTION_TYPE.SHORT_TEXT:
    case QUESTION_TYPE.LONG_TEXT:
      return answer.valueText?.trim() || null;
    case QUESTION_TYPE.SCALE: {
      if (answer.valueNumber === null) return null;
      const { min, max, minLabel, maxLabel } = question.config;
      const ends =
        minLabel || maxLabel
          ? ` (${min} = ${minLabel || '?'}, ${max} = ${maxLabel || '?'})`
          : '';
      return `${plain(answer.valueNumber)} on ${min}-${max}${ends}`;
    }
    case QUESTION_TYPE.NUMBER:
      return answer.valueNumber === null
        ? null
        : [plain(answer.valueNumber), question.config.unit]
            .filter(Boolean)
            .join(' ');
    case QUESTION_TYPE.YES_NO:
      return answer.valueNumber === null
        ? null
        : answer.valueNumber === 1
          ? 'yes'
          : 'no';
    case QUESTION_TYPE.SINGLE_CHOICE:
    case QUESTION_TYPE.MULTIPLE_CHOICE: {
      const labels = answer.valueOptions.map(
        (id) =>
          question.config.options.find((option) => option.id === id)?.label ??
          '(removed option)',
      );
      return labels.length ? labels.join(', ') : null;
    }
  }
}

/** The span a score can take, from the scale its questions share */
function scoreRange(kind: 'sum' | 'average', scored: Question[]): string {
  const scale = scored.find(
    (question) => question.type === QUESTION_TYPE.SCALE,
  );
  if (!scale || scale.type !== QUESTION_TYPE.SCALE) return '';
  const { min, max } = scale.config;
  return kind === 'sum'
    ? `${min * scored.length}-${max * scored.length}`
    : `${min}-${max}`;
}

/**
 * What an athlete answered to their coaches' questionnaires over a span,
 * the oldest first, for AI agents to read. Only what `user` may read: the
 * athlete reads all theirs, a coach those they wrote or their club placed.
 */
export async function questionnaireDigest(
  prisma: PrismaService,
  user: AuthUser,
  {
    athleteId,
    start,
    end,
    timeZone,
  }: { athleteId: number; start: Date; end: Date; timeZone: string },
  now = new Date(),
): Promise<QuestionnaireDigest[]> {
  const rows = await prisma.eventQuestionnaire.findMany({
    where: {
      AND: [
        await readableOccurrences(prisma, user),
        { event: { athleteId, startDate: { gte: start, lte: end } } },
      ],
    },
    select: {
      answeredAt: true,
      score: true,
      questionnaire: { select: { title: true, scoreKind: true } },
      event: { select: { eventId: true, startDate: true, seriesId: true } },
      answers: {
        select: {
          questionId: true,
          valueNumber: true,
          valueText: true,
          valueOptions: true,
        },
      },
    } satisfies Prisma.EventQuestionnaireSelect,
    orderBy: [{ event: { startDate: 'asc' } }, { eventId: 'asc' }],
  });
  if (rows.length === 0) return [];

  const closing = await closingDates(
    prisma,
    rows.map((row) => row.event),
  );
  const questionIds = [
    ...new Set(
      rows.flatMap((row) => row.answers.map((answer) => answer.questionId)),
    ),
  ];
  const questions = new Map(
    (
      await prisma.questionnaireQuestion.findMany({
        where: { questionId: { in: questionIds } },
      })
    ).map((row) => [row.questionId, toQuestion(row)]),
  );

  return rows.map((row) => {
    const status = questionnaireStatus({
      startDate: row.event.startDate,
      closesAt: closing.get(row.event.eventId)!,
      answeredAt: row.answeredAt,
      now,
    });
    const answered = row.answers
      .map((answer) => ({ answer, question: questions.get(answer.questionId) }))
      .filter(
        (item): item is { answer: Answer; question: Question } =>
          item.question !== undefined,
      )
      .sort(
        (a, b) =>
          a.question.position - b.question.position ||
          a.question.questionId - b.question.questionId,
      );
    const kind =
      row.questionnaire.scoreKind === 'SUM'
        ? 'sum'
        : row.questionnaire.scoreKind === 'AVERAGE'
          ? 'average'
          : null;
    return {
      eventId: row.event.eventId,
      questionnaire: row.questionnaire.title,
      date: zonedClock(row.event.startDate, timeZone).date,
      status: STATUS[status],
      ...(kind &&
        row.score !== null && {
          score: {
            value: Math.round(row.score * 100) / 100,
            kind,
            range: scoreRange(
              kind,
              answered
                .map((item) => item.question)
                .filter((question) => question.inScore),
            ),
          },
        }),
      answers: answered.flatMap(({ question, answer }) => {
        const text = answerText(question, answer);
        return text === null
          ? []
          : [{ question: question.label, answer: text }];
      }),
    };
  });
}

/** A long text answer, cut to what a prompt can carry */
const PROMPT_ANSWER_MAX = 400;
/** The latest questionnaires a prompt tells about */
const PROMPT_ITEMS_MAX = 20;

const cut = (text: string) =>
  text.length > PROMPT_ANSWER_MAX
    ? `${text.slice(0, PROMPT_ANSWER_MAX).trimEnd()}…`
    : text;

/**
 * The digest as lines for a prompt: one questionnaire a line, its answers
 * after it, the latest ones. Empty when there is nothing to tell.
 */
export function digestLines(digest: QuestionnaireDigest[]): string {
  return digest
    .filter((item) => item.status === 'answered' || item.status === 'missed')
    .slice(-PROMPT_ITEMS_MAX)
    .map((item) => {
      if (item.status === 'missed') {
        return `- ${item.date} ${item.questionnaire}: not answered`;
      }
      const score = item.score
        ? ` (score ${item.score.value}${item.score.range ? ` on ${item.score.range}` : ''})`
        : '';
      const answers = item.answers
        .map(
          (answer) =>
            `  - ${answer.question}: ${cut(answer.answer).replace(/\s+/g, ' ')}`,
        )
        .join('\n');
      return `- ${item.date} ${item.questionnaire}${score}${answers ? `\n${answers}` : ''}`;
    })
    .join('\n');
}
