import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useChatbot } from '@/contexts/chatbot';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { AnimatePresence, motion } from 'framer-motion';
import { Maximize2, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';

const MIN_WIDTH = 320;
const MAX_WIDTH = 800;

export function ChatWindow() {
  const {
    isOpen,
    closeChat,
    chatWidth,
    setChatWidth,
    chatSide,
    setChatSide,
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    getActiveConversation,
  } = useChatbot();

  const navigate = useNavigate();
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startSide: 'left' | 'right';
    hasSwapped: boolean;
  } | null>(null);

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
      const newWidth = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, resizeRef.current.startWidth - delta),
      );

      setChatWidth(newWidth);
    },
    [isResizing, setChatWidth],
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

      // Only allow one swap per drag operation
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
    navigate('/dashboard/chatbot');
  }, [closeChat, navigate]);

  const handleNewConversation = useCallback(() => {
    createConversation();
  }, [createConversation]);

  // Create default conversation if none exists
  useEffect(() => {
    if (isOpen && conversations.length === 0) {
      createConversation(m.chatbot_new_conversation());
    }
  }, [isOpen, conversations.length, createConversation]);

  const activeConversation = getActiveConversation();

  // Position de la fenêtre (décalée du bord avec marge)
  const windowMargin = 24;
  const windowHeight = `calc(100vh - ${windowMargin * 2}px)`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay invisible pour fermer en cliquant à l'extérieur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998]"
            onClick={closeChat}
          />

          {/* Fenêtre de chat - bulle flottante */}
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
              top: windowMargin,
              left: windowMargin,
              width: chatWidth,
              height: windowHeight,
              zIndex: 9999,
            }}
            className={cn(
              'bg-background border border-border',
              'rounded-3xl',
              'shadow-2xl',
              'flex flex-col',
              'overflow-hidden',
            )}
          >
            {/* Resize handle */}
            <div
              onMouseDown={handleResizeStart}
              className={cn(
                'absolute top-6 right-0 bottom-6 w-1.5 rounded-full',
                'cursor-ew-resize hover:bg-primary/30',
                'transition-colors',
                isResizing && 'bg-primary/50',
              )}
            />

            {/* Header */}
            <div className="flex-shrink-0 border-b border-border">
              <div className="flex items-center justify-between p-4 pb-3">
                <div
                  onMouseDown={handleDragStart}
                  className={cn(
                    'flex items-center gap-2 flex-1',
                    'cursor-grab active:cursor-grabbing',
                    isDragging && 'cursor-grabbing',
                  )}
                >
                  <h2 className="text-lg font-semibold select-none">
                    {m.chatbot_assistant()}
                  </h2>
                  <div className="flex-1 h-1 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors" />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewConversation}
                    title={m.chatbot_new_conversation()}
                  >
                    <Plus className="h-4 w-4" />
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

              {/* Conversation selector */}
              {conversations.length > 0 && (
                <div className="px-4 pb-3">
                  <Select
                    value={activeConversationId || undefined}
                    onValueChange={setActiveConversationId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={m.chatbot_select_conversation()}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {conversations.map((conv) => (
                        <SelectItem key={conv.id} value={conv.id}>
                          {conv.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              {activeConversation ? (
                <ChatMessages conversation={activeConversation} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>{m.chatbot_select_or_create()}</p>
                </div>
              )}
            </div>

            {/* Input */}
            <Separator />
            <div className="flex-shrink-0 p-4">
              {activeConversation && (
                <ChatInput conversationId={activeConversation.id} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
