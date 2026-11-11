import { useGetThreadMessagesQuery, useGetThreadQuery } from '@/api/messages';
import { useMessagesWebSocket } from '@/api/messages/use-messages-websocket.hooks';
import { useGetMeQuery } from '@/api/user';
import { Loader } from '@/components/ui/loader';
import { useWindowVisibility } from '@/hooks/use-window-visibility';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import type { MessageSearchTarget } from '@/utils/message-search';
import { cn } from '@/utils/shadcn';
import { CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Message } from '@openathlete/shared';

import { RichText } from '../images';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { ActivityChatNotice } from './activity-chat-notice';

interface MessageMessagesProps {
  messageThreadId: number;
  isWindowMode?: boolean;
  searchTarget?: MessageSearchTarget | null;
}

function MessageBubble({
  message,
  currentUserId,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  totalParticipantCount,
  isWindowMode,
  highlighted,
}: {
  message: Message;
  currentUserId?: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (content: string) => void;
  totalParticipantCount?: number;
  isWindowMode?: boolean;
  highlighted?: boolean;
}) {
  const isUser = message.senderId === currentUserId;
  const [editContent, setEditContent] = useState(message.content);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    } else {
      setEditContent(message.content);
    }
  }, [isEditing, message.content]);

  const handleSave = () => {
    if (editContent.trim() && editContent !== message.content) {
      onSaveEdit(editContent.trim());
    } else {
      onCancelEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const readCount =
    message.readReceipts?.filter((rr) => rr.userId !== message.senderId)
      .length || 0;
  const totalParticipants = totalParticipantCount || 2;
  const isReadByAll = readCount >= totalParticipants - 1;
  const time = new Date(message.createdAt).toLocaleTimeString(
    getDateLocale(getLocale()),
    { hour: '2-digit', minute: '2-digit' },
  );

  // Automatic notices are stored under the athlete but nobody wrote them:
  // show them as a system row, not as a bubble on one side of the chat
  if (message.activityNotice)
    return (
      <div
        data-message-id={message.messageId}
        data-activity-notice
        data-search-match={highlighted || undefined}
        tabIndex={-1}
        className={cn(
          'flex w-full justify-center mb-4 rounded-2xl',
          highlighted &&
            'ring-2 ring-primary ring-offset-2 ring-offset-background',
        )}
      >
        <div className="w-full max-w-[80%] sm:max-w-120 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
          <ActivityChatNotice notice={message.activityNotice} />
          <p className="text-xs opacity-60 mt-2">{time}</p>
        </div>
      </div>
    );

  return (
    <div
      data-message-id={message.messageId}
      data-search-match={highlighted || undefined}
      tabIndex={-1}
      className={cn(
        'flex w-full mb-4 rounded-2xl',
        highlighted &&
          'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'rounded-2xl px-4 py-3',
          isWindowMode
            ? 'max-w-[80%] w-full'
            : 'max-w-[80%] w-full sm:max-w-[600px]',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        )}
      >
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                'w-full min-h-[60px] rounded-md px-3 py-2 text-sm',
                'bg-background text-foreground border border-border',
                'focus:outline-none focus:ring-2 focus:ring-ring',
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button onClick={onCancelEdit}>{m.cancel()}</Button>
              <Button onClick={handleSave} variant="secondary">
                {m.save()}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {!isUser && message.sender && (
              <div className="text-xs font-medium mb-1 opacity-80">
                {message.sender.firstName} {message.sender.lastName}
              </div>
            )}
            <RichText
              text={message.content}
              linkClassName={isUser ? 'text-primary-foreground' : undefined}
            />

            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs opacity-60">{time}</p>
              {message.editedAt && (
                <p className="text-xs opacity-60 italic">
                  {m.messages_edited()}
                </p>
              )}
              {isUser && (
                <>
                  {isReadByAll ? (
                    <CheckCheck className="h-3 w-3 opacity-60" />
                  ) : readCount > 0 ? (
                    <CheckCheck className="h-3 w-3 opacity-40" />
                  ) : null}
                </>
              )}
              {isUser && (
                <button
                  onClick={onStartEdit}
                  className="text-xs opacity-60 hover:opacity-100 ml-auto cursor-pointer"
                >
                  {m.edit()}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function MessageMessages({
  messageThreadId,
  isWindowMode,
  searchTarget,
}: MessageMessagesProps) {
  const handledSearchTarget = useRef<MessageSearchTarget | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const { data: currentUser } = useGetMeQuery();

  const { data: messages, isLoading } =
    useGetThreadMessagesQuery(messageThreadId);
  const { data: thread } = useGetThreadQuery(messageThreadId);

  const { updateMessage, markAsRead } = useMessagesWebSocket({
    messageThreadId,
  });

  const { isVisibleAndFocused } = useWindowVisibility();

  useEffect(() => {
    // Only mark as read if window is visible and focused
    if (messages && currentUser && messageThreadId && isVisibleAndFocused) {
      const unreadMessageIds = messages
        .filter(
          (msg) =>
            msg.senderId !== currentUser.userId &&
            !msg.readReceipts?.some((rr) => rr.userId === currentUser.userId),
        )
        .map((msg) => msg.messageId);

      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentUser, messageThreadId, isVisibleAndFocused]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (searchTarget?.messageThreadId === messageThreadId) {
        if (handledSearchTarget.current === searchTarget) return;
        const match = messages?.some(
          (message) => message.messageId === searchTarget.messageId,
        )
          ? scrollRef.current?.querySelector<HTMLElement>(
              `[data-message-id="${searchTarget.messageId}"]`,
            )
          : null;
        if (match) {
          match.scrollIntoView({ behavior: 'auto', block: 'center' });
          match.focus({ preventScroll: true });
          handledSearchTarget.current = searchTarget;
          return;
        }
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, messageThreadId, searchTarget]);

  const handleStartEdit = (messageId: number) => {
    setEditingMessageId(messageId);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
  };

  const handleSaveEdit = (messageId: number, content: string) => {
    updateMessage(messageId, content);
    setEditingMessageId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] p-4">
        <Loader size="md" />
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-muted-foreground p-4">
        <div className="text-center">
          <p className="text-sm">{m.chatbot_no_messages()}</p>
          <p className="text-xs mt-2">{m.chatbot_start_conversation()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4" ref={scrollRef}>
      {messages.map((message) => (
        <MessageBubble
          key={message.messageId}
          message={message}
          currentUserId={currentUser?.userId}
          isEditing={editingMessageId === message.messageId}
          onStartEdit={() => handleStartEdit(message.messageId)}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={(content) => handleSaveEdit(message.messageId, content)}
          totalParticipantCount={thread?.participants?.length}
          isWindowMode={isWindowMode}
          highlighted={
            searchTarget?.messageThreadId === messageThreadId &&
            searchTarget.messageId === message.messageId
          }
        />
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
