export const messagesKeys = {
  getUserThreads: ['messages', 'threads'] as const,
  getThread: (threadId: number) => ['messages', 'thread', threadId] as const,
  getThreadMessages: (threadId: number) =>
    ['messages', 'thread', threadId, 'messages'] as const,
  getMessage: (messageId: number) =>
    ['messages', 'message', messageId] as const,
};


