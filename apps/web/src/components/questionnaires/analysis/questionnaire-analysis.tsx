import { m } from '@/paraglide/messages';
import { useMemo } from 'react';

import {
  QUESTIONNAIRE_SCORE,
  QUESTIONNAIRE_STATUS,
  type Questionnaire,
  type QuestionnaireOccurrence,
} from '@openathlete/shared';

import { AnswersMatrix } from './analysis-parts';
import {
  NumberChart,
  QuestionWidget,
  type WidgetAthlete,
} from './question-widget';
import { type AnswerPoint, answersOf, responseRate } from './series';

interface P {
  questionnaire: Questionnaire;
  occurrences: QuestionnaireOccurrence[];
  athletes?: WidgetAthlete[];
  from: Date;
  to: Date;
  /** One athlete: the table of all their answers */
  withMatrix?: boolean;
}

/**
 * Everything one questionnaire got over the span: how often it was
 * answered, its score, and each question drawn for its type.
 */
export function QuestionnaireAnalysis({
  questionnaire,
  occurrences,
  athletes,
  from,
  to,
  withMatrix = false,
}: P) {
  const rate = responseRate(occurrences);
  // The charts start with the first occurrence, not an empty span before it
  const start = useMemo(() => {
    const first = occurrences.reduce<number | null>((min, occurrence) => {
      const time = new Date(occurrence.startDate).getTime();
      return min === null || time < min ? time : min;
    }, null);
    if (first === null) return from;
    const day = new Date(Math.max(first, from.getTime()));
    day.setHours(0, 0, 0, 0);
    return day;
  }, [occurrences, from]);
  const scorePoints = useMemo<AnswerPoint[]>(
    () =>
      occurrences
        .filter(
          (occurrence) =>
            occurrence.status === QUESTIONNAIRE_STATUS.ANSWERED &&
            occurrence.score !== null,
        )
        .map((occurrence) => ({
          eventId: occurrence.eventId,
          athleteId: occurrence.athleteId,
          date: new Date(occurrence.startDate),
          answer: {
            questionId: 0,
            valueNumber: occurrence.score,
            valueText: null,
            valueOptions: [],
          },
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [occurrences],
  );
  const questions = [...questionnaire.questions].sort(
    (a, b) =>
      Number(a.archivedAt !== null) - Number(b.archivedAt !== null) ||
      a.position - b.position,
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {rate.due > 0
          ? m.questionnaire_response_rate({
              answered: rate.answered,
              due: rate.due,
              percent: Math.round((rate.answered / rate.due) * 100),
            })
          : m.questionnaire_nothing_due()}
      </p>

      {questionnaire.scoreKind !== QUESTIONNAIRE_SCORE.NONE && (
        <section className="space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-medium">{m.questionnaire_score()}</h3>
          {scorePoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {m.questionnaire_no_answer_yet()}
            </p>
          ) : (
            <NumberChart
              label={m.questionnaire_score()}
              points={scorePoints}
              athletes={athletes}
              from={start}
              to={to}
            />
          )}
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {questions.map((question) => (
          <QuestionWidget
            key={question.questionId}
            question={question}
            points={answersOf(question, occurrences)}
            athletes={athletes}
            from={start}
            to={to}
          />
        ))}
      </div>

      {withMatrix && (
        <AnswersMatrix questions={questions} occurrences={occurrences} />
      )}
    </div>
  );
}
