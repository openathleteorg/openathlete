import { useMemo } from 'react';
import { UseFormWatch } from 'react-hook-form';
import z from 'zod';

import type {
  CreateEventDto,
  CreateWorkoutStepDto,
  Event,
  activityEventSchema,
  competitionEventSchema,
  trainingEventSchema,
} from '@openathlete/shared';
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
  workoutSteps: CreateWorkoutStepDto[],
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
        sport:
          (formValues as z.infer<typeof trainingEventSchema>).sport ||
          SPORT_TYPE.RUNNING,
        goalDistance:
          (formValues as z.infer<typeof trainingEventSchema>).goalDistance ??
          null,
        goalDuration:
          (formValues as z.infer<typeof trainingEventSchema>).goalDuration ??
          null,
        goalElevationGain:
          (formValues as z.infer<typeof trainingEventSchema>)
            .goalElevationGain ?? null,
        goalRpe:
          (formValues as z.infer<typeof trainingEventSchema>).goalRpe ?? null,
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
        sport:
          (formValues as z.infer<typeof competitionEventSchema>).sport ||
          SPORT_TYPE.RUNNING,
        goalDistance:
          (formValues as z.infer<typeof competitionEventSchema>).goalDistance ??
          null,
        goalDuration:
          (formValues as z.infer<typeof competitionEventSchema>).goalDuration ??
          null,
        goalElevationGain:
          (formValues as z.infer<typeof competitionEventSchema>)
            .goalElevationGain ?? null,
        goalRpe:
          (formValues as z.infer<typeof competitionEventSchema>).goalRpe ??
          null,
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
        sport:
          (formValues as z.infer<typeof activityEventSchema>).sport ||
          SPORT_TYPE.RUNNING,
        rpe: (formValues as z.infer<typeof activityEventSchema>).rpe ?? null,
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
