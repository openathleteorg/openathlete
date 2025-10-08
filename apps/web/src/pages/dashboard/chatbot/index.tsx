import { ChatInput } from '@/components/chatbot/chat-input';
import { ChatMessages } from '@/components/chatbot/chat-messages';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useChatbot } from '@/contexts/chatbot';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { motion } from 'framer-motion';
import { MessageCircle, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect } from 'react';

export function ChatbotPage() {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    getActiveConversation,
  } = useChatbot();

  const activeConversation = getActiveConversation();

  // Create default conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      createConversation(m.chatbot_new_conversation());
    }
  }, [conversations.length, createConversation]);

  const handleNewConversation = useCallback(() => {
    createConversation();
  }, [createConversation]);

  const handleDeleteConversation = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (conversations.length > 1) {
        deleteConversation(id);
      }
    },
    [deleteConversation, conversations.length],
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Conversations sidebar */}
      <div className="w-80 border-r border-border flex flex-col min-h-0">
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">{m.chatbot_assistant()}</h1>
            <Button
              onClick={handleNewConversation}
              size="icon"
              variant="default"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {conversations.length}{' '}
            {conversations.length > 1
              ? m.chatbot_conversations()
              : m.chatbot_conversation()}
          </p>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <motion.button
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => setActiveConversationId(conversation.id)}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg text-left',
                  'transition-colors',
                  'hover:bg-accent',
                  activeConversationId === conversation.id && 'bg-accent',
                )}
              >
                <MessageCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {conversation.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {conversation.messages.length}{' '}
                    {conversation.messages.length > 1
                      ? m.chatbot_messages()
                      : m.chatbot_message()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {conversation.updatedAt.toLocaleDateString()}
                  </p>
                </div>
                {conversations.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) =>
                      handleDeleteConversation(conversation.id, e)
                    }
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
        {activeConversation ? (
          <>
            <div className="flex-shrink-0 border-b border-border p-4">
              <h2 className="text-lg font-semibold">
                {activeConversation.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {m.chatbot_created_on()}{' '}
                {activeConversation.createdAt.toLocaleDateString()}
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatMessages conversation={activeConversation} />
            </div>

            <Separator className="flex-shrink-0" />
            <div className="flex-shrink-0 p-4 bg-background">
              <ChatInput conversationId={activeConversation.id} />
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
