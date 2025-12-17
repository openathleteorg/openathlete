import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { Event, EventTemplate } from '@openathlete/shared';

import { eventTemplateFolderKeys } from '../event-template-folder/event-template-folder.keys';
import { eventKeys } from '../event/event.keys';
import { EventTemplateAPI } from './event-template.api';
import { eventTemplateKeys } from './event-template.keys';

// Extended mutation parameters that include template for optimistic updates
type UseEventTemplateMutationVariables = Parameters<
  typeof EventTemplateAPI.useEventTemplate
>[0] & {
  template?: EventTemplate;
};

export const useCreateEventTemplateMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventTemplateAPI.createEventTemplate>>,
    Error,
    Parameters<typeof EventTemplateAPI.createEventTemplate>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventTemplateAPI.createEventTemplate,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [eventTemplateKeys.getMyEventTemplates],
      });
    },
  });
};

export const useGetMyEventTemplatesQuery = (
  search?: string,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof EventTemplateAPI.getMyEventTemplates>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () => EventTemplateAPI.getMyEventTemplates(search),
    queryKey: [eventTemplateKeys.getMyEventTemplates, search],
  });

export const useUpdateEventTemplateMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventTemplateAPI.updateEventTemplate>>,
    Error,
    Parameters<typeof EventTemplateAPI.updateEventTemplate>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventTemplateAPI.updateEventTemplate,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [eventTemplateKeys.getMyEventTemplates],
      });
    },
  });
};

export const useDeleteEventTemplateMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventTemplateAPI.deleteEventTemplate>>,
    Error,
    Parameters<typeof EventTemplateAPI.deleteEventTemplate>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventTemplateAPI.deleteEventTemplate,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [eventTemplateKeys.getMyEventTemplates],
      });
      queryClient.invalidateQueries({
        queryKey: [eventTemplateFolderKeys.getMyFolders],
      });
    },
  });
};

type UseEventTemplateContext = {
  previousQueries: Map<unknown[], unknown>;
  tempId: number;
};

export const useUseEventTemplateMutation = (
  opt?: MutationOptions<
    Event,
    Error,
    UseEventTemplateMutationVariables,
    UseEventTemplateContext
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Event,
    Error,
    UseEventTemplateMutationVariables,
    UseEventTemplateContext
  >({
    ...opt,
    mutationFn: ({ template: _template, ...rest }) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      EventTemplateAPI.useEventTemplate(rest),
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

      // Create optimistic event from template if available
      if (variables.template?.event) {
        const templateEvent = variables.template.event;
        const optimisticEvent: Event = {
          ...templateEvent,
          eventId: tempId,
          startDate: new Date(variables.body.startDate),
          endDate: new Date(variables.body.endDate),
          athleteId: variables.body.athleteId ?? templateEvent.athleteId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Optimistically add the event to all getMyEvents queries
        queryClient.setQueriesData<Event[]>(
          { queryKey: [eventKeys.getMyEvents] },
          (old) => {
            if (!old) return [optimisticEvent];
            return [...old, optimisticEvent];
          },
        );
      }

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
      const ctx = context as UseEventTemplateContext | undefined;

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
      // from setQueriesData. Let the natural staleTime handle eventual sync.
    },
  });
};
