import { ChatInput } from '@/components/chatbot/chat-input';
import { ChatMessages } from '@/components/chatbot/chat-messages';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useChatbot } from '@/contexts/chatbot';
import { m } from '@/paraglide/messages';
import {
  MessageChunk,
  useAgentWebSocket,
  useCreateThreadMutation,
  useDeleteThreadMutation,
  useGetUserThreadsQuery,
} from '@/services/agent';
import { cn } from '@/utils/shadcn';
import { motion } from 'framer-motion';
import { MessageCircle, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { ToolExecutionState } from '@openathlete/shared';

export function ChatbotPage() {
  const { activeThreadId, setActiveThreadId } = useChatbot();
  const [streamingBlocks, setStreamingBlocks] = useState<
    Map<number, MessageChunk>
  >(new Map());
  const [activeToolExecutions, setActiveToolExecutions] = useState<
    ToolExecutionState[]
  >([]);

  // Fetch threads
  const { data: threads, isLoading } = useGetUserThreadsQuery();
  const createThreadMutation = useCreateThreadMutation();
  const deleteThreadMutation = useDeleteThreadMutation();

  // WebSocket for streaming
  const { isStreaming, sendMessage } = useAgentWebSocket({
    threadId: activeThreadId || undefined,
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
      console.log('[ChatbotPage] Tool started:', tool.toolName);
      setActiveToolExecutions((prev) => [...prev, tool]);
    },
    onToolCallComplete: (tool) => {
      console.log('[ChatbotPage] Tool completed:', tool.toolName);
      setActiveToolExecutions((prev) =>
        prev.filter((t) => t.toolCallId !== tool.toolCallId),
      );
    },
    onToolCallError: (tool) => {
      console.error('[ChatbotPage] Tool error:', tool.toolName, tool.error);
    },
  });

  // Auto-create first thread if none exist
  useEffect(() => {
    if (
      threads &&
      threads.length === 0 &&
      !isLoading &&
      !createThreadMutation.isPending
    ) {
      createThreadMutation.mutate(
        { title: 'New Conversation' },
        {
          onSuccess: (newThread) => {
            setActiveThreadId(newThread.threadId);
          },
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, isLoading]);

  // Auto-select first thread if available and no active thread
  useEffect(() => {
    if (threads && threads.length > 0 && !activeThreadId) {
      setActiveThreadId(threads[0].threadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, activeThreadId]);

  const handleNewConversation = useCallback(() => {
    createThreadMutation.mutate(
      { title: m.chatbot_new_conversation() },
      {
        onSuccess: (thread) => {
          setActiveThreadId(thread.threadId);
        },
      },
    );
  }, [createThreadMutation, setActiveThreadId]);

  const handleDeleteConversation = useCallback(
    (threadId: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (threads && threads.length > 1) {
        deleteThreadMutation.mutate(threadId);
      }
    },
    [deleteThreadMutation, threads],
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
            <h1 className="text-xl font-semibold">{m.chatbot_assistant()}</h1>
            <Button
              onClick={handleNewConversation}
              size="icon"
              variant="default"
              disabled={createThreadMutation.isPending}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {threads?.length || 0}{' '}
            {(threads?.length || 0) > 1
              ? m.chatbot_conversations()
              : m.chatbot_conversation()}
          </p>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-1">
            {threads?.map((thread) => (
              <motion.button
                key={thread.threadId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => setActiveThreadId(thread.threadId)}
                className={cn(
                  'group w-full flex items-start gap-3 p-3 rounded-lg text-left',
                  'transition-colors',
                  'hover:bg-accent',
                  activeThreadId === thread.threadId && 'bg-accent',
                )}
              >
                <MessageCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {thread.title || `Thread ${thread.threadId}`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(thread.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {(threads?.length || 0) > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) =>
                      handleDeleteConversation(thread.threadId, e)
                    }
                    disabled={deleteThreadMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </motion.button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeThreadId ? (
          <>
            <div className="flex-shrink-0 border-b border-border p-4">
              <h2 className="text-lg font-semibold">
                {threads?.find((t) => t.threadId === activeThreadId)?.title ||
                  `Thread ${activeThreadId}`}
              </h2>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <ChatMessages
                threadId={activeThreadId}
                streamingBlocks={streamingBlocks}
                activeTools={activeToolExecutions}
              />
            </div>

            <Separator className="flex-shrink-0" />
            <div className="flex-shrink-0 p-4 bg-background">
              <ChatInput
                threadId={activeThreadId}
                onSendMessage={sendMessage}
                isStreaming={isStreaming}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>{m.chatbot_select_or_create()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
