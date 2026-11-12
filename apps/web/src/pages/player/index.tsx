import { useGetEventQuery } from '@/api/event';
import { LoadingScreen } from '@/components/loading-screen';
import { SessionPlayer } from '@/components/player/session-player';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { WorkoutStepDto } from '@openathlete/shared';
import { EVENT_TYPE, normalizeWorkoutForCreate } from '@openathlete/shared';

/** The full-screen player of one planned session */
export function PlayerPage() {
  const { eventId } = useParams();
  const id = Number(eventId);
  const navigate = useNavigate();
  const { data: event, isLoading, isError } = useGetEventQuery(id);

  const steps = useMemo(() => {
    if (event?.type !== EVENT_TYPE.TRAINING || !event.workout) return [];
    return normalizeWorkoutForCreate({
      steps: event.workout.steps as unknown as Partial<WorkoutStepDto>[],
    }).steps;
  }, [event]);

  const back = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(getPath(['dashboard', 'calendar']), { replace: true });
  };

  if (isLoading) return <LoadingScreen />;
  if (
    isError ||
    !event ||
    event.type !== EVENT_TYPE.TRAINING ||
    steps.length === 0
  ) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <title>{m.player_title()}</title>
        <p className="text-lg font-medium">{m.player_unavailable()}</p>
        <Button type="button" onClick={back}>
          {m.ui_close()}
        </Button>
      </div>
    );
  }
  return (
    <>
      <title>{`${event.name} · ${m.player_title()}`}</title>
      <SessionPlayer
        eventId={id}
        name={event.name}
        steps={steps}
        done={!!event.relatedActivity}
        onExit={back}
      />
    </>
  );
}
