import { describe, expect, it, vi } from 'vitest';

import {
  QUESTIONNAIRE_SCORE,
  QUESTIONNAIRE_STATUS,
  QUESTION_TYPE,
  type Question,
  type Questionnaire,
  type QuestionnaireOccurrence,
} from '@openathlete/shared';

import { csvDateTime, csvFileName, questionnaireTable } from './csv';

// Every message renders as its key, with its parameters
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy(
    {},
    {
      get: (_target, key) => (params?: Record<string, unknown>) =>
        params ? `${String(key)}:${Object.values(params).join(',')}` : key,
    },
  ),
}));

const base = {
  help: '',
  required: true,
  inScore: true,
  metricType: null,
  archivedAt: null,
};
const fatigue: Question = {
  ...base,
  questionId: 1,
  position: 0,
  type: QUESTION_TYPE.SCALE,
  label: 'Fatigue',
  config: {
    min: 1,
    max: 7,
    step: 1,
    minLabel: '',
    maxLabel: '',
    display: 'BUTTONS',
  },
};
const sleep: Question = {
  ...base,
  questionId: 2,
  position: 1,
  type: QUESTION_TYPE.NUMBER,
  label: 'Sleep',
  inScore: false,
  config: { unit: 'h', min: null, max: null, decimals: 1 },
};
const replaced: Question = {
  ...base,
  questionId: 3,
  position: 2,
  type: QUESTION_TYPE.SINGLE_CHOICE,
  label: 'Mood',
  inScore: false,
  archivedAt: new Date('2026-11-01'),
  config: {
    options: [
      { id: 'good', label: 'Good' },
      { id: 'bad', label: 'Bad' },
    ],
  },
};
const unused: Question = { ...replaced, questionId: 4, label: 'Old' };

const questionnaire: Questionnaire = {
  questionnaireId: 9,
  title: 'Hooper',
  description: '',
  scoreKind: QUESTIONNAIRE_SCORE.SUM,
  scoreMetricType: null,
  archivedAt: null,
  hasCoach: true,
  questions: [replaced, sleep, unused, fatigue],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const occurrence = (
  eventId: number,
  athleteId: number,
  start: string,
  values: Partial<QuestionnaireOccurrence> = {},
): QuestionnaireOccurrence => ({
  eventId,
  athleteId,
  questionnaireId: 9,
  startDate: new Date(start),
  closesAt: new Date(start),
  answeredAt: null,
  editableUntil: null,
  status: QUESTIONNAIRE_STATUS.MISSED,
  score: null,
  answers: [],
  ...values,
});

describe('questionnaireTable', () => {
  const occurrences = [
    occurrence(2, 7, '2026-11-10T08:00:00', {
      status: QUESTIONNAIRE_STATUS.ANSWERED,
      answeredAt: new Date('2026-11-10T09:30:00'),
      score: 5,
      answers: [
        { questionId: 1, valueNumber: 5, valueText: null, valueOptions: [] },
        { questionId: 2, valueNumber: 7.5, valueText: null, valueOptions: [] },
        {
          questionId: 3,
          valueNumber: null,
          valueText: null,
          valueOptions: ['bad'],
        },
      ],
    }),
    occurrence(1, 8, '2026-11-09T08:00:00'),
  ];

  it('has a row per occurrence, the oldest first, a column per question', () => {
    const table = questionnaireTable(questionnaire, occurrences, [
      { athleteId: 7, firstName: 'Ada', lastName: 'L' },
      { athleteId: 8, firstName: 'Bo', lastName: 'K' },
    ]);
    expect(table.header).toEqual([
      'athlete',
      'questionnaire_csv_opened',
      'questionnaire_csv_status',
      'questionnaire_csv_answered',
      'questionnaire_score',
      'Fatigue (1–7)',
      'Sleep (h)',
      // Replaced, but answered over the span; the unanswered one is left out
      'questionnaire_csv_replaced:Mood',
    ]);
    expect(table.rows).toEqual([
      [
        'Bo K',
        '2026-11-09 08:00',
        'questionnaire_unanswered',
        null,
        null,
        null,
        null,
        null,
      ],
      [
        'Ada L',
        '2026-11-10 08:00',
        'questionnaire_answered',
        '2026-11-10 09:30',
        5,
        5,
        7.5,
        'Bad',
      ],
    ]);
  });

  it("leaves the athlete out of one athlete's table", () => {
    const table = questionnaireTable(questionnaire, occurrences);
    expect(table.header[0]).toBe('questionnaire_csv_opened');
    expect(table.rows[0][0]).toBe('2026-11-09 08:00');
  });
});

describe('csv helpers', () => {
  it('writes local dates a spreadsheet reads', () => {
    expect(csvDateTime(new Date(2026, 0, 5, 7, 3))).toBe('2026-01-05 07:03');
    expect(csvDateTime(null)).toBeNull();
  });

  it('names the file after the questionnaire', () => {
    expect(csvFileName('Bien-être (McLean) ')).toBe(
      'openathlete-bien-etre-mclean.csv',
    );
    expect(csvFileName('???')).toBe('openathlete-questionnaire.csv');
  });
});
