import { Agent } from '@mastra/core/agent';
import { RuntimeContext } from '@mastra/core/runtime-context';

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { mastra } from 'src/mastra/mastra.instance';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { ActivityDetailService } from 'src/modules/core/services/activity-detail.service';
import { TrainingLoadService } from 'src/modules/core/services/training-load.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { BlockService } from './block.service';
import { MessageService } from './message.service';
import { ThreadService } from './thread.service';

// Types for better type safety
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
}

interface ToolCall {
  payload: {
    toolName: string;
    args: Record<string, unknown>;
  };
}

interface ToolResult {
  payload: {
    toolName: string;
    result: Record<string, unknown>;
  };
}

interface MessageWithBlocks {
  message_id: number;
  role: string;
  status: string;
  blocks?: Array<{
    type: string;
    content: string;
    status: string;
  }>;
}

interface AgentMessage {
  role: string;
  content: string;
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

  constructor(
    private configService: ConfigService<ApiEnvSchemaType, true>,
    private threadService: ThreadService,
    private messageService: MessageService,
    private blockService: BlockService,
    private prismaService: PrismaService,
    private activityDetailService: ActivityDetailService,
    private trainingLoadService: TrainingLoadService,
  ) {
    process.env.OPENAI_API_KEY = this.configService.get('OPENAI_API_KEY');
  }

  /**
   * Initialize the agent singleton on module startup
   * Best Practice: Create agent once and reuse for all requests
   */
  async onModuleInit() {
    this.coachAgent = mastra.getAgent('openathlete-coach');
  }

  /**
   * Non-streaming version of process message (kept for backwards compatibility)
   * Consider migrating all calls to use processMessageStream instead
   */
  async processMessage(
    user: AuthUser,
    threadId: number,
    content: string,
  ): Promise<ProcessMessageResponse> {
    await this.threadService.getThreadById(user, threadId);

    // Create user message with a text block
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

    // Create assistant message
    const assistantMessage = await this.messageService.createMessage(user, {
      threadId,
      role: 'ASSISTANT',
      blocks: [],
    });

    try {
      // Update message status
      await this.messageService.updateMessageStatus(
        user,
        assistantMessage.message_id,
        'processing',
      );

      // Get athleteId for runtime context and memory
      const athleteId = user.athlete?.athlete_id || user.user_id;

      const runtimeContext = new RuntimeContext();
      runtimeContext.set('prisma', this.prismaService);
      runtimeContext.set('athleteId', athleteId);
      runtimeContext.set('userId', user.user_id);
      runtimeContext.set('trainingLoadService', this.trainingLoadService);
      runtimeContext.set('currentDate', new Date().toISOString());

      const resultStream = await this.coachAgent.generate(
        `[CURRENT DATE: ${new Date().toISOString().split('T')[0]} (${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})]\n\n${content}`,
        {
          runtimeContext,
          threadId: `thread-${threadId}`,
          resourceId: `athlete-${athleteId}`,
        },
      );

      const responseContent = resultStream.text || 'No response';

      // Create response block
      await this.blockService.createBlock(user, assistantMessage.message_id, {
        type: 'TEXT',
        order: 0,
        content: responseContent,
        status: 'completed',
      });

      // Update message status
      await this.messageService.updateMessageStatus(
        user,
        assistantMessage.message_id,
        'completed',
      );

      return {
        userMessage,
        assistantMessage: await this.messageService.getMessageById(
          user,
          assistantMessage.message_id,
        ),
      };
    } catch (error) {
      console.error('[MastraAgentService] Error processing message:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Create error block
      await this.blockService.createBlock(user, assistantMessage.message_id, {
        type: 'ERROR',
        order: 0,
        content: 'An error occurred while processing your message',
        error: errorMessage,
        status: 'error',
      });

      // Update message status
      await this.messageService.updateMessageStatus(
        user,
        assistantMessage.message_id,
        'error',
      );

      throw error;
    }
  }

  async processMessageStream(
    user: AuthUser,
    threadId: number,
    content: string,
    onChunk: (data: StreamChunkData) => void,
  ): Promise<void> {
    await this.threadService.getThreadById(user, threadId);

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

            if (
              toolName === 'run_plan-generation' ||
              toolName === 'run_planGenerationWorkflow'
            ) {
              onChunk({
                type: 'agent_thinking',
                data: {
                  agentName: 'plan-generation',
                  timestamp: Date.now(),
                },
              });

              const workflowSteps = [
                { id: 'profile-analysis', delay: 2000 },
                { id: 'macro-planning', delay: 15000 },
                { id: 'meso-planning', delay: 20000 },
                { id: 'micro-planning', delay: 25000 },
                { id: 'scheduling', delay: 15000 },
                { id: 'quality-assurance', delay: 10000 },
                { id: 'qa-improvement-loop', delay: 20000 },
                { id: 'finalize', delay: 5000 },
              ];

              let cumulativeDelay = 1000;
              for (const step of workflowSteps) {
                setTimeout(() => {
                  onChunk({
                    type: 'agent_thinking',
                    data: {
                      agentName: step.id,
                      timestamp: Date.now(),
                    },
                  });
                }, cumulativeDelay);
                cumulativeDelay += step.delay;
              }
            }
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

      onChunk({
        type: 'message_completed',
        data: {
          messageId: assistantMessage.message_id,
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
