import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, message } from '@openathlete/database';
import type {
  CreateMessageThreadMessageDto,
  MarkMessagesAsReadDto,
  UpdateMessageThreadMessageDto,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { MessageThreadService } from './message-thread.service';

const MESSAGE_INCLUDES = {
  sender: {
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
    },
  },
  read_receipts: {
    include: {
      user: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  },
};

type MessageWithIncludes = Prisma.messageGetPayload<{
  include: typeof MESSAGE_INCLUDES;
}>;

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    private threadService: MessageThreadService,
  ) {}

  async createMessage(
    user: AuthUser,
    dto: CreateMessageThreadMessageDto,
  ): Promise<MessageWithIncludes> {
    // Get thread to check if it's linked to a training session
    const thread = await this.prisma.message_thread.findUnique({
      where: { message_thread_id: dto.messageThreadId },
      select: { event_activity_id: true },
    });

    if (!thread) {
      throw new NotFoundException(
        `Thread with ID ${dto.messageThreadId} not found`,
      );
    }

    // If thread is linked to a training session, ensure it exists
    // (should already exist, but double-check for safety)
    if (thread.event_activity_id) {
      // Verify thread access (this will also mark as read if needed)
      await this.threadService.getThreadById(user, dto.messageThreadId);
    } else {
      // For non-training threads, just verify access
      await this.threadService.getThreadById(user, dto.messageThreadId);
    }

    const message = await this.prisma.message.create({
      data: {
        message_thread_id: dto.messageThreadId,
        sender_id: user.user_id,
        content: dto.content,
      },
      include: MESSAGE_INCLUDES,
    });

    // Update thread updated_at
    await this.prisma.message_thread.update({
      where: { message_thread_id: dto.messageThreadId },
      data: { updated_at: new Date() },
    });

    return message;
  }

  async getMessageById(
    user: AuthUser,
    messageId: number,
  ): Promise<MessageWithIncludes> {
    const message = await this.prisma.message.findUnique({
      where: { message_id: messageId },
      include: {
        ...MESSAGE_INCLUDES,
        thread: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Verify thread access
    const isParticipant = message.thread.participants.some(
      (p) => p.user_id === user.user_id,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You cannot access this message');
    }

    // Return only the message part (without thread) to match MessageWithIncludes
    const { thread, ...messageWithoutThread } = message;
    return messageWithoutThread;
  }

  async getThreadMessages(
    user: AuthUser,
    threadId: number,
  ): Promise<message[]> {
    // Verify thread access
    await this.threadService.getThreadById(user, threadId);

    const messages = await this.prisma.message.findMany({
      where: { message_thread_id: threadId },
      include: MESSAGE_INCLUDES,
      orderBy: { created_at: 'asc' },
    });

    return messages;
  }

  async updateMessage(
    user: AuthUser,
    messageId: number,
    dto: UpdateMessageThreadMessageDto,
  ): Promise<MessageWithIncludes> {
    const message = await this.getMessageById(user, messageId);

    // Only sender can edit
    if (message.sender_id !== user.user_id) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const updated = await this.prisma.message.update({
      where: { message_id: messageId },
      data: {
        content: dto.content,
        edited_at: new Date(),
      },
      include: MESSAGE_INCLUDES,
    });

    return updated;
  }

  async deleteMessage(user: AuthUser, messageId: number): Promise<void> {
    const message = await this.getMessageById(user, messageId);

    // Only sender can delete
    if (message.sender_id !== user.user_id) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.delete({
      where: { message_id: messageId },
    });
  }

  async markMessagesAsRead(
    user: AuthUser,
    dto: MarkMessagesAsReadDto,
  ): Promise<void> {
    // Verify thread access
    await this.threadService.getThreadById(user, dto.messageThreadId);

    // Get messages to mark as read
    const whereClause: any = {
      message_thread_id: dto.messageThreadId,
      sender_id: { not: user.user_id }, // Don't mark own messages as read
    };

    if (dto.messageIds && dto.messageIds.length > 0) {
      whereClause.message_id = { in: dto.messageIds };
    }

    const messages = await this.prisma.message.findMany({
      where: whereClause,
      select: { message_id: true },
    });

    // Create read receipts (using createMany with skipDuplicates)
    if (messages.length > 0) {
      await this.prisma.message_read_receipt.createMany({
        data: messages.map((m) => ({
          message_id: m.message_id,
          user_id: user.user_id,
        })),
        skipDuplicates: true,
      });
    }

    // Update participant's last_read_at
    await this.prisma.message_thread_participant.updateMany({
      where: {
        message_thread_id: dto.messageThreadId,
        user_id: user.user_id,
      },
      data: {
        last_read_at: new Date(),
      },
    });
  }
}
