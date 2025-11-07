import {
  MutationOptions,
  QueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  CreateMessageThreadDto,
  CreateMessageThreadMessageDto,
  MarkMessagesAsReadDto,
  UpdateMessageThreadDto,
  UpdateMessageThreadMessageDto,
} from '@openathlete/shared';

import { MessagesAPI } from './messages.api';
import { messagesKeys } from './messages.keys';

// ==================== Thread Hooks ====================

export const useGetUserThreadsQuery = (
  opt?: QueryOptions<Awaited<ReturnType<typeof MessagesAPI.getUserThreads>>>,
) =>
  useQuery({
    ...opt,
    queryFn: MessagesAPI.getUserThreads,
    queryKey: messagesKeys.getUserThreads,
  });

export const useGetThreadQuery = (
  threadId: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof MessagesAPI.getThread>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => MessagesAPI.getThread(threadId),
    queryKey: messagesKeys.getThread(threadId),
    enabled: !!threadId,
  });

export const useCreateThreadMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MessagesAPI.createThread>>,
    Error,
    CreateMessageThreadDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: MessagesAPI.createThread,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getUserThreads,
      });
    },
  });
};

export const useUpdateThreadMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MessagesAPI.updateThread>>,
    Error,
    { threadId: number; body: UpdateMessageThreadDto }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: MessagesAPI.updateThread,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getThread(variables.threadId),
      });
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getUserThreads,
      });
    },
  });
};

export const useDeleteThreadMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MessagesAPI.deleteThread>>,
    Error,
    number
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: MessagesAPI.deleteThread,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getUserThreads,
      });
    },
  });
};

// ==================== Message Hooks ====================

export const useGetThreadMessagesQuery = (
  threadId: number,
  opt?: QueryOptions<Awaited<ReturnType<typeof MessagesAPI.getThreadMessages>>>,
) =>
  useQuery({
    ...opt,
    queryFn: () => MessagesAPI.getThreadMessages(threadId),
    queryKey: messagesKeys.getThreadMessages(threadId),
    enabled: !!threadId,
  });

export const useCreateMessageMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MessagesAPI.createMessage>>,
    Error,
    CreateMessageThreadMessageDto
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: MessagesAPI.createMessage,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getThreadMessages(variables.messageThreadId),
      });
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getThread(variables.messageThreadId),
      });
    },
  });
};

export const useUpdateMessageMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MessagesAPI.updateMessage>>,
    Error,
    { messageId: number; body: UpdateMessageThreadMessageDto; threadId: number }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ messageId, body }) =>
      MessagesAPI.updateMessage({ messageId, body }),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getThreadMessages(variables.threadId),
      });
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getMessage(variables.messageId),
      });
    },
  });
};

export const useDeleteMessageMutation = (
  opt?: MutationOptions<
    Awaited<ReturnType<typeof MessagesAPI.deleteMessage>>,
    Error,
    { messageId: number; threadId: number }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ messageId }) => MessagesAPI.deleteMessage(messageId),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getThreadMessages(variables.threadId),
      });
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getThread(variables.threadId),
      });
    },
  });
};

export const useMarkMessagesAsReadMutation = (
  opt?: MutationOptions<
    void,
    Error,
    { threadId: number; body: MarkMessagesAsReadDto }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...opt,
    mutationFn: ({ threadId, body }) =>
      MessagesAPI.markMessagesAsRead(threadId, body),
    onSuccess: (data, variables, onMutateResult, context) => {
      if (opt?.onSuccess)
        opt.onSuccess(data, variables, onMutateResult, context);
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getThreadMessages(variables.threadId),
      });
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getThread(variables.threadId),
      });
    },
  });
};

