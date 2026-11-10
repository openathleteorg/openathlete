import { CoachNotesPanel } from '@/components/coach-notes';
import { PageTitle } from '@/components/ui/page-title';
import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';

interface P {
  /** One athlete's notes; none: all of the coach's notes */
  athleteId?: number;
}

export function NotesView({ athleteId }: P) {
  const { athlete } = useAthleteInfo({ athleteId });

  const pageTitle =
    athleteId === undefined
      ? m.coach_notes()
      : m.coach_notes_of({
          firstName: athlete?.user?.firstName || '',
          lastName: athlete?.user?.lastName || '',
        });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-8">
      <PageTitle desktopOnly>{pageTitle}</PageTitle>
      {/* A new key per athlete: the search starts empty on each */}
      <CoachNotesPanel key={athleteId ?? 'all'} athleteId={athleteId} />
    </div>
  );
}
