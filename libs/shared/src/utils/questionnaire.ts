import {
  type Answer,
  type AnswerInput,
  LONG_TEXT_ANSWER_MAX,
  QUESTIONNAIRE_SCORE,
  QUESTIONNAIRE_STATUS,
  QUESTION_TYPE,
  type Question,
  type QuestionInput,
  SHORT_TEXT_ANSWER_MAX,
  type ScaleConfig,
} from '../types/dtos/core/questionnaire.dto';

const HOUR_MS = 3600 * 1000;
/** An answer can be changed for a day after it was given */
export const QUESTIONNAIRE_EDIT_WINDOW_MS = 24 * HOUR_MS;
/** A questionnaire that does not repeat stays open a week */
export const QUESTIONNAIRE_OPEN_MS = 7 * 24 * HOUR_MS;

/** The values a scale offers, from its start to its end */
export function scalePoints(config: ScaleConfig): number[] {
  const count = Math.round((config.max - config.min) / config.step) + 1;
  return Array.from({ length: count }, (_, index) =>
    roundTo(config.min + index * config.step, 1),
  );
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export type AnswerError =
  | 'required'
  | 'not_a_number'
  | 'out_of_range'
  | 'not_on_scale'
  | 'too_long'
  | 'unknown_option'
  | 'too_many_options';

export type AnswersCheck = {
  /** The answers to store: one per answered question, values cleaned */
  answers: Answer[];
  /** By question id, the questions whose answer is refused */
  errors: Record<number, AnswerError>;
  /** Answers given to questions the questionnaire does not ask */
  unknownQuestionIds: number[];
};

/**
 * Checks answers against the questions they answer, the same way in the
 * form and in the API. An empty answer to an optional question is no answer.
 */
export function checkAnswers(
  questions: Question[],
  inputs: AnswerInput[],
): AnswersCheck {
  const byId = new Map(inputs.map((input) => [input.questionId, input]));
  const asked = new Set(questions.map((question) => question.questionId));
  const answers: Answer[] = [];
  const errors: Record<number, AnswerError> = {};

  for (const question of questions) {
    const result = checkAnswer(question, byId.get(question.questionId));
    if (result === null) continue;
    if (typeof result === 'string') errors[question.questionId] = result;
    else answers.push(result);
  }

  return {
    answers,
    errors,
    unknownQuestionIds: inputs
      .map((input) => input.questionId)
      .filter((id) => !asked.has(id)),
  };
}

/** The stored answer, an error, or null for an optional question skipped */
function checkAnswer(
  question: Question,
  input: AnswerInput | undefined,
): Answer | AnswerError | null {
  const empty = (): AnswerError | null =>
    question.required ? 'required' : null;
  const answer = (value: Partial<Answer>): Answer => ({
    questionId: question.questionId,
    valueNumber: null,
    valueText: null,
    valueOptions: [],
    ...value,
  });

  switch (question.type) {
    case QUESTION_TYPE.SHORT_TEXT:
    case QUESTION_TYPE.LONG_TEXT: {
      const text = input?.valueText?.trim() ?? '';
      if (!text) return empty();
      const max =
        question.type === QUESTION_TYPE.SHORT_TEXT
          ? SHORT_TEXT_ANSWER_MAX
          : LONG_TEXT_ANSWER_MAX;
      if (text.length > max) return 'too_long';
      return answer({ valueText: text });
    }
    case QUESTION_TYPE.SCALE: {
      const value = input?.valueNumber;
      if (value === null || value === undefined) return empty();
      if (!Number.isFinite(value)) return 'not_a_number';
      const { min, max } = question.config;
      if (value < min || value > max) return 'out_of_range';
      if (!scalePoints(question.config).includes(value)) return 'not_on_scale';
      return answer({ valueNumber: value });
    }
    case QUESTION_TYPE.NUMBER: {
      const value = input?.valueNumber;
      if (value === null || value === undefined) return empty();
      if (!Number.isFinite(value)) return 'not_a_number';
      const { min, max, decimals } = question.config;
      if ((min !== null && value < min) || (max !== null && value > max)) {
        return 'out_of_range';
      }
      return answer({ valueNumber: roundTo(value, decimals) });
    }
    case QUESTION_TYPE.YES_NO: {
      const value = input?.valueNumber;
      if (value === null || value === undefined) return empty();
      if (value !== 0 && value !== 1) return 'out_of_range';
      return answer({ valueNumber: value });
    }
    case QUESTION_TYPE.SINGLE_CHOICE:
    case QUESTION_TYPE.MULTIPLE_CHOICE: {
      const chosen = [...new Set(input?.valueOptions ?? [])];
      if (chosen.length === 0) return empty();
      const ids = new Set(question.config.options.map((option) => option.id));
      if (chosen.some((id) => !ids.has(id))) return 'unknown_option';
      if (question.type === QUESTION_TYPE.SINGLE_CHOICE && chosen.length > 1) {
        return 'too_many_options';
      }
      // In the order the coach wrote them, so answers compare as they read
      const ordered = question.config.options
        .map((option) => option.id)
        .filter((id) => chosen.includes(id));
      return answer({ valueOptions: ordered });
    }
  }
}

/**
 * The questionnaire's score: the sum or the average of the answers to the
 * questions counted in it. None while one of them is unanswered, as a sum
 * missing a term would read as a better (or worse) day.
 */
export function questionnaireScore(
  kind: QUESTIONNAIRE_SCORE,
  questions: Question[],
  answers: Answer[],
): number | null {
  if (kind === QUESTIONNAIRE_SCORE.NONE) return null;
  const scored = questions.filter((question) => question.inScore);
  if (scored.length === 0) return null;
  const values: number[] = [];
  for (const question of scored) {
    const value = answers.find(
      (answer) => answer.questionId === question.questionId,
    )?.valueNumber;
    if (value === null || value === undefined) return null;
    values.push(value);
  }
  const sum = values.reduce((total, value) => total + value, 0);
  return kind === QUESTIONNAIRE_SCORE.SUM
    ? roundTo(sum, 2)
    : roundTo(sum / values.length, 2);
}

/** Where an occurrence stands at `now` */
export function questionnaireStatus(params: {
  startDate: Date;
  closesAt: Date;
  answeredAt: Date | null;
  now: Date;
}): QUESTIONNAIRE_STATUS {
  const { startDate, closesAt, answeredAt, now } = params;
  if (answeredAt) return QUESTIONNAIRE_STATUS.ANSWERED;
  if (now < startDate) return QUESTIONNAIRE_STATUS.UPCOMING;
  if (now >= closesAt) return QUESTIONNAIRE_STATUS.MISSED;
  return QUESTIONNAIRE_STATUS.OPEN;
}

/**
 * When an occurrence stops taking a first answer: when the next one of its
 * series opens, or a week after it opened.
 */
export function questionnaireClosesAt(
  startDate: Date,
  nextStartDate: Date | null,
): Date {
  if (nextStartDate && nextStartDate > startDate) return nextStartDate;
  return new Date(startDate.getTime() + QUESTIONNAIRE_OPEN_MS);
}

/** Until when given answers can still be changed */
export function questionnaireEditableUntil(answeredAt: Date | null) {
  return answeredAt
    ? new Date(answeredAt.getTime() + QUESTIONNAIRE_EDIT_WINDOW_MS)
    : null;
}

/** Whether the athlete may answer, or change their answers, at `now` */
export function canAnswerQuestionnaire(params: {
  startDate: Date;
  closesAt: Date;
  answeredAt: Date | null;
  now: Date;
}): boolean {
  const { answeredAt, now } = params;
  if (answeredAt) {
    return now < questionnaireEditableUntil(answeredAt)!;
  }
  return questionnaireStatus(params) === QUESTIONNAIRE_STATUS.OPEN;
}

/**
 * Whether a question, once answered, can take this edit in place. A change
 * of type, of scale or of unit, or an option removed, would make its
 * series mix meanings: the question is replaced instead.
 */
export function isQuestionEditCompatible(
  current: Question,
  next: QuestionInput,
): boolean {
  if (current.type !== next.type) return false;
  if (
    current.type === QUESTION_TYPE.SCALE &&
    next.type === QUESTION_TYPE.SCALE
  ) {
    return (
      current.config.min === next.config.min &&
      current.config.max === next.config.max &&
      current.config.step === next.config.step
    );
  }
  if (
    current.type === QUESTION_TYPE.NUMBER &&
    next.type === QUESTION_TYPE.NUMBER
  ) {
    return current.config.unit === next.config.unit;
  }
  if (
    (current.type === QUESTION_TYPE.SINGLE_CHOICE ||
      current.type === QUESTION_TYPE.MULTIPLE_CHOICE) &&
    (next.type === QUESTION_TYPE.SINGLE_CHOICE ||
      next.type === QUESTION_TYPE.MULTIPLE_CHOICE)
  ) {
    const kept = new Set(next.config.options.map((option) => option.id));
    return current.config.options.every((option) => kept.has(option.id));
  }
  return true;
}
