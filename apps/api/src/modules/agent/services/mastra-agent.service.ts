import { Agent } from '@mastra/core/agent';
import { RuntimeContext } from '@mastra/core/runtime-context';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { createOpenAthleteCoachAssistant } from 'src/mastra';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { ActivityDetailService } from 'src/modules/core/services/activity-detail.service';
import { TrainingLoadService } from 'src/modules/core/services/training-load.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { BlockService } from './block.service';
import { MessageService } from './message.service';
import { ThreadService } from './thread.service';

// Types for better type safety
interface ToolContext {
  user: AuthUser | null;
}

interface StreamChunkData {
  type:
    | 'user_message'
    | 'assistant_message_created'
    | 'block_created'
    | 'block_delta'
    | 'block_completed'
    | 'message_completed'
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
export class MastraAgentService {
  private networkAgent: Agent;
  private currentUser: AuthUser | null = null;
  // Shared context object that tools can access via closure
  private readonly toolContext: ToolContext = { user: null };

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
    this.networkAgent = createOpenAthleteCoachAssistant();
  }

  /**
   * Set the current user context for tool execution
   * Updates the shared toolContext object
   */
  private setUserContext(user: AuthUser) {
    this.currentUser = user;
    this.toolContext.user = user;
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
    // Verify thread access
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

      // Get conversation history
      const messages = await this.messageService.getThreadMessages(
        user,
        threadId,
      );

      // Build conversation context from message history
      const conversationContext = this.buildConversationContext(messages);

      // Set user context for tools
      this.setUserContext(user);

      // Create runtime context for memory
      const runtimeContext = new RuntimeContext();

      // Use network orchestration to handle the request
      // The network agent will route to appropriate sub-agents/workflows
      const resultStream = await this.networkAgent.network(
        `${conversationContext}\n\nUser: ${content}`,
        {
          runtimeContext,
          memory: {
            resource: `athlete-${user.athlete?.athlete_id || user.user_id}`,
            thread: `thread-${threadId}`,
          },
        },
      );

      // Network returns a stream, collect the text
      let responseContent = '';
      for await (const chunk of (resultStream as any).textStream || []) {
        responseContent += chunk;
      }

      if (!responseContent) {
        responseContent = 'No response';
      }

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

      const messages = await this.messageService.getThreadMessages(
        user,
        threadId,
      );

      // Build conversation context
      const conversationContext = this.buildConversationContext(messages);

      this.setUserContext(user);

      // Create runtime context for memory
      const runtimeContext = new RuntimeContext();

      // Use agent.stream() for real text streaming instead of network()
      // network() is better for multi-agent orchestration but doesn't stream text progressively
      const agentMessages = this.buildAgentMessages(messages);
      agentMessages.push({ role: 'user', content });

      const stream = await this.networkAgent.stream(agentMessages as any, {
        runtimeContext,
        memory: {
          resource: `athlete-${user.athlete?.athlete_id || user.user_id}`,
          thread: `thread-${threadId}`,
        },
      });

      let responseContent = '';
      let textBlock: BlockData | null = null;

      // Process the text stream - this gives us real word-by-word streaming
      try {
        // Stream text chunks progressively
        for await (const textChunk of stream.textStream) {
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

  /**
   * Build conversation context string from message history
   * Converts database messages into a context string for network agent
   */
  private buildConversationContext(messages: MessageWithBlocks[]): string {
    const contextParts: string[] = [];

    for (const message of messages) {
      // Skip assistant messages that are still processing
      if (
        message.role === 'ASSISTANT' &&
        (message.status === 'processing' || message.status === 'pending')
      ) {
        continue;
      }

      // Concatenate all text blocks for content
      const textBlocks = message.blocks?.filter(
        (block) => block.type === 'TEXT' && block.status === 'completed',
      );
      const content = textBlocks?.map((block) => block.content).join('\n\n');

      if (content) {
        const roleLower = message.role.toLowerCase();
        const roleLabel =
          roleLower === 'user'
            ? 'User'
            : roleLower === 'assistant'
              ? 'Assistant'
              : 'System';

        contextParts.push(`${roleLabel}: ${content}`);
      }
    }

    return contextParts.join('\n\n');
  }

  /**
   * Build message history for the Mastra agent (legacy - kept for reference)
   * @deprecated Use buildConversationContext instead for network agent
   */
  private buildAgentMessages(messages: MessageWithBlocks[]): AgentMessage[] {
    const agentMessages: AgentMessage[] = [];

    for (const message of messages) {
      // Skip assistant messages that are still processing
      if (
        message.role === 'ASSISTANT' &&
        (message.status === 'processing' || message.status === 'pending')
      ) {
        continue;
      }

      // Concatenate all text blocks for content
      const textBlocks = message.blocks?.filter(
        (block) => block.type === 'TEXT' && block.status === 'completed',
      );
      const content = textBlocks?.map((block) => block.content).join('\n\n');

      if (content) {
        const roleLower = message.role.toLowerCase();
        // Map roles to valid message roles
        const role = roleLower === 'tool' ? 'assistant' : roleLower;

        agentMessages.push({
          role,
          content,
        });
      }
    }

    return agentMessages;
  }
}
