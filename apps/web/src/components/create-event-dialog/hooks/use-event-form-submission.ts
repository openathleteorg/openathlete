import {
  EventAPI,
  useCreateEventMutation,
  useUpdateEventMutation,
  useUpdateEventSeriesMutation,
} from '@/api/event';
import { useCreateEventTemplateMutation } from '@/api/event-template';
import { eventKeys } from '@/api/event/event.keys';
import { invalidateTrainingLoadQueries } from '@/api/training-load/training-load.keys';
import { m } from '@/paraglide/messages';
import { AnalyticsEvent } from '@/utils/analytics-events';
import { useQueryClient } from '@tanstack/react-query';
import { usePostHog } from 'posthog-js/react';
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

import type { SeriesScope } from '../../calendar/series-scope-dialog';
import { endOfLocalDateInput } from '../../calendar/utils/local-date';
import {
  type EventFormValues,
  withEquipmentId,
} from '../utils/event-form-schemas';

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
  /** Editing a repeated session: asks whether the following ones change too */
  chooseSeriesScope?: () => Promise<SeriesScope | null>,
) {
  const edit = 'event' in props;
  const create = 'type' in props && 'date' in props;
  const posthog = usePostHog();
  const queryClient = useQueryClient();

  const updateSeriesMutation = useUpdateEventSeriesMutation({
    onSuccess: (updated) => {
      toast.success(m.series_updated({ count: updated.length }));
      onClose();
    },
    onError: () => toast.error(m.failed_to_update_event()),
  });

  /**
   * Repeats a session just created. The dialog has closed by then, so this
   * talks to the API directly rather than through a component's mutation.
   */
  const repeatCreated = async (
    eventId: Event['eventId'],
    everyWeeks: number,
    until: string,
  ) => {
    try {
      const copies = await EventAPI.repeatEvent(eventId, {
        everyWeeks,
        until: endOfLocalDateInput(until),
      });
      toast.success(m.repeat_done({ count: copies.length }));
    } catch {
      toast.error(m.repeat_failed());
    }
    queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
    invalidateTrainingLoadQueries(queryClient);
  };

  /** Updates one occurrence, or it and the following ones, as chosen */
  const update = async (eventId: Event['eventId'], body: UpdateEventDto) => {
    const seriesEvent =
      'event' in props && props.event?.seriesId ? props.event : null;
    const scope =
      seriesEvent && chooseSeriesScope ? await chooseSeriesScope() : 'single';
    if (!scope) return;
    if (scope === 'following') {
      updateSeriesMutation.mutate({ eventId, body });
    } else {
      updateEventMutation.mutate({ eventId, body });
    }
  };

  const createEventTemplateMutation = useCreateEventTemplateMutation({
    onSuccess: () => {
      posthog?.capture(AnalyticsEvent.event_template_saved, {
        from: 'create_dialog',
      });
      toast.success(m.template_saved_successfully());
    },
    onError: () => {
      toast.error(m.failed_to_save_template());
    },
  });

  const createEventMutation = useCreateEventMutation({
    onSuccess: (_, variables) => {
      posthog?.capture('event_created', { event_type: variables.type });
      toast.success(m.event_created_successfully());
      onClose();
    },
    onError: () => {
      toast.error(m.failed_to_create_event());
    },
  });

  const updateEventMutation = useUpdateEventMutation({
    onSuccess: (_, variables) => {
      posthog?.capture('event_updated', { event_type: variables.body.type });
      toast.success(m.event_updated_successfully());
      onClose();
    },
    onError: () => {
      toast.error(m.failed_to_update_event());
    },
  });

  const onSubmit = useCallback(
    (handleSubmit: UseFormHandleSubmit<EventFormValues>) =>
      handleSubmit(
        async (data: EventFormValues) => {
          const {
            saveAsTemplate,
            startDate,
            endDate,
            repeatEveryWeeks,
            repeatUntil,
            ...formData
          } = data;
          const shouldSaveAsTemplate = saveAsTemplate === true;
          const everyWeeks = Number(repeatEveryWeeks ?? 0);
          const afterCreate = (createdEvent: Event) => {
            if (shouldSaveAsTemplate && createdEvent.eventId) {
              createEventTemplateMutation.mutate({
                eventId: createdEvent.eventId,
              });
            }
            if (everyWeeks > 0 && repeatUntil && createdEvent.eventId) {
              void repeatCreated(createdEvent.eventId, everyWeeks, repeatUntil);
            }
          };
          const eventData = withEquipmentId(formData);

          // Prepare event data, only include dates if they exist
          const baseEventData = {
            ...eventData,
            ...(startDate && { startDate }),
            ...(endDate && { endDate }),
          };

          // For training events, always include workout (even if empty)
          if (data.type === EVENT_TYPE.TRAINING) {
            const eventWithWorkout = {
              ...baseEventData,
              athleteId,
              workout: {
                steps: workoutSteps,
              },
            };

            if (create) {
              createEventMutation.mutate(eventWithWorkout as CreateEventDto, {
                onSuccess: afterCreate,
              });
            } else if (edit && 'event' in props && props.event) {
              await update(
                props.event.eventId,
                eventWithWorkout as UpdateEventDto,
              );
            }
          } else {
            // For non-training events, no workout
            if (create) {
              createEventMutation.mutate(
                {
                  ...(baseEventData as CreateEventDto),
                  athleteId,
                },
                { onSuccess: afterCreate },
              );
            } else if (edit && 'event' in props && props.event) {
              await update(
                props.event.eventId,
                baseEventData as UpdateEventDto,
              );
            }
          }
        },
        (_) => {
          // Form validation failed
        },
      ),
    // update and repeatCreated only use the props and mutations listed here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      workoutSteps,
      athleteId,
      create,
      edit,
      props,
      createEventMutation,
      updateEventMutation,
      createEventTemplateMutation,
      chooseSeriesScope,
    ],
  );

  return {
    onSubmit,
    isSubmitting:
      createEventMutation.isPending ||
      updateEventMutation.isPending ||
      updateSeriesMutation.isPending,
  };
}
