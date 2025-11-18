import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { Event } from '@openathlete/shared';

import { trainingLoadKeys } from '../training-load/training-load.keys';
import { EventAPI } from './event.api';
import { eventKeys } from './event.keys';

export const useCreateEventMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.createEvent>>,
    Error,
    Parameters<typeof EventAPI.createEvent>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventAPI.createEvent,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
    },
  });
};

export const useUpdateEventMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.updateEvent>>,
    Error,
    Parameters<typeof EventAPI.updateEvent>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventAPI.updateEvent,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      // Invalidate event queries - this will also invalidate workouts since they're part of events
      // Using resetQueries to completely expire the cache and force a fresh fetch
      queryClient.resetQueries({
        queryKey: [eventKeys.getEvent, variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getMyEvents],
      });
      // Invalidate training load queries when RPE is updated (affects Foster RPE calculation)
      queryClient.invalidateQueries({
        queryKey: [trainingLoadKeys.root],
      });
      // Also invalidate the specific activity training loads query
      queryClient.invalidateQueries({
        queryKey: [
          trainingLoadKeys.getActivityTrainingLoads,
          variables.eventId,
        ],
      });
    },
    onMutate: (variables) => {
      const events = queryClient.getQueryData([
        eventKeys.getMyEvents,
      ]) as Event[];
      if (!events) return;
      const updateIndex = events.findIndex(
        (e) => e.eventId === variables.eventId,
      );

      if (updateIndex === -1) return;

      events[updateIndex] = {
        ...events[updateIndex],
        ...variables.body,
      } as Event;
      queryClient.setQueryData([eventKeys.getMyEvents], events);
    },
  });
};

export const useGetMyEventsQuery = (
  isCoach?: boolean,
  athleteId?: number,
  startDate?: Date,
  endDate?: Date,
  opt?: QueryOptions<Awaited<ReturnType<typeof EventAPI.getMyEvents>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => EventAPI.getMyEvents(isCoach, athleteId, startDate, endDate),
    queryKey: [eventKeys.getMyEvents, isCoach, athleteId, startDate, endDate],
  });

export const useGetEventQuery = (
  eventId: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof EventAPI.getEvent>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => EventAPI.getEvent(eventId),
    queryKey: [eventKeys.getEvent, eventId],
  });

export const useGetEventStreamQuery = (
  eventId: number,
  resolution: number,
  keys?: string[],
  opt?: QueryOptions<Awaited<ReturnType<typeof EventAPI.getEventStream>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => EventAPI.getEventStream(eventId, resolution, keys),
    queryKey: [eventKeys.getEventStream, eventId, resolution, keys],
  });

export const useGetEventWeatherQuery = (
  eventId: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof EventAPI.getEventWeather>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => EventAPI.getEventWeather(eventId),
    queryKey: [eventKeys.getEventWeather, eventId],
  });

export const useGetEventNormalizationQuery = (
  eventId: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof EventAPI.getEventNormalization>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () => EventAPI.getEventNormalization(eventId),
    queryKey: [eventKeys.getEventNormalization, eventId],
  });

export const useDeleteEventMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.deleteEvent>>,
    Error,
    Parameters<typeof EventAPI.deleteEvent>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventAPI.deleteEvent,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
    },
  });
};

export const useSetRelatedActivityMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.setRelatedActivity>>,
    Error,
    Parameters<typeof EventAPI.setRelatedActivity>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventAPI.setRelatedActivity,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getEvent, variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getMyEvents],
      });
    },
  });
};

export const useUnsetRelatedActivityMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.unsetRelatedActivity>>,
    Error,
    Parameters<typeof EventAPI.unsetRelatedActivity>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventAPI.unsetRelatedActivity,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getEvent, variables],
      });
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getMyEvents],
      });
    },
  });
};

export const useGetMyIcalCalendarSecretQuery = (
  opt?: QueryOptions<
    Awaited<ReturnType<typeof EventAPI.getMyIcalCalendarSecret>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: EventAPI.getMyIcalCalendarSecret,
    queryKey: [eventKeys.getMyIcalCalendarSecret],
  });

export const useDuplicateEventMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.duplicateEvent>>,
    Error,
    Parameters<typeof EventAPI.duplicateEvent>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventAPI.duplicateEvent,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getMyEvents],
      });
    },
  });
};
