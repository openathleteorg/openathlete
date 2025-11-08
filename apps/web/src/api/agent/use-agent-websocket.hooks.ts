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

    AgentAPI.connectSocket();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('message_chunk');
      socket.off('message_complete');
      socket.off('message_error');
      socket.off('thread_title_updated');
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
