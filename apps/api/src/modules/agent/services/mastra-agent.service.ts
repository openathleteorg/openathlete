import { Agent } from '@mastra/core/agent';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { Memory } from '@mastra/memory';
import { PostgresStore } from '@mastra/pg';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { createMastraMemory } from 'src/mastra/config/memory.config';
import { mastra } from 'src/mastra/mastra.instance';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { TrainingLoadService } from 'src/modules/core/services/training-load.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { BlockService } from './block.service';
import { MessageService } from './message.service';
import { ThreadService } from './thread.service';

interface StreamChunkData {
  type:
    | 'user_message'
    | 'assistant_message_created'
    | 'block_created'
    | 'block_delta'
    | 'block_completed'
    | 'message_completed'
    | 'tool_call_start'
    | 'tool_call_complete'
    | 'tool_call_error'
    | 'agent_thinking'
    | 'error';
  data: Record<string, unknown>;
}

export interface ProcessMessageResponse {
  userMessage: Record<string, unknown>;
  assistantMessage: Record<string, unknown>;
  updatedThreadTitle?: string | null;
}

interface BlockData {
  block_id?: number;
  message_id?: number;
  type: string;
  order: number;
  content: string;
  status: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  error?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class MastraAgentService implements OnModuleInit {
  private coachAgent!: Agent;
  private memory!: Memory;
  private storage!: PostgresStore;

  constructor(
    private configService: ConfigService<ApiEnvSchemaType, true>,
    private threadService: ThreadService,
    private messageService: MessageService,
    private blockService: BlockService,
    private prismaService: PrismaService,
    private trainingLoadService: TrainingLoadService,
  ) {
    process.env.OPENAI_API_KEY = this.configService.get('OPENAI_API_KEY');
  }

  async onModuleInit() {
    this.coachAgent = mastra.getAgent('openathlete-coach');
    this.memory = createMastraMemory();
    this.storage = this.memory.storage as PostgresStore;
  }

  private async updateThreadTitleFromMastra(
    threadId: number,
    athleteId: number,
  ): Promise<string | null> {
    const mastraThreadId = `thread-${threadId}`;
    const resourceId = `athlete-${athleteId}`;

    const maxAttempts = 5;
    const delayMs = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const thread = await this.storage.getThreadById({
          threadId: mastraThreadId,
        });

        console.log('thread', thread);

        if (!thread) {
          throw new Error('Thread not found in Mastra');
        }

        if (thread.resourceId !== resourceId || !thread.title) {
          throw new Error('Thread resourceId mismatch or no title');
        }

        if (thread.title) {
          return thread.title;
        }

        if (attempt === maxAttempts) {
          console.log(
            `[MastraAgentService] Thread title not available after ${maxAttempts} attempts for thread ${threadId}`,
          );
          return null;
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } catch (error) {
        console.error(
          `[MastraAgentService] Error updating thread title from Mastra (attempt ${attempt}/${maxAttempts}):`,
          error,
        );

        if (attempt === maxAttempts) {
          return null;
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return null;
  }

  async processMessageStream(
    user: AuthUser,
    threadId: number,
    content: string,
    onChunk: (data: StreamChunkData) => void,
    onThreadTitleUpdated?: (title: string) => void,
  ): Promise<void> {
    await this.threadService.getThreadById(user, threadId);
    const existingMessages = await this.messageService.getThreadMessages(
      user,
      threadId,
    );
    const isFirstMessage = existingMessages.length === 0;

    const userMessage = await this.messageService.createMessage(user, {
      threadId,
      role: 'USER',
      blocks: [
        {
          type: 'TEXT',
          order: 0,
          content,
          status: 'completed',
        },
      ],
    });

    await this.messageService.updateMessageStatus(
      user,
      userMessage.message_id,
      'completed',
    );

    onChunk({
      type: 'user_message',
      data: { ...userMessage, status: 'completed' },
    });

    const assistantMessage = await this.messageService.createMessage(user, {
      threadId,
      role: 'ASSISTANT',
      blocks: [],
    });

    onChunk({
      type: 'assistant_message_created',
      data: assistantMessage,
    });

    try {
      await this.messageService.updateMessageStatus(
        user,
        assistantMessage.message_id,
        'processing',
      );

      const athleteId = user.athlete?.athlete_id || user.user_id;

      const runtimeContext = new RuntimeContext();
      runtimeContext.set('prisma', this.prismaService);
      runtimeContext.set('athleteId', athleteId);
      runtimeContext.set('userId', user.user_id);
      runtimeContext.set('trainingLoadService', this.trainingLoadService);
      runtimeContext.set('currentDate', new Date().toISOString());

      const stream = await this.coachAgent.stream(
        `[CURRENT DATE: ${new Date().toISOString().split('T')[0]} (${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})]\n\n${content}`,
        {
          runtimeContext,
          threadId: `thread-${threadId}`,
          resourceId: `athlete-${athleteId}`,
        },
      );

      let responseContent = '';
      let textBlock: BlockData | null = null;
      const activeToolCalls = new Map<
        string,
        { toolName: string; startTime: number }
      >();
      let currentAgent: string | null = null;

      try {
        for await (const chunk of stream.fullStream) {
          if (chunk.type === 'step-start' && chunk.payload) {
            const stepAgent =
              (chunk.payload as any).agent ||
              (chunk.payload as any).name ||
              (chunk.payload as any).stepId ||
              (chunk.payload as any).id;

            if (stepAgent && stepAgent !== currentAgent) {
              currentAgent = stepAgent;
              onChunk({
                type: 'agent_thinking',
                data: {
                  agentName: currentAgent,
                  timestamp: Date.now(),
                },
              });
            }
          }

          if (chunk.type === 'tool-call' && chunk.payload) {
            const { toolCallId, toolName, args } = chunk.payload;

            activeToolCalls.set(toolCallId, {
              toolName,
              startTime: Date.now(),
            });

            onChunk({
              type: 'tool_call_start',
              data: {
                toolCallId,
                toolName,
                args,
                timestamp: Date.now(),
              },
            });
          }

          if (chunk.type === 'tool-result' && chunk.payload) {
            const { toolCallId, toolName, result, isError } = chunk.payload;

            const toolInfo = activeToolCalls.get(toolCallId);
            const duration = toolInfo ? Date.now() - toolInfo.startTime : 0;

            activeToolCalls.delete(toolCallId);

            onChunk({
              type: isError ? 'tool_call_error' : 'tool_call_complete',
              data: {
                toolCallId,
                toolName,
                result,
                isError,
                duration,
                timestamp: Date.now(),
              },
            });
          }

          if (chunk.type === 'text-delta' && chunk.payload) {
            const textChunk = chunk.payload.text || '';
            responseContent += textChunk;

            if (!textBlock) {
              textBlock = (await this.blockService.createBlock(
                user,
                assistantMessage.message_id,
                {
                  type: 'TEXT',
                  order: 0,
                  content: textChunk,
                  status: 'processing',
                },
              )) as BlockData;

              onChunk({
                type: 'block_created',
                data: textBlock as unknown as Record<string, unknown>,
              });
            } else {
              await this.blockService.updateBlock(user, textBlock.block_id!, {
                content: responseContent,
                status: 'processing',
              });

              onChunk({
                type: 'block_delta',
                data: {
                  blockId: textBlock.block_id,
                  messageId: textBlock.message_id,
                  delta: textChunk,
                  content: responseContent,
                },
              });
            }
          }
        }

        if (textBlock) {
          await this.blockService.updateBlock(user, textBlock.block_id!, {
            status: 'completed',
          });

          onChunk({
            type: 'block_completed',
            data: { blockId: textBlock.block_id },
          });
        }
      } catch (streamError) {
        console.error(
          '[MastraAgentService] Error reading stream:',
          streamError,
        );

        if (!textBlock) {
          textBlock = (await this.blockService.createBlock(
            user,
            assistantMessage.message_id,
            {
              type: 'TEXT',
              order: 0,
              content: 'Error processing response',
              status: 'error',
            },
          )) as BlockData;

          onChunk({
            type: 'block_created',
            data: textBlock as unknown as Record<string, unknown>,
          });
        }
      }

      await this.messageService.updateMessageStatus(
        user,
        assistantMessage.message_id,
        'completed',
      );

      let updatedTitle: string | null = null;
      if (isFirstMessage) {
        updatedTitle = await this.updateThreadTitleFromMastra(
          threadId,
          athleteId,
        );

        if (updatedTitle && onThreadTitleUpdated) {
          onThreadTitleUpdated(updatedTitle);
        }

        if (updatedTitle) {
          await this.threadService.updateThread(user, threadId, {
            title: updatedTitle,
          });
        }
      }

      onChunk({
        type: 'message_completed',
        data: {
          messageId: assistantMessage.message_id,
          threadTitle: updatedTitle || undefined,
        },
      });
    } catch (error) {
      console.error('[MastraAgentService] Error processing message:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      const errorBlock = await this.blockService.createBlock(
        user,
        assistantMessage.message_id,
        {
          type: 'ERROR',
          order: 0,
          content: 'An error occurred while processing your message',
          error: errorMessage,
          status: 'error',
        },
      );

      onChunk({
        type: 'error',
        data: errorBlock as Record<string, unknown>,
      });

      await this.messageService.updateMessageStatus(
        user,
        assistantMessage.message_id,
        'error',
      );
    }
  }
}
