import { useGetMyAthleteQuery } from '@/api/athlete';
import { useQuestionnaireOfEventQuery } from '@/api/questionnaire';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { useState } from 'react';

import {
  QUESTIONNAIRE_STATUS,
  type QuestionnaireEvent,
  type QuestionnaireOccurrence,
} from '@openathlete/shared';

import { formatDateTime } from './answer-format';
import { QuestionnaireAnswerForm } from './questionnaire-answer-form';
import { QuestionnaireAnswers } from './questionnaire-answers';

interface P {
  event: QuestionnaireEvent;
}

/**
 * A questionnaire placed in the calendar. The athlete answers it while it
 * is open; afterwards, they and their coach read the answers.
 */
export function QuestionnaireEventDetails({ event }: P) {
  const {
    data: form,
    isLoading,
    isError,
  } = useQuestionnaireOfEventQuery(event.eventId);
  const { data: me } = useGetMyAthleteQuery();
  const [editing, setEditing] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (isError || !form) {
    // Another coach of the athlete sees it is there, not its answers
    return (
      <p className="text-sm text-muted-foreground">
        {m.questionnaire_not_yours()}
      </p>
    );
  }

  const { occurrence, questionnaire, questions, canAnswer, coach } = form;
  const isAthlete = me?.athleteId === occurrence.athleteId;
  const answered = occurrence.status === QUESTIONNAIRE_STATUS.ANSWERED;
  const showForm = canAnswer && (!answered || editing);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="space-y-1 text-sm text-muted-foreground">
        {coach && isAthlete && (
          <p>
            {m.questionnaire_from({
              coach: `${coach.firstName} ${coach.lastName}`.trim(),
            })}
          </p>
        )}
        <p>{statusLine(occurrence)}</p>
      </div>

      {questionnaire.description && (
        <p className="whitespace-pre-wrap text-sm">
          {questionnaire.description}
        </p>
      )}

      {showForm && (
        <QuestionnaireAnswerForm
          key={occurrence.answeredAt?.toString() ?? 'new'}
          form={form}
          onDone={() => setEditing(false)}
        />
      )}

      {!showForm && answered && (
        <>
          <QuestionnaireAnswers
            questions={questions}
            answers={occurrence.answers}
            score={occurrence.score}
          />
          {canAnswer && (
            <button
              type="button"
              className="min-h-11 text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setEditing(true)}
            >
              {m.questionnaire_change_answers()}
            </button>
          )}
        </>
      )}

      {!showForm && !answered && isAthlete && (
        <p className="rounded-lg bg-muted px-4 py-3 text-sm">
          {occurrence.status === QUESTIONNAIRE_STATUS.UPCOMING
            ? m.questionnaire_upcoming_hint()
            : m.questionnaire_missed_hint()}
        </p>
      )}

      {!showForm && !answered && !isAthlete && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{m.questionnaire_questions()}</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {questions.map((question) => (
              <li key={question.questionId}>{question.label}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function statusLine(occurrence: QuestionnaireOccurrence) {
  switch (occurrence.status) {
    case QUESTIONNAIRE_STATUS.UPCOMING:
      return m.questionnaire_opens_on({
        date: formatDateTime(occurrence.startDate),
      });
    case QUESTIONNAIRE_STATUS.OPEN:
      return m.questionnaire_open_until({
        date: formatDateTime(occurrence.closesAt),
      });
    case QUESTIONNAIRE_STATUS.ANSWERED:
      return occurrence.answeredAt
        ? m.questionnaire_answered_on({
            date: formatDateTime(occurrence.answeredAt),
          })
        : m.questionnaire_answered();
    case QUESTIONNAIRE_STATUS.MISSED:
      return m.questionnaire_closed_unanswered();
  }
}
