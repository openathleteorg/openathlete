import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Message, Prisma } from '@openathlete/database';
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
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  readReceipts: {
    include: {
      user: {
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  },
};

type MessageWithIncludes = Prisma.MessageGetPayload<{
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
    const thread = await this.prisma.messageThread.findUnique({
      where: { messageThreadId: dto.messageThreadId },
      select: { eventActivityId: true },
    });

    if (!thread) {
      throw new NotFoundException(
        `Thread with ID ${dto.messageThreadId} not found`,
      );
    }

    // If thread is linked to a training session, ensure it exists
    // (should already exist, but double-check for safety)
    if (thread.eventActivityId) {
      // Verify thread access (this will also mark as read if needed)
      await this.threadService.getThreadById(user, dto.messageThreadId);
    } else {
      // For non-training threads, just verify access
      await this.threadService.getThreadById(user, dto.messageThreadId);
    }

    const message = await this.prisma.message.create({
      data: {
        messageThreadId: dto.messageThreadId,
        senderId: user.userId,
        content: dto.content,
      },
      include: MESSAGE_INCLUDES,
    });

    // Update thread updated_at
    await this.prisma.messageThread.update({
      where: { messageThreadId: dto.messageThreadId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getMessageById(
    user: AuthUser,
    messageId: number,
  ): Promise<MessageWithIncludes> {
    const message = await this.prisma.message.findUnique({
      where: { messageId: messageId },
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
      (p) => p.userId === user.userId,
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
  ): Promise<Message[]> {
    // Verify thread access
    await this.threadService.getThreadById(user, threadId);

    const messages = await this.prisma.message.findMany({
      where: { messageThreadId: threadId },
      include: MESSAGE_INCLUDES,
      orderBy: { createdAt: 'asc' },
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
    if (message.senderId !== user.userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    const updated = await this.prisma.message.update({
      where: { messageId: messageId },
      data: {
        content: dto.content,
        editedAt: new Date(),
      },
      include: MESSAGE_INCLUDES,
    });

    return updated;
  }

  async deleteMessage(user: AuthUser, messageId: number): Promise<void> {
    const message = await this.getMessageById(user, messageId);

    // Only sender can delete
    if (message.senderId !== user.userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.prisma.message.delete({
      where: { messageId: messageId },
    });
  }

  async markMessagesAsRead(
    user: AuthUser,
    dto: MarkMessagesAsReadDto,
  ): Promise<void> {
    await this.threadService.getThreadById(user, dto.messageThreadId);

    const whereClause: Prisma.MessageWhereInput = {
      messageThreadId: dto.messageThreadId,
      senderId: { not: user.userId },
    };

    if (dto.messageIds && dto.messageIds.length > 0) {
      whereClause.messageId = { in: dto.messageIds };
    }

    const messages = await this.prisma.message.findMany({
      where: whereClause,
      select: { messageId: true },
    });

    if (messages.length > 0) {
      await this.prisma.messageReadReceipt.createMany({
        data: messages.map((m) => ({
          messageId: m.messageId,
          userId: user.userId,
        })),
        skipDuplicates: true,
      });
    }

    await this.prisma.messageThreadParticipant.updateMany({
      where: {
        messageThreadId: dto.messageThreadId,
        userId: user.userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }
}
