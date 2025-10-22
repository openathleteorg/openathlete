import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  CreateBlockDto,
  CreateMessageDto,
  CreateThreadDto,
  SendMessageDto,
  UpdateBlockDto,
  UpdateThreadDto,
} from '@openathlete/shared';

import { AgentAPI } from './agent.api';
import { agentKeys } from './agent.keys';

// ==================== Thread Hooks ====================

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

// ==================== Message Hooks ====================

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

export const useCreateMessageMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentAPI.createMessage>>,
    Error,
    CreateMessageDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AgentAPI.createMessage,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getThreadMessages, variables.threadId],
      });
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getThread, variables.threadId],
      });
    },
  });
};

export const useDeleteMessageMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentAPI.deleteMessage>>,
    Error,
    { messageId: number; threadId: number }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ messageId }) => AgentAPI.deleteMessage(messageId),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getThreadMessages, variables.threadId],
      });
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getThread, variables.threadId],
      });
    },
  });
};

export const useSendMessageMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentAPI.sendMessage>>,
    Error,
    { threadId: number; body: SendMessageDto }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AgentAPI.sendMessage,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getThreadMessages, variables.threadId],
      });
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getThread, variables.threadId],
      });
    },
  });
};

// ==================== Block Hooks ====================

export const useCreateBlockMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentAPI.createBlock>>,
    Error,
    CreateBlockDto & { threadId: number }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ threadId, ...body }) => AgentAPI.createBlock(body),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getThreadMessages, variables.threadId],
      });
    },
  });
};

export const useUpdateBlockMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentAPI.updateBlock>>,
    Error,
    { blockId: number; body: UpdateBlockDto; threadId: number }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ blockId, body }) => AgentAPI.updateBlock({ blockId, body }),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getThreadMessages, variables.threadId],
      });
    },
  });
};

export const useDeleteBlockMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentAPI.deleteBlock>>,
    Error,
    { blockId: number; threadId: number }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ blockId }) => AgentAPI.deleteBlock(blockId),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: [agentKeys.getThreadMessages, variables.threadId],
      });
    },
  });
};
