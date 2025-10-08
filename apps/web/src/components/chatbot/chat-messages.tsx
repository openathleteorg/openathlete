import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatConversation, ChatMessage } from '@/contexts/chatbot';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { useEffect, useRef } from 'react';

interface ChatMessagesProps {
  conversation: ChatConversation;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <p className="text-xs opacity-60 mt-1">
          {message.timestamp.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

export function ChatMessages({ conversation }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  if (conversation.messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-4">
        <div className="text-center">
          <p className="text-sm">{m.chatbot_no_messages()}</p>
          <p className="text-xs mt-2">{m.chatbot_start_conversation()}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4" ref={scrollRef}>
        {conversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
