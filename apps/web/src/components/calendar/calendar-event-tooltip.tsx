import { SportIcon } from '@/components/sport-icon/sport-icon';
import { Separator } from '@/components/ui/separator';
import { WorkoutGraph } from '@/components/workout/workout-graph';
import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { Fragment } from 'react/jsx-runtime';

import {
  ActivityEvent,
  CompetitionEvent,
  EVENT_TYPE,
  Event,
  NoteEvent,
  QuestionnaireEvent,
  SPORT_TYPE,
  TrainingEvent,
  formatDuration,
  formatSpeed,
  formatSpeedUnit,
  getSportConfig,
} from '@openathlete/shared';

interface CalendarEventTooltipProps {
  event: Event;
}

function ActivityTooltipContent({ event }: { event: ActivityEvent }) {
  const units = useUnits();
  const sportConfig = getSportConfig(event.sport);
  const speedUnit = units.speedUnit(sportConfig.speedUnit);
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SportIcon sport={event.sport} className="w-4 h-4" />
          <span className="font-semibold text-sm">{event.name}</span>
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground">
            {event.description.split('\n').map((line, index) => (
              <Fragment key={index}>
                {line}
                <br />
              </Fragment>
            ))}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        {!!event.movingTime && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{m.duration()}</span>
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
              <span className="text-muted-foreground">{m.distance()}</span>
              <span className="font-medium">
                {units.formatSportDist(event.distance, sportConfig.speedUnit)}
              </span>
            </div>
          )}
        {!!event.elevationGain && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{m.elevation_gain()}</span>
            <span className="font-medium">
              {units.elevation(event.elevationGain)} {units.elevationLabel}
            </span>
          </div>
        )}
        {event.rpe !== null && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{m.rpe()}</span>
            <span className="font-medium">{event.rpe * 10}/10</span>
          </div>
        )}
        {!!event.averageSpeed && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{m.average_speed()}</span>
            <span className="font-medium">
              {formatSpeed(event.averageSpeed, speedUnit)}{' '}
              {formatSpeedUnit(speedUnit)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TrainingTooltipContent({ event }: { event: TrainingEvent }) {
  const units = useUnits();
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SportIcon sport={event.sport} className="w-4 h-4" />
          <span className="font-semibold text-sm">{event.name}</span>
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground">
            {event.description.split('\n').map((line, index) => (
              <Fragment key={index}>
                {line}
                <br />
              </Fragment>
            ))}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        {!!event.goalDuration && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{m.goal_duration()}</span>
            <span className="font-medium">
              {formatDuration(event.goalDuration)}
            </span>
          </div>
        )}
        {!!event.goalDistance && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{m.goal_distance()}</span>
            <span className="font-medium">
              {units.formatDist(event.goalDistance)} {units.distanceLabel}
            </span>
          </div>
        )}
        {!!event.goalElevationGain && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">
              {m.goal_elevation_gain()}
            </span>
            <span className="font-medium">
              {units.elevation(event.goalElevationGain)} {units.elevationLabel}
            </span>
          </div>
        )}
        {event.goalRpe !== null && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{m.goal_rpe()}</span>
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
  const units = useUnits();
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SportIcon sport={event.sport} className="w-4 h-4" />
          <span className="font-semibold text-sm">{event.name}</span>
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground">
            {event.description.split('\n').map((line, index) => (
              <Fragment key={index}>
                {line}
                <br />
              </Fragment>
            ))}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        {!!event.goalDuration && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{m.goal_duration()}</span>
            <span className="font-medium">
              {formatDuration(event.goalDuration)}
            </span>
          </div>
        )}
        {!!event.goalDistance && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{m.goal_distance()}</span>
            <span className="font-medium">
              {units.formatDist(event.goalDistance)} {units.distanceLabel}
            </span>
          </div>
        )}
        {!!event.goalElevationGain && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">
              {m.goal_elevation_gain()}
            </span>
            <span className="font-medium">
              {units.elevation(event.goalElevationGain)} {units.elevationLabel}
            </span>
          </div>
        )}
        {event.goalRpe !== null && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{m.goal_rpe()}</span>
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
          <p className="text-xs text-muted-foreground">
            {event.description.split('\n').map((line, index) => (
              <Fragment key={index}>
                {line}
                <br />
              </Fragment>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

function QuestionnaireTooltipContent({ event }: { event: QuestionnaireEvent }) {
  const status = event.answeredAt
    ? m.questionnaire_answered()
    : new Date(event.startDate) > new Date()
      ? m.questionnaire_upcoming()
      : m.questionnaire_unanswered();
  return (
    <div className="space-y-1">
      <div className="font-semibold text-sm">{event.name}</div>
      <p className="text-xs text-muted-foreground">{status}</p>
      {event.score !== null && (
        <p className="text-xs">
          {m.questionnaire_score_value({ score: event.score })}
        </p>
      )}
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
    case EVENT_TYPE.QUESTIONNAIRE:
      return <QuestionnaireTooltipContent event={event} />;
    default:
      return null;
  }
}
