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

  // Initialize socket connection
  useEffect(() => {
    const socket = AgentService.getSocket();
    socketRef.current = socket;

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 2000; // 2 seconds

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[Agent WebSocket] Connected');
      setIsConnected(true);
      reconnectAttempts = 0; // Reset on successful connection
    });

    socket.on('disconnect', (reason) => {
      console.log('[Agent WebSocket] Disconnected:', reason);
      setIsConnected(false);
      setIsStreaming(false);

      // Attempt to reconnect if disconnection was not intentional
      if (reason === 'io server disconnect') {
        // Server disconnected, don't auto-reconnect
        console.log('[Agent WebSocket] Server disconnected client');
      } else {
        // Try to reconnect
        console.log('[Agent WebSocket] Will attempt to reconnect...');
      }
    });

    socket.on('connect_error', (error) => {
      console.error('[Agent WebSocket] Connection error:', error);
      setIsConnected(false);

      // Implement exponential backoff for reconnection
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        const delay = reconnectDelay * Math.pow(2, reconnectAttempts - 1);
        console.log(
          `[Agent WebSocket] Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`,
        );
      } else {
        console.error(
          '[Agent WebSocket] Max reconnection attempts reached. Please refresh the page.',
        );
      }
    });

    // Message streaming event handlers
    socket.on('message_chunk', (chunk: any) => {
      console.log('[Agent WebSocket] Message chunk received:', chunk);

      // Handle different chunk types from backend
      if (chunk.type === 'user_message' && chunk.data) {
        // User message created - invalidate to show it immediately
        if (threadId) {
          queryClient.invalidateQueries({
            queryKey: ['AgentService.getThreadMessages', threadId],
          });
        }
      } else if (chunk.type === 'assistant_message_created' && chunk.data) {
        // Assistant message created - invalidate to show it immediately
        if (threadId) {
          queryClient.invalidateQueries({
            queryKey: ['AgentService.getThreadMessages', threadId],
          });
        }
      } else if (chunk.type === 'block_delta' && chunk.data && onMessageChunk) {
        // Convert backend chunk format to frontend MessageChunk format
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
      console.log('[Agent WebSocket] Message complete:', data);
      setIsStreaming(false);
      if (onMessageComplete) {
        onMessageComplete(data);
      }
      // Invalidate queries to refresh data
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

    // Connect socket
    AgentService.connectSocket();

    return () => {
      // Don't disconnect on unmount, just clean up listeners
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

  // Join/leave thread
  useEffect(() => {
    if (isConnected && threadId) {
      console.log(`[Agent WebSocket] Joining thread ${threadId}`);
      AgentService.joinThread(threadId);

      return () => {
        console.log(`[Agent WebSocket] Leaving thread ${threadId}`);
        AgentService.leaveThread(threadId);
      };
    }
  }, [isConnected, threadId]);

  // Send message function
  const sendMessage = useCallback(
    (content: string) => {
      if (!threadId) {
        console.error('[Agent WebSocket] Cannot send message: no thread', {
          threadId,
        });
        return;
      }

      setIsStreaming(true);
      console.log(`[Agent WebSocket] Sending message to thread ${threadId}`, {
        content,
      });
      // User is now authenticated via JWT in WebSocket, no need to send userId
      AgentService.sendMessageStream(threadId, content);
    },
    [threadId],
  );

  // Disconnect function
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
