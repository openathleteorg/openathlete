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
import { useGetMeQuery } from '@/api/user';
import { ChatInput } from '@/components/chatbot/chat-input';
import { ChatMessages } from '@/components/chatbot/chat-messages';
import { MessageMessages } from '@/components/messages/message-messages';
import { NewMessageThreadDialog } from '@/components/messages/new-message-thread-dialog';
import { MobileHeader } from '@/components/mobile/mobile-header';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/loader';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { UnreadBadge } from '@/components/ui/unread-badge';
import { useChatbot } from '@/contexts/chatbot';
import { useSetPageActions } from '@/hooks/use-page-actions';
import { m } from '@/paraglide/messages';
import { isCapacitor } from '@/utils/capacitor';
import { calculateUnreadCount } from '@/utils/messages';
import { cn } from '@/utils/shadcn';
import { motion } from 'framer-motion';
import { MessageCircle, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  AgentThread,
  MessageThread,
  ToolExecutionState,
} from '@openathlete/shared';

type MessageMode = 'chatbot' | 'messages';
type ThreadFilter = 'all' | 'unread';

export function MessagesPage() {
  const [mode, setMode] = useState<MessageMode>('messages');
  const [filter, setFilter] = useState<ThreadFilter>('all');
  const [newThreadDialogOpen, setNewThreadDialogOpen] = useState(false);
  const { activeThreadId, setActiveThreadId } = useChatbot();
  const [activeMessageThreadId, setActiveMessageThreadId] = useState<
    number | null
  >(null);
  const [mobileView, setMobileView] = useState<'list' | 'conversation'>('list');
  const isMobile = isCapacitor();
  const [streamingBlocks, setStreamingBlocks] = useState<
    Map<number, MessageChunk>
  >(new Map());
  const [activeToolExecutions, setActiveToolExecutions] = useState<
    ToolExecutionState[]
  >([]);
  const mainRef = useRef<HTMLElement | null>(null);
  const { data: agentThreads, isLoading: isLoadingAgentThreads } =
    useGetUserThreadsQuery();
  const createAgentThreadMutation = useCreateThreadMutation();
  const deleteAgentThreadMutation = useDeleteThreadMutation();
  const { data: messageThreads, isLoading: isLoadingMessageThreads } =
    useGetMessageThreadsQuery();
  const createMessageThreadMutation = useCreateMessageThreadMutation();
  const deleteMessageThreadMutation = useDeleteMessageThreadMutation();
  const { data: currentUser } = useGetMeQuery();

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
        setActiveToolExecutions((prev) => [...prev, tool]);
      },
      onToolCallComplete: (tool) => {
        setActiveToolExecutions((prev) =>
          prev.filter((t) => t.toolCallId !== tool.toolCallId),
        );
      },
      onToolCallError: () => {},
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
  const allThreads = mode === 'chatbot' ? agentThreads : messageThreads;

  // Filter threads based on filter state
  const threads = useMemo(() => {
    if (!allThreads) return undefined;
    if (mode === 'chatbot' || filter === 'all' || !currentUser) {
      return allThreads;
    }
    // For messages mode, filter by unread count
    if (mode === 'messages') {
      const messageThreadsArray = messageThreads || [];
      return messageThreadsArray.filter((thread: MessageThread) => {
        const unreadCount = calculateUnreadCount(thread, currentUser.userId);
        return unreadCount > 0;
      });
    }
    return allThreads;
  }, [allThreads, mode, filter, currentUser, messageThreads]);

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

  useEffect(() => {
    if (!isMobile && threads && threads.length > 0 && !activeId) {
      setActiveId(
        mode === 'chatbot'
          ? (threads[0] as AgentThread).threadId
          : (threads[0] as MessageThread).messageThreadId,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, activeId, mode, isMobile]);

  useEffect(() => {
    if (!isMobile || mobileView !== 'conversation') return;

    const mainElement = document.querySelector(
      'main[class*="overflow-y-auto"]',
    ) as HTMLElement;
    if (mainElement) {
      mainRef.current = mainElement;
      mainElement.style.overflow = 'hidden';
      mainElement.style.height = '100vh';
    }

    return () => {
      if (mainRef.current) {
        mainRef.current.style.overflow = '';
        mainRef.current.style.height = '';
      }
    };
  }, [isMobile, mobileView]);

  const handleThreadClick = useCallback(
    (threadId: number) => {
      setActiveId(threadId);
      if (isMobile) {
        setMobileView('conversation');
      }
    },
    [isMobile, setActiveId],
  );

  const handleBackToList = useCallback(() => {
    setMobileView('list');
    setActiveId(null);
  }, [setActiveId]);

  const handleNewConversation = useCallback(() => {
    if (mode === 'chatbot') {
      createAgentThreadMutation.mutate(
        { title: m.chatbot_new_conversation() },
        {
          onSuccess: (thread) => {
            setActiveThreadId(thread.threadId);
            if (isMobile) {
              setMobileView('conversation');
            }
          },
        },
      );
    } else {
      setNewThreadDialogOpen(true);
    }
  }, [createAgentThreadMutation, setActiveThreadId, mode, isMobile]);

  const pageTitle = mode === 'chatbot' ? m.chatbot_assistant() : m.messages();
  const conversationTitle = activeId
    ? (mode === 'chatbot'
        ? agentThreads?.find((t) => t.threadId === activeThreadId)?.title
        : messageThreads?.find(
            (t) => t.messageThreadId === activeMessageThreadId,
          )?.title) || `Thread ${activeId}`
    : pageTitle;

  const createAction = useMemo(
    () => ({
      label: m.chatbot_new_conversation(),
      icon: Plus,
      onClick: handleNewConversation,
    }),
    [handleNewConversation],
  );

  const mobileActions = useMemo(() => {
    if (isMobile && mobileView === 'list') {
      return [createAction];
    }
    return [];
  }, [isMobile, mobileView, createAction]);

  useSetPageActions(mobileActions);

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
    return <PageLoader />;
  }

  if (isMobile) {
    if (mobileView === 'list') {
      return (
        <div className="flex h-full bg-background flex-col">
          <div className="flex-shrink-0 px-4 py-2 border-b border-border bg-background">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Select
                value={mode}
                onValueChange={(v) => setMode(v as MessageMode)}
              >
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue>
                    {mode === 'chatbot' ? m.chatbot_assistant() : m.messages()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="messages">{m.messages()}</SelectItem>
                  <SelectItem value="chatbot">
                    {m.chatbot_assistant()}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
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
            {mode === 'messages' && (
              <div className="flex items-center gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="h-7 text-xs"
                >
                  Tous
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                  className="h-7 text-xs"
                >
                  Non lus
                </Button>
              </div>
            )}
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 space-y-1">
              {threads?.map((thread: AgentThread | MessageThread) => {
                const threadId =
                  mode === 'chatbot'
                    ? (thread as AgentThread).threadId
                    : (thread as MessageThread).messageThreadId;
                const threadTitle = thread.title;
                const threadCreatedAt = thread.createdAt;
                const unreadCount =
                  mode === 'messages' && currentUser
                    ? calculateUnreadCount(
                        thread as MessageThread,
                        currentUser.userId,
                      )
                    : 0;
                return (
                  <motion.button
                    key={threadId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onClick={() => handleThreadClick(threadId)}
                    className={cn(
                      'group w-full flex items-start gap-3 p-3 rounded-lg text-left',
                      'transition-colors',
                      'hover:bg-accent',
                      activeId === threadId && 'bg-accent',
                    )}
                  >
                    <MessageCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">
                          {threadTitle
                            ? threadTitle.length > 25
                              ? threadTitle.substring(0, 25) + '...'
                              : threadTitle
                            : `Thread ${threadId}`}
                        </h3>
                        {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
                      </div>
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

          <NewMessageThreadDialog
            open={newThreadDialogOpen}
            onOpenChange={setNewThreadDialogOpen}
            onConfirm={handleCreateMessageThread}
            isLoading={createMessageThreadMutation.isPending}
          />
        </div>
      );
    }

    return (
      <div
        className="flex h-screen bg-background flex-col overflow-hidden"
        style={{
          height: '100vh',
          position: 'relative',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 z-40"
          style={{
            top: 'calc(120px + env(safe-area-inset-top))',
          }}
        >
          <MobileHeader
            title={conversationTitle}
            showBack={true}
            onBack={handleBackToList}
          />
        </div>

        {/* Messages */}
        {activeId ? (
          <>
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              style={{
                WebkitOverflowScrolling: 'touch',
                paddingTop: 'calc(120px + 50px + env(safe-area-inset-top))',
              }}
            >
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
            <div
              className="flex-shrink-0 p-4 bg-background"
              style={{
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              }}
            >
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

        <NewMessageThreadDialog
          open={newThreadDialogOpen}
          onOpenChange={setNewThreadDialogOpen}
          onConfirm={handleCreateMessageThread}
          isLoading={createMessageThreadMutation.isPending}
        />
      </div>
    );
  }

  // Desktop: show sidebar and conversation side by side
  return (
    <div className="flex h-screen bg-background">
      {/* Threads sidebar */}
      <div className="hidden md:flex md:flex-col w-80 border-r border-border min-h-0">
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as MessageMode)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue>
                  {mode === 'chatbot' ? m.chatbot_assistant() : m.messages()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="messages">{m.messages()}</SelectItem>
                <SelectItem value="chatbot">{m.chatbot_assistant()}</SelectItem>
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
          {mode === 'messages' && (
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                className="h-7"
              >
                Tous
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="h-7"
              >
                Non lus
              </Button>
            </div>
          )}
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
            {threads?.map((thread: AgentThread | MessageThread) => {
              const threadId =
                mode === 'chatbot'
                  ? (thread as AgentThread).threadId
                  : (thread as MessageThread).messageThreadId;
              const threadTitle = thread.title;
              const threadCreatedAt = thread.createdAt;
              const unreadCount =
                mode === 'messages' && currentUser
                  ? calculateUnreadCount(
                      thread as MessageThread,
                      currentUser.userId,
                    )
                  : 0;
              return (
                <motion.button
                  key={threadId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => handleThreadClick(threadId)}
                  className={cn(
                    'group w-full flex items-start gap-3 p-3 rounded-lg text-left',
                    'transition-colors',
                    'hover:bg-accent',
                    activeId === threadId && 'bg-accent',
                  )}
                >
                  <MessageCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">
                        {threadTitle
                          ? threadTitle.length > 25
                            ? threadTitle.substring(0, 25) + '...'
                            : threadTitle
                          : `Thread ${threadId}`}
                      </h3>
                      {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
                    </div>
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
