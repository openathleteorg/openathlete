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
  // Singleton agent instance - created once and reused
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
    console.log('[MastraAgentService] Initializing singleton coach agent...');
    this.coachAgent = mastra.getAgent('openathlete-coach');
    console.log('[MastraAgentService] Coach agent initialized successfully');
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

      // Create runtime context with tool dependencies
      const runtimeContext = new RuntimeContext();
      runtimeContext.set('prisma', this.prismaService);
      runtimeContext.set('athleteId', athleteId);
      runtimeContext.set('userId', user.user_id);
      runtimeContext.set('trainingLoadService', this.trainingLoadService);
      runtimeContext.set('currentDate', new Date().toISOString());

      // Use the singleton agent with memory configuration
      // Memory automatically handles conversation history - no need to build it manually
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

      // Get athleteId for runtime context and memory
      const athleteId = user.athlete?.athlete_id || user.user_id;

      // Create runtime context with tool dependencies
      const runtimeContext = new RuntimeContext();
      runtimeContext.set('prisma', this.prismaService);
      runtimeContext.set('athleteId', athleteId);
      runtimeContext.set('userId', user.user_id);
      runtimeContext.set('trainingLoadService', this.trainingLoadService);
      runtimeContext.set('currentDate', new Date().toISOString());

      // Use the singleton agent with streaming
      // Memory automatically handles conversation history
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

      // Process the full stream to capture all events including tool calls
      try {
        // Use fullStream to get ALL events (text, tool calls, etc.)
        for await (const chunk of stream.fullStream) {
          // Log ALL chunk types to understand what Mastra sends
          console.log('[MastraAgentService] chunk.type:', chunk.type);

          // Handle step-start events to detect agent/workflow step changes
          if (chunk.type === 'step-start' && chunk.payload) {
            // Log the full payload to understand its structure
            console.log(
              '[MastraAgentService] step-start payload:',
              JSON.stringify(chunk.payload, null, 2),
            );

            const stepAgent =
              (chunk.payload as any).agent ||
              (chunk.payload as any).name ||
              (chunk.payload as any).stepId ||
              (chunk.payload as any).id;

            if (stepAgent && stepAgent !== currentAgent) {
              currentAgent = stepAgent;
              console.log(
                `[MastraAgentService] Agent/Step started: ${currentAgent}`,
              );

              // Emit agent execution event
              onChunk({
                type: 'agent_thinking',
                data: {
                  agentName: currentAgent,
                  timestamp: Date.now(),
                },
              });
            }
          }

          // Handle tool call events
          if (chunk.type === 'tool-call' && chunk.payload) {
            const { toolCallId, toolName, args } = chunk.payload;

            // Track active tool call
            activeToolCalls.set(toolCallId, {
              toolName,
              startTime: Date.now(),
            });

            console.log(
              `[MastraAgentService] Tool call started: ${toolName} (${toolCallId})`,
            );

            // Emit tool call start event
            onChunk({
              type: 'tool_call_start',
              data: {
                toolCallId,
                toolName,
                args,
                timestamp: Date.now(),
              },
            });

            // Special handling for workflow tools - emit workflow execution started
            if (
              toolName === 'run_plan-generation' ||
              toolName === 'run_planGenerationWorkflow'
            ) {
              console.log(
                '[MastraAgentService] Plan generation workflow started',
              );

              // Emit workflow start
              onChunk({
                type: 'agent_thinking',
                data: {
                  agentName: 'plan-generation',
                  timestamp: Date.now(),
                },
              });

              // Simulate workflow steps progression
              // Since Mastra doesn't emit step events for workflows called as tools,
              // we emit them manually with realistic delays
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

              // Emit steps sequentially with delays
              let cumulativeDelay = 1000; // Start after 1s
              for (const step of workflowSteps) {
                setTimeout(() => {
                  console.log(`[MastraAgentService] Workflow step: ${step.id}`);
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

          // Handle tool result events
          if (chunk.type === 'tool-result' && chunk.payload) {
            const { toolCallId, toolName, result, isError } = chunk.payload;

            const toolInfo = activeToolCalls.get(toolCallId);
            const duration = toolInfo ? Date.now() - toolInfo.startTime : 0;

            console.log(
              `[MastraAgentService] Tool call completed: ${toolName} (${toolCallId}) in ${duration}ms`,
            );

            // Remove from active tracking
            activeToolCalls.delete(toolCallId);

            // Emit tool result event
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

          // Handle text delta events (agent response)
          if (chunk.type === 'text-delta' && chunk.payload) {
            const textChunk = chunk.payload.text || '';
            responseContent += textChunk;

            // Create text block on first chunk
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
              // Update block with accumulated content
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

        // Mark as completed
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

        // Fallback: create error block
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

      // Update message status
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

      // Create error block
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

  /**
   * Create enriched blocks for specific tool results (e.g., activity lists)
   * This is used for rendering rich UI components on the frontend
   */
  private async createEnrichedBlock(
    user: AuthUser,
    messageId: number,
    toolName: string,
    toolResult: Record<string, unknown>,
    order: number,
    onChunk: (data: StreamChunkData) => void,
  ): Promise<void> {
    let enrichedBlock: Record<string, unknown> | null = null;

    if (
      toolName === 'getRecentActivities' ||
      toolName === 'get-recent-activities'
    ) {
      const activities = Array.isArray(toolResult.activities)
        ? toolResult.activities
        : [];

      enrichedBlock = await this.blockService.createBlock(user, messageId, {
        type: 'ACTIVITY_LIST' as any,
        order: order,
        content: `Found ${activities.length} activities`,
        metadata: {
          activities: toolResult.activities,
          totalCount: toolResult.totalCount,
        },
        status: 'completed',
      });
    } else if (
      toolName === 'createTraining' ||
      toolName === 'create-training' ||
      toolName === 'createActivity' ||
      toolName === 'create-activity'
    ) {
      const message =
        typeof toolResult.message === 'string'
          ? toolResult.message
          : 'Training created successfully';

      enrichedBlock = await this.blockService.createBlock(user, messageId, {
        type: 'ACTIVITY_CREATED' as any,
        order: order,
        content: message,
        metadata: {
          activity: {
            eventId: toolResult.eventId,
            name: toolResult.name,
            sport: toolResult.sport,
            startDate: toolResult.startDate,
            endDate: toolResult.endDate,
          },
        },
        status: 'completed',
      });
    }

    if (enrichedBlock) {
      onChunk({
        type: 'block_created',
        data: enrichedBlock,
      });
    }
  }
}
