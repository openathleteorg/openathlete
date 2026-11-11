import {
  useCreateThreadMutation as useCreateMessageThreadMutation,
  useGetUserThreadsQuery as useGetMessageThreadsQuery,
  useMessagesWebSocket,
} from '@/api/messages';
import { useGetMeQuery } from '@/api/user';
import { MessageMessages } from '@/components/messages/message-messages';
import { MessageSearch } from '@/components/messages/message-search';
import { NewMessageThreadDialog } from '@/components/messages/new-message-thread-dialog';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
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
import { m } from '@/paraglide/messages';
import type { MessageSearchTarget } from '@/utils/message-search';
import { calculateUnreadCount } from '@/utils/messages';
import { cn } from '@/utils/shadcn';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { MessageThread } from '@openathlete/shared';

import { ChatInput } from './chat-input';

const MIN_WIDTH = 320;
const MAX_WIDTH = 800;

export function ChatWindow() {
  const { isOpen, closeChat, chatWidth, setChatWidth, chatSide, setChatSide } =
    useChatbot();

  const navigate = useNavigate();
  const [searchTarget, setSearchTarget] = useState<MessageSearchTarget | null>(
    null,
  );
  const [activeMessageThreadId, setActiveMessageThreadId] = useState<
    number | null
  >(null);
  const [newThreadDialogOpen, setNewThreadDialogOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startSide: 'left' | 'right';
    hasSwapped: boolean;
  } | null>(null);

  const { data: messageThreads, isLoading: isLoadingMessageThreads } =
    useGetMessageThreadsQuery();
  const createMessageThreadMutation = useCreateMessageThreadMutation();
  const { data: currentUser } = useGetMeQuery();

  const threads = messageThreads;
  const isLoading = isLoadingMessageThreads;
  const activeId = activeMessageThreadId;

  const { sendMessage: sendMessageMessage } = useMessagesWebSocket({
    messageThreadId: activeMessageThreadId || undefined,
  });

  useMessagesWebSocket({});

  const isStreaming = false;

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      resizeRef.current = {
        startX: e.clientX,
        startWidth: chatWidth,
      };
    },
    [chatWidth],
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;

      const delta = e.clientX - resizeRef.current.startX;
      const direction = chatSide === 'left' ? 1 : -1;
      const newWidth = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, resizeRef.current.startWidth + delta * direction),
      );

      setChatWidth(newWidth);
    },
    [isResizing, setChatWidth, chatSide],
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    resizeRef.current = null;
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);

      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startSide: chatSide,
        hasSwapped: false,
      };
    },
    [chatSide],
  );

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const threshold = 100;

      if (dragRef.current.hasSwapped) return;

      if (dragRef.current.startSide === 'left' && deltaX > threshold) {
        setChatSide('right');
        dragRef.current.hasSwapped = true;
      } else if (dragRef.current.startSide === 'right' && deltaX < -threshold) {
        setChatSide('left');
        dragRef.current.hasSwapped = true;
      }
    },
    [isDragging, setChatSide],
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleFullscreen = useCallback(() => {
    closeChat();
    navigate('/dashboard/messages');
  }, [closeChat, navigate]);

  const handleNewThread = useCallback(() => {
    setNewThreadDialogOpen(true);
  }, []);

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

  const handleSendMessage = useCallback(
    (content: string) => {
      setSearchTarget(null);
      sendMessageMessage(content);
    },
    [sendMessageMessage],
  );

  useEffect(() => {
    if (
      isOpen &&
      threads &&
      threads.length === 0 &&
      !isLoading &&
      !createMessageThreadMutation.isPending
    ) {
      createMessageThreadMutation.mutate({ participantUserIds: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, threads, isLoading]);

  useEffect(() => {
    if (threads && threads.length > 0 && !activeId) {
      setActiveMessageThreadId((threads[0] as MessageThread).messageThreadId);
    }
  }, [threads, activeId]);

  const windowMargin = 24;
  const windowHeight = `calc(100vh - ${windowMargin * 2}px)`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[101]"
            onClick={closeChat}
          />
          <motion.div
            initial={{
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x:
                chatSide === 'left'
                  ? 0
                  : window.innerWidth - chatWidth - windowMargin * 2,
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            style={{
              position: 'fixed',
              left: `${windowMargin}px`,
              top: `${windowMargin}px`,
              width: `${chatWidth}px`,
              height: windowHeight,
              zIndex: 102,
            }}
            className="bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div
              onMouseDown={handleResizeStart}
              className={cn(
                'absolute top-0 w-2 h-full cursor-ew-resize hover:bg-primary/20 transition-colors z-10',
                chatSide === 'left' ? 'right-0' : 'left-0',
                isResizing && 'bg-primary/30',
              )}
            />

            <div className="flex-shrink-0">
              <div className="flex items-center p-4 pb-3">
                <div
                  onMouseDown={handleDragStart}
                  className={cn(
                    'h-5 flex-1',
                    'cursor-grab active:cursor-grabbing',
                    isDragging && 'cursor-grabbing',
                  )}
                />
                <div className="flex items-center gap-2">
                  <MessageSearch
                    activeThreadId={activeId}
                    onSelect={(target) => {
                      setSearchTarget(target);
                      setActiveMessageThreadId(target.messageThreadId);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewThread}
                    title={m.chatbot_new_conversation()}
                    disabled={createMessageThreadMutation.isPending}
                  >
                    {createMessageThreadMutation.isPending ? (
                      <Loader size="sm" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFullscreen}
                    title={m.chatbot_fullscreen()}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={closeChat}
                    title={m.chatbot_close()}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {threads && threads.length > 0 && (
                <div className="px-4 pb-3">
                  <Select
                    value={activeId?.toString() || undefined}
                    onValueChange={(value) => {
                      const id = Number.parseInt(value, 10);
                      setSearchTarget(null);
                      setActiveMessageThreadId(id);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={m.chatbot_select_conversation()}
                      />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      {threads.map((thread) => {
                        const threadId = (thread as MessageThread)
                          .messageThreadId;
                        const threadTitle = (thread as MessageThread).title;
                        const unreadCount = currentUser
                          ? calculateUnreadCount(
                              thread as MessageThread,
                              currentUser.userId,
                            )
                          : 0;
                        return (
                          <SelectItem
                            key={threadId}
                            value={threadId.toString()}
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              <span className="flex-1 truncate">
                                {threadTitle || `Thread ${threadId}`} -{' '}
                                {new Date(
                                  thread.createdAt,
                                ).toLocaleDateString()}
                              </span>
                              {unreadCount > 0 && (
                                <UnreadBadge count={unreadCount} />
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex-1 min-h-0 overflow-y-auto">
              {activeId ? (
                <MessageMessages
                  messageThreadId={activeId}
                  isWindowMode={true}
                  searchTarget={searchTarget}
                />
              ) : (
                <div className="flex items-center justify-center min-h-full text-muted-foreground">
                  <p>{m.chatbot_select_or_create()}</p>
                </div>
              )}
            </div>

            <Separator />
            <div className="flex-shrink-0 p-4">
              {activeId && (
                <ChatInput
                  threadId={activeId}
                  allowImages
                  onSendMessage={handleSendMessage}
                  isStreaming={isStreaming}
                />
              )}
            </div>
          </motion.div>

          <NewMessageThreadDialog
            open={newThreadDialogOpen}
            onOpenChange={setNewThreadDialogOpen}
            onConfirm={handleCreateMessageThread}
            isLoading={createMessageThreadMutation.isPending}
          />
        </>
      )}
    </AnimatePresence>
  );
}
