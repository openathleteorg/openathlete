import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';

import {
  QUESTIONNAIRE_STATUS,
  QUESTION_TYPE,
  type Question,
  type QuestionnaireOccurrence,
} from '@openathlete/shared';

import { formatAnswer, formatShortDay } from '../answer-format';
import { PERIODS, type Period, periodLabel, statusLabel } from './period';

export function PeriodSelect({
  value,
  onChange,
}: {
  value: Period;
  onChange: (days: Period) => void;
}) {
  return (
    <Select
      value={String(value)}
      onValueChange={(next) => onChange(Number(next) as Period)}
    >
      <SelectTrigger className="w-44" aria-label={m.questionnaire_period()}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIODS.map((days) => (
          <SelectItem key={days} value={String(days)}>
            {periodLabel(days)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StatusBadge({ status }: { status: QUESTIONNAIRE_STATUS }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        status === QUESTIONNAIRE_STATUS.ANSWERED
          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
          : status === QUESTIONNAIRE_STATUS.MISSED
            ? 'bg-muted text-muted-foreground'
            : 'bg-secondary text-secondary-foreground',
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

/** Most columns the table shows: the latest occurrences */
const MATRIX_COLUMNS = 16;

const isText = (question: Question) =>
  question.type === QUESTION_TYPE.SHORT_TEXT ||
  question.type === QUESTION_TYPE.LONG_TEXT;

/**
 * Questions down, occurrences across: a whole series read at a glance, as
 * coaches keep it in a spreadsheet. Over a long span the latest come first,
 * so they show without scrolling; within a week, the days are in order.
 * Text answers read better as lines under the table than in its cells.
 */
export function AnswersMatrix({
  questions,
  occurrences,
  order = 'newest',
}: {
  questions: Question[];
  occurrences: QuestionnaireOccurrence[];
  order?: 'newest' | 'oldest';
}) {
  const due = occurrences
    .filter(
      (occurrence) =>
        occurrence.status === QUESTIONNAIRE_STATUS.ANSWERED ||
        occurrence.status === QUESTIONNAIRE_STATUS.MISSED,
    )
    .slice(-MATRIX_COLUMNS);
  const columns = order === 'newest' ? [...due].reverse() : due;
  if (columns.length === 0) return null;
  const hasScore = columns.some((occurrence) => occurrence.score !== null);
  const rows = questions.filter((question) => !isText(question));
  const texts = questions.filter(isText).flatMap((question) =>
    columns.flatMap((occurrence) => {
      const answer = occurrence.answers.find(
        (item) => item.questionId === question.questionId,
      );
      return answer?.valueText
        ? [{ question, occurrence, text: answer.valueText }]
        : [];
    }),
  );

  return (
    <div className="space-y-3">
      {(rows.length > 0 || hasScore) && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 min-w-40 bg-background">
                  {m.questionnaire_questions()}
                </TableHead>
                {columns.map((occurrence) => (
                  <TableHead
                    key={occurrence.eventId}
                    className="whitespace-nowrap text-right"
                  >
                    {formatShortDay(new Date(occurrence.startDate))}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hasScore && (
                <TableRow>
                  <TableCell className="sticky left-0 bg-background font-medium">
                    {m.questionnaire_score()}
                  </TableCell>
                  {columns.map((occurrence) => (
                    <TableCell
                      key={occurrence.eventId}
                      className="text-right font-semibold tabular-nums"
                    >
                      {occurrence.score ?? '–'}
                    </TableCell>
                  ))}
                </TableRow>
              )}
              {rows.map((question) => (
                <TableRow key={question.questionId}>
                  <TableCell className="sticky left-0 max-w-56 truncate bg-background">
                    {question.label}
                  </TableCell>
                  {columns.map((occurrence) => {
                    const answer = occurrence.answers.find(
                      (item) => item.questionId === question.questionId,
                    );
                    return (
                      <TableCell
                        key={occurrence.eventId}
                        className={cn(
                          'max-w-48 truncate text-right tabular-nums',
                          !answer && 'text-muted-foreground',
                        )}
                        title={
                          answer ? formatAnswer(question, answer) : undefined
                        }
                      >
                        {answer ? formatAnswer(question, answer) : '–'}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {texts.length > 0 && (
        <ul className="space-y-2">
          {texts.map(({ question, occurrence, text }) => (
            <li
              key={`${occurrence.eventId}-${question.questionId}`}
              className="space-y-0.5"
            >
              <p className="text-xs text-muted-foreground">
                {formatShortDay(new Date(occurrence.startDate))} ·{' '}
                {question.label}
              </p>
              <p className="whitespace-pre-wrap text-sm">{text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
