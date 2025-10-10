import { ScrollArea } from '@/components/ui/scroll-area';
import { m } from '@/paraglide/messages';
import { useGetThreadMessagesQuery } from '@/services/agent';
import { MessageChunk } from '@/services/agent/use-agent-websocket.hook';
import { cn } from '@/utils/shadcn';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { AgentMessage } from '@openathlete/shared';

import { BlockRenderer } from './block-renderer';

interface ChatMessagesProps {
  threadId: number;
  streamingBlocks?: Map<number, MessageChunk>;
}

function MessageBubble({
  message,
  streamingBlock,
}: {
  message: AgentMessage;
  streamingBlock?: MessageChunk;
}) {
  const isUser = message.role === 'USER';
  const sortedBlocks = [...message.blocks].sort((a, b) => a.order - b.order);

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 space-y-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm',
        )}
      >
        {/* Render all blocks */}
        {sortedBlocks.map((block) => {
          const isStreaming =
            streamingBlock && streamingBlock.blockId === block.blockId;
          return (
            <div key={block.blockId}>
              <BlockRenderer
                block={
                  isStreaming
                    ? { ...block, content: streamingBlock.content }
                    : block
                }
                isStreaming={isStreaming}
              />
            </div>
          );
        })}

        {/* Show streaming block if it doesn't exist in sortedBlocks yet */}
        {streamingBlock &&
          !sortedBlocks.find((b) => b.blockId === streamingBlock.blockId) && (
            <div key={`streaming-${streamingBlock.blockId}`}>
              <BlockRenderer
                block={{
                  blockId: streamingBlock.blockId,
                  messageId: message.messageId,
                  type: (streamingBlock.type as any) || 'TEXT',
                  order: 0,
                  content: streamingBlock.content,
                  status: streamingBlock.status,
                  metadata: undefined,
                  error: undefined,
                  toolName: undefined,
                  toolInput: undefined,
                  toolOutput: undefined,
                  chartType: undefined,
                  chartData: undefined,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }}
                isStreaming={true}
              />
            </div>
          )}

        {/* Timestamp */}
        <p className="text-xs opacity-60 mt-2">
          {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

export function ChatMessages({ threadId, streamingBlocks }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useGetThreadMessagesQuery(threadId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages, streamingBlocks]);

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
          <p className="text-sm">{m.chatbot_no_messages()}</p>
          <p className="text-xs mt-2">{m.chatbot_start_conversation()}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4" ref={scrollRef}>
        {messages.map((message) => {
          // Find streaming block for this message by checking all blocks in the map
          let streamingBlock: MessageChunk | undefined;
          if (streamingBlocks) {
            for (const block of streamingBlocks.values()) {
              if (block.messageId === message.messageId) {
                streamingBlock = block;
                break;
              }
            }
          }
          return (
            <MessageBubble
              key={message.messageId}
              message={message}
              streamingBlock={streamingBlock}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
