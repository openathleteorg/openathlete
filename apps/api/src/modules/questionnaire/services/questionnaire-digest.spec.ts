import { QUESTION_TYPE, type Question } from '@openathlete/shared';

import {
  type QuestionnaireDigest,
  answerText,
  digestLines,
} from './questionnaire-digest';

const base = {
  questionId: 1,
  position: 0,
  label: 'Q',
  help: '',
  required: true,
  inScore: false,
  metricType: null,
  archivedAt: null,
};
const answer = (values: {
  valueNumber?: number | null;
  valueText?: string | null;
  valueOptions?: string[];
}) => ({
  questionId: 1,
  valueNumber: null,
  valueText: null,
  valueOptions: [],
  ...values,
});

describe('answerText', () => {
  it('reads a scale with its range and what its ends mean', () => {
    const question = {
      ...base,
      type: QUESTION_TYPE.SCALE,
      config: {
        min: 1,
        max: 7,
        step: 1,
        minLabel: 'Very fresh',
        maxLabel: 'Exhausted',
        display: 'BUTTONS',
      },
    } as Question;
    expect(answerText(question, answer({ valueNumber: 5 }))).toBe(
      '5 on 1-7 (1 = Very fresh, 7 = Exhausted)',
    );
  });

  it('gives a number its unit, a choice its labels, yes or no', () => {
    expect(
      answerText(
        {
          ...base,
          type: QUESTION_TYPE.NUMBER,
          config: { unit: 'h', min: null, max: null, decimals: 1 },
        } as Question,
        answer({ valueNumber: 7.25 }),
      ),
    ).toBe('7.25 h');
    expect(
      answerText(
        {
          ...base,
          type: QUESTION_TYPE.MULTIPLE_CHOICE,
          config: {
            options: [
              { id: 'a', label: 'Legs' },
              { id: 'b', label: 'Back' },
            ],
          },
        } as Question,
        answer({ valueOptions: ['b', 'gone'] }),
      ),
    ).toBe('Back, (removed option)');
    expect(
      answerText(
        { ...base, type: QUESTION_TYPE.YES_NO, config: {} } as Question,
        answer({ valueNumber: 0 }),
      ),
    ).toBe('no');
  });

  it('tells nothing for a question left empty', () => {
    expect(
      answerText(
        { ...base, type: QUESTION_TYPE.SHORT_TEXT, config: {} } as Question,
        answer({ valueText: '  ' }),
      ),
    ).toBeNull();
  });
});

describe('digestLines', () => {
  const item = (
    eventId: number,
    values: Partial<QuestionnaireDigest> = {},
  ): QuestionnaireDigest => ({
    eventId,
    questionnaire: 'Hooper',
    date: '2026-11-1' + eventId,
    status: 'answered',
    answers: [],
    ...values,
  });

  it('lists what was answered or missed, not what is still to come', () => {
    expect(
      digestLines([
        item(1, {
          score: { value: 14, kind: 'sum', range: '4-28' },
          answers: [{ question: 'Sleep', answer: 'Bad\nreally' }],
        }),
        item(2, { status: 'missed' }),
        item(3, { status: 'open' }),
        item(4, { status: 'upcoming' }),
      ]),
    ).toBe(
      [
        '- 2026-11-11 Hooper (score 14 on 4-28)',
        '  - Sleep: Bad really',
        '- 2026-11-12 Hooper: not answered',
      ].join('\n'),
    );
  });

  it('cuts long answers and keeps the latest questionnaires', () => {
    const many = Array.from({ length: 25 }, (_, index) =>
      item(index, { answers: [{ question: 'Note', answer: 'x'.repeat(900) }] }),
    );
    const lines = digestLines(many).split('\n');
    expect(lines.filter((line) => line.startsWith('- '))).toHaveLength(20);
    expect(lines[0]).toContain('Hooper');
    expect(lines[1].length).toBeLessThan(420);
    expect(lines[1].endsWith('…')).toBe(true);
    expect(digestLines([])).toBe('');
  });
});
