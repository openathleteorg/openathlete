import { m } from '@/paraglide/messages';

import {
  type Answer,
  QUESTIONNAIRE_SCORE,
  QUESTION_TYPE,
  type Question,
  type Questionnaire,
  type QuestionnaireOccurrence,
} from '@openathlete/shared';

import { statusLabel } from './period';

type Cell = string | number | null;

/** A local date and time a spreadsheet reads: 2026-11-18 08:00 */
export function csvDateTime(value: Date | string | null): string | null {
  if (value === null) return null;
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** An answer as a spreadsheet cell: numbers stay numbers, to be computed */
function answerCell(question: Question, answer?: Answer): Cell {
  if (!answer) return null;
  switch (question.type) {
    case QUESTION_TYPE.SHORT_TEXT:
    case QUESTION_TYPE.LONG_TEXT:
      return answer.valueText;
    case QUESTION_TYPE.SCALE:
    case QUESTION_TYPE.NUMBER:
      return answer.valueNumber;
    case QUESTION_TYPE.YES_NO:
      return answer.valueNumber === null
        ? null
        : answer.valueNumber === 1
          ? m.questionnaire_yes()
          : m.questionnaire_no();
    case QUESTION_TYPE.SINGLE_CHOICE:
    case QUESTION_TYPE.MULTIPLE_CHOICE:
      return answer.valueOptions.length
        ? answer.valueOptions
            .map(
              (id) =>
                question.config.options.find((option) => option.id === id)
                  ?.label ?? m.questionnaire_removed_option(),
            )
            .join('; ')
        : null;
  }
}

/** A column title: the unit, and whether the question was replaced since */
function questionHeader(question: Question): string {
  const unit =
    question.type === QUESTION_TYPE.NUMBER && question.config.unit
      ? ` (${question.config.unit})`
      : question.type === QUESTION_TYPE.SCALE
        ? ` (${question.config.min}–${question.config.max})`
        : '';
  const label = `${question.label}${unit}`;
  return question.archivedAt ? m.questionnaire_csv_replaced({ label }) : label;
}

/**
 * The answers to one questionnaire as a table: a row per occurrence, the
 * oldest first, a column per question. Across athletes, the first column
 * names the athlete.
 */
export function questionnaireTable(
  questionnaire: Questionnaire,
  occurrences: QuestionnaireOccurrence[],
  athletes?: { athleteId: number; firstName: string; lastName: string }[],
): { header: string[]; rows: Cell[][] } {
  // The current questions in their order, then the replaced ones answered
  const answered = new Set(
    occurrences.flatMap((occurrence) =>
      occurrence.answers.map((answer) => answer.questionId),
    ),
  );
  const questions = questionnaire.questions
    .filter(
      (question) => !question.archivedAt || answered.has(question.questionId),
    )
    .sort(
      (a, b) =>
        Number(a.archivedAt !== null) - Number(b.archivedAt !== null) ||
        a.position - b.position,
    );
  const withScore = questionnaire.scoreKind !== QUESTIONNAIRE_SCORE.NONE;
  const names = new Map(
    (athletes ?? []).map((athlete) => [
      athlete.athleteId,
      `${athlete.firstName} ${athlete.lastName}`.trim(),
    ]),
  );

  const header = [
    ...(athletes ? [m.athlete()] : []),
    m.questionnaire_csv_opened(),
    m.questionnaire_csv_status(),
    m.questionnaire_csv_answered(),
    ...(withScore ? [m.questionnaire_score()] : []),
    ...questions.map(questionHeader),
  ];
  const rows = [...occurrences]
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime() ||
        a.eventId - b.eventId,
    )
    .map((occurrence) => [
      ...(athletes ? [names.get(occurrence.athleteId) ?? ''] : []),
      csvDateTime(occurrence.startDate),
      statusLabel(occurrence.status),
      csvDateTime(occurrence.answeredAt),
      ...(withScore ? [occurrence.score] : []),
      ...questions.map((question) =>
        answerCell(
          question,
          occurrence.answers.find(
            (answer) => answer.questionId === question.questionId,
          ),
        ),
      ),
    ]);
  return { header, rows };
}

/** A file name from the title: openathlete-hooper-index.csv */
export function csvFileName(title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `openathlete-${slug || 'questionnaire'}.csv`;
}
