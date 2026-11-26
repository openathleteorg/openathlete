import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getMetricUnit } from '@/utils/metric-unit';

import {
  type Answer,
  type AnswerError,
  type AnswerInput,
  QUESTION_TYPE,
  type Question,
  type UnitSystem,
  metricDisplayUnit,
  metricFromDisplay,
  metricToDisplay,
  metricUnitMap,
} from '@openathlete/shared';

const same = (value: number) => value;

/**
 * The unit a number answer reads in. An answer that fills a metric is
 * stored in the metric's unit, kilograms for a weight, and read in the
 * user's: the athlete types pounds, the coach reads pounds.
 */
export function numberAnswerUnit(question: Question, unitSystem: UnitSystem) {
  const stored =
    question.type === QUESTION_TYPE.NUMBER ? question.config.unit : undefined;
  const type = question.metricType;
  if (!type || metricDisplayUnit(type, unitSystem) === metricUnitMap[type]) {
    return { unit: stored, toDisplay: same, fromDisplay: same };
  }
  return {
    unit: getMetricUnit(type, unitSystem),
    toDisplay: (value: number) => metricToDisplay(type, value, unitSystem),
    fromDisplay: (value: number) => metricFromDisplay(type, value, unitSystem),
  };
}

const number = (value: number, decimals = 1) =>
  new Intl.NumberFormat(getLocale(), {
    maximumFractionDigits: decimals,
  }).format(value);

/** An answer as one line of text, the way it reads in a list */
export function formatAnswer(
  question: Question,
  answer?: Answer,
  unitSystem: UnitSystem = 'METRIC',
): string {
  if (!answer) return m.questionnaire_not_answered();
  switch (question.type) {
    case QUESTION_TYPE.SHORT_TEXT:
    case QUESTION_TYPE.LONG_TEXT:
      return answer.valueText ?? m.questionnaire_not_answered();
    case QUESTION_TYPE.SCALE:
      return answer.valueNumber === null
        ? m.questionnaire_not_answered()
        : `${number(answer.valueNumber)} / ${number(question.config.max)}`;
    case QUESTION_TYPE.NUMBER: {
      if (answer.valueNumber === null) return m.questionnaire_not_answered();
      const { unit, toDisplay } = numberAnswerUnit(question, unitSystem);
      return [
        number(toDisplay(answer.valueNumber), question.config.decimals),
        unit,
      ]
        .filter(Boolean)
        .join(' ');
    }
    case QUESTION_TYPE.YES_NO:
      return answer.valueNumber === null
        ? m.questionnaire_not_answered()
        : answer.valueNumber === 1
          ? m.questionnaire_yes()
          : m.questionnaire_no();
    case QUESTION_TYPE.SINGLE_CHOICE:
    case QUESTION_TYPE.MULTIPLE_CHOICE: {
      const labels = answer.valueOptions.map(
        (id) =>
          question.config.options.find((option) => option.id === id)?.label ??
          m.questionnaire_removed_option(),
      );
      return labels.length ? labels.join(', ') : m.questionnaire_not_answered();
    }
  }
}

/** A date and time in the reader's language */
export const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat(getLocale(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

/** A short day, for axes and lists */
export const formatShortDay = (date: Date) =>
  new Intl.DateTimeFormat(getLocale(), {
    day: 'numeric',
    month: 'short',
  }).format(date);

export const emptyAnswer = (questionId: number): AnswerInput => ({
  questionId,
  valueNumber: null,
  valueText: null,
  valueOptions: [],
});

export function answerErrorMessage(error: AnswerError): string {
  switch (error) {
    case 'required':
      return m.questionnaire_answer_required();
    case 'not_a_number':
      return m.questionnaire_answer_not_a_number();
    case 'out_of_range':
      return m.questionnaire_answer_out_of_range();
    case 'not_on_scale':
      return m.questionnaire_answer_not_on_scale();
    case 'too_long':
      return m.questionnaire_answer_too_long();
    case 'unknown_option':
    case 'too_many_options':
      return m.questionnaire_answer_invalid_option();
  }
}
