import { m } from '@/paraglide/messages';
import { CheckCircle2 } from 'lucide-react';

import {
  ActivityEvent,
  CompetitionEvent,
  EVENT_TYPE,
  Event,
  TrainingEvent,
} from '@openathlete/shared';

import { DistanceStat, DurationStat, ElevationStat } from '../numeric-stats';
import { useCalendarContext } from './hooks/use-calendar-context';

interface P {
  events: Event[];
}

export function DoneSummary({ events }: P) {
  const activities = events.filter(
    (event) => event.type === EVENT_TYPE.ACTIVITY,
  ) as ActivityEvent[];
  const totalDuration = activities.reduce((acc, event) => {
    const duration = event.movingTime;
    return acc + duration;
  }, 0);
  const totalDistance = activities.reduce((acc, event) => {
    return acc + (event.distance || 0);
  }, 0);
  const totalElevation = activities.reduce((acc, event) => {
    return acc + (event.elevationGain || 0);
  }, 0);
  const trainingCompetitions = events.filter(
    (event) =>
      event.type === EVENT_TYPE.TRAINING ||
      event.type === EVENT_TYPE.COMPETITION,
  ) as (TrainingEvent | CompetitionEvent)[];
  const doneTrainingCompetitions = trainingCompetitions.filter(
    (event) => event.relatedActivityId,
  );

  return (
    <div className="min-h-32 flex flex-col [&:not(:last-child)]:border-r-1 p-2 select-none">
      {!!trainingCompetitions.length && (
        <div className="flex gap-1 items-center">
          <span>
            {m.done_summary({
              done: doneTrainingCompetitions.length,
              total: trainingCompetitions.length,
            })}
          </span>
          {doneTrainingCompetitions.length === trainingCompetitions.length && (
            <CheckCircle2 size={14} />
          )}
        </div>
      )}
      <DurationStat duration={totalDuration} />
      <DistanceStat distance={totalDistance} />
      <ElevationStat elevation={totalElevation} />
    </div>
  );
}

export function PlannedSummary({ events }: P) {
  const trainings = events.filter(
    (event) =>
      event.type === EVENT_TYPE.TRAINING ||
      event.type === EVENT_TYPE.COMPETITION,
  ) as (TrainingEvent | CompetitionEvent)[];
  const totalDuration = trainings.reduce((acc, event) => {
    const duration = event.goalDuration || 0;
    return acc + duration;
  }, 0);
  const totalDistance = trainings.reduce((acc, event) => {
    return acc + (event.goalDistance || 0);
  }, 0);
  const totalElevation = trainings.reduce((acc, event) => {
    return acc + (event.goalElevationGain || 0);
  }, 0);

  return (
    <div className="min-h-32 flex flex-col [&:not(:last-child)]:border-r-1 p-2 select-none">
      <DurationStat duration={totalDuration} />
      <DistanceStat distance={totalDistance} />
      <ElevationStat elevation={totalElevation} />
    </div>
  );
}

export function PlannedDoneSummary({ events }: P) {
  const todoTrainings = events.filter(
    (event) =>
      (event.type === EVENT_TYPE.TRAINING ||
        event.type === EVENT_TYPE.COMPETITION) &&
      !event.relatedActivity,
  ) as (TrainingEvent | CompetitionEvent)[];
  const doneActivities = events.filter(
    (event) => event.type === EVENT_TYPE.ACTIVITY,
  ) as ActivityEvent[];

  const totalTrainingDuration = todoTrainings.reduce((acc, event) => {
    const duration = event.goalDuration || 0;
    return acc + duration;
  }, 0);
  const totalTrainingDistance = todoTrainings.reduce((acc, event) => {
    return acc + (event.goalDistance || 0);
  }, 0);
  const totalTrainingElevation = todoTrainings.reduce((acc, event) => {
    return acc + (event.goalElevationGain || 0);
  }, 0);

  const totalActivitiesDuration = doneActivities.reduce((acc, event) => {
    const duration = event.movingTime || 0;
    return acc + duration;
  }, 0);
  const totalActivitiesDistance = doneActivities.reduce((acc, event) => {
    return acc + (event.distance || 0);
  }, 0);
  const totalActivitiesElevation = doneActivities.reduce((acc, event) => {
    return acc + (event.elevationGain || 0);
  }, 0);

  return (
    <div className="min-h-32 flex flex-col [&:not(:last-child)]:border-r-1 p-2 select-none">
      <DurationStat
        duration={totalActivitiesDuration + totalTrainingDuration}
      />
      <DistanceStat
        distance={totalActivitiesDistance + totalTrainingDistance}
      />
      <ElevationStat
        elevation={totalActivitiesElevation + totalTrainingElevation}
      />
    </div>
  );
}

export function CalendarWeekSummary({ events }: P) {
  const { summaryType } = useCalendarContext();

  if (summaryType === 'done') {
    return <DoneSummary events={events} />;
  } else if (summaryType === 'planned') {
    return <PlannedSummary events={events} />;
  } else if (summaryType === 'planned-done') {
    return <PlannedDoneSummary events={events} />;
  }
}
