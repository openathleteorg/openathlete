import { getAccessToken } from '@/utils/auth';
import { ACCESS_TOKEN, setItem } from '@/utils/local-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

import { AgentMessage, ToolExecutionState } from '@openathlete/shared';

import { AgentAPI } from './agent.api';
import { agentKeys } from './agent.keys';

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
  onToolCallStart?: (tool: ToolExecutionState) => void;
  onToolCallComplete?: (tool: ToolExecutionState) => void;
  onToolCallError?: (tool: ToolExecutionState) => void;
  onAgentThinking?: (message: string) => void;
}

export function useAgentWebSocket({
  threadId,
  onMessageChunk,
  onMessageComplete,
  onMessageError,
  onToolCallStart,
  onToolCallComplete,
  onToolCallError,
  onAgentThinking,
}: UseAgentWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTools, setActiveTools] = useState<
    Map<string, ToolExecutionState>
  >(new Map());
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = AgentAPI.getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsStreaming(false);
      // Let Socket.IO's built-in reconnection handle reconnection
    });

    socket.on('connect_error', async (error: any) => {
      setIsConnected(false);

      // If authentication failed, try to refresh token
      // Socket.IO will automatically retry connection with new token
      if (
        error?.message?.includes('Unauthorized') ||
        error?.message?.includes('jwt expired') ||
        error?.message?.includes('Invalid token')
      ) {
        try {
          // Refresh token - this updates the socket auth for next connection attempt
          // Don't call connectSocket() here - let Socket.IO's reconnection handle it
          // The token will be updated and Socket.IO will use it on the next retry
          const tokenInfo = await getAccessToken();
          if (tokenInfo) {
            if (tokenInfo.refreshToken) {
              setItem(ACCESS_TOKEN, tokenInfo.accessToken);
            }
            const socket = AgentAPI.getSocket();
            socket.auth = {
              token: tokenInfo.accessToken,
            };
            socket.io.opts.extraHeaders = {
              Authorization: `Bearer ${tokenInfo.accessToken}`,
            };
          }
        } catch (refreshError) {
          console.error(
            '[Agent WebSocket] Failed to refresh token:',
            refreshError,
          );
        }
      }
      // Let Socket.IO's built-in reconnection handle retries
    });

    socket.on('message_chunk', (chunk: any) => {
      if (chunk.type === 'user_message' && chunk.data) {
        if (threadId) {
          queryClient.invalidateQueries({
            queryKey: [agentKeys.getThreadMessages, threadId],
          });
        }
      } else if (chunk.type === 'assistant_message_created' && chunk.data) {
        if (threadId) {
          queryClient.invalidateQueries({
            queryKey: [agentKeys.getThreadMessages, threadId],
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
      } else if (chunk.type === 'tool_call_start' && chunk.data) {
        const toolState: ToolExecutionState = {
          toolCallId: chunk.data.toolCallId,
          toolName: chunk.data.toolName,
          status: 'executing',
          args: chunk.data.args,
          startTime: chunk.data.timestamp || Date.now(),
        };

        setActiveTools((prev) =>
          new Map(prev).set(chunk.data.toolCallId, toolState),
        );

        if (onToolCallStart) {
          onToolCallStart(toolState);
        }
      } else if (chunk.type === 'tool_call_complete' && chunk.data) {
        const toolState: ToolExecutionState = {
          toolCallId: chunk.data.toolCallId,
          toolName: chunk.data.toolName,
          status: 'completed',
          result: chunk.data.result,
          startTime:
            activeTools.get(chunk.data.toolCallId)?.startTime || Date.now(),
          endTime: chunk.data.timestamp || Date.now(),
        };

        setActiveTools((prev) => {
          const updated = new Map(prev);
          updated.delete(chunk.data.toolCallId);
          return updated;
        });

        if (onToolCallComplete) {
          onToolCallComplete(toolState);
        }
      } else if (chunk.type === 'tool_call_error' && chunk.data) {
        const toolState: ToolExecutionState = {
          toolCallId: chunk.data.toolCallId,
          toolName: chunk.data.toolName,
          status: 'error',
          error: chunk.data.error || 'Tool execution failed',
          startTime:
            activeTools.get(chunk.data.toolCallId)?.startTime || Date.now(),
          endTime: chunk.data.timestamp || Date.now(),
        };

        setActiveTools((prev) => {
          const updated = new Map(prev);
          updated.delete(chunk.data.toolCallId);
          return updated;
        });

        if (onToolCallError) {
          onToolCallError(toolState);
        }
      } else if (chunk.type === 'agent_thinking' && chunk.data) {
        // Agent execution started - track which agent is active
        if (chunk.data.agentName) {
          setCurrentAgent(chunk.data.agentName);
        }
        if (onAgentThinking) {
          onAgentThinking(
            chunk.data.agentName || chunk.data.message || 'Processing...',
          );
        }
      }
    });

    socket.on('message_complete', (data: any) => {
      setIsStreaming(false);
      setActiveTools(new Map());
      setCurrentAgent(null);
      if (onMessageComplete) {
        onMessageComplete(data);
      }
      if (threadId) {
        queryClient.invalidateQueries({
          queryKey: [agentKeys.getThreadMessages, threadId],
        });
        queryClient.invalidateQueries({
          queryKey: [agentKeys.getThread, threadId],
        });
      }

      if (data.threadTitle && threadId) {
        queryClient.setQueryData(
          [agentKeys.getThread, threadId],
          (oldThread: any) => {
            if (!oldThread) return undefined;
            return {
              ...oldThread,
              title: data.threadTitle,
            };
          },
        );

        queryClient.setQueryData(
          [agentKeys.getUserThreads],
          (oldThreads: any) => {
            if (!oldThreads) return undefined;
            return oldThreads.map((thread: any) => {
              if (thread.threadId === threadId) {
                return {
                  ...thread,
                  title: data.threadTitle,
                };
              }
              return thread;
            });
          },
        );
      }
    });

    socket.on('message_error', (data: { error: string }) => {
      console.error('[Agent WebSocket] Message error:', data);
      setIsStreaming(false);
      if (onMessageError) {
        onMessageError(data.error);
      }
    });

    socket.on(
      'thread_title_updated',
      (data: { threadId: number; title: string }) => {
        const updatedThreadId = data.threadId;

        queryClient.setQueryData(
          [agentKeys.getThread, updatedThreadId],
          (oldThread: any) => {
            if (!oldThread) return undefined;
            return {
              ...oldThread,
              title: data.title,
            };
          },
        );

        queryClient.setQueryData(
          [agentKeys.getUserThreads],
          (oldThreads: any) => {
            if (!oldThreads) return undefined;
            return oldThreads.map((thread: any) => {
              if (thread.threadId === updatedThreadId) {
                return {
                  ...thread,
                  title: data.title,
                };
              }
              return thread;
            });
          },
        );
      },
    );

    AgentAPI.connectSocket().catch((error) => {
      console.error('[Agent WebSocket] Failed to connect:', error);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('message_chunk');
      socket.off('message_complete');
      socket.off('message_error');
      socket.off('thread_title_updated');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    threadId,
    onMessageChunk,
    onMessageComplete,
    onMessageError,
    queryClient,
  ]);

  useEffect(() => {
    if (isConnected && threadId) {
      AgentAPI.joinThread(threadId);

      return () => {
        AgentAPI.leaveThread(threadId);
      };
    }
  }, [isConnected, threadId]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!threadId) {
        return;
      }

      setIsStreaming(true);
      AgentAPI.sendMessageStream(threadId, content);
    },
    [threadId],
  );

  const disconnect = useCallback(() => {
    AgentAPI.disconnectSocket();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    isStreaming,
    activeTools: Array.from(activeTools.values()),
    currentAgent,
    sendMessage,
    disconnect,
  };
}
