import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { EventTemplateService } from './event-template.service';

export const useCreateEventTemplateMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventTemplateService.createEventTemplate>>,
    Error,
    Parameters<typeof EventTemplateService.createEventTemplate>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventTemplateService.createEventTemplate,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['EventTemplateService.getMyEventTemplates'],
      });
    },
  });
};

export const useGetMyEventTemplatesQuery = (
  opt?: QueryOptions<
    Awaited<ReturnType<typeof EventTemplateService.getMyEventTemplates>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: EventTemplateService.getMyEventTemplates,
    queryKey: ['EventTemplateService.getMyEventTemplates'],
  });

export const useDeleteEventTemplateMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventTemplateService.deleteEventTemplate>>,
    Error,
    Parameters<typeof EventTemplateService.deleteEventTemplate>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventTemplateService.deleteEventTemplate,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['EventTemplateService.getMyEventTemplates'],
      });
    },
  });
};

export const useUseEventTemplateMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof EventTemplateService.useEventTemplate>>,
    Error,
    Parameters<typeof EventTemplateService.useEventTemplate>[0]
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: EventTemplateService.useEventTemplate,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['EventService.getMyEvents'],
      });
    },
  });
};
