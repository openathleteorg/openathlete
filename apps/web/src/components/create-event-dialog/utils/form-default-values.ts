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
      description: (props.event as any).description ?? '',
      startDate: props.event.startDate,
      endDate: props.event.endDate,
    } as EventFormValues;

    if (props.event.type === EVENT_TYPE.TRAINING) {
      return {
        ...base,
        sport: (props.event as any).sport,
        goalDistance: (props.event as any).goalDistance ?? null,
        goalDuration: (props.event as any).goalDuration ?? null,
        goalElevationGain: (props.event as any).goalElevationGain ?? null,
        goalRpe: (props.event as any).goalRpe ?? null,
      } as EventFormValues;
    }

    if (props.event.type === EVENT_TYPE.COMPETITION) {
      return {
        ...base,
        sport: (props.event as any).sport,
        goalDistance: (props.event as any).goalDistance ?? null,
        goalDuration: (props.event as any).goalDuration ?? null,
        goalElevationGain: (props.event as any).goalElevationGain ?? null,
        goalRpe: (props.event as any).goalRpe ?? null,
      } as EventFormValues;
    }

    if (props.event.type === EVENT_TYPE.ACTIVITY) {
      return {
        ...base,
        sport: (props.event as any).sport,
        rpe: (props.event as any).rpe ?? null,
      } as EventFormValues;
    }

    return base;
  }

  if (create && props.prefilledData) {
    const prefilled = props.prefilledData;
    const base = {
      type: prefilled.type,
      name: prefilled.name,
      description: (prefilled as any).description ?? '',
      startDate: prefilled.startDate,
      endDate: prefilled.endDate,
    } as EventFormValues;

    if (prefilled.type === EVENT_TYPE.TRAINING) {
      return {
        ...base,
        sport: (prefilled as any).sport,
        goalDistance: (prefilled as any).goalDistance ?? null,
        goalDuration: (prefilled as any).goalDuration ?? null,
        goalElevationGain: (prefilled as any).goalElevationGain ?? null,
        goalRpe: (prefilled as any).goalRpe ?? null,
      } as EventFormValues;
    }

    if (prefilled.type === EVENT_TYPE.COMPETITION) {
      return {
        ...base,
        sport: (prefilled as any).sport,
        goalDistance: (prefilled as any).goalDistance ?? null,
        goalDuration: (prefilled as any).goalDuration ?? null,
        goalElevationGain: (prefilled as any).goalElevationGain ?? null,
        goalRpe: (prefilled as any).goalRpe ?? null,
      } as EventFormValues;
    }

    if (prefilled.type === EVENT_TYPE.ACTIVITY) {
      return {
        ...base,
        sport: (prefilled as any).sport,
        rpe: (prefilled as any).rpe ?? null,
      } as EventFormValues;
    }

    return base;
  }

  if (create && startDate && endDate) {
    return {
      type: props.type!,
      name: '',
      description: '',
      startDate,
      endDate,
      sport: SPORT_TYPE.RUNNING,
    };
  }

  return undefined;
}
