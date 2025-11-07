import { useGetThreadMessagesQuery, useGetThreadQuery } from '@/api/messages';
import { useMessagesWebSocket } from '@/api/messages/use-messages-websocket.hooks';
import { useGetMeQuery } from '@/api/user';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWindowVisibility } from '@/hooks/use-window-visibility';
import { cn } from '@/utils/shadcn';
import { CheckCheck, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Message } from '@openathlete/shared';

import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface MessageMessagesProps {
  messageThreadId: number;
  isWindowMode?: boolean;
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
}: {
  message: Message;
  currentUserId?: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (content: string) => void;
  totalParticipantCount?: number;
  isWindowMode?: boolean;
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

  return (
    <div
      className={cn(
        'flex w-full mb-4',
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
              <Button onClick={onCancelEdit}>Annuler</Button>
              <Button onClick={handleSave} variant="secondary">
                Enregistrer
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs opacity-60">
                {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {message.editedAt && (
                <p className="text-xs opacity-60 italic">édité</p>
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
                  Modifier
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
}: MessageMessagesProps) {
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-4">
        <div className="text-center">
          <p className="text-sm">Aucun message</p>
          <p className="text-xs mt-2">Commencez la conversation</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
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
          />
        ))}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
