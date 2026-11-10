import { m } from '@/paraglide/messages';
import { NotesView } from '@/views/dashboard';
import { useParams } from 'react-router-dom';

export function NotesPage() {
  return (
    <>
      <title>{m.coach_notes()}</title>
      <NotesView />
    </>
  );
}

export function AthleteNotesPage() {
  const { athleteId } = useParams<{ athleteId: string }>();

  return (
    <>
      <title>{m.coach_notes()}</title>
      <NotesView
        athleteId={athleteId ? Number.parseInt(athleteId, 10) : undefined}
      />
    </>
  );
}
