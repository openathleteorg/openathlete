import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';

import { type Answer, QUESTION_TYPE, type Question } from '@openathlete/shared';

import { formatAnswer } from './answer-format';

interface P {
  questions: Question[];
  answers: Answer[];
  score?: number | null;
  className?: string;
}

/** Answers given, question by question, to read */
export function QuestionnaireAnswers({
  questions,
  answers,
  score,
  className,
}: P) {
  return (
    <dl className={cn('divide-y rounded-lg border', className)}>
      {score !== null && score !== undefined && (
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-sm font-medium">{m.questionnaire_score()}</dt>
          <dd className="text-lg font-semibold tabular-nums">{score}</dd>
        </div>
      )}
      {questions.map((question) => {
        const answer = answers.find(
          (item) => item.questionId === question.questionId,
        );
        const text =
          question.type === QUESTION_TYPE.LONG_TEXT ||
          question.type === QUESTION_TYPE.SHORT_TEXT;
        return (
          <div
            key={question.questionId}
            className={cn(
              'gap-1 px-4 py-3',
              text ? 'grid' : 'flex items-baseline justify-between gap-4',
            )}
          >
            <dt className="text-sm text-muted-foreground">{question.label}</dt>
            <dd
              className={cn(
                'text-sm',
                text ? 'whitespace-pre-wrap' : 'text-right font-medium',
                !answer && 'text-muted-foreground',
              )}
            >
              {formatAnswer(question, answer)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
