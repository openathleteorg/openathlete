import { describe, expect, it } from 'vitest';

import {
  QUESTIONNAIRE_STATUS,
  QUESTION_TYPE,
  type Question,
  type QuestionnaireOccurrence,
} from '@openathlete/shared';

import {
  answersOf,
  byWeek,
  dailyMeans,
  optionCounts,
  responseRate,
  weekOf,
} from './series';

const question: Question = {
  questionId: 1,
  position: 0,
  type: QUESTION_TYPE.SCALE,
  label: 'Fatigue',
  help: '',
  required: true,
  inScore: false,
  metricType: null,
  archivedAt: null,
  config: {
    min: 1,
    max: 7,
    step: 1,
    minLabel: '',
    maxLabel: '',
    display: 'BUTTONS',
  },
};

const occurrence = (
  eventId: number,
  start: Date,
  status: QUESTIONNAIRE_STATUS,
  value: number | null = null,
  athleteId = 7,
): QuestionnaireOccurrence => ({
  eventId,
  athleteId,
  questionnaireId: 1,
  startDate: start,
  closesAt: start,
  answeredAt: status === QUESTIONNAIRE_STATUS.ANSWERED ? start : null,
  editableUntil: null,
  status,
  score: null,
  answers:
    value === null
      ? []
      : [
          {
            questionId: 1,
            valueNumber: value,
            valueText: null,
            valueOptions: [],
          },
        ],
});

// Local dates: the tests run in several time zones
const monday = new Date(2026, 9, 5, 8);
const wednesday = new Date(2026, 9, 7, 8);
const nextMonday = new Date(2026, 9, 12, 8);

describe('questionnaire series', () => {
  it('keeps the answered occurrences, oldest first', () => {
    const points = answersOf(question, [
      occurrence(2, wednesday, QUESTIONNAIRE_STATUS.ANSWERED, 5),
      occurrence(1, monday, QUESTIONNAIRE_STATUS.ANSWERED, 3),
      occurrence(3, nextMonday, QUESTIONNAIRE_STATUS.MISSED),
    ]);
    expect(points.map((point) => point.answer.valueNumber)).toEqual([3, 5]);
  });

  it('counts the answers due, not the coming ones', () => {
    expect(
      responseRate([
        occurrence(1, monday, QUESTIONNAIRE_STATUS.ANSWERED, 3),
        occurrence(2, wednesday, QUESTIONNAIRE_STATUS.MISSED),
        occurrence(3, nextMonday, QUESTIONNAIRE_STATUS.OPEN),
        occurrence(4, nextMonday, QUESTIONNAIRE_STATUS.UPCOMING),
      ]),
    ).toEqual({ answered: 1, due: 2 });
  });

  it('groups by local week from Monday, the latest first', () => {
    expect(weekOf(wednesday).start).toEqual(new Date(2026, 9, 5));
    const weeks = byWeek([
      occurrence(2, wednesday, QUESTIONNAIRE_STATUS.ANSWERED, 5),
      occurrence(3, nextMonday, QUESTIONNAIRE_STATUS.OPEN),
      occurrence(1, monday, QUESTIONNAIRE_STATUS.ANSWERED, 3),
    ]);
    expect(
      weeks.map((week) => week.occurrences.map((item) => item.eventId)),
    ).toEqual([[3], [1, 2]]);
  });

  it('averages the athletes of a day', () => {
    const points = answersOf(question, [
      occurrence(1, monday, QUESTIONNAIRE_STATUS.ANSWERED, 2, 7),
      occurrence(2, monday, QUESTIONNAIRE_STATUS.ANSWERED, 6, 8),
      occurrence(3, wednesday, QUESTIONNAIRE_STATUS.ANSWERED, 5, 7),
    ]);
    expect(
      dailyMeans(points).map(({ value, count }) => ({ value, count })),
    ).toEqual([
      { value: 4, count: 2 },
      { value: 5, count: 1 },
    ]);
  });

  it('counts the options chosen', () => {
    const points = [{ valueOptions: ['a'] }, { valueOptions: ['a', 'b'] }].map(
      (answer, index) => ({
        eventId: index,
        athleteId: 7,
        date: monday,
        answer: {
          questionId: 1,
          valueNumber: null,
          valueText: null,
          ...answer,
        },
      }),
    );
    expect(
      optionCounts(
        [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
          { id: 'c', label: 'C' },
        ],
        points,
      ).map((option) => option.count),
    ).toEqual([2, 1, 0]);
  });
});
