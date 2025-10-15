import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

import { AgentMessage } from '@openathlete/shared';

import { AgentService } from './agent.service';

export interface MessageChunk {
  blockId: number;
  messageId: number;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  type?: string;
}

export interface StreamingMessage {
  messageId: number;
  role: 'ASSISTANT';
  blocks: Array<{
    blockId: number;
    content: string;
    status: string;
    type: string;
  }>;
}

interface UseAgentWebSocketOptions {
  threadId?: number;
  onMessageChunk?: (chunk: MessageChunk) => void;
  onMessageComplete?: (message: AgentMessage) => void;
  onMessageError?: (error: string) => void;
}

export function useAgentWebSocket({
  threadId,
  onMessageChunk,
  onMessageComplete,
  onMessageError,
}: UseAgentWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = AgentService.getSocket();
    socketRef.current = socket;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    socket.on('connect', () => {
      setIsConnected(true);
      reconnectAttempts = 0;
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsStreaming(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);

      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
      }
    });

    socket.on('message_chunk', (chunk: any) => {
      if (chunk.type === 'user_message' && chunk.data) {
        if (threadId) {
          queryClient.invalidateQueries({
            queryKey: ['AgentService.getThreadMessages', threadId],
          });
        }
      } else if (chunk.type === 'assistant_message_created' && chunk.data) {
        if (threadId) {
          queryClient.invalidateQueries({
            queryKey: ['AgentService.getThreadMessages', threadId],
          });
        }
      } else if (chunk.type === 'block_delta' && chunk.data && onMessageChunk) {
        const messageChunk: MessageChunk = {
          blockId: chunk.data.blockId,
          messageId: chunk.data.messageId,
          content: chunk.data.content,
          status: 'processing',
          type: 'TEXT',
        };
        onMessageChunk(messageChunk);
      } else if (
        chunk.type === 'block_created' &&
        chunk.data &&
        onMessageChunk
      ) {
        const messageChunk: MessageChunk = {
          blockId: chunk.data.block_id,
          messageId: chunk.data.message_id,
          content: chunk.data.content,
          status: 'processing',
          type: chunk.data.type,
        };
        onMessageChunk(messageChunk);
      }
    });

    socket.on('message_complete', (data: AgentMessage) => {
      setIsStreaming(false);
      if (onMessageComplete) {
        onMessageComplete(data);
      }
      if (threadId) {
        queryClient.invalidateQueries({
          queryKey: ['AgentService.getThreadMessages', threadId],
        });
        queryClient.invalidateQueries({
          queryKey: ['AgentService.getThread', threadId],
        });
      }
    });

    socket.on('message_error', (data: { error: string }) => {
      console.error('[Agent WebSocket] Message error:', data);
      setIsStreaming(false);
      if (onMessageError) {
        onMessageError(data.error);
      }
    });

    AgentService.connectSocket();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('message_chunk');
      socket.off('message_complete');
      socket.off('message_error');
    };
  }, [
    threadId,
    onMessageChunk,
    onMessageComplete,
    onMessageError,
    queryClient,
  ]);

  useEffect(() => {
    if (isConnected && threadId) {
      AgentService.joinThread(threadId);

      return () => {
        AgentService.leaveThread(threadId);
      };
    }
  }, [isConnected, threadId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!threadId) {
        return;
      }

      setIsStreaming(true);
      AgentService.sendMessageStream(threadId, content);
    },
    [threadId],
  );

  const disconnect = useCallback(() => {
    AgentService.disconnectSocket();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    isStreaming,
    sendMessage,
    disconnect,
  };
}
