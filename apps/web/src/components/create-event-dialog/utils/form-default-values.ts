import { EVENT_TYPE, Event, SPORT_TYPE } from '@openathlete/shared';
import type { CreateEventDto } from '@openathlete/shared';

import type { EventFormValues } from './event-form-schemas';

type CreateProps = {
  date?: Date;
  type?: EVENT_TYPE;
  prefilledData?: CreateEventDto;
};

type EditProps = {
  event?: Event;
};

type Props = CreateProps | EditProps;

export function getFormDefaultValues(
  props: Props,
  startDate?: Date,
  endDate?: Date,
): EventFormValues | undefined {
  const edit = 'event' in props;
  const create = 'type' in props && 'date' in props;

  if (edit && props.event) {
    const base = {
      type: props.event.type,
      name: props.event.name,
      description: props.event.description ?? '',
      startDate: props.event.startDate,
      endDate: props.event.endDate,
    } as EventFormValues;

    if (props.event.type === EVENT_TYPE.TRAINING) {
      return {
        ...base,
        sport: props.event.sport,
        goalDistance: props.event.goalDistance ?? null,
        goalDuration: props.event.goalDuration ?? null,
        goalElevationGain: props.event.goalElevationGain ?? null,
        goalRpe: props.event.goalRpe ?? null,
      } as EventFormValues;
    }

    if (props.event.type === EVENT_TYPE.COMPETITION) {
      return {
        ...base,
        sport: props.event.sport,
        goalDistance: props.event.goalDistance ?? null,
        goalDuration: props.event.goalDuration ?? null,
        goalElevationGain: props.event.goalElevationGain ?? null,
        goalRpe: props.event.goalRpe ?? null,
      } as EventFormValues;
    }

    if (props.event.type === EVENT_TYPE.ACTIVITY) {
      return {
        ...base,
        sport: props.event.sport,
        rpe: props.event.rpe ?? null,
      } as EventFormValues;
    }

    return base;
  }

  if (create && props.prefilledData) {
    const prefilled = props.prefilledData;
    const base = {
      type: prefilled.type,
      name: prefilled.name,
      description: prefilled.description ?? '',
      startDate: prefilled.startDate,
      endDate: prefilled.endDate,
    } as EventFormValues;

    if (prefilled.type === EVENT_TYPE.TRAINING) {
      return {
        ...base,
        sport: prefilled.sport,
        goalDistance: prefilled.goalDistance ?? null,
        goalDuration: prefilled.goalDuration ?? null,
        goalElevationGain: prefilled.goalElevationGain ?? null,
        goalRpe: prefilled.goalRpe ?? null,
      } as EventFormValues;
    }

    if (prefilled.type === EVENT_TYPE.COMPETITION) {
      return {
        ...base,
        sport: prefilled.sport,
        goalDistance: prefilled.goalDistance ?? null,
        goalDuration: prefilled.goalDuration ?? null,
        goalElevationGain: prefilled.goalElevationGain ?? null,
        goalRpe: prefilled.goalRpe ?? null,
      } as EventFormValues;
    }

    if (prefilled.type === EVENT_TYPE.ACTIVITY) {
      return {
        ...base,
        sport: prefilled.sport,
        rpe: prefilled.rpe ?? null,
      } as EventFormValues;
    }

    return base;
  }

  if (create && startDate) {
    // Calculate endDate from startDate + 1 hour if not provided
    const calculatedEndDate =
      endDate ||
      (() => {
        const end = new Date(startDate);
        end.setSeconds(end.getSeconds() + 3600); // Add 1 hour (3600 seconds)
        return end;
      })();
    return {
      type: props.type!,
      name: '',
      description: '',
      startDate,
      endDate: calculatedEndDate,
      sport: SPORT_TYPE.RUNNING,
      saveAsTemplate: false,
    };
  }

  return undefined;
}
