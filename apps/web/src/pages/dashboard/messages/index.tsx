import {
  useCreateThreadMutation as useCreateMessageThreadMutation,
  useDeleteThreadMutation as useDeleteMessageThreadMutation,
  useGetUserThreadsQuery as useGetMessageThreadsQuery,
  useMessagesWebSocket,
} from '@/api/messages';
import { useGetMeQuery } from '@/api/user';
import { ChatInput } from '@/components/chatbot/chat-input';
import { MessageMessages } from '@/components/messages/message-messages';
import { MessageSearch } from '@/components/messages/message-search';
import { NewMessageThreadDialog } from '@/components/messages/new-message-thread-dialog';
import { MobileHeader } from '@/components/mobile/mobile-header';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/loader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UnreadBadge } from '@/components/ui/unread-badge';
import { useSetPageActions } from '@/hooks/use-page-actions';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { AnalyticsEvent } from '@/utils/analytics-events';
import { isCapacitor } from '@/utils/capacitor';
import type { MessageSearchTarget } from '@/utils/message-search';
import { calculateUnreadCount } from '@/utils/messages';
import { cn } from '@/utils/shadcn';
import { motion } from 'framer-motion';
import { MessageCircle, Plus, Trash2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AgentThread, MessageThread } from '@openathlete/shared';

type ThreadFilter = 'all' | 'unread';

function formatConversationCount(count: number) {
  const label =
    new Intl.PluralRules(getLocale()).select(count) === 'one'
      ? m.chatbot_conversation()
      : m.chatbot_conversations();

  return `${count} ${label}`;
}

export function MessagesPage() {
  const posthog = usePostHog();
  const [filter, setFilter] = useState<ThreadFilter>('all');
  const [newThreadDialogOpen, setNewThreadDialogOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState<MessageSearchTarget | null>(
    null,
  );
  const [activeMessageThreadId, setActiveMessageThreadId] = useState<
    number | null
  >(null);
  const [mobileView, setMobileView] = useState<'list' | 'conversation'>('list');
  const isMobile = isCapacitor();
  const mainRef = useRef<HTMLElement | null>(null);
  const { data: messageThreads, isLoading: isLoadingMessageThreads } =
    useGetMessageThreadsQuery();
  const createMessageThreadMutation = useCreateMessageThreadMutation();
  const deleteMessageThreadMutation = useDeleteMessageThreadMutation();
  const { data: currentUser } = useGetMeQuery();

  const { sendMessage: sendMessageMessage } = useMessagesWebSocket({
    messageThreadId: activeMessageThreadId || undefined,
    onNewMessage: () => {
      // Messages will be invalidated via React Query
    },
    onError: (error) => {
      console.error('[MessagesPage] WebSocket error:', error);
    },
  });

  useMessagesWebSocket({
    onNewMessage: () => {
      // Thread list will be invalidated via React Query
    },
    onMessagesRead: () => {
      // Thread list will be invalidated via React Query
    },
  });

  const isLoading = isLoadingMessageThreads;
  const allThreads = messageThreads;

  const threads = useMemo(() => {
    if (!allThreads) return undefined;
    if (filter === 'all' || !currentUser) {
      return allThreads;
    }
    // For messages mode, filter by unread count
    const messageThreadsArray = messageThreads || [];
    return messageThreadsArray.filter((thread: MessageThread) => {
      const unreadCount = calculateUnreadCount(thread, currentUser.userId);
      return unreadCount > 0;
    });
  }, [allThreads, filter, currentUser, messageThreads]);

  const activeId = activeMessageThreadId;
  const setActiveId = setActiveMessageThreadId;
  const deleteThreadMutation = deleteMessageThreadMutation;
  const isStreaming = false;

  // Auto-create a first thread when the user has none at all. Checked on
  // every thread, not the filtered list: an empty "Unread" view used to
  // create a new conversation on each refresh.
  useEffect(() => {
    if (
      currentUser &&
      allThreads &&
      allThreads.length === 0 &&
      !isLoading &&
      !createMessageThreadMutation.isPending
    ) {
      // The API requires the creator to be a participant
      createMessageThreadMutation.mutate(
        {
          title: m.chatbot_new_conversation(),
          participantUserIds: [currentUser.userId],
        },
        {
          onSuccess: (newThread) => {
            posthog?.capture(AnalyticsEvent.messages_thread_created, {
              trigger: 'auto_empty_state',
              participant_count: 0,
            });
            setActiveMessageThreadId(newThread.messageThreadId);
          },
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allThreads, isLoading, currentUser]);

  useEffect(() => {
    if (!isMobile && threads && threads.length > 0 && !activeId) {
      setActiveId((threads[0] as MessageThread).messageThreadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, activeId, isMobile]);

  useEffect(() => {
    if (!isMobile || mobileView !== 'conversation') return;

    const mainElement = document.querySelector(
      'main[class*="overflow-y-auto"]',
    ) as HTMLElement;

    const layoutContainer = document.querySelector(
      'div.flex.min-h-screen.flex-col',
    );
    const layoutHeader = layoutContainer?.querySelector(
      'header[class*="sticky"]',
    ) as HTMLElement;
    const messageHeaderContainer = document.querySelector(
      '[data-message-header]',
    );
    const messageHeader = messageHeaderContainer?.querySelector('header');

    if (layoutHeader && layoutHeader !== messageHeader) {
      layoutHeader.style.display = 'none';
    }

    if (mainElement) {
      mainRef.current = mainElement;
      mainElement.style.overflow = 'hidden';
    }

    return () => {
      if (mainRef.current) {
        mainRef.current.style.overflow = '';
        mainRef.current.style.height = '';
        mainRef.current.style.maxHeight = '';
      }
      if (layoutHeader && layoutHeader !== messageHeader) {
        layoutHeader.style.display = '';
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

  const handleSearchResult = (target: MessageSearchTarget) => {
    setSearchTarget(target);
    setFilter('all');
    handleThreadClick(target.messageThreadId);
  };

  const handleBackToList = useCallback(() => {
    setMobileView('list');
    setActiveId(null);
  }, [setActiveId]);

  const handleNewConversation = useCallback(() => {
    setNewThreadDialogOpen(true);
  }, [setNewThreadDialogOpen]);

  const pageTitle = m.messages();
  const conversationTitle = activeId
    ? messageThreads?.find((t) => t.messageThreadId === activeMessageThreadId)
        ?.title || m.message_thread_title({ id: activeId })
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
            posthog?.capture(AnalyticsEvent.messages_thread_created, {
              trigger: 'user',
              participant_count: participantUserIds.length,
            });
            setActiveMessageThreadId(thread.messageThreadId);
            setNewThreadDialogOpen(false);
          },
        },
      );
    },
    [createMessageThreadMutation, posthog],
  );

  const handleDeleteConversation = useCallback(
    (threadId: number, e: React.MouseEvent) => {
      e.stopPropagation();
      // The last conversation stays, whatever the filter shows
      if (allThreads && allThreads.length > 1) {
        deleteThreadMutation.mutate(threadId, {
          onSuccess: () => {
            posthog?.capture(AnalyticsEvent.messages_thread_deleted);
          },
        });
      }
    },
    [deleteThreadMutation, posthog, allThreads],
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      setSearchTarget(null);
      posthog?.capture(AnalyticsEvent.messages_message_sent, {
        char_length_bucket:
          content.length > 2000
            ? 'xlarge'
            : content.length > 500
              ? 'large'
              : 'normal',
      });
      sendMessageMessage(content);
    },
    [posthog, sendMessageMessage],
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
              <p className="text-xs text-muted-foreground">
                {formatConversationCount(threads?.length || 0)}
              </p>
              <MessageSearch onSelect={handleSearchResult} />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                className="h-7 text-xs"
              >
                {m.messages_filter_all()}
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="h-7 text-xs"
              >
                {m.messages_filter_unread()}
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2 space-y-1">
              {filter === 'unread' && threads?.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {m.messages_no_unread()}
                </p>
              )}
              {threads?.map((thread: AgentThread | MessageThread) => {
                const threadId = (thread as MessageThread).messageThreadId;
                const threadTitle = thread.title;
                const threadCreatedAt = thread.createdAt;
                const unreadCount = currentUser
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
                    onClick={() => {
                      setSearchTarget(null);
                      handleThreadClick(threadId);
                    }}
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
                            : m.message_thread_title({ id: threadId })}
                        </h3>
                        {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(threadCreatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {(allThreads?.length || 0) > 1 && (
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
        className="flex bg-background flex-col overflow-hidden"
        style={{
          height:
            'calc(100dvh - 56px - 8px - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
          maxHeight:
            'calc(100dvh - 56px - 8px- env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        }}
        data-message-header
      >
        <div className="flex-shrink-0">
          <MobileHeader
            title={conversationTitle}
            showBack={true}
            onBack={handleBackToList}
          />
        </div>

        <div className="flex justify-end px-3 border-b">
          <MessageSearch
            activeThreadId={activeId}
            onSelect={handleSearchResult}
          />
        </div>

        {/* Messages */}
        {activeId ? (
          <>
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              style={{
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <MessageMessages
                messageThreadId={activeId}
                searchTarget={searchTarget}
              />
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
              <p>{m.chatbot_select_or_create()}</p>
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
            <MessageSearch onSelect={handleSearchResult} />
            <Button
              onClick={handleNewConversation}
              size="icon"
              variant="default"
              disabled={createMessageThreadMutation.isPending}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className="h-7"
            >
              {m.messages_filter_all()}
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
              className="h-7"
            >
              {m.messages_filter_unread()}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatConversationCount(threads?.length || 0)}
          </p>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-1">
            {filter === 'unread' && threads?.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {m.messages_no_unread()}
              </p>
            )}
            {threads?.map((thread: AgentThread | MessageThread) => {
              const threadId = (thread as MessageThread).messageThreadId;
              const threadTitle = thread.title;
              const threadCreatedAt = thread.createdAt;
              const unreadCount = currentUser
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
                  onClick={() => {
                    setSearchTarget(null);
                    handleThreadClick(threadId);
                  }}
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
                          : m.message_thread_title({ id: threadId })}
                      </h3>
                      {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(threadCreatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {(allThreads?.length || 0) > 1 && (
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
            <div className="flex-shrink-0 border-b border-border p-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold min-w-0 break-words">
                {messageThreads?.find(
                  (t) => t.messageThreadId === activeMessageThreadId,
                )?.title || m.message_thread_title({ id: activeId })}
              </h2>
              <MessageSearch
                activeThreadId={activeId}
                onSelect={handleSearchResult}
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
              <MessageMessages
                messageThreadId={activeId}
                searchTarget={searchTarget}
              />
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
              <p>{m.chatbot_select_or_create()}</p>
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
