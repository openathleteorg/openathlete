import {
  useSetRelatedActivityMutation,
  useUnsetRelatedActivityMutation,
} from '@/api/event';
import { m } from '@/paraglide/messages';

import {
  CompetitionEvent,
  EVENT_TYPE,
  TrainingEvent,
  formatDistance,
} from '@openathlete/shared';

import { useCalendarContext } from '../calendar/hooks/use-calendar-context';
import { DistanceStat, DurationStat, ElevationStat } from '../numeric-stats';
import { SelectEvent } from '../select-event';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { WorkoutSummary } from '../workout';

interface P {
  event: CompetitionEvent | TrainingEvent;
}

export function TrainingCompetitionDetails({ event }: P) {
  const setRelatedActivityMutation = useSetRelatedActivityMutation();
  const unsetRelatedActivityMutation = useUnsetRelatedActivityMutation();
  const { events, openEventDetails } = useCalendarContext();

  const isTraining = event.type === EVENT_TYPE.TRAINING;
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{m.details()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {event.goalDuration && (
                <DurationStat
                  label={m.goal_duration()}
                  duration={event.goalDuration}
                />
              )}
              {event.goalDistance && (
                <DistanceStat
                  label={m.goal_distance()}
                  distance={event.goalDistance}
                />
              )}
              {event.goalElevationGain && (
                <ElevationStat
                  label={m.goal_elevation_gain()}
                  elevation={event.goalElevationGain}
                />
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{m.related_activity()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <SelectEvent
                  data={events}
                  value={event.relatedActivity?.eventId}
                  onChange={(activityId) => {
                    setRelatedActivityMutation.mutate({
                      eventId: event.eventId,
                      activityId,
                    });
                  }}
                  className="flex-1 min-w-0"
                  filter={(e, events) => {
                    if (e.type !== EVENT_TYPE.ACTIVITY) return false;
                    const startFilter = new Date(event.startDate);
                    startFilter.setDate(startFilter.getDate() - 3);
                    const endFilter = new Date(event.endDate);
                    endFilter.setDate(endFilter.getDate() + 3);
                    const isInRelatedActivity = events.some(
                      (relatedEvent) =>
                        (relatedEvent.type === EVENT_TYPE.TRAINING ||
                          relatedEvent.type === EVENT_TYPE.COMPETITION) &&
                        relatedEvent.relatedActivity?.eventId === e.eventId,
                    );
                    return (
                      startFilter.getTime() < e.startDate.getTime() &&
                      endFilter.getTime() > e.endDate.getTime() &&
                      !isInRelatedActivity
                    );
                  }}
                  displayRow={(e) => (
                    <div>
                      {e.name}{' '}
                      {e.type === EVENT_TYPE.ACTIVITY
                        ? `(${formatDistance(e.distance)} km)`
                        : ''}
                    </div>
                  )}
                />
                {!!event.relatedActivity?.eventId && (
                  <Button
                    onClick={() => {
                      unsetRelatedActivityMutation.mutate(event.eventId);
                    }}
                    isLoading={
                      unsetRelatedActivityMutation.isPending ||
                      setRelatedActivityMutation.isPending
                    }
                  >
                    {m.remove()}
                  </Button>
                )}
              </div>
              {!!event.relatedActivity?.eventId && (
                <Button
                  onClick={() => {
                    openEventDetails(event.relatedActivity!.eventId);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  {m.view_activity()}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        {event.description && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>{m.description()}</CardTitle>
            </CardHeader>
            <CardContent>
              {event.description.split('\n').map((part) => (
                <>
                  {part}
                  <br />
                </>
              ))}
            </CardContent>
          </Card>
        )}
        {isTraining && event.workout && (
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>{m.workout()}</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkoutSummary workout={event.workout} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
