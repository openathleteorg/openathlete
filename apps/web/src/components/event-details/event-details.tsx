import { useGetEventQuery } from '@/api/event';

import { EVENT_TYPE, Event } from '@openathlete/shared';

import { ActivityDetails } from './activity-details';
import { clubSessionIdOf } from './club-session-id';
import { ClubSessionPanel } from './club-session-panel';
import { EventComments } from './event-comments';
import { NoteDetails } from './note-details';
import { TrainingCompetitionDetails } from './training-competition-details';

interface P {
  eventId: Event['eventId'];
}

export function EventDetails({ eventId }: P) {
  const { data: event } = useGetEventQuery(eventId);

  if (event?.type === EVENT_TYPE.ACTIVITY) {
    return (
      <>
        <ActivityDetails event={event} />
        <EventComments eventId={event.eventId} />
      </>
    );
  }
  const clubSession = event && clubSessionIdOf(event) && (
    <ClubSessionPanel event={event} />
  );
  if (event?.type === EVENT_TYPE.TRAINING) {
    return (
      <>
        {clubSession}
        <TrainingCompetitionDetails event={event} />
        <EventComments eventId={event.eventId} />
      </>
    );
  }
  if (event?.type === EVENT_TYPE.COMPETITION) {
    return <TrainingCompetitionDetails event={event} />;
  }
  if (event?.type === EVENT_TYPE.NOTE) {
    return (
      <>
        {clubSession}
        <NoteDetails event={event} />
      </>
    );
  }
}
