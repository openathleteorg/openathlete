import {
  useSetRelatedActivityMutation,
  useUnsetRelatedActivityMutation,
} from '@/api/event';
import { ZwiftWorkoutAction } from '@/components/zwift/zwift-workout-action';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { useMemo } from 'react';

import {
  CompetitionEvent,
  EVENT_TYPE,
  type Event,
  TrainingEvent,
  formatDistance,
} from '@openathlete/shared';

import { useCalendarContext } from '../calendar/hooks/use-calendar-context';
import {
  DistanceStat,
  DurationStat,
  ElevationStat,
  EstimatedLoadStat,
} from '../numeric-stats';
import { SelectEvent } from '../select-event';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { WorkoutGraph, WorkoutSummary } from '../workout';
import {
  activityLinkCandidates,
  isSameLocalDay,
} from './activity-link-candidates';

interface P {
  event: CompetitionEvent | TrainingEvent;
}

export function TrainingCompetitionDetails({ event }: P) {
  const setRelatedActivityMutation = useSetRelatedActivityMutation();
  const unsetRelatedActivityMutation = useUnsetRelatedActivityMutation();
  const { events, openEventDetails } = useCalendarContext();
  const { sameDay, nearby } = useMemo(
    () => activityLinkCandidates(event, events),
    [event, events],
  );
  const linking =
    unsetRelatedActivityMutation.isPending ||
    setRelatedActivityMutation.isPending;
  const link = (activityId: number) =>
    setRelatedActivityMutation.mutate({ eventId: event.eventId, activityId });
  // Time on the session's day, date and time otherwise; then the distance.
  const activityRow = (activity: Event) => {
    const start = new Date(activity.startDate);
    const locale = getDateLocale(getLocale());
    const when = isSameLocalDay(start, new Date(event.startDate))
      ? start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      : start.toLocaleString(locale, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
    const distance =
      activity.type === EVENT_TYPE.ACTIVITY && activity.distance > 0
        ? ` · ${formatDistance(activity.distance)} km`
        : '';
    return `${activity.name} · ${when}${distance}`;
  };

  const isTraining = event.type === EVENT_TYPE.TRAINING;
  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
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
                {isTraining &&
                  (event as TrainingEvent).estimatedLoad !== null &&
                  (event as TrainingEvent).estimatedLoad !== undefined && (
                    <EstimatedLoadStat
                      label={m.estimated_training_load()}
                      estimatedLoad={(event as TrainingEvent).estimatedLoad}
                    />
                  )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{m.related_activity()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {/* Not linked yet: the same day's activities, one click away. */}
                {!event.relatedActivity?.eventId && sameDay.length > 0 && (
                  <div className="space-y-2" data-link-suggestions>
                    <p className="text-sm text-muted-foreground">
                      {m.related_activity_suggestions()}
                    </p>
                    {sameDay.slice(0, 3).map((activity) => (
                      <Button
                        key={activity.eventId}
                        variant="secondary"
                        className="h-auto min-h-10 w-full justify-between gap-3 whitespace-normal text-left"
                        disabled={linking}
                        onClick={() => link(activity.eventId)}
                      >
                        <span className="min-w-0 break-words">
                          {activityRow(activity)}
                        </span>
                        <span className="shrink-0 text-xs font-medium">
                          {m.related_activity_link()}
                        </span>
                      </Button>
                    ))}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <SelectEvent
                    data={events}
                    value={event.relatedActivity?.eventId}
                    onChange={link}
                    className="flex-1 min-w-0"
                    groups={[
                      {
                        heading: m.related_activity_same_day(),
                        events: sameDay,
                      },
                      { heading: m.related_activity_nearby(), events: nearby },
                    ].filter((group) => group.events.length > 0)}
                    displayRow={(e) => (
                      <div className="min-w-0 truncate">{activityRow(e)}</div>
                    )}
                  />
                  {!!event.relatedActivity?.eventId && (
                    <Button
                      onClick={() => {
                        unsetRelatedActivityMutation.mutate(event.eventId);
                      }}
                      isLoading={linking}
                      className="w-full sm:w-auto flex-shrink-0"
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
        </div>
        {event.description && (
          <Card>
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
        {isTraining && event.workout && event.workout.steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{m.workout()}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ZwiftWorkoutAction event={event} />
              <WorkoutGraph
                workout={event.workout}
                sport={(event as TrainingEvent).sport}
                maxHeight={80}
                athleteId={event.athleteId ?? undefined}
              />
              <WorkoutSummary workout={event.workout} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
