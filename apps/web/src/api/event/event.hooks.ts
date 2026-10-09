import {
  MutationOptions,
  QueryClient,
  QueryKey,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { Event, ShiftEventsDto } from '@openathlete/shared';

import {
  invalidateTrainingLoadQueries,
  trainingLoadKeys,
} from '../training-load/training-load.keys';
import { EventAPI } from './event.api';
import { eventKeys } from './event.keys';
import {
  linkActivityInEvents,
  shiftEventsInCache,
  unlinkActivityInEvents,
} from './events.cache';

type CreateEventContext = {
  previousQueries: Map<unknown[], unknown>;
  tempId: number;
};

export const useCreateEventMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.createEvent>>,
    Error,
    Parameters<typeof EventAPI.createEvent>[0],
    CreateEventContext
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof EventAPI.createEvent>>,
    Error,
    Parameters<typeof EventAPI.createEvent>[0],
    CreateEventContext
  >({
    ...opt,
    mutationFn: EventAPI.createEvent,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: [eventKeys.getMyEvents],
      });

      // Snapshot all previous query states for rollback
      const previousQueries = new Map();
      queryClient
        .getQueriesData({ queryKey: [eventKeys.getMyEvents] })
        .forEach(([queryKey, data]) => {
          previousQueries.set(queryKey, data);
        });

      // Generate a temporary negative ID
      const tempId = -(Math.abs(Date.now()) % 1000000);

      // Create optimistic event from the input data
      const optimisticEvent: Event = {
        eventId: tempId,
        ...variables,
        startDate: new Date(variables.startDate),
        endDate: new Date(variables.endDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Event;

      // Optimistically add the event to all getMyEvents queries
      queryClient.setQueriesData<Event[]>(
        { queryKey: [eventKeys.getMyEvents] },
        (old) => {
          if (!old) return [optimisticEvent];
          return [...old, optimisticEvent];
        },
      );

      return { previousQueries, tempId };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error - restore all previous query states
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data, variables, context, _unused) => {
      // context (3rd param) is what onMutate returns
      const ctx = context as CreateEventContext | undefined;

      // First, update the cache with the real event
      queryClient.setQueriesData<Event[]>(
        { queryKey: [eventKeys.getMyEvents] },
        (old) => {
          if (!old) return [data];
          // Remove the temporary event if it exists, then add the real one
          const filtered = ctx?.tempId
            ? old.filter((e) => e.eventId !== ctx.tempId)
            : old;
          // Check if real event already exists
          const existingIndex = filtered.findIndex(
            (e) => e.eventId === data.eventId,
          );
          if (existingIndex !== -1) {
            const updated = [...filtered];
            updated[existingIndex] = data;
            return updated;
          }
          return [...filtered, data];
        },
      );

      // Also set the individual event query
      queryClient.setQueryData<Event>([eventKeys.getEvent, data.eventId], data);

      opt?.onSuccess?.(data, variables, context, _unused);

      // Don't invalidate immediately - the cache already has the real data
      // from setQueriesData. The invalidation would trigger a refetch that could
      // return stale data if the server hasn't fully committed yet.
      invalidateTrainingLoadQueries(queryClient);
      // Let the natural staleTime (5 min) handle eventual sync.
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
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update (non-blocking)
      queryClient.cancelQueries({
        queryKey: [eventKeys.getMyEvents],
      });
      queryClient.cancelQueries({
        queryKey: [eventKeys.getEvent, variables.eventId],
      });

      // Snapshot all previous query states for rollback
      const previousQueries = new Map();
      queryClient
        .getQueriesData({ queryKey: [eventKeys.getMyEvents] })
        .forEach(([queryKey, data]) => {
          previousQueries.set(queryKey, data);
        });

      const previousEvent = queryClient.getQueryData<Event>([
        eventKeys.getEvent,
        variables.eventId,
      ]);

      // Optimistically update all getMyEvents queries (they can have different params)
      // This happens synchronously for instant UI feedback
      queryClient.setQueriesData<Event[]>(
        { queryKey: [eventKeys.getMyEvents] },
        (old) => {
          if (!old) return old;
          const updateIndex = old.findIndex(
            (e) => e.eventId === variables.eventId,
          );

          if (updateIndex === -1) return old;

          const updatedEvents = [...old];
          updatedEvents[updateIndex] = {
            ...updatedEvents[updateIndex],
            ...variables.body,
            // Ensure dates are properly converted
            startDate: variables.body.startDate
              ? new Date(variables.body.startDate)
              : updatedEvents[updateIndex].startDate,
            endDate: variables.body.endDate
              ? new Date(variables.body.endDate)
              : updatedEvents[updateIndex].endDate,
          } as Event;
          return updatedEvents;
        },
      );

      // Optimistically update the single event query if it exists
      if (previousEvent) {
        queryClient.setQueryData<Event>(
          [eventKeys.getEvent, variables.eventId],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              ...variables.body,
              startDate: variables.body.startDate
                ? new Date(variables.body.startDate)
                : old.startDate,
              endDate: variables.body.endDate
                ? new Date(variables.body.endDate)
                : old.endDate,
            } as Event;
          },
        );
      }

      // Return context with previous values for rollback
      return { previousQueries, previousEvent };
    },
    onError: (_error, variables, context) => {
      // Rollback on error - restore all previous query states
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousEvent) {
        queryClient.setQueryData(
          [eventKeys.getEvent, variables.eventId],
          context.previousEvent,
        );
      }
      // User's onError will be called via the spread ...opt
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      opt?.onSuccess?.(data, variables, onMutateResult, context);
      // Invalidate event queries - this will also invalidate workouts since they're part of events
      // Using resetQueries to completely expire the cache and force a fresh fetch
      queryClient.resetQueries({
        queryKey: [eventKeys.getEvent, variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getMyEvents],
      });
      // Invalidate training load queries when RPE is updated (affects Foster RPE calculation)
      invalidateTrainingLoadQueries(queryClient);
      // Also invalidate the specific activity training loads query
      queryClient.invalidateQueries({
        queryKey: [
          trainingLoadKeys.getActivityTrainingLoads,
          variables.eventId,
        ],
      });
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

export const useGetUpcomingCompetitionsQuery = (
  isCoach?: boolean,
  athleteId?: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof EventAPI.getUpcomingCompetitions>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () => EventAPI.getUpcomingCompetitions(isCoach, athleteId),
    queryKey: [eventKeys.getUpcomingCompetitions, isCoach, athleteId],
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
  enabled?: boolean,
) =>
  useQuery({
    queryFn: () => EventAPI.getEventStream(eventId, resolution, keys),
    queryKey: [eventKeys.getEventStream, eventId, resolution, keys],
    enabled,
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
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      queryClient.cancelQueries({
        queryKey: [eventKeys.getMyEvents],
      });
      queryClient.cancelQueries({
        queryKey: [eventKeys.getEvent, variables],
      });

      // Snapshot all previous query states for rollback
      const previousQueries = new Map();
      queryClient
        .getQueriesData({ queryKey: [eventKeys.getMyEvents] })
        .forEach(([queryKey, data]) => {
          previousQueries.set(queryKey, data);
        });

      const previousEvent = queryClient.getQueryData<Event>([
        eventKeys.getEvent,
        variables,
      ]);

      // Optimistically remove the event from all getMyEvents queries
      queryClient.setQueriesData<Event[]>(
        { queryKey: [eventKeys.getMyEvents] },
        (old) => {
          if (!old) return old;
          return old.filter((e) => e.eventId !== variables);
        },
      );

      // Optimistically remove the single event query if it exists
      if (previousEvent) {
        queryClient.removeQueries({
          queryKey: [eventKeys.getEvent, variables],
        });
      }

      // Return context with previous values for rollback
      return { previousQueries, previousEvent };
    },
    onError: (_error, variables, context) => {
      // Rollback on error - restore all previous query states
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousEvent) {
        queryClient.setQueryData(
          [eventKeys.getEvent, variables],
          context.previousEvent,
        );
      }
      // User's onError will be called via the spread ...opt
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      // Invalidate to ensure we have the correct server data
      queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
      invalidateTrainingLoadQueries(queryClient);
    },
  });
};

type EventsSnapshot = { previousEvents: [QueryKey, Event[] | undefined][] };

/**
 * Applies a change to every cached list of events at once, and returns them
 * as they were, to roll back if the request fails.
 */
async function updateCachedEvents(
  queryClient: QueryClient,
  update: (events: Event[]) => Event[],
): Promise<EventsSnapshot> {
  await queryClient.cancelQueries({ queryKey: [eventKeys.getMyEvents] });
  const previousEvents = queryClient.getQueriesData<Event[]>({
    queryKey: [eventKeys.getMyEvents],
  });
  queryClient.setQueriesData<Event[]>(
    { queryKey: [eventKeys.getMyEvents] },
    (events) => events && update(events),
  );
  return { previousEvents };
}

function restoreCachedEvents(
  queryClient: QueryClient,
  snapshot: EventsSnapshot | undefined,
) {
  snapshot?.previousEvents.forEach(([queryKey, events]) =>
    queryClient.setQueryData(queryKey, events),
  );
}

/** Links an activity to a session, shown at once in the calendar */
export const useSetRelatedActivityMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.setRelatedActivity>>,
    Error,
    Parameters<typeof EventAPI.setRelatedActivity>[0],
    EventsSnapshot
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventAPI.setRelatedActivity,
    onMutate: ({ eventId, activityId }) =>
      updateCachedEvents(queryClient, (events) =>
        linkActivityInEvents(events, eventId, activityId),
      ),
    onError: (error, variables, snapshot, context) => {
      restoreCachedEvents(queryClient, snapshot);
      opt?.onError?.(error, variables, snapshot, context);
    },
    onSettled: (data, error, variables, snapshot, context) => {
      opt?.onSettled?.(data, error, variables, snapshot, context);
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getEvent, variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getMyEvents],
      });
      invalidateTrainingLoadQueries(queryClient);
    },
  });
};

/** Unlinks the activity of a session, shown at once in the calendar */
export const useUnsetRelatedActivityMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.unsetRelatedActivity>>,
    Error,
    Parameters<typeof EventAPI.unsetRelatedActivity>[0],
    EventsSnapshot
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventAPI.unsetRelatedActivity,
    onMutate: (eventId) =>
      updateCachedEvents(queryClient, (events) =>
        unlinkActivityInEvents(events, eventId),
      ),
    onError: (error, variables, snapshot, context) => {
      restoreCachedEvents(queryClient, snapshot);
      opt?.onError?.(error, variables, snapshot, context);
    },
    onSettled: (data, error, variables, snapshot, context) => {
      opt?.onSettled?.(data, error, variables, snapshot, context);
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getEvent, variables],
      });
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getMyEvents],
      });
      invalidateTrainingLoadQueries(queryClient);
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

/** Copies planned events by whole days (week actions) */
export const useCopyEventsMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.copyEvents>>,
    Error,
    ShiftEventsDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventAPI.copyEvents,
    onSettled: (data, error, variables, onMutateResult, context) => {
      opt?.onSettled?.(data, error, variables, onMutateResult, context);
      queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
      invalidateTrainingLoadQueries(queryClient);
    },
  });
};

/** Moves planned events by whole days, shown at once in the calendar */
export const useMoveEventsMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.moveEvents>>,
    Error,
    ShiftEventsDto,
    EventsSnapshot
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventAPI.moveEvents,
    onMutate: ({ eventIds, offsetDays }) =>
      updateCachedEvents(queryClient, (events) =>
        shiftEventsInCache(events, eventIds, offsetDays),
      ),
    onError: (error, variables, snapshot, context) => {
      restoreCachedEvents(queryClient, snapshot);
      opt?.onError?.(error, variables, snapshot, context);
    },
    onSettled: (data, error, variables, snapshot, context) => {
      opt?.onSettled?.(data, error, variables, snapshot, context);
      queryClient.invalidateQueries({ queryKey: [eventKeys.getMyEvents] });
      invalidateTrainingLoadQueries(queryClient);
    },
  });
};

export const useRegenerateIcalCalendarSecretMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.regenerateMyIcalCalendarSecret>>,
    Error,
    void
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventAPI.regenerateMyIcalCalendarSecret,
    onSuccess: (token, variables, onMutateResult, context) => {
      queryClient.setQueryData([eventKeys.getMyIcalCalendarSecret], token);
      opt?.onSuccess?.(token, variables, onMutateResult, context);
    },
  });
};

export const useDuplicateEventMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventAPI.duplicateEvent>>,
    Error,
    Parameters<typeof EventAPI.duplicateEvent>[0],
    { previousQueries: Map<unknown[], unknown>; tempId?: number }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventAPI.duplicateEvent,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: [eventKeys.getMyEvents],
      });

      // Snapshot all previous query states for rollback
      const previousQueries = new Map();
      queryClient
        .getQueriesData({ queryKey: [eventKeys.getMyEvents] })
        .forEach(([queryKey, data]) => {
          previousQueries.set(queryKey, data);
        });

      // Find the source event to duplicate from any of the cached queries
      let sourceEvent: Event | undefined;
      queryClient
        .getQueriesData<Event[]>({ queryKey: [eventKeys.getMyEvents] })
        .forEach(([, data]) => {
          if (!sourceEvent && data) {
            sourceEvent = data.find((e) => e.eventId === variables.eventId);
          }
        });

      // Generate a temporary negative ID that won't conflict with real IDs
      // This will be replaced by the server response
      const tempId = sourceEvent
        ? -(Math.abs(Date.now()) % 1000000)
        : undefined; // Negative number within INT4 range

      if (sourceEvent && tempId) {
        // Create optimistic duplicate event
        const duplicatedEvent: Event = {
          ...sourceEvent,
          eventId: tempId, // Temporary negative ID (will be replaced by server response)
          startDate: variables.body?.startDate
            ? new Date(variables.body.startDate)
            : sourceEvent.startDate,
          endDate: variables.body?.endDate
            ? new Date(variables.body.endDate)
            : sourceEvent.endDate,
        } as Event;

        // Optimistically add the duplicated event to all getMyEvents queries
        queryClient.setQueriesData<Event[]>(
          { queryKey: [eventKeys.getMyEvents] },
          (old) => {
            if (!old) return old;
            // Only add if the source event exists in this query
            if (old.some((e) => e.eventId === variables.eventId)) {
              return [...old, duplicatedEvent];
            }
            return old;
          },
        );
      }

      // Return context with previous values for rollback
      return { previousQueries, tempId };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error - restore all previous query states
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      // User's onError will be called via the spread ...opt
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      // Replace the temporary event with the real one from the server
      // This MUST happen before invalidation to ensure the real ID is in the cache
      const ctx = context as unknown as
        | { previousQueries: Map<unknown[], unknown>; tempId?: number }
        | undefined;
      if (ctx?.tempId) {
        // Replace in all getMyEvents queries - remove temp event and ensure real event is present
        queryClient.setQueriesData<Event[]>(
          { queryKey: [eventKeys.getMyEvents] },
          (old) => {
            if (!old) return [data];
            // Remove the temporary event (if it exists)
            const filtered = old.filter((e) => e.eventId !== ctx.tempId);
            // Check if real event already exists
            const existingIndex = filtered.findIndex(
              (e) => e.eventId === data.eventId,
            );
            if (existingIndex !== -1) {
              // Update existing event
              const updated = [...filtered];
              updated[existingIndex] = data;
              return updated;
            }
            // Add the real event
            return [...filtered, data];
          },
        );

        // Also set the individual event query with the real ID
        queryClient.setQueryData<Event>(
          [eventKeys.getEvent, data.eventId],
          data,
        );
      } else {
        // If no tempId, just add/update the event normally
        queryClient.setQueriesData<Event[]>(
          { queryKey: [eventKeys.getMyEvents] },
          (old) => {
            if (!old) return [data];
            const existingIndex = old.findIndex(
              (e) => e.eventId === data.eventId,
            );
            if (existingIndex !== -1) {
              const updated = [...old];
              updated[existingIndex] = data;
              return updated;
            }
            return [...old, data];
          },
        );
        queryClient.setQueryData<Event>(
          [eventKeys.getEvent, data.eventId],
          data,
        );
      }

      opt?.onSuccess?.(data, variables, onMutateResult, context);

      // Invalidate to refetch and sync with DB
      // The refetch will get fresh data from server, ensuring sync
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getMyEvents],
      });
      invalidateTrainingLoadQueries(queryClient);
    },
    onSettled: (_data, _error, _variables, context) => {
      // After everything is settled (success or error), ensure cache is clean
      // This runs after refetch completes, so we can clean up any duplicates
      const ctx = context as unknown as
        | { previousQueries: Map<unknown[], unknown>; tempId?: number }
        | undefined;

      if (ctx?.tempId) {
        // Clean up any remaining temporary events after refetch
        queryClient.setQueriesData<Event[]>(
          { queryKey: [eventKeys.getMyEvents] },
          (old) => {
            if (!old) return old;
            // Remove any temporary events (negative IDs)
            return old.filter((e) => e.eventId !== ctx.tempId);
          },
        );
      }
    },
  });
};
