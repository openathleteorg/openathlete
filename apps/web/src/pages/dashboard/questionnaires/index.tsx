import { m } from '@/paraglide/messages';
import { AthleteQuestionnairesView } from '@/views/dashboard/questionnaires/athlete-questionnaires-view';
import { QuestionnaireAnswersView } from '@/views/dashboard/questionnaires/questionnaire-answers-view';
import { QuestionnaireEditorView } from '@/views/dashboard/questionnaires/questionnaire-editor-view';
import { QuestionnaireLibraryView } from '@/views/dashboard/questionnaires/questionnaire-library-view';
import { useParams } from 'react-router-dom';

const idParam = (value?: string) =>
  value && /^\d+$/.test(value) ? Number.parseInt(value, 10) : undefined;

export function QuestionnairesPage() {
  return (
    <>
      <title>{m.questionnaires()}</title>
      <QuestionnaireLibraryView />
    </>
  );
}

export function QuestionnaireCreatePage() {
  return (
    <>
      <title>{m.questionnaire_create()}</title>
      <QuestionnaireEditorView />
    </>
  );
}

export function QuestionnaireEditPage() {
  const { questionnaireId } = useParams<{ questionnaireId: string }>();
  return (
    <>
      <title>{m.questionnaire_edit_title()}</title>
      <QuestionnaireEditorView questionnaireId={idParam(questionnaireId)} />
    </>
  );
}

export function QuestionnaireAnswersPage() {
  const id = idParam(useParams<{ questionnaireId: string }>().questionnaireId);
  return (
    <>
      <title>{m.questionnaire_answers()}</title>
      {id !== undefined && <QuestionnaireAnswersView questionnaireId={id} />}
    </>
  );
}

export function AthleteQuestionnairesPage() {
  const id = idParam(useParams<{ athleteId: string }>().athleteId);
  return (
    <>
      <title>{m.questionnaires()}</title>
      {id !== undefined && (
        // A new key per athlete: the tabs and choices start over
        <AthleteQuestionnairesView key={id} athleteId={id} />
      )}
    </>
  );
}
