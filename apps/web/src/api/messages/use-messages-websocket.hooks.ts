import { ACCESS_TOKEN, getItem } from '@/utils/local-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

import { Message } from '@openathlete/shared';

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

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    socket.on('connect', () => {
      setIsConnected(true);
      connectingRef.current = false;
      reconnectAttempts = 0;

      if (messageThreadId) {
        MessagesAPI.joinThread(messageThreadId);
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      connectingRef.current = false;

      if (reason === 'transport close' || reason === 'transport error') {
        setTimeout(() => {
          if (!connectingRef.current && !socket.connected) {
            connectingRef.current = true;
            MessagesAPI.connectSocket();
          }
        }, 1000);
      }
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      connectingRef.current = false;

      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        setTimeout(() => {
          if (!connectingRef.current && !socket.connected) {
            connectingRef.current = true;
            MessagesAPI.connectSocket();
          }
        }, 1000 * reconnectAttempts);
      }
    });

    socket.on('new_message', (data: { message: Message }) => {
      if (onNewMessage) {
        onNewMessage(data.message);
      }
      if (data.message.messageThreadId) {
        // Invalidate messages for this thread
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getThreadMessages(
            data.message.messageThreadId,
          ),
        });
        // Invalidate thread details
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getThread(data.message.messageThreadId),
        });
        // Invalidate thread list to update last message and unread count
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getUserThreads,
        });
      }
    });

    socket.on('message_updated', (data: { message: Message }) => {
      if (onMessageUpdated) {
        onMessageUpdated(data.message);
      }
      if (data.message.messageThreadId) {
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getThreadMessages(
            data.message.messageThreadId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getMessage(data.message.messageId),
        });
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getThread(data.message.messageThreadId),
        });
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getUserThreads,
        });
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
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getThreadMessages(data.messageThreadId),
        });
        queryClient.invalidateQueries({
          queryKey: messagesKeys.getThread(data.messageThreadId),
        });
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

    const token = getItem(ACCESS_TOKEN);
    if (token && !connectingRef.current && !socket.connected) {
      connectingRef.current = true;
      MessagesAPI.connectSocket();
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
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
    (content: string) => {
      if (!messageThreadId) {
        return;
      }

      const socket = MessagesAPI.getSocket();
      MessagesAPI.sendMessage(messageThreadId, content);

      if (!socket.connected && !connectingRef.current) {
        connectingRef.current = true;
        MessagesAPI.connectSocket();
      }
    },
    [messageThreadId, isConnected],
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
