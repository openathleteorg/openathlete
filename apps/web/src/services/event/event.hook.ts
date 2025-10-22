import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { Event } from '@openathlete/shared';

import { EventService } from './event.service';

export const useCreateEventMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventService.createEvent>>,
    Error,
    Parameters<typeof EventService.createEvent>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventService.createEvent,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({ queryKey: ['EventService.getMyEvents'] });
    },
  });
};

export const useUpdateEventMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventService.updateEvent>>,
    Error,
    Parameters<typeof EventService.updateEvent>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventService.updateEvent,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['EventService.getEvent', variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ['EventService.getMyEvents'],
      });
    },
    onMutate: (variables) => {
      const events = queryClient.getQueryData([
        'EventService.getMyEvents',
      ]) as Event[];
      if (!events) return;
      const updateIndex = events.findIndex(
        (e) => e.eventId === variables.eventId,
      );

      if (updateIndex === -1) return;

      (events[updateIndex] as any) = {
        ...events[updateIndex],
        ...variables.body,
      };
      queryClient.setQueryData(['EventService.getMyEvents'], events);
    },
  });
};

export const useGetMyEventsQuery = (
  isCoach?: boolean,
  athleteId?: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof EventService.getMyEvents>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => EventService.getMyEvents(isCoach, athleteId),
    queryKey: ['EventService.getMyEvents', isCoach, athleteId],
  });

export const useGetEventQuery = (
  eventId: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof EventService.getEvent>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => EventService.getEvent(eventId),
    queryKey: ['EventService.getEvent', eventId],
  });

export const useGetEventStreamQuery = (
  eventId: number,
  resolution: number,
  keys?: string[],
  opt?: QueryOptions<Awaited<ReturnType<typeof EventService.getEventStream>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => EventService.getEventStream(eventId, resolution, keys),
    queryKey: ['EventService.getEventStream', eventId, resolution, keys],
  });

export const useGetEventWeatherQuery = (
  eventId: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof EventService.getEventWeather>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => EventService.getEventWeather(eventId),
    queryKey: ['EventService.getEventWeather', eventId],
  });

export const useGetEventNormalizationQuery = (
  eventId: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof EventService.getEventNormalization>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () => EventService.getEventNormalization(eventId),
    queryKey: ['EventService.getEventNormalization', eventId],
  });

export const useDeleteEventMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventService.deleteEvent>>,
    Error,
    Parameters<typeof EventService.deleteEvent>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventService.deleteEvent,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({ queryKey: ['EventService.getMyEvents'] });
    },
  });
};

export const useSetRelatedActivityMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventService.setRelatedActivity>>,
    Error,
    Parameters<typeof EventService.setRelatedActivity>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventService.setRelatedActivity,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['EventService.getEvent', variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ['EventService.getMyEvents'],
      });
    },
  });
};

export const useUnsetRelatedActivityMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventService.unsetRelatedActivity>>,
    Error,
    Parameters<typeof EventService.unsetRelatedActivity>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventService.unsetRelatedActivity,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['EventService.getEvent', variables],
      });
      queryClient.invalidateQueries({
        queryKey: ['EventService.getMyEvents'],
      });
    },
  });
};

export const useGetMyIcalCalendarSecretQuery = (
  opt?: QueryOptions<
    Awaited<ReturnType<typeof EventService.getMyIcalCalendarSecret>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: EventService.getMyIcalCalendarSecret,
    queryKey: ['EventService.getMyIcalCalendarSecret'],
  });

export const useDuplicateEventMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventService.duplicateEvent>>,
    Error,
    Parameters<typeof EventService.duplicateEvent>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventService.duplicateEvent,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['EventService.getMyEvents'],
      });
    },
  });
};
