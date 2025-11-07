import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { Loader2, Send } from 'lucide-react';
import { KeyboardEvent, useCallback, useState } from 'react';

interface ChatInputProps {
  threadId: number;
  onSendMessage: (content: string) => void;
  isStreaming: boolean;
}

export function ChatInput({ onSendMessage, isStreaming }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isStreaming) return;

    setMessage('');

    onSendMessage(trimmedMessage);
  }, [message, isStreaming, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        value={message}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          setMessage(e.target.value)
        }
        onKeyDown={handleKeyDown}
        placeholder={m.chatbot_write_message()}
        className="min-h-[60px] max-h-[120px] resize-none"
        disabled={isStreaming}
      />
      <Button
        onClick={handleSubmit}
        disabled={!message.trim() || isStreaming}
        size="icon"
        className="h-[60px] w-[60px] flex-shrink-0"
      >
        {isStreaming ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
