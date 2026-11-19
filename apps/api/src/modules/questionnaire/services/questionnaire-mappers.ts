import {
  Prisma,
  QuestionnaireQuestion as PrismaQuestion,
} from '@openathlete/database';
import {
  type Question,
  type QuestionInput,
  type Questionnaire,
  questionSchema,
} from '@openathlete/shared';

export const QUESTIONNAIRE_SELECT = {
  questionnaireId: true,
  title: true,
  description: true,
  scoreKind: true,
  scoreMetricType: true,
  archivedAt: true,
  coachUserId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.QuestionnaireSelect;

export type QuestionnaireRow = Prisma.QuestionnaireGetPayload<{
  select: typeof QUESTIONNAIRE_SELECT;
}>;

/** A stored question, its settings read through their schema */
export function toQuestion(row: PrismaQuestion): Question {
  return questionSchema.parse({
    questionId: row.questionId,
    position: row.position,
    type: row.type,
    label: row.label,
    help: row.help,
    required: row.required,
    inScore: row.inScore,
    metricType: row.metricType,
    archivedAt: row.archivedAt,
    config: row.config,
  });
}

export function toQuestionnaire(
  row: QuestionnaireRow,
  questions: PrismaQuestion[],
): Questionnaire {
  const { coachUserId, ...rest } = row;
  return {
    ...rest,
    hasCoach: coachUserId !== null,
    questions: [...questions]
      .sort((a, b) => a.position - b.position || a.questionId - b.questionId)
      .map(toQuestion),
  } as Questionnaire;
}

/** The columns a question's input writes */
export function questionData(input: QuestionInput, position: number) {
  return {
    position,
    type: input.type,
    label: input.label,
    help: input.help,
    required: input.required,
    config: input.config as Prisma.InputJsonValue,
    inScore: input.inScore,
    metricType: input.metricType,
  };
}
