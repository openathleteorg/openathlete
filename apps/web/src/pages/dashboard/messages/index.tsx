import {
  MessageChunk,
  useAgentWebSocket,
  useCreateThreadMutation,
  useDeleteThreadMutation,
  useGetUserThreadsQuery,
} from '@/api/agent';
import {
  useCreateThreadMutation as useCreateMessageThreadMutation,
  useDeleteThreadMutation as useDeleteMessageThreadMutation,
  useGetUserThreadsQuery as useGetMessageThreadsQuery,
  useMessagesWebSocket,
} from '@/api/messages';
import { ChatInput } from '@/components/chatbot/chat-input';
import { ChatMessages } from '@/components/chatbot/chat-messages';
import { MessageMessages } from '@/components/messages/message-messages';
import { NewMessageThreadDialog } from '@/components/messages/new-message-thread-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useChatbot } from '@/contexts/chatbot';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { motion } from 'framer-motion';
import { MessageCircle, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { ToolExecutionState } from '@openathlete/shared';

type MessageMode = 'chatbot' | 'messages';

export function MessagesPage() {
  const [mode, setMode] = useState<MessageMode>('messages');
  const [newThreadDialogOpen, setNewThreadDialogOpen] = useState(false);
  const { activeThreadId, setActiveThreadId } = useChatbot();
  const [activeMessageThreadId, setActiveMessageThreadId] = useState<
    number | null
  >(null);
  const [streamingBlocks, setStreamingBlocks] = useState<
    Map<number, MessageChunk>
  >(new Map());
  const [activeToolExecutions, setActiveToolExecutions] = useState<
    ToolExecutionState[]
  >([]);

  // Agent threads (chatbot)
  const { data: agentThreads, isLoading: isLoadingAgentThreads } =
    useGetUserThreadsQuery();
  const createAgentThreadMutation = useCreateThreadMutation();
  const deleteAgentThreadMutation = useDeleteThreadMutation();

  // Message threads (messagerie)
  const { data: messageThreads, isLoading: isLoadingMessageThreads } =
    useGetMessageThreadsQuery();
  const createMessageThreadMutation = useCreateMessageThreadMutation();
  const deleteMessageThreadMutation = useDeleteMessageThreadMutation();

  // WebSocket for agent streaming
  const { isStreaming: isAgentStreaming, sendMessage: sendAgentMessage } =
    useAgentWebSocket({
      threadId: mode === 'chatbot' ? activeThreadId || undefined : undefined,
      onMessageChunk: (chunk) => {
        setStreamingBlocks((prev) => {
          const newMap = new Map(prev);
          newMap.set(chunk.blockId, chunk);
          return newMap;
        });
      },
      onMessageComplete: () => {
        setStreamingBlocks(new Map());
      },
      onMessageError: (error) => {
        console.error('WebSocket error:', error);
        setStreamingBlocks(new Map());
      },
      onToolCallStart: (tool) => {
        console.log('[MessagesPage] Tool started:', tool.toolName);
        setActiveToolExecutions((prev) => [...prev, tool]);
      },
      onToolCallComplete: (tool) => {
        console.log('[MessagesPage] Tool completed:', tool.toolName);
        setActiveToolExecutions((prev) =>
          prev.filter((t) => t.toolCallId !== tool.toolCallId),
        );
      },
      onToolCallError: (tool) => {
        console.error('[MessagesPage] Tool error:', tool.toolName, tool.error);
      },
    });

  // WebSocket for messages - always connected to receive thread updates
  const { sendMessage: sendMessageMessage, isConnected: isMessagesConnected } =
    useMessagesWebSocket({
      messageThreadId:
        mode === 'messages' ? activeMessageThreadId || undefined : undefined,
      onNewMessage: () => {
        // Messages will be invalidated via React Query
      },
      onError: (error) => {
        console.error('[MessagesPage] WebSocket error:', error);
      },
    });

  // Additional WebSocket hook without threadId to receive all thread updates
  // This ensures thread list is updated even when no thread is selected
  useMessagesWebSocket({
    // No messageThreadId - just listening for global updates
    onNewMessage: () => {
      // Thread list will be invalidated via React Query
    },
    onMessagesRead: () => {
      // Thread list will be invalidated via React Query
    },
  });

  const isLoading =
    mode === 'chatbot' ? isLoadingAgentThreads : isLoadingMessageThreads;
  const threads = mode === 'chatbot' ? agentThreads : messageThreads;
  const activeId = mode === 'chatbot' ? activeThreadId : activeMessageThreadId;
  const setActiveId =
    mode === 'chatbot' ? setActiveThreadId : setActiveMessageThreadId;
  const deleteThreadMutation =
    mode === 'chatbot'
      ? deleteAgentThreadMutation
      : deleteMessageThreadMutation;
  const isStreaming = mode === 'chatbot' ? isAgentStreaming : false;

  // Auto-create first thread if none exist
  useEffect(() => {
    if (
      threads &&
      threads.length === 0 &&
      !isLoading &&
      !(mode === 'chatbot'
        ? createAgentThreadMutation.isPending
        : createMessageThreadMutation.isPending)
    ) {
      if (mode === 'chatbot') {
        createAgentThreadMutation.mutate(
          {},
          {
            onSuccess: (newThread) => {
              setActiveThreadId(newThread.threadId);
            },
          },
        );
      } else {
        createMessageThreadMutation.mutate(
          { title: 'New Thread', participantUserIds: [] },
          {
            onSuccess: (newThread) => {
              setActiveMessageThreadId(newThread.messageThreadId);
            },
          },
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, isLoading, mode]);

  // Auto-select first thread if available and no active thread
  useEffect(() => {
    if (threads && threads.length > 0 && !activeId) {
      setActiveId(
        mode === 'chatbot'
          ? (threads[0] as any).threadId
          : (threads[0] as any).messageThreadId,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, activeId, mode]);

  const handleNewConversation = useCallback(() => {
    if (mode === 'chatbot') {
      createAgentThreadMutation.mutate(
        { title: m.chatbot_new_conversation() },
        {
          onSuccess: (thread) => {
            setActiveThreadId(thread.threadId);
          },
        },
      );
    } else {
      setNewThreadDialogOpen(true);
    }
  }, [createAgentThreadMutation, setActiveThreadId, mode]);

  const handleCreateMessageThread = useCallback(
    (participantUserIds: number[]) => {
      createMessageThreadMutation.mutate(
        { participantUserIds },
        {
          onSuccess: (thread) => {
            setActiveMessageThreadId(thread.messageThreadId);
            setNewThreadDialogOpen(false);
          },
        },
      );
    },
    [createMessageThreadMutation],
  );

  const handleDeleteConversation = useCallback(
    (threadId: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (threads && threads.length > 1) {
        deleteThreadMutation.mutate(threadId);
      }
    },
    [deleteThreadMutation, threads],
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      if (mode === 'chatbot' && activeThreadId) {
        sendAgentMessage(content);
      } else if (mode === 'messages' && activeMessageThreadId) {
        console.log('[MessagesPage] Sending message via WebSocket:', {
          activeMessageThreadId,
          content,
          isConnected: isMessagesConnected,
        });
        // sendMessage will handle connection check internally
        sendMessageMessage(content);
      } else {
        console.error('[MessagesPage] Cannot send message:', {
          mode,
          activeThreadId,
          activeMessageThreadId,
          isMessagesConnected,
        });
      }
    },
    [
      mode,
      activeThreadId,
      activeMessageThreadId,
      sendAgentMessage,
      sendMessageMessage,
      isMessagesConnected,
    ],
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Threads sidebar */}
      <div className="w-80 border-r border-border flex flex-col min-h-0">
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as MessageMode)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue>
                  {mode === 'chatbot' ? m.chatbot_assistant() : 'Messages'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="messages">Messages</SelectItem>
                <SelectItem disabled value="chatbot">
                  {m.chatbot_assistant()}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleNewConversation}
              size="icon"
              variant="default"
              disabled={
                mode === 'chatbot'
                  ? createAgentThreadMutation.isPending
                  : createMessageThreadMutation.isPending
              }
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {threads?.length || 0}{' '}
            {(threads?.length || 0) > 1
              ? mode === 'chatbot'
                ? m.chatbot_conversations()
                : 'conversations'
              : mode === 'chatbot'
                ? m.chatbot_conversation()
                : 'conversation'}
          </p>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-1">
            {threads?.map((thread) => {
              const threadId =
                mode === 'chatbot'
                  ? (thread as any).threadId
                  : (thread as any).messageThreadId;
              const threadTitle =
                mode === 'chatbot'
                  ? (thread as any).title
                  : (thread as any).title;
              const threadCreatedAt =
                mode === 'chatbot'
                  ? (thread as any).createdAt
                  : (thread as any).createdAt;
              return (
                <motion.button
                  key={threadId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => setActiveId(threadId)}
                  className={cn(
                    'group w-full flex items-start gap-3 p-3 rounded-lg text-left',
                    'transition-colors',
                    'hover:bg-accent',
                    activeId === threadId && 'bg-accent',
                  )}
                >
                  <MessageCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">
                      {threadTitle || `Thread ${threadId}`}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(threadCreatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {(threads?.length || 0) > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => handleDeleteConversation(threadId, e)}
                      disabled={deleteThreadMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </motion.button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeId ? (
          <>
            <div className="flex-shrink-0 border-b border-border p-4">
              <h2 className="text-lg font-semibold">
                {(mode === 'chatbot'
                  ? agentThreads?.find((t) => t.threadId === activeThreadId)
                      ?.title
                  : messageThreads?.find(
                      (t) => t.messageThreadId === activeMessageThreadId,
                    )?.title) || `Thread ${activeId}`}
              </h2>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {mode === 'chatbot' ? (
                <ChatMessages
                  threadId={activeId}
                  streamingBlocks={streamingBlocks}
                  activeTools={activeToolExecutions}
                />
              ) : (
                <MessageMessages messageThreadId={activeId} />
              )}
            </div>

            <Separator className="flex-shrink-0" />
            <div className="flex-shrink-0 p-4 bg-background">
              <ChatInput
                threadId={activeId}
                onSendMessage={handleSendMessage}
                isStreaming={isStreaming}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>
                {mode === 'chatbot'
                  ? m.chatbot_select_or_create()
                  : 'Select or create a conversation'}
              </p>
            </div>
          </div>
        )}
      </div>

      <NewMessageThreadDialog
        open={newThreadDialogOpen}
        onOpenChange={setNewThreadDialogOpen}
        onConfirm={handleCreateMessageThread}
        isLoading={createMessageThreadMutation.isPending}
      />
    </div>
  );
}
