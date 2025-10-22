import { useGetEventQuery } from '@/api/event';

import { EVENT_TYPE, Event } from '@openathlete/shared';

import { ActivityDetails } from './activity-details';
import { NoteDetails } from './note-details';
import { TrainingCompetitionDetails } from './training-competition-details';

interface P {
  eventId: Event['eventId'];
}

export function EventDetails({ eventId }: P) {
  const { data: event } = useGetEventQuery(eventId);

  if (event?.type === EVENT_TYPE.ACTIVITY) {
    return <ActivityDetails event={event} />;
  }
  if (
    event?.type === EVENT_TYPE.TRAINING ||
    event?.type === EVENT_TYPE.COMPETITION
  ) {
    return <TrainingCompetitionDetails event={event} />;
  }
  if (event?.type === EVENT_TYPE.NOTE) {
    return <NoteDetails event={event} />;
  }
}
