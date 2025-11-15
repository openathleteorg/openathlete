import { useMemo } from 'react';
import { UseFormWatch } from 'react-hook-form';

import type { CreateEventDto, Event } from '@openathlete/shared';
import { EVENT_TYPE, SPORT_TYPE } from '@openathlete/shared';

import type { EventFormValues } from '../utils/event-form-schemas';

type CreateProps = {
  date?: Date;
  type?: EVENT_TYPE;
  prefilledData?: CreateEventDto;
};

type EditProps = {
  event?: Event;
};

type Props = CreateProps | EditProps;

export function useCurrentEventData(
  props: Props,
  watch: UseFormWatch<EventFormValues>,
  workoutSteps: any[],
  athleteId: number,
) {
  const currentEventData = useMemo(() => {
    const formValues = watch();
    const eventType =
      formValues.type || ('type' in props ? props.type : EVENT_TYPE.TRAINING);

    if (eventType === EVENT_TYPE.TRAINING) {
      return {
        type: EVENT_TYPE.TRAINING,
        name: formValues.name || '',
        description: formValues.description || '',
        startDate: formValues.startDate || new Date(),
        endDate: formValues.endDate || new Date(),
        athleteId,
        sport: (formValues as any).sport || SPORT_TYPE.RUNNING,
        goalDistance: (formValues as any).goalDistance ?? null,
        goalDuration: (formValues as any).goalDuration ?? null,
        goalElevationGain: (formValues as any).goalElevationGain ?? null,
        goalRpe: (formValues as any).goalRpe ?? null,
        ...(workoutSteps.length > 0
          ? { workout: { steps: workoutSteps } }
          : {}),
      } as CreateEventDto;
    }

    if (eventType === EVENT_TYPE.COMPETITION) {
      return {
        type: EVENT_TYPE.COMPETITION,
        name: formValues.name || '',
        description: formValues.description || '',
        startDate: formValues.startDate || new Date(),
        endDate: formValues.endDate || new Date(),
        athleteId,
        sport: (formValues as any).sport || SPORT_TYPE.RUNNING,
        goalDistance: (formValues as any).goalDistance ?? null,
        goalDuration: (formValues as any).goalDuration ?? null,
        goalElevationGain: (formValues as any).goalElevationGain ?? null,
        goalRpe: (formValues as any).goalRpe ?? null,
      } as CreateEventDto;
    }

    if (eventType === EVENT_TYPE.ACTIVITY) {
      return {
        type: EVENT_TYPE.ACTIVITY,
        name: formValues.name || '',
        description: formValues.description || '',
        startDate: formValues.startDate || new Date(),
        endDate: formValues.endDate || new Date(),
        athleteId,
        sport: (formValues as any).sport || SPORT_TYPE.RUNNING,
        rpe: (formValues as any).rpe ?? null,
      } as CreateEventDto;
    }

    return {
      type: EVENT_TYPE.NOTE,
      name: formValues.name || '',
      description: formValues.description || '',
      startDate: formValues.startDate || new Date(),
      endDate: formValues.endDate || new Date(),
      athleteId,
    } as CreateEventDto;
  }, [props, watch, workoutSteps, athleteId]);

  return {
    currentEventData,
  };
}
