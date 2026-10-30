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
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/loader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { UnreadBadge } from '@/components/ui/unread-badge';
import { useAppBar } from '@/hooks/use-app-bar';
import { useIsMobile } from '@/hooks/use-mobile';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { AnalyticsEvent } from '@/utils/analytics-events';
import type { MessageSearchTarget } from '@/utils/message-search';
import { calculateUnreadCount } from '@/utils/messages';
import { cn } from '@/utils/shadcn';
import { motion } from 'framer-motion';
import { MessageCircle, Plus, Trash2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  const isMobile = useIsMobile();
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

  const inConversation = mobileView === 'conversation';
  const appBar = useMemo(
    () => ({
      title: inConversation ? conversationTitle : pageTitle,
      back: inConversation,
      onBack: inConversation ? handleBackToList : undefined,
      hideTabBar: inConversation,
      fullHeight: inConversation,
      trailing: inConversation ? (
        <MessageSearch
          activeThreadId={activeId}
          onSelect={handleSearchResult}
        />
      ) : (
        <>
          <MessageSearch onSelect={handleSearchResult} />
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-full"
            aria-label={m.chatbot_new_conversation()}
            onClick={handleNewConversation}
          >
            <Plus className="size-5" />
          </Button>
        </>
      ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inConversation, conversationTitle, pageTitle, activeId],
  );
  useAppBar(appBar);

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
        <div className="flex flex-col bg-background">
          <div className="flex gap-2 px-4 pt-1 pb-2">
            {(['all', 'unread'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                className={cn(
                  'flex h-9 items-center rounded-full px-4 text-sm font-medium',
                  filter === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground',
                )}
                onClick={() => setFilter(value)}
              >
                {value === 'all'
                  ? m.messages_filter_all()
                  : m.messages_filter_unread()}
              </button>
            ))}
          </div>
          {filter === 'unread' && threads?.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {m.messages_no_unread()}
            </p>
          )}
          <div className="divide-y divide-border/60">
            {threads?.map((thread: AgentThread | MessageThread) => {
              const threadId = (thread as MessageThread).messageThreadId;
              const unreadCount = currentUser
                ? calculateUnreadCount(
                    thread as MessageThread,
                    currentUser.userId,
                  )
                : 0;
              return (
                <div key={threadId} className="flex items-center pr-2">
                  <button
                    type="button"
                    data-message-thread={threadId}
                    className="flex min-h-16 min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left active:bg-accent"
                    onClick={() => {
                      setSearchTarget(null);
                      handleThreadClick(threadId);
                    }}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <MessageCircle className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.9375rem] font-medium">
                        {thread.title ||
                          m.message_thread_title({ id: threadId })}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {new Date(thread.createdAt).toLocaleDateString(
                          getLocale(),
                        )}
                      </span>
                    </span>
                    {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
                  </button>
                  {(allThreads?.length || 0) > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-11 rounded-full text-muted-foreground"
                      aria-label={m.delete_()}
                      onClick={(e) => handleDeleteConversation(threadId, e)}
                      disabled={deleteThreadMutation.isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              );
            })}
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

    return (
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {activeId && (
            <MessageMessages
              messageThreadId={activeId}
              searchTarget={searchTarget}
            />
          )}
        </div>
        <div className="shrink-0 border-t bg-background p-3 pb-[calc(0.75rem+var(--safe-bottom))]">
          {activeId && (
            <ChatInput
              threadId={activeId}
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
            />
          )}
        </div>
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
