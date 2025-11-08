import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { CreateThreadDto, UpdateThreadDto } from '@openathlete/shared';

import { AgentAPI } from './agent.api';
import { agentKeys } from './agent.keys';

export const useGetUserThreadsQuery = (
  opt?: QueryOptions<Awaited<ReturnType<typeof AgentAPI.getUserThreads>>>,
) =>
  useQuery({
    ...opt,
    queryFn: AgentAPI.getUserThreads,
    queryKey: [agentKeys.getUserThreads],
  });

export const useGetThreadQuery = (
  threadId: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof AgentAPI.getThread>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => AgentAPI.getThread(threadId),
    queryKey: [agentKeys.getThread, threadId],
    enabled: !!threadId,
  });

export const useCreateThreadMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentAPI.createThread>>,
    Error,
    CreateThreadDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AgentAPI.createThread,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getUserThreads],
      });
    },
  });
};

export const useUpdateThreadMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentAPI.updateThread>>,
    Error,
    { threadId: number; body: UpdateThreadDto }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AgentAPI.updateThread,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getThread, variables.threadId],
      });
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getUserThreads],
      });
    },
  });
};

export const useDeleteThreadMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentAPI.deleteThread>>,
    Error,
    number
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AgentAPI.deleteThread,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getUserThreads],
      });
    },
  });
};

export const useGetThreadMessagesQuery = (
  threadId: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof AgentAPI.getThreadMessages>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => AgentAPI.getThreadMessages(threadId),
    queryKey: [agentKeys.getThreadMessages, threadId],
    enabled: !!threadId,
  });
