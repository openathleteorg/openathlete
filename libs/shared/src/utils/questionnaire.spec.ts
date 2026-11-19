import { describe, expect, it } from 'vitest';

import {
  QUESTIONNAIRE_SCORE,
  QUESTIONNAIRE_STATUS,
  QUESTION_TYPE,
  type Question,
  type QuestionInput,
  questionnaireInputSchema,
} from '../types/dtos/core/questionnaire.dto';
import { METRIC_TYPE } from '../types/misc';
import {
  canAnswerQuestionnaire,
  checkAnswers,
  isQuestionEditCompatible,
  questionnaireClosesAt,
  questionnaireScore,
  questionnaireStatus,
  scalePoints,
} from './questionnaire';

const base = {
  position: 0,
  help: '',
  required: true,
  inScore: false,
  metricType: null,
  archivedAt: null,
};

const scale = (
  questionId: number,
  extra: Partial<Question> = {},
  config = {
    min: 1,
    max: 7,
    step: 1 as const,
    minLabel: '',
    maxLabel: '',
    display: 'BUTTONS' as const,
  },
): Question =>
  ({
    ...base,
    questionId,
    label: `Scale ${questionId}`,
    type: QUESTION_TYPE.SCALE,
    config,
    ...extra,
  }) as Question;

const choice = (
  questionId: number,
  type: QUESTION_TYPE.SINGLE_CHOICE | QUESTION_TYPE.MULTIPLE_CHOICE,
): Question => ({
  ...base,
  questionId,
  label: 'Choice',
  type,
  config: {
    options: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ],
  },
});

const answer = (
  questionId: number,
  value: Partial<{
    valueNumber: number | null;
    valueText: string | null;
    valueOptions: string[];
  }>,
) => ({
  questionId,
  valueNumber: null,
  valueText: null,
  valueOptions: [],
  ...value,
});

describe('scalePoints', () => {
  it('lists every point of the scale', () => {
    expect(
      scalePoints({ ...scale(1).config, min: 1, max: 5 } as never),
    ).toEqual([1, 2, 3, 4, 5]);
  });

  it('follows half steps without float drift', () => {
    expect(
      scalePoints({
        min: 0,
        max: 2,
        step: 0.5,
        minLabel: '',
        maxLabel: '',
        display: 'SLIDER',
      }),
    ).toEqual([0, 0.5, 1, 1.5, 2]);
  });
});

describe('checkAnswers', () => {
  it('keeps valid answers and cleans text', () => {
    const questions: Question[] = [
      scale(1),
      {
        ...base,
        questionId: 2,
        label: 'Text',
        type: QUESTION_TYPE.LONG_TEXT,
        config: {},
      },
    ];
    const result = checkAnswers(questions, [
      answer(1, { valueNumber: 4 }),
      answer(2, { valueText: '  Tired legs  ' }),
    ]);
    expect(result.errors).toEqual({});
    expect(result.answers).toEqual([
      answer(1, { valueNumber: 4 }),
      answer(2, { valueText: 'Tired legs' }),
    ]);
  });

  it('refuses a missing required answer and skips an optional one', () => {
    const result = checkAnswers(
      [scale(1), scale(2, { required: false })],
      [answer(2, { valueNumber: null })],
    );
    expect(result.errors).toEqual({ 1: 'required' });
    expect(result.answers).toEqual([]);
  });

  it('takes blank text as no answer', () => {
    const result = checkAnswers(
      [
        {
          ...base,
          questionId: 1,
          label: 'Text',
          type: QUESTION_TYPE.SHORT_TEXT,
          config: {},
        },
      ],
      [answer(1, { valueText: '   ' })],
    );
    expect(result.errors).toEqual({ 1: 'required' });
  });

  it('refuses values off the scale', () => {
    expect(
      checkAnswers([scale(1)], [answer(1, { valueNumber: 8 })]).errors,
    ).toEqual({ 1: 'out_of_range' });
    expect(
      checkAnswers([scale(1)], [answer(1, { valueNumber: 2.5 })]).errors,
    ).toEqual({ 1: 'not_on_scale' });
  });

  it('bounds and rounds numbers', () => {
    const question: Question = {
      ...base,
      questionId: 1,
      label: 'Sleep',
      type: QUESTION_TYPE.NUMBER,
      config: { unit: 'h', min: 0, max: 24, decimals: 1 },
    };
    expect(
      checkAnswers([question], [answer(1, { valueNumber: 7.46 })]).answers,
    ).toEqual([answer(1, { valueNumber: 7.5 })]);
    expect(
      checkAnswers([question], [answer(1, { valueNumber: 25 })]).errors,
    ).toEqual({ 1: 'out_of_range' });
  });

  it('only takes 0 or 1 for yes/no', () => {
    const question: Question = {
      ...base,
      questionId: 1,
      label: 'Pain?',
      type: QUESTION_TYPE.YES_NO,
      config: {},
    };
    expect(
      checkAnswers([question], [answer(1, { valueNumber: 0 })]).errors,
    ).toEqual({});
    expect(
      checkAnswers([question], [answer(1, { valueNumber: 2 })]).errors,
    ).toEqual({ 1: 'out_of_range' });
  });

  it('checks the options chosen', () => {
    const single = choice(1, QUESTION_TYPE.SINGLE_CHOICE);
    const multiple = choice(2, QUESTION_TYPE.MULTIPLE_CHOICE);
    expect(
      checkAnswers([single], [answer(1, { valueOptions: ['a', 'b'] })]).errors,
    ).toEqual({ 1: 'too_many_options' });
    expect(
      checkAnswers([single], [answer(1, { valueOptions: ['z'] })]).errors,
    ).toEqual({ 1: 'unknown_option' });
    expect(
      checkAnswers([multiple], [answer(2, { valueOptions: ['c', 'a', 'c'] })])
        .answers,
    ).toEqual([answer(2, { valueOptions: ['a', 'c'] })]);
  });

  it('reports answers to questions not asked', () => {
    expect(
      checkAnswers([scale(1)], [answer(1, { valueNumber: 3 }), answer(9, {})])
        .unknownQuestionIds,
    ).toEqual([9]);
  });
});

describe('questionnaireScore', () => {
  const questions = [
    scale(1, { inScore: true }),
    scale(2, { inScore: true }),
    scale(3),
  ];

  it('adds or averages the questions counted in it', () => {
    const answers = [
      answer(1, { valueNumber: 3 }),
      answer(2, { valueNumber: 4 }),
      answer(3, { valueNumber: 7 }),
    ];
    expect(
      questionnaireScore(QUESTIONNAIRE_SCORE.SUM, questions, answers),
    ).toBe(7);
    expect(
      questionnaireScore(QUESTIONNAIRE_SCORE.AVERAGE, questions, answers),
    ).toBe(3.5);
    expect(
      questionnaireScore(QUESTIONNAIRE_SCORE.NONE, questions, answers),
    ).toBeNull();
  });

  it('gives no score while a counted question is unanswered', () => {
    expect(
      questionnaireScore(QUESTIONNAIRE_SCORE.SUM, questions, [
        answer(1, { valueNumber: 3 }),
      ]),
    ).toBeNull();
  });
});

describe('questionnaire status', () => {
  const startDate = new Date('2026-11-16T07:00:00Z');
  const closesAt = new Date('2026-11-23T07:00:00Z');

  it('follows the occurrence from upcoming to missed', () => {
    const at = (iso: string, answeredAt: Date | null = null) =>
      questionnaireStatus({
        startDate,
        closesAt,
        answeredAt,
        now: new Date(iso),
      });
    expect(at('2026-11-16T06:59:00Z')).toBe(QUESTIONNAIRE_STATUS.UPCOMING);
    expect(at('2026-11-16T07:00:00Z')).toBe(QUESTIONNAIRE_STATUS.OPEN);
    expect(at('2026-11-23T07:00:00Z')).toBe(QUESTIONNAIRE_STATUS.MISSED);
    expect(at('2026-11-30T00:00:00Z', startDate)).toBe(
      QUESTIONNAIRE_STATUS.ANSWERED,
    );
  });

  it('closes at the next occurrence, or after a week', () => {
    const next = new Date('2026-11-17T07:00:00Z');
    expect(questionnaireClosesAt(startDate, next)).toEqual(next);
    expect(questionnaireClosesAt(startDate, null)).toEqual(closesAt);
    expect(questionnaireClosesAt(startDate, startDate)).toEqual(closesAt);
  });

  it('lets answers change for a day, even after closing', () => {
    const answeredAt = new Date('2026-11-22T20:00:00Z');
    const can = (iso: string, answered: Date | null) =>
      canAnswerQuestionnaire({
        startDate,
        closesAt,
        answeredAt: answered,
        now: new Date(iso),
      });
    expect(can('2026-11-23T19:59:00Z', answeredAt)).toBe(true);
    expect(can('2026-11-23T20:00:00Z', answeredAt)).toBe(false);
    expect(can('2026-11-23T08:00:00Z', null)).toBe(false);
    expect(can('2026-11-16T06:00:00Z', null)).toBe(false);
  });
});

describe('isQuestionEditCompatible', () => {
  const asInput = (question: Question): QuestionInput =>
    question as unknown as QuestionInput;

  it('keeps a question whose wording changes', () => {
    expect(
      isQuestionEditCompatible(scale(1), asInput(scale(1, { label: 'New' }))),
    ).toBe(true);
  });

  it('replaces a question whose scale or type changes', () => {
    expect(
      isQuestionEditCompatible(
        scale(1),
        asInput(scale(1, {}, { ...scale(1).config, max: 10 } as never)),
      ),
    ).toBe(false);
    expect(
      isQuestionEditCompatible(
        scale(1),
        asInput(choice(1, QUESTION_TYPE.SINGLE_CHOICE)),
      ),
    ).toBe(false);
  });

  it('replaces a choice question that loses an option', () => {
    const current = choice(1, QUESTION_TYPE.SINGLE_CHOICE);
    const fewer = {
      ...current,
      config: {
        options:
          current.type === QUESTION_TYPE.SINGLE_CHOICE
            ? current.config.options.slice(0, 2)
            : [],
      },
    } as Question;
    const more = {
      ...current,
      config: {
        options: [
          ...(current.type === QUESTION_TYPE.SINGLE_CHOICE
            ? current.config.options
            : []),
          { id: 'd', label: 'D' },
        ],
      },
    } as Question;
    expect(isQuestionEditCompatible(current, asInput(fewer))).toBe(false);
    expect(isQuestionEditCompatible(current, asInput(more))).toBe(true);
  });
});

describe('questionnaireInputSchema', () => {
  const hooperItem = (labelText: string) => ({
    type: QUESTION_TYPE.SCALE,
    label: labelText,
    inScore: true,
    config: { min: 1, max: 7 },
  });

  it('accepts a scored questionnaire filling a metric', () => {
    const parsed = questionnaireInputSchema.safeParse({
      title: 'Hooper',
      scoreKind: QUESTIONNAIRE_SCORE.SUM,
      scoreMetricType: METRIC_TYPE.HOOPER_INDEX,
      questions: ['Fatigue', 'Stress', 'Soreness', 'Sleep'].map(hooperItem),
    });
    expect(parsed.success).toBe(true);
  });

  it('refuses a score over different scales', () => {
    const parsed = questionnaireInputSchema.safeParse({
      title: 'Mixed',
      scoreKind: QUESTIONNAIRE_SCORE.SUM,
      questions: [
        hooperItem('A'),
        { ...hooperItem('B'), config: { min: 1, max: 10 } },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it('refuses two answers filling one metric', () => {
    const parsed = questionnaireInputSchema.safeParse({
      title: 'Sleep',
      questions: [
        {
          type: QUESTION_TYPE.NUMBER,
          label: 'Hours',
          metricType: METRIC_TYPE.SLEEP_DURATION,
          config: {},
        },
        {
          type: QUESTION_TYPE.NUMBER,
          label: 'Again',
          metricType: METRIC_TYPE.SLEEP_DURATION,
          config: {},
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it('refuses a score on text and a metric on a choice', () => {
    expect(
      questionnaireInputSchema.safeParse({
        title: 'T',
        scoreKind: QUESTIONNAIRE_SCORE.SUM,
        questions: [
          { type: QUESTION_TYPE.SHORT_TEXT, label: 'Q', inScore: true },
        ],
      }).success,
    ).toBe(false);
    expect(
      questionnaireInputSchema.safeParse({
        title: 'T',
        questions: [
          {
            type: QUESTION_TYPE.YES_NO,
            label: 'Q',
            metricType: METRIC_TYPE.WEIGHT,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it('refuses a scale that ends below its start', () => {
    expect(
      questionnaireInputSchema.safeParse({
        title: 'T',
        questions: [
          { type: QUESTION_TYPE.SCALE, label: 'Q', config: { min: 5, max: 1 } },
        ],
      }).success,
    ).toBe(false);
  });
});
