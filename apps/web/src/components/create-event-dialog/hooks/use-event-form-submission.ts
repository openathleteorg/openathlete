import { useCreateEventMutation, useUpdateEventMutation } from '@/api/event';
import { m } from '@/paraglide/messages';
import { useCallback } from 'react';
import { UseFormHandleSubmit } from 'react-hook-form';
import { toast } from 'sonner';

import type {
  CreateEventDto,
  CreateWorkoutStepDto,
  Event,
  UpdateEventDto,
} from '@openathlete/shared';
import { EVENT_TYPE } from '@openathlete/shared';

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

export function useEventFormSubmission(
  props: Props,
  athleteId: number,
  workoutSteps: CreateWorkoutStepDto[],
  onClose: () => void,
) {
  const edit = 'event' in props;
  const create = 'type' in props && 'date' in props;

  const createEventMutation = useCreateEventMutation({
    onSuccess: () => {
      toast.success(m.event_created_successfully());
      onClose();
    },
    onError: () => {
      toast.error(m.failed_to_create_event());
    },
  });

  const updateEventMutation = useUpdateEventMutation({
    onSuccess: () => {
      toast.success(m.event_updated_successfully());
      onClose();
    },
    onError: () => {
      toast.error(m.failed_to_update_event());
    },
  });

  const onSubmit = useCallback(
    (handleSubmit: UseFormHandleSubmit<EventFormValues>) =>
      handleSubmit(async (data: EventFormValues) => {
        if (data.type === EVENT_TYPE.TRAINING && workoutSteps.length > 0) {
          const eventWithWorkout = {
            ...data,
            athleteId,
            workout: {
              steps: workoutSteps,
            },
          };

          if (create) {
            createEventMutation.mutate(eventWithWorkout as CreateEventDto);
          } else if (edit && 'event' in props && props.event) {
            updateEventMutation.mutate({
              eventId: props.event.eventId,
              body: eventWithWorkout as UpdateEventDto,
            });
          }
        } else {
          if (create) {
            createEventMutation.mutate({
              ...(data as CreateEventDto),
              athleteId,
            });
          } else if (edit && 'event' in props && props.event) {
            updateEventMutation.mutate({
              eventId: props.event.eventId,
              body: data as UpdateEventDto,
            });
          }
        }
      }),
    [
      workoutSteps,
      athleteId,
      create,
      edit,
      props,
      createEventMutation,
      updateEventMutation,
    ],
  );

  return {
    onSubmit,
    isSubmitting:
      createEventMutation.isPending || updateEventMutation.isPending,
  };
}
