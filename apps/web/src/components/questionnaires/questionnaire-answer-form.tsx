import { useSubmitQuestionnaireAnswersMutation } from '@/api/questionnaire';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  type AnswerError,
  type AnswerInput,
  type QuestionnaireForm,
  checkAnswers,
} from '@openathlete/shared';

import { emptyAnswer } from './answer-format';
import { QuestionField } from './question-field';
import {
  questionnaireErrorCode,
  questionnaireErrorMessage,
} from './questionnaire-errors';

interface P {
  form: QuestionnaireForm;
  onDone?: () => void;
}

/**
 * The athlete answers, or changes their answers while they still may. The
 * same checks run here and in the API, so a refusal shows on its question.
 */
export function QuestionnaireAnswerForm({ form, onDone }: P) {
  const { questions, occurrence } = form;
  const [values, setValues] = useState<Record<number, AnswerInput>>(() =>
    Object.fromEntries(
      questions.map((question) => [
        question.questionId,
        {
          ...emptyAnswer(question.questionId),
          ...occurrence.answers.find(
            (answer) => answer.questionId === question.questionId,
          ),
        },
      ]),
    ),
  );
  const [errors, setErrors] = useState<Record<number, AnswerError>>({});
  const submit = useSubmitQuestionnaireAnswersMutation();
  const editing = occurrence.answeredAt !== null;

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const answers = Object.values(values);
    const checked = checkAnswers(questions, answers);
    setErrors(checked.errors);
    const firstError = questions.find(
      (question) => checked.errors[question.questionId],
    );
    if (firstError) {
      document
        .querySelector(`[data-question="${firstError.questionId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    submit.mutate(
      { eventId: occurrence.eventId, body: { answers: checked.answers } },
      {
        onSuccess: () => {
          toast.success(
            editing
              ? m.questionnaire_answers_updated()
              : m.questionnaire_answers_sent(),
          );
          onDone?.();
        },
        onError: (error) => {
          // The API saw what the form could not: show it on the questions
          if (questionnaireErrorCode(error) === 'INVALID_ANSWERS') {
            const data = (
              error as { response?: { data?: { errors?: unknown } } }
            ).response?.data?.errors;
            if (data && typeof data === 'object') {
              setErrors(data as Record<number, AnswerError>);
            }
          }
          toast.error(
            questionnaireErrorMessage(error) ??
              m.questionnaire_answers_failed(),
          );
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {questions.map((question) => (
        <QuestionField
          key={question.questionId}
          question={question}
          value={values[question.questionId]}
          error={errors[question.questionId]}
          disabled={submit.isPending}
          onChange={(value) => {
            setValues((current) => ({
              ...current,
              [question.questionId]: value,
            }));
            if (errors[question.questionId]) {
              setErrors(({ [question.questionId]: _fixed, ...rest }) => rest);
            }
          }}
        />
      ))}
      <Button
        type="submit"
        className="w-full sm:w-auto"
        size="lg"
        isLoading={submit.isPending}
      >
        {editing ? m.questionnaire_update_answers() : m.questionnaire_submit()}
      </Button>
    </form>
  );
}
