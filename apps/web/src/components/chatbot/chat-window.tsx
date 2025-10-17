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
import {
  MessageChunk,
  useAgentWebSocket,
  useCreateThreadMutation,
  useGetUserThreadsQuery,
} from '@/services/agent';
import { cn } from '@/utils/shadcn';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Maximize2, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ToolExecutionState } from '@openathlete/shared';

import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import { ToolExecutionIndicator } from './tool-execution-indicator';

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
    activeThreadId,
    setActiveThreadId,
  } = useChatbot();

  const navigate = useNavigate();
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [streamingBlocks, setStreamingBlocks] = useState<
    Map<number, MessageChunk>
  >(new Map());
  const [activeToolExecutions, setActiveToolExecutions] = useState<
    ToolExecutionState[]
  >([]);

  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startSide: 'left' | 'right';
    hasSwapped: boolean;
  } | null>(null);

  // Fetch threads
  const { data: threads, isLoading } = useGetUserThreadsQuery();
  const createThreadMutation = useCreateThreadMutation();

  // WebSocket for streaming
  const { isStreaming, activeTools, currentAgent, sendMessage } =
    useAgentWebSocket({
      threadId: activeThreadId || undefined,
      onMessageChunk: (chunk) => {
        setStreamingBlocks((prev) => {
          const newMap = new Map(prev);
          newMap.set(chunk.blockId, chunk);
          return newMap;
        });
      },
      onMessageComplete: () => {
        // Clear streaming blocks when message is complete
        setStreamingBlocks(new Map());
      },
      onMessageError: (error) => {
        console.error('WebSocket error:', error);
        setStreamingBlocks(new Map());
      },
      onToolCallStart: (tool) => {
        console.log('[ChatWindow] Tool started:', tool.toolName);
      },
      onToolCallComplete: (tool) => {
        console.log('[ChatWindow] Tool completed:', tool.toolName);
      },
      onToolCallError: (tool) => {
        console.error('[ChatWindow] Tool error:', tool.toolName, tool.error);
      },
    });

  // Update active tool executions from WebSocket hook
  useEffect(() => {
    setActiveToolExecutions(activeTools);
  }, [activeTools]);

  // Resize handlers
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
      // When on left side, dragging right increases width
      // When on right side, dragging left increases width
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

  // Drag handlers
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
    navigate('/dashboard/chatbot');
  }, [closeChat, navigate]);

  const handleNewThread = useCallback(() => {
    createThreadMutation.mutate(
      { title: m.chatbot_new_conversation() },
      {
        onSuccess: (thread) => {
          setActiveThreadId(thread.threadId);
        },
      },
    );
  }, [createThreadMutation, setActiveThreadId]);

  // Create default thread if none exists
  useEffect(() => {
    if (isOpen && threads && threads.length === 0 && !isLoading) {
      handleNewThread();
    }
  }, [isOpen, threads, isLoading, handleNewThread]);

  // Auto-select first thread if none selected
  useEffect(() => {
    if (threads && threads.length > 0 && !activeThreadId) {
      setActiveThreadId(threads[0].threadId);
    }
  }, [threads, activeThreadId, setActiveThreadId]);

  const windowMargin = 24;
  const windowHeight = `calc(100vh - ${windowMargin * 2}px)`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998]"
            onClick={closeChat}
          />

          {/* Chat window */}
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
              zIndex: 9999,
            }}
            className="bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Resize handle - on the inner edge (opposite to scrollbar) */}
            <div
              onMouseDown={handleResizeStart}
              className={cn(
                'absolute top-0 w-2 h-full cursor-ew-resize hover:bg-primary/20 transition-colors z-10',
                chatSide === 'left' ? 'right-0' : 'left-0',
                isResizing && 'bg-primary/30',
              )}
            />

            {/* Header */}
            <div className="flex-shrink-0">
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
                    onClick={handleNewThread}
                    title={m.chatbot_new_conversation()}
                    disabled={createThreadMutation.isPending}
                  >
                    {createThreadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
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

              {/* Thread selector */}
              {threads && threads.length > 0 && (
                <div className="px-4 pb-3">
                  <Select
                    value={activeThreadId?.toString() || undefined}
                    onValueChange={(value) =>
                      setActiveThreadId(parseInt(value, 10))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={m.chatbot_select_conversation()}
                      />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      {threads.map((thread) => (
                        <SelectItem
                          key={thread.threadId}
                          value={thread.threadId.toString()}
                        >
                          {thread.title || `Thread ${thread.threadId}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Messages */}
            <Separator />
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeThreadId ? (
                <>
                  <ChatMessages
                    threadId={activeThreadId}
                    streamingBlocks={streamingBlocks}
                    currentAgent={currentAgent}
                  />
                  {/* Tool execution indicator - shows active tools */}
                  <ToolExecutionIndicator activeTools={activeToolExecutions} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>{m.chatbot_select_or_create()}</p>
                </div>
              )}
            </div>

            {/* Input */}
            <Separator />
            <div className="flex-shrink-0 p-4">
              {activeThreadId && (
                <ChatInput
                  threadId={activeThreadId}
                  onSendMessage={sendMessage}
                  isStreaming={isStreaming}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
