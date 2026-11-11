import { CoachNotebookPanel, CoachNotesPanel } from '@/components/coach-notes';
import { PageTitle } from '@/components/ui/page-title';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';

interface P {
  /** One athlete's notes; none: the notebook and all of the coach's notes */
  athleteId?: number;
}

export function NotesView({ athleteId }: P) {
  const { athlete } = useAthleteInfo({ athleteId });

  if (athleteId !== undefined) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-8">
        <PageTitle desktopOnly>
          {m.coach_notes_of({
            firstName: athlete?.user?.firstName || '',
            lastName: athlete?.user?.lastName || '',
          })}
        </PageTitle>
        {/* A new key per athlete: the search starts empty on each */}
        <CoachNotesPanel key={athleteId} athleteId={athleteId} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-8">
      <PageTitle desktopOnly>{m.coach_notes()}</PageTitle>
      <Tabs defaultValue="notebook" className="gap-4">
        <TabsList>
          <TabsTrigger value="notebook">{m.coach_notebook()}</TabsTrigger>
          <TabsTrigger value="notes">{m.coach_notes_list()}</TabsTrigger>
        </TabsList>
        <TabsContent value="notebook">
          <CoachNotebookPanel />
        </TabsContent>
        <TabsContent value="notes">
          <CoachNotesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
