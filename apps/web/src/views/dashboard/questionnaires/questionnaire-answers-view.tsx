import {
  useQuestionnaireQuery,
  useQuestionnaireResponsesQuery,
} from '@/api/questionnaire';
import { PeriodSelect } from '@/components/questionnaires/analysis/analysis-parts';
import { usePeriod } from '@/components/questionnaires/analysis/period';
import { QuestionnaireAnalysis } from '@/components/questionnaires/analysis/questionnaire-analysis';
import { responseRate } from '@/components/questionnaires/analysis/series';
import { formatShortDay } from '@/components/questionnaires/answer-format';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/ui/page-title';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { m } from '@/paraglide/messages';
import { getPath, questionnaireEditPath } from '@/routes/paths';
import { Pencil } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { QUESTIONNAIRE_STATUS } from '@openathlete/shared';

interface P {
  questionnaireId: number;
}

/**
 * One questionnaire across the athletes it was sent to: who answers, and
 * how the answers compare.
 */
export function QuestionnaireAnswersView({ questionnaireId }: P) {
  const period = usePeriod();
  const { data: own } = useQuestionnaireQuery(questionnaireId);
  const { data, isLoading } = useQuestionnaireResponsesQuery({
    questionnaireId,
    ...period.query,
  });
  const questionnaire =
    data?.questionnaires.find(
      (item) => item.questionnaireId === questionnaireId,
    ) ?? own;

  const athletes = useMemo(
    () =>
      (data?.athletes ?? []).map((athlete) => ({
        athleteId: athlete.athleteId,
        name: `${athlete.firstName} ${athlete.lastName}`.trim(),
      })),
    [data?.athletes],
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle desktopOnly>
          {questionnaire?.title ?? m.questionnaire()}
        </PageTitle>
        <div className="flex items-center gap-2">
          <PeriodSelect value={period.days} onChange={period.setDays} />
          {own && !own.archivedAt && (
            <Button asChild variant="outline">
              <Link to={questionnaireEditPath(questionnaireId)}>
                <Pencil />
                {m.edit()}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {data && data.occurrences.length === 0 && (
        <div className="space-y-2 rounded-lg border p-6 text-sm">
          <p>{m.questionnaire_answers_empty()}</p>
          <Link
            to={getPath(['dashboard', 'coach'])}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {m.questionnaire_go_athletes()}
          </Link>
        </div>
      )}

      {data && questionnaire && data.occurrences.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{m.athletes()}</TableHead>
                  <TableHead className="text-right">
                    {m.questionnaire_answers()}
                  </TableHead>
                  <TableHead className="text-right">
                    {m.questionnaire_last_answer_column()}
                  </TableHead>
                  {questionnaire.scoreKind !== 'NONE' && (
                    <TableHead className="text-right">
                      {m.questionnaire_last_score()}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {athletes.map((athlete) => {
                  const own = data.occurrences.filter(
                    (occurrence) => occurrence.athleteId === athlete.athleteId,
                  );
                  const rate = responseRate(own);
                  const last = [...own]
                    .reverse()
                    .find(
                      (occurrence) =>
                        occurrence.status === QUESTIONNAIRE_STATUS.ANSWERED,
                    );
                  return (
                    <TableRow key={athlete.athleteId}>
                      <TableCell>
                        <Link
                          to={`${getPath(['dashboard', 'questionnaires'])}/${athlete.athleteId}`}
                          className="font-medium hover:underline"
                        >
                          {athlete.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {rate.answered} / {rate.due}
                      </TableCell>
                      <TableCell className="text-right">
                        {last ? formatShortDay(new Date(last.startDate)) : '–'}
                      </TableCell>
                      {questionnaire.scoreKind !== 'NONE' && (
                        <TableCell className="text-right font-semibold tabular-nums">
                          {last?.score ?? '–'}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <QuestionnaireAnalysis
            questionnaire={questionnaire}
            occurrences={data.occurrences}
            athletes={athletes}
            from={period.from}
            to={period.to}
          />
        </>
      )}
    </div>
  );
}
