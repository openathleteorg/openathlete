import {
  type Answer,
  QUESTIONNAIRE_STATUS,
  type Question,
  type QuestionnaireOccurrence,
} from '@openathlete/shared';

/** One answer to one question, with when and by whom */
export interface AnswerPoint {
  eventId: number;
  athleteId: number;
  date: Date;
  answer: Answer;
}

/** The answers a question got, oldest first */
export function answersOf(
  question: Question,
  occurrences: QuestionnaireOccurrence[],
): AnswerPoint[] {
  return occurrences
    .filter((occurrence) => occurrence.status === QUESTIONNAIRE_STATUS.ANSWERED)
    .flatMap((occurrence) => {
      const answer = occurrence.answers.find(
        (item) => item.questionId === question.questionId,
      );
      return answer
        ? [
            {
              eventId: occurrence.eventId,
              athleteId: occurrence.athleteId,
              date: new Date(occurrence.startDate),
              answer,
            },
          ]
        : [];
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** How many times each option was chosen, in the order of the options */
export function optionCounts(
  options: { id: string; label: string }[],
  points: AnswerPoint[],
): { id: string; label: string; count: number }[] {
  return options.map((option) => ({
    ...option,
    count: points.filter((point) =>
      point.answer.valueOptions.includes(option.id),
    ).length,
  }));
}

/** Occurrences answered over those that closed or were answered */
export function responseRate(occurrences: QuestionnaireOccurrence[]) {
  const due = occurrences.filter(
    (occurrence) =>
      occurrence.status === QUESTIONNAIRE_STATUS.ANSWERED ||
      occurrence.status === QUESTIONNAIRE_STATUS.MISSED,
  );
  const answered = due.filter(
    (occurrence) => occurrence.status === QUESTIONNAIRE_STATUS.ANSWERED,
  ).length;
  return { answered, due: due.length };
}

/** The Monday starting the local week of a date, as a key and a date */
export function weekOf(date: Date): { key: string; start: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  return { key, start };
}

/** Occurrences grouped by local week, the latest week first */
export function byWeek(
  occurrences: QuestionnaireOccurrence[],
): { key: string; start: Date; occurrences: QuestionnaireOccurrence[] }[] {
  const weeks = new Map<
    string,
    { key: string; start: Date; occurrences: QuestionnaireOccurrence[] }
  >();
  for (const occurrence of occurrences) {
    const week = weekOf(new Date(occurrence.startDate));
    const entry = weeks.get(week.key) ?? { ...week, occurrences: [] };
    entry.occurrences.push(occurrence);
    weeks.set(week.key, entry);
  }
  return [...weeks.values()]
    .map((week) => ({
      ...week,
      occurrences: [...week.occurrences].sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      ),
    }))
    .sort((a, b) => b.start.getTime() - a.start.getTime());
}

/**
 * The group's mean per day of a numeric question, for one line across
 * athletes: each athlete counts once a day.
 */
export function dailyMeans(points: AnswerPoint[]) {
  const days = new Map<string, { date: Date; values: number[] }>();
  for (const point of points) {
    if (point.answer.valueNumber === null) continue;
    const day = new Date(point.date);
    day.setHours(12, 0, 0, 0);
    const key = day.toDateString();
    const entry = days.get(key) ?? { date: day, values: [] };
    entry.values.push(point.answer.valueNumber);
    days.set(key, entry);
  }
  return [...days.values()]
    .map(({ date, values }) => ({
      date,
      value: values.reduce((sum, value) => sum + value, 0) / values.length,
      count: values.length,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/** The palette, in its fixed order: an athlete keeps their colour */
export const SERIES_COLORS = [
  'var(--chart-2)',
  'var(--chart-1)',
  'var(--chart-3)',
  'var(--chart-5)',
  'var(--chart-4)',
  'var(--chart-6)',
  'var(--chart-7)',
];
