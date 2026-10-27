import { EventAPI } from '@/api/event/event.api';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { localDayBounds, todaysZwiftWorkouts } from '@/utils/zwift-workout';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useZwiftUpload } from './use-zwift-upload';

export function ZwiftSync() {
  const {
    available,
    scope,
    query,
    busy,
    messages,
    send,
    athleteReady,
    athleteQuery,
  } = useZwiftUpload();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!available) return;
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [available]);
  const { start, end } = localDayBounds(now);
  const events = useQuery({
    queryKey: ['zwiftToday', scope, start.toISOString()],
    queryFn: () => EventAPI.getMyEvents(false, undefined, start, end),
    enabled: available && Boolean(query.data?.connected),
  });
  if (!available) return null;
  const workouts = todaysZwiftWorkouts(events.data ?? [], now);
  return (
    <section
      className="mt-4 space-y-3 rounded-xl border bg-card p-4 shadow-sm md:p-6"
      aria-label={m.zwift_today()}
    >
      <h2 className="font-semibold">{m.zwift_today()}</h2>
      {!query.data?.connected ? (
        <Link
          className="inline-flex min-h-11 items-center underline"
          to="/dashboard/settings?tab=connectors"
        >
          {m.zwift_setup()}
        </Link>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{m.zwift_supported()}</p>
          {events.isPending && <p>{m.zwift_busy()}</p>}
          {(events.error || athleteQuery.error) && (
            <div role="alert">
              <p>{m.zwift_failed()}</p>
              <Button
                variant="outline"
                onClick={() => {
                  void events.refetch();
                  void athleteQuery.refetch();
                }}
              >
                {m.zwift_retry()}
              </Button>
            </div>
          )}
          {!events.isPending && !events.error && !workouts.length && (
            <p>{m.zwift_no_workouts()}</p>
          )}
          {workouts.map((event) => (
            <div
              key={event.eventId}
              className="ph-no-capture ph-mask flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
              data-cs-mask="true"
            >
              <span className="min-w-0 break-words">{event.name}</span>
              <Button
                className="min-h-11"
                disabled={busy !== null || !athleteReady}
                onClick={() => void send(event.eventId, true)}
              >
                {busy === event.eventId ? m.zwift_busy() : m.zwift_send()}
              </Button>
              {messages[event.eventId] && (
                <p className="w-full text-sm" role="status">
                  {messages[event.eventId]}
                </p>
              )}
            </div>
          ))}
        </>
      )}
      {query.error && <p role="alert">{m.zwift_failed()}</p>}
    </section>
  );
}
