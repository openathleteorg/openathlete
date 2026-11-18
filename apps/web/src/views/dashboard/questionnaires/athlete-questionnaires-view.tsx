import { useQuestionnaireResponsesQuery } from '@/api/questionnaire';
import {
  AnswersMatrix,
  PeriodSelect,
  StatusBadge,
} from '@/components/questionnaires/analysis/analysis-parts';
import { usePeriod } from '@/components/questionnaires/analysis/period';
import { QuestionnaireAnalysis } from '@/components/questionnaires/analysis/questionnaire-analysis';
import {
  byWeek,
  responseRate,
} from '@/components/questionnaires/analysis/series';
import { formatShortDay } from '@/components/questionnaires/answer-format';
import { QuestionnaireAnswers } from '@/components/questionnaires/questionnaire-answers';
import { PageTitle } from '@/components/ui/page-title';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  QUESTIONNAIRE_STATUS,
  type Questionnaire,
  type QuestionnaireOccurrence,
  type QuestionnaireResponses,
} from '@openathlete/shared';

interface P {
  athleteId: number;
}

/**
 * What one athlete answered: week after week, or questionnaire by
 * questionnaire with a chart per question.
 */
export function AthleteQuestionnairesView({ athleteId }: P) {
  const { athlete } = useAthleteInfo({ athleteId });
  const period = usePeriod();
  const { data, isLoading } = useQuestionnaireResponsesQuery({
    athleteId,
    ...period.query,
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle desktopOnly>
          {m.questionnaires_of({
            firstName: athlete?.user?.firstName || '',
            lastName: athlete?.user?.lastName || '',
          })}
        </PageTitle>
        <PeriodSelect value={period.days} onChange={period.setDays} />
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {data && data.occurrences.length === 0 && (
        <div className="space-y-2 rounded-lg border p-6 text-sm">
          <p>{m.questionnaire_athlete_empty()}</p>
          <Link
            to={getPath(['dashboard', 'questionnaires'])}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {m.questionnaire_go_library()}
          </Link>
        </div>
      )}

      {data && data.occurrences.length > 0 && (
        <Tabs defaultValue="weeks" className="gap-4">
          <TabsList>
            <TabsTrigger value="weeks">{m.questionnaire_by_week()}</TabsTrigger>
            <TabsTrigger value="questionnaires">
              {m.questionnaire_by_questionnaire()}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="weeks">
            <Weeks data={data} />
          </TabsContent>
          <TabsContent value="questionnaires">
            <ByQuestionnaire data={data} from={period.from} to={period.to} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function Weeks({ data }: { data: QuestionnaireResponses }) {
  const weeks = useMemo(
    () =>
      byWeek(
        data.occurrences.filter(
          (occurrence) => occurrence.status !== QUESTIONNAIRE_STATUS.UPCOMING,
        ),
      ),
    [data.occurrences],
  );

  return (
    <div className="space-y-8">
      {weeks.map((week) => (
        <section key={week.key} className="space-y-3">
          <h2 className="text-sm font-semibold">
            {m.questionnaire_week_of({ date: formatShortDay(week.start) })}
          </h2>
          {/* One card per questionnaire: a daily one is a table of the week */}
          <div className="grid gap-3">
            {data.questionnaires.map((questionnaire) => {
              const occurrences = week.occurrences.filter(
                (occurrence) =>
                  occurrence.questionnaireId === questionnaire.questionnaireId,
              );
              if (occurrences.length === 0) return null;
              return (
                <WeekCard
                  key={questionnaire.questionnaireId}
                  questionnaire={questionnaire}
                  occurrences={occurrences}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function WeekCard({
  questionnaire,
  occurrences,
}: {
  questionnaire: Questionnaire;
  occurrences: QuestionnaireOccurrence[];
}) {
  const answeredIds = new Set(
    occurrences.flatMap((occurrence) =>
      occurrence.answers.map((answer) => answer.questionId),
    ),
  );
  // The questions answered this week, replaced ones included
  const questions = questionnaire.questions
    .filter(
      (question) =>
        answeredIds.has(question.questionId) || !question.archivedAt,
    )
    .sort((a, b) => a.position - b.position);
  const [single] = occurrences;
  const rate = responseRate(occurrences);

  return (
    <article
      className="space-y-3 rounded-lg border p-4"
      data-occurrence={single.eventId}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{questionnaire.title}</p>
          <p className="text-xs text-muted-foreground">
            {occurrences.length === 1
              ? formatShortDay(new Date(single.startDate))
              : m.questionnaire_week_answered({
                  answered: rate.answered,
                  due: rate.due,
                })}
          </p>
        </div>
        {occurrences.length === 1 && <StatusBadge status={single.status} />}
      </header>
      {occurrences.length === 1 ? (
        single.status === QUESTIONNAIRE_STATUS.ANSWERED && (
          <QuestionnaireAnswers
            questions={questions.filter((question) =>
              single.answers.some(
                (answer) => answer.questionId === question.questionId,
              ),
            )}
            answers={single.answers}
            score={single.score}
          />
        )
      ) : (
        <AnswersMatrix
          questions={questions}
          occurrences={occurrences}
          order="oldest"
        />
      )}
    </article>
  );
}

function ByQuestionnaire({
  data,
  from,
  to,
}: {
  data: QuestionnaireResponses;
  from: Date;
  to: Date;
}) {
  const [selected, setSelected] = useState(
    data.questionnaires[0]?.questionnaireId,
  );
  const questionnaire =
    data.questionnaires.find((item) => item.questionnaireId === selected) ??
    data.questionnaires[0];
  if (!questionnaire) return null;
  const occurrences = data.occurrences.filter(
    (occurrence) =>
      occurrence.questionnaireId === questionnaire.questionnaireId,
  );

  return (
    <div className="space-y-4">
      {data.questionnaires.length > 1 && (
        <Select
          value={String(questionnaire.questionnaireId)}
          onValueChange={(value) => setSelected(Number(value))}
        >
          <SelectTrigger
            className="w-full sm:w-72"
            aria-label={m.questionnaire()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {data.questionnaires.map((item) => (
              <SelectItem
                key={item.questionnaireId}
                value={String(item.questionnaireId)}
              >
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <QuestionnaireAnalysis
        questionnaire={questionnaire}
        occurrences={occurrences}
        from={from}
        to={to}
        withMatrix
      />
    </div>
  );
}
