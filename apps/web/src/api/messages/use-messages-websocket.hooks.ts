import { m } from '@/paraglide/messages';
import { ACCESS_TOKEN, getItem } from '@/utils/local-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

import { Message, MessageThread } from '@openathlete/shared';

import { MessagesAPI } from './messages.api';
import { messagesKeys } from './messages.keys';

interface UseMessagesWebSocketOptions {
  messageThreadId?: number;
  onNewMessage?: (message: Message) => void;
  onMessageUpdated?: (message: Message) => void;
  onMessagesRead?: (data: {
    userId: number;
    messageThreadId: number;
    messageIds: number[];
  }) => void;
  onError?: (error: string) => void;
}

export function useMessagesWebSocket({
  messageThreadId,
  onNewMessage,
  onMessageUpdated,
  onMessagesRead,
  onError,
}: UseMessagesWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const connectingRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = MessagesAPI.getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      socket.emit('subscribe_inbox');
      setIsConnected(true);
      connectingRef.current = false;

      if (messageThreadId) {
        MessagesAPI.joinThread(messageThreadId);
      }
    };
    socket.on('connect', onConnect);

    // Socket.IO retries by itself, with a fresh token (see MessagesAPI)
    const onDisconnect = () => {
      setIsConnected(false);
      connectingRef.current = false;
    };
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onDisconnect);

    const onActivityNotice = (data: { message: Message }) => {
      void queryClient.invalidateQueries({
        queryKey: messagesKeys.getUserThreads,
      });
      void queryClient.invalidateQueries({
        queryKey: messagesKeys.getThread(data.message.messageThreadId),
      });
      void queryClient.invalidateQueries({
        queryKey: messagesKeys.getThreadMessages(data.message.messageThreadId),
      });
    };
    socket.on('activity_notice', onActivityNotice);

    socket.on('new_message', (data: { message: Message }) => {
      if (onNewMessage) {
        onNewMessage(data.message);
      }
      if (data.message.messageThreadId) {
        const threadId = data.message.messageThreadId;
        const newMessage = data.message;

        // Update messages cache directly - add new message to the list
        queryClient.setQueryData<Message[]>(
          messagesKeys.getThreadMessages(threadId),
          (oldMessages) => {
            if (!oldMessages) return [newMessage];
            // Check if message already exists (avoid duplicates)
            if (oldMessages.some((m) => m.messageId === newMessage.messageId)) {
              return oldMessages;
            }
            return [...oldMessages, newMessage];
          },
        );

        // Update thread cache - update lastMessage and updatedAt
        queryClient.setQueryData<MessageThread>(
          messagesKeys.getThread(threadId),
          (oldThread) => {
            if (!oldThread) return undefined;
            return {
              ...oldThread,
              messages: oldThread.messages?.some(
                (message) => message.messageId === newMessage.messageId,
              )
                ? oldThread.messages
                : oldThread.messages
                  ? [...oldThread.messages, newMessage]
                  : undefined,
              lastMessage: newMessage,
              updatedAt: newMessage.createdAt,
            };
          },
        );

        // Update thread list cache - update the thread in the list
        queryClient.setQueryData<MessageThread[]>(
          messagesKeys.getUserThreads,
          (oldThreads) => {
            if (!oldThreads) return undefined;
            return oldThreads.map((thread) => {
              if (thread.messageThreadId === threadId) {
                return {
                  ...thread,
                  messages: thread.messages?.some(
                    (message) => message.messageId === newMessage.messageId,
                  )
                    ? thread.messages
                    : thread.messages
                      ? [...thread.messages, newMessage]
                      : undefined,
                  lastMessage: newMessage,
                  updatedAt: newMessage.createdAt,
                };
              }
              return thread;
            });
          },
        );
      }
    });

    socket.on('message_updated', (data: { message: Message }) => {
      if (onMessageUpdated) {
        onMessageUpdated(data.message);
      }
      if (data.message.messageThreadId) {
        const threadId = data.message.messageThreadId;
        const updatedMessage = data.message;

        // Update messages cache directly - replace the message in the list
        queryClient.setQueryData<Message[]>(
          messagesKeys.getThreadMessages(threadId),
          (oldMessages) => {
            if (!oldMessages) return undefined;
            return oldMessages.map((msg) =>
              msg.messageId === updatedMessage.messageId ? updatedMessage : msg,
            );
          },
        );

        // Update message cache
        queryClient.setQueryData<Message>(
          messagesKeys.getMessage(updatedMessage.messageId),
          updatedMessage,
        );

        // Update thread cache - update lastMessage if it's the last one
        queryClient.setQueryData<MessageThread>(
          messagesKeys.getThread(threadId),
          (oldThread) => {
            if (!oldThread) return undefined;
            const isLastMessage =
              oldThread.lastMessage?.messageId === updatedMessage.messageId;
            return {
              ...oldThread,
              messages: oldThread.messages?.map((message) =>
                message.messageId === updatedMessage.messageId
                  ? updatedMessage
                  : message,
              ),
              lastMessage: isLastMessage
                ? updatedMessage
                : oldThread.lastMessage,
              updatedAt: updatedMessage.updatedAt,
            };
          },
        );

        // Update thread list cache
        queryClient.setQueryData<MessageThread[]>(
          messagesKeys.getUserThreads,
          (oldThreads) => {
            if (!oldThreads) return undefined;
            return oldThreads.map((thread) => {
              if (thread.messageThreadId === threadId) {
                const isLastMessage =
                  thread.lastMessage?.messageId === updatedMessage.messageId;
                return {
                  ...thread,
                  messages: thread.messages?.map((message) =>
                    message.messageId === updatedMessage.messageId
                      ? updatedMessage
                      : message,
                  ),
                  lastMessage: isLastMessage
                    ? updatedMessage
                    : thread.lastMessage,
                  updatedAt: updatedMessage.updatedAt,
                };
              }
              return thread;
            });
          },
        );
      }
    });

    socket.on(
      'messages_read',
      (data: {
        userId: number;
        messageThreadId: number;
        messageIds: number[];
      }) => {
        if (onMessagesRead) {
          onMessagesRead(data);
        }
        const { messageThreadId, messageIds } = data;

        // Update messages cache - mark messages as read
        queryClient.setQueryData<Message[]>(
          messagesKeys.getThreadMessages(messageThreadId),
          (oldMessages) => {
            if (!oldMessages) return undefined;
            return oldMessages.map((msg) => {
              if (messageIds.includes(msg.messageId)) {
                // Add read receipt if not already present
                const hasReadReceipt = msg.readReceipts?.some(
                  (rr) => rr.userId === data.userId,
                );
                if (!hasReadReceipt) {
                  return {
                    ...msg,
                    readReceipts: [
                      ...(msg.readReceipts || []),
                      {
                        messageReadReceiptId: 0, // Will be set by server
                        messageId: msg.messageId,
                        userId: data.userId,
                        readAt: new Date().toISOString(),
                      },
                    ],
                  };
                }
              }
              return msg;
            });
          },
        );

        // Update thread cache - recalculate unread count would require server data
        // So we invalidate thread to get updated unread count
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getThread(messageThreadId),
        });

        // Update thread list cache - invalidate to get updated unread counts
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getUserThreads,
        });
      },
    );

    socket.on('thread_updated', (data: { messageThreadId: number }) => {
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getUserThreads,
      });
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getThread(data.messageThreadId),
      });
    });

    socket.on('thread_created', () => {
      queryClient.invalidateQueries({
        queryKey: messagesKeys.getUserThreads,
      });
    });

    socket.on('message_error', (data: { error: string }) => {
      if (onError) {
        onError(data.error);
      }
    });

    if (socket.connected) {
      socket.emit('subscribe_inbox');
      setIsConnected(true);
    }
    const token = getItem(ACCESS_TOKEN);
    if (token && !socket.connected && !connectingRef.current) {
      connectingRef.current = true;
      MessagesAPI.connectSocket()
        .catch((err) => {
          console.error('[Messages WebSocket] Failed to connect:', err);
        })
        .finally(() => {
          connectingRef.current = false;
        });
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onDisconnect);
      socket.off('activity_notice', onActivityNotice);
      socket.off('new_message');
      socket.off('message_updated');
      socket.off('messages_read');
      socket.off('thread_updated');
      socket.off('thread_created');
      socket.off('message_error');
      connectingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isConnected && messageThreadId) {
      MessagesAPI.joinThread(messageThreadId);
      return () => {
        MessagesAPI.leaveThread(messageThreadId);
      };
    }
  }, [isConnected, messageThreadId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!messageThreadId) {
        return;
      }

      const socket = MessagesAPI.getSocket();

      if (socket.connected) {
        MessagesAPI.sendMessage(messageThreadId, content);
        return;
      }

      if (!connectingRef.current) {
        connectingRef.current = true;
        MessagesAPI.connectSocket().catch((err) => {
          console.error('[Messages WebSocket] Failed to connect:', err);
          connectingRef.current = false;
        });
      }

      try {
        await MessagesAPI.createMessage({
          messageThreadId,
          content,
        });
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getThreadMessages(messageThreadId),
        });
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getUserThreads,
        });
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error.message : m.ui_send_failed());
        }
      }
    },
    [messageThreadId, queryClient, onError],
  );

  const updateMessage = useCallback((messageId: number, content: string) => {
    MessagesAPI.updateMessageViaSocket(messageId, content);
  }, []);

  const markAsRead = useCallback(
    (messageIds?: number[]) => {
      if (!messageThreadId) {
        return;
      }

      MessagesAPI.markAsRead(messageThreadId, messageIds);
    },
    [messageThreadId],
  );

  const disconnect = useCallback(() => {
    MessagesAPI.disconnectSocket();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    sendMessage,
    updateMessage,
    markAsRead,
    disconnect,
  };
}
