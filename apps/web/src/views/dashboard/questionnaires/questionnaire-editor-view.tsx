import {
  useQuestionnaireQuery,
  useQuestionnairesQuery,
} from '@/api/questionnaire';
import { toDraft } from '@/components/questionnaires/question-types';
import { QuestionnaireEditor } from '@/components/questionnaires/questionnaire-editor';
import {
  isQuestionnaireTemplate,
  templateQuestionnaire,
} from '@/components/questionnaires/questionnaire-templates';
import { PageTitle } from '@/components/ui/page-title';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface P {
  /** The questionnaire edited; absent, a new one */
  questionnaireId?: number;
}

export function QuestionnaireEditorView({ questionnaireId }: P) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const {
    data: questionnaire,
    isLoading,
    isError,
  } = useQuestionnaireQuery(questionnaireId);
  const { data: library } = useQuestionnairesQuery({
    enabled: questionnaireId !== undefined,
  });
  const libraryPath = getPath(['dashboard', 'questionnaires']);

  const template = params.get('template');
  const initial = useMemo(
    () =>
      questionnaire
        ? toDraft(questionnaire)
        : templateQuestionnaire(
            isQuestionnaireTemplate(template) ? template : 'blank',
          ),
    [questionnaire, template],
  );
  // Answered once: changing a question's meaning will replace it
  const hasAnswers = Boolean(
    library?.find((item) => item.questionnaireId === questionnaireId)
      ?.answeredCount,
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-8">
      <PageTitle desktopOnly>
        {questionnaireId
          ? m.questionnaire_edit_title()
          : m.questionnaire_create()}
      </PageTitle>
      {questionnaireId !== undefined && isLoading && (
        <Skeleton className="h-96 w-full" />
      )}
      {questionnaireId !== undefined && isError && (
        <p className="text-sm text-muted-foreground">
          {m.questionnaire_not_found()}
        </p>
      )}
      {(questionnaireId === undefined || questionnaire) && (
        <QuestionnaireEditor
          // A new form for each questionnaire or template
          key={questionnaire?.questionnaireId ?? template ?? 'blank'}
          questionnaire={questionnaire}
          initial={initial}
          hasAnswers={hasAnswers}
          onSaved={() => navigate(libraryPath)}
          onCancel={() => navigate(libraryPath)}
        />
      )}
    </div>
  );
}
