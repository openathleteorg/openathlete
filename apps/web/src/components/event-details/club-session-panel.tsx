import { useGetMyAthleteQuery } from '@/api/athlete';
import {
  useAnswerClubSessionMutation,
  useClubSessionForEventQuery,
} from '@/api/club';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Event } from '@openathlete/shared';

/**
 * A club session in an athlete's calendar: the club, the place, and the
 * athlete's answer, which they give from here.
 */
export function ClubSessionPanel({ event }: { event: Event }) {
  const { data: session } = useClubSessionForEventQuery(event.eventId);
  const { data: me } = useGetMyAthleteQuery();
  const answer = useAnswerClubSessionMutation(event.eventId);
  if (!session) return null;
  const isMine = me?.athleteId === event.athleteId;

  const reply = (going: boolean) =>
    answer.mutate(going, {
      onSuccess: () =>
        toast.success(
          going
            ? m.club_session_answer_going()
            : m.club_session_answer_not_going(),
        ),
      onError: () => toast.error(m.club_save_failed()),
    });

  return (
    <section
      className="space-y-3 rounded-xl border bg-muted/40 p-4"
      data-club-session-panel
    >
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Users className="size-4" />
          {m.club_session_by({ club: session.clubName })}
        </p>
        {session.location && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {session.location}
          </p>
        )}
        {session.notes && (
          <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
        )}
      </div>
      {isMine ? (
        <div className="flex flex-wrap gap-2" role="group">
          {[true, false].map((going) => (
            <Button
              key={String(going)}
              size="sm"
              variant={session.going === going ? 'default' : 'outline'}
              aria-pressed={session.going === going}
              disabled={answer.isPending}
              onClick={() => reply(going)}
              className={cn('max-sm:flex-1')}
            >
              {going ? m.club_session_going() : m.club_session_not_going()}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {session.going === null
            ? m.club_session_no_answer()
            : session.going
              ? m.club_session_answer_going()
              : m.club_session_answer_not_going()}
        </p>
      )}
    </section>
  );
}
