import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { eventKeys } from '../event/event.keys';
import { EventTemplateAPI } from './event-template.api';
import { eventTemplateKeys } from './event-template.keys';

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
  opt?: QueryOptions<
    Awaited<ReturnType<typeof EventTemplateAPI.getMyEventTemplates>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: EventTemplateAPI.getMyEventTemplates,
    queryKey: [eventTemplateKeys.getMyEventTemplates],
  });

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
    },
  });
};

export const useUseEventTemplateMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventTemplateAPI.useEventTemplate>>,
    Error,
    Parameters<typeof EventTemplateAPI.useEventTemplate>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventTemplateAPI.useEventTemplate,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [eventKeys.getMyEvents],
      });
    },
  });
};
