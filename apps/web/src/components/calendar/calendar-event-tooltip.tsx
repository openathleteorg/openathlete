import { SportIcon } from '@/components/sport-icon/sport-icon';
import { Separator } from '@/components/ui/separator';
import { WorkoutGraph } from '@/components/workout/workout-graph';
import { m } from '@/paraglide/messages';

import {
  ActivityEvent,
  CompetitionEvent,
  EVENT_TYPE,
  Event,
  NoteEvent,
  SPORT_TYPE,
  TrainingEvent,
  formatDistance,
  formatDuration,
  formatSpeed,
  getSportConfig,
} from '@openathlete/shared';

interface CalendarEventTooltipProps {
  event: Event;
}

function ActivityTooltipContent({ event }: { event: ActivityEvent }) {
  const sportConfig = getSportConfig(event.sport);
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SportIcon sport={event.sport} className="w-4 h-4" />
          <span className="font-semibold text-sm">{event.name}</span>
        </div>
        {event.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {event.description}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        {!!event.movingTime && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {m.duration()}
            </span>
            <span className="font-medium">
              {formatDuration(event.movingTime)}
            </span>
          </div>
        )}
        {!!event.distance &&
          (event.sport === SPORT_TYPE.RUNNING ||
            event.sport === SPORT_TYPE.CYCLING ||
            event.sport === SPORT_TYPE.TRAIL_RUNNING ||
            event.sport === SPORT_TYPE.SWIMMING ||
            event.sport === SPORT_TYPE.HIKING) && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                {m.distance()}
              </span>
              <span className="font-medium">
                {formatDistance(event.distance, 'km')} km
              </span>
            </div>
          )}
        {!!event.elevationGain && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {m.elevation_gain()}
            </span>
            <span className="font-medium">
              {Math.round(event.elevationGain)} m
            </span>
          </div>
        )}
        {event.rpe !== null && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">{m.rpe()}</span>
            <span className="font-medium">{event.rpe * 10}/10</span>
          </div>
        )}
        {!!event.averageSpeed && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {m.average_speed()}
            </span>
            <span className="font-medium">
              {formatSpeed(event.averageSpeed, sportConfig.speedUnit)}{' '}
              {sportConfig.speedUnit}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TrainingTooltipContent({ event }: { event: TrainingEvent }) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SportIcon sport={event.sport} className="w-4 h-4" />
          <span className="font-semibold text-sm">{event.name}</span>
        </div>
        {event.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {event.description}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        {!!event.goalDuration && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {m.goal_duration()}
            </span>
            <span className="font-medium">
              {formatDuration(event.goalDuration)}
            </span>
          </div>
        )}
        {!!event.goalDistance && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {m.goal_distance()}
            </span>
            <span className="font-medium">
              {formatDistance(event.goalDistance, 'km')} km
            </span>
          </div>
        )}
        {!!event.goalElevationGain && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {m.goal_elevation_gain()}
            </span>
            <span className="font-medium">
              {Math.round(event.goalElevationGain)} m
            </span>
          </div>
        )}
        {event.goalRpe !== null && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {m.goal_rpe()}
            </span>
            <span className="font-medium">{event.goalRpe * 10}/10</span>
          </div>
        )}
      </div>

      {event.workout && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {m.workout()}
            </div>
            <WorkoutGraph
              workout={event.workout}
              sport={event.sport}
              maxHeight={60}
              athleteId={event.athleteId ?? undefined}
            />
          </div>
        </>
      )}
    </div>
  );
}

function CompetitionTooltipContent({ event }: { event: CompetitionEvent }) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SportIcon sport={event.sport} className="w-4 h-4" />
          <span className="font-semibold text-sm">{event.name}</span>
        </div>
        {event.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {event.description}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        {!!event.goalDuration && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {m.goal_duration()}
            </span>
            <span className="font-medium">
              {formatDuration(event.goalDuration)}
            </span>
          </div>
        )}
        {!!event.goalDistance && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {m.goal_distance()}
            </span>
            <span className="font-medium">
              {formatDistance(event.goalDistance, 'km')} km
            </span>
          </div>
        )}
        {!!event.goalElevationGain && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {m.goal_elevation_gain()}
            </span>
            <span className="font-medium">
              {Math.round(event.goalElevationGain)} m
            </span>
          </div>
        )}
        {event.goalRpe !== null && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              {m.goal_rpe()}
            </span>
            <span className="font-medium">{event.goalRpe * 10}/10</span>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteTooltipContent({ event }: { event: NoteEvent }) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="font-semibold text-sm">{event.name}</div>
        {event.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function CalendarEventTooltipContent({
  event,
}: CalendarEventTooltipProps) {
  switch (event.type) {
    case EVENT_TYPE.ACTIVITY:
      return <ActivityTooltipContent event={event} />;
    case EVENT_TYPE.TRAINING:
      return <TrainingTooltipContent event={event} />;
    case EVENT_TYPE.COMPETITION:
      return <CompetitionTooltipContent event={event} />;
    case EVENT_TYPE.NOTE:
      return <NoteTooltipContent event={event} />;
    default:
      return null;
  }
}
