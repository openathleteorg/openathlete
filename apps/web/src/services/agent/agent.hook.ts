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

import { AgentService } from './agent.service';

// ==================== Thread Hooks ====================

export const useGetUserThreadsQuery = (
  opt?: QueryOptions<Awaited<ReturnType<typeof AgentService.getUserThreads>>>,
) =>
  useQuery({
    ...opt,
    queryFn: AgentService.getUserThreads,
    queryKey: ['AgentService.getUserThreads'],
  });

export const useGetThreadQuery = (
  threadId: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof AgentService.getThread>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => AgentService.getThread(threadId),
    queryKey: ['AgentService.getThread', threadId],
    enabled: !!threadId,
  });

export const useCreateThreadMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentService.createThread>>,
    Error,
    CreateThreadDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AgentService.createThread,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getUserThreads'],
      });
    },
  });
};

export const useUpdateThreadMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentService.updateThread>>,
    Error,
    { threadId: number; body: UpdateThreadDto }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AgentService.updateThread,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getThread', variables.threadId],
      });
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getUserThreads'],
      });
    },
  });
};

export const useDeleteThreadMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentService.deleteThread>>,
    Error,
    number
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AgentService.deleteThread,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getUserThreads'],
      });
    },
  });
};

// ==================== Message Hooks ====================

export const useGetThreadMessagesQuery = (
  threadId: number,
  opt?: QueryOptions<
    Awaited<ReturnType<typeof AgentService.getThreadMessages>>
  >,
) =>
  useQuery({
    ...opt,
    queryFn: () => AgentService.getThreadMessages(threadId),
    queryKey: ['AgentService.getThreadMessages', threadId],
    enabled: !!threadId,
  });

export const useCreateMessageMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentService.createMessage>>,
    Error,
    CreateMessageDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AgentService.createMessage,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getThreadMessages', variables.threadId],
      });
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getThread', variables.threadId],
      });
    },
  });
};

export const useDeleteMessageMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentService.deleteMessage>>,
    Error,
    { messageId: number; threadId: number }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ messageId }) => AgentService.deleteMessage(messageId),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getThreadMessages', variables.threadId],
      });
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getThread', variables.threadId],
      });
    },
  });
};

export const useSendMessageMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentService.sendMessage>>,
    Error,
    { threadId: number; body: SendMessageDto }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: AgentService.sendMessage,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getThreadMessages', variables.threadId],
      });
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getThread', variables.threadId],
      });
    },
  });
};

// ==================== Block Hooks ====================

export const useCreateBlockMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentService.createBlock>>,
    Error,
    CreateBlockDto & { threadId: number }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ threadId, ...body }) => AgentService.createBlock(body),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getThreadMessages', variables.threadId],
      });
    },
  });
};

export const useUpdateBlockMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentService.updateBlock>>,
    Error,
    { blockId: number; body: UpdateBlockDto; threadId: number }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ blockId, body }) =>
      AgentService.updateBlock({ blockId, body }),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getThreadMessages', variables.threadId],
      });
    },
  });
};

export const useDeleteBlockMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof AgentService.deleteBlock>>,
    Error,
    { blockId: number; threadId: number }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ blockId }) => AgentService.deleteBlock(blockId),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: ['AgentService.getThreadMessages', variables.threadId],
      });
    },
  });
};
