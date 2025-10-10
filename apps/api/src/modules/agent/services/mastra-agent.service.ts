import OpenAI from 'openai';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { BlockService } from './block.service';
import { MessageService } from './message.service';
import { ThreadService } from './thread.service';

@Injectable()
export class MastraAgentService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private threadService: ThreadService,
    private messageService: MessageService,
    private blockService: BlockService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  async processMessage(
    user: AuthUser,
    threadId: number,
    content: string,
  ): Promise<any> {
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

    // Create assistant message (will be filled by streaming)
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

      // Build OpenAI messages format
      const openaiMessages = this.buildOpenAIMessages(messages);

      // Call OpenAI (non-streaming for now)
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: openaiMessages,
        temperature: 0.7,
      });

      const responseContent =
        completion.choices[0]?.message?.content || 'No response';

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
    } catch (error: any) {
      // Create error block
      await this.blockService.createBlock(user, assistantMessage.message_id, {
        type: 'ERROR',
        order: 0,
        content: 'An error occurred while processing your message',
        error: error?.message || 'Unknown error',
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
    onChunk: (data: any) => void,
  ): Promise<void> {
    // Verify thread access
    await this.threadService.getThreadById(user, threadId);

    // Create user message
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

    // Mark user message as completed
    await this.messageService.updateMessageStatus(
      user,
      userMessage.message_id,
      'completed',
    );

    onChunk({
      type: 'user_message',
      data: { ...userMessage, status: 'completed' },
    });

    // Create assistant message
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

      // Get conversation history
      const messages = await this.messageService.getThreadMessages(
        user,
        threadId,
      );
      const openaiMessages = this.buildOpenAIMessages(messages);

      // Stream OpenAI response
      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: openaiMessages,
        temperature: 0.7,
        stream: true,
      });

      let fullContent = '';
      let textBlock: any = null;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';

        if (delta) {
          fullContent += delta;

          // Create or update text block
          if (!textBlock) {
            textBlock = await this.blockService.createBlock(
              user,
              assistantMessage.message_id,
              {
                type: 'TEXT',
                order: 0,
                content: delta,
                status: 'processing',
              },
            );

            onChunk({
              type: 'block_created',
              data: textBlock,
            });
          } else {
            textBlock = await this.blockService.updateBlock(
              user,
              textBlock.block_id,
              {
                content: fullContent,
                status: 'processing',
              },
            );

            onChunk({
              type: 'block_delta',
              data: {
                blockId: textBlock.block_id,
                messageId: textBlock.message_id,
                delta,
                content: fullContent,
              },
            });
          }
        }
      }

      // Finalize block
      if (textBlock) {
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
    } catch (error: any) {
      // Create error block
      const errorBlock = await this.blockService.createBlock(
        user,
        assistantMessage.message_id,
        {
          type: 'ERROR',
          order: 0,
          content: 'An error occurred while processing your message',
          error: error?.message || 'Unknown error',
          status: 'error',
        },
      );

      onChunk({
        type: 'error',
        data: errorBlock,
      });

      await this.messageService.updateMessageStatus(
        user,
        assistantMessage.message_id,
        'error',
      );
    }
  }

  private buildOpenAIMessages(messages: any[]): any[] {
    const openaiMessages: any[] = [];

    for (const message of messages) {
      // Skip assistant messages that are still processing (but allow USER messages)
      if (
        message.role === 'ASSISTANT' &&
        (message.status === 'processing' || message.status === 'pending')
      ) {
        continue;
      }

      // Concatenate all text blocks
      const textBlocks = message.blocks?.filter(
        (block: any) => block.type === 'TEXT' && block.status === 'completed',
      );
      const content = textBlocks
        ?.map((block: any) => block.content)
        .join('\n\n');

      if (content) {
        const role = message.role.toLowerCase();
        openaiMessages.push({
          role: role === 'tool' ? 'system' : role, // Map TOOL to system
          content,
        });
      }
    }

    return openaiMessages;
  }
}
