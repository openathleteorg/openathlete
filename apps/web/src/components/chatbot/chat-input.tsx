import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatbot } from '@/contexts/chatbot';
import { m } from '@/paraglide/messages';
import { Send } from 'lucide-react';
import { KeyboardEvent, useCallback, useState } from 'react';

interface ChatInputProps {
  conversationId: string;
}

export function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const { addMessage } = useChatbot();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isProcessing) return;

    setIsProcessing(true);

    addMessage(conversationId, {
      content: trimmedMessage,
      role: 'user',
    });

    setMessage('');

    // TODO: Replace with actual API call
    setTimeout(() => {
      addMessage(conversationId, {
        content: m.chatbot_default_response(),
        role: 'assistant',
      });
      setIsProcessing(false);
    }, 1000);
  }, [message, conversationId, addMessage, isProcessing]);

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
        disabled={isProcessing}
      />
      <Button
        onClick={handleSubmit}
        disabled={!message.trim() || isProcessing}
        size="icon"
        className="h-[60px] w-[60px] flex-shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
