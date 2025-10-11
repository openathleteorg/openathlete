import { Agent } from '@mastra/core/agent';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiEnvSchemaType } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { createOpenAthleteAgent } from '../agents';
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

interface ProcessMessageResponse {
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
  private agent: ReturnType<typeof createOpenAthleteAgent>;
  private currentUser: AuthUser | null = null;
  // Shared context object that tools can access via closure
  private readonly toolContext: ToolContext = { user: null };

  constructor(
    private configService: ConfigService<ApiEnvSchemaType, true>,
    private threadService: ThreadService,
    private messageService: MessageService,
    private blockService: BlockService,
    private prismaService: PrismaService,
  ) {
    // Set OpenAI API key for Mastra
    process.env.OPENAI_API_KEY = this.configService.get('OPENAI_API_KEY');

    // Create the Mastra agent with access to prisma service and tool context
    this.agent = createOpenAthleteAgent(this.prismaService, this.toolContext);
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

      // Build agent messages
      const agentMessages = this.buildAgentMessages(messages);

      // Set user context for tools via agent property
      this.setUserContext(user);

      // Generate response (non-streaming)
      const result = await this.agent.generate(agentMessages as any);

      const responseContent = result.text || 'No response';

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
      const agentMessages = this.buildAgentMessages(messages);

      this.setUserContext(user);

      const stream = await this.agent.stream(agentMessages as any);

      let textBlock: BlockData | null = null;
      let fullContent = '';

      for await (const textChunk of stream.textStream) {
        fullContent += textChunk;

        if (!textBlock) {
          const createdBlock = await this.blockService.createBlock(
            user,
            assistantMessage.message_id,
            {
              type: 'TEXT',
              order: 0,
              content: textChunk,
              status: 'processing',
            },
          );
          textBlock = createdBlock as BlockData;

          onChunk({
            type: 'block_created',
            data: createdBlock as Record<string, unknown>,
          });
        } else {
          const updatedBlock = await this.blockService.updateBlock(
            user,
            textBlock.block_id!,
            {
              content: fullContent,
              status: 'processing',
            },
          );
          textBlock = updatedBlock as BlockData;

          onChunk({
            type: 'block_delta',
            data: {
              blockId: textBlock.block_id,
              messageId: textBlock.message_id,
              delta: textChunk,
              content: fullContent,
            },
          });
        }
      }

      const fullOutput = await stream.text;
      const steps = await stream.steps;
      const toolCalls = (await stream.toolCalls) as ToolCall[] | undefined;
      const toolResults = (await stream.toolResults) as
        | ToolResult[]
        | undefined;

      if (toolCalls && toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          const payload = toolCall.payload;
          const toolBlock = await this.blockService.createBlock(
            user,
            assistantMessage.message_id,
            {
              type: 'TOOL_CALL',
              order: 0,
              content: `Calling tool: ${payload.toolName}`,
              toolName: payload.toolName,
              toolInput: payload.args,
              status: 'completed',
            },
          );

          onChunk({
            type: 'block_created',
            data: toolBlock as Record<string, unknown>,
          });
        }
      }

      if (toolResults && toolResults.length > 0) {
        for (const toolResult of toolResults) {
          const payload = toolResult.payload;
          const resultBlock = await this.blockService.createBlock(
            user,
            assistantMessage.message_id,
            {
              type: 'TOOL_RESULT',
              order: 1,
              content: `Tool result from ${payload.toolName}`,
              toolName: payload.toolName,
              toolOutput: payload.result,
              status: 'completed',
            },
          );

          onChunk({
            type: 'block_created',
            data: resultBlock as Record<string, unknown>,
          });

          // Create enriched block based on tool result
          await this.createEnrichedBlock(
            user,
            assistantMessage.message_id,
            payload.toolName,
            payload.result,
            onChunk,
          );
        }
      }

      // Finalize text block
      if (textBlock && textBlock.block_id) {
        await this.blockService.updateBlock(user, textBlock.block_id, {
          status: 'completed',
        });

        onChunk({
          type: 'block_completed',
          data: { blockId: textBlock.block_id },
        });
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
        order: 2,
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
        order: 2,
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
   * Build message history for the Mastra agent
   * Converts our database message format to Mastra's expected format
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
