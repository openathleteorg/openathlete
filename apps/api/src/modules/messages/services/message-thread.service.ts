import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MessageThread } from '@openathlete/database';
import type {
  CreateMessageThreadDto,
  UpdateMessageThreadDto,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const THREAD_INCLUDES = {
  participants: {
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
  messages: {
    include: {
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
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class MessageThreadService {
  constructor(private prisma: PrismaService) {}

  async createThread(
    user: AuthUser,
    dto: CreateMessageThreadDto,
  ): Promise<MessageThread> {
    // Validate participants
    if (!dto.participantUserIds.includes(user.userId)) {
      throw new BadRequestException(
        'You must include yourself as a participant',
      );
    }

    // If linked to event_training, verify access
    if (dto.eventActivityId) {
      const eventActivity = await this.prisma.eventActivity.findUnique({
        where: { eventActivityId: dto.eventActivityId },
        include: {
          event: {
            include: {
              athlete: {
                include: {
                  coachAthletes: true,
                },
              },
            },
          },
        },
      });

      if (!eventActivity) {
        throw new NotFoundException(
          `Training session with ID ${dto.eventActivityId} not found`,
        );
      }

      // Verify user has access to this training session
      const athleteId = eventActivity.event.athleteId;
      if (!athleteId) {
        throw new ForbiddenException('Training session has no athlete');
      }

      const athlete = eventActivity.event.athlete;
      if (!athlete) {
        throw new ForbiddenException('Training session has no athlete');
      }

      const isAthlete = athlete.userId === user.userId;
      const isCoach = athlete.coachAthletes.some(
        (ca) => ca.userId === user.userId,
      );

      if (!isAthlete && !isCoach) {
        throw new ForbiddenException(
          'You do not have access to this training session',
        );
      }

      // Auto-add athlete and coaches as participants
      const athleteUserId = athlete.userId;
      const coachUserIds = athlete.coachAthletes.map((ca) => ca.userId);
      const allParticipantIds = [athleteUserId, ...coachUserIds].filter(
        (id, index, self) => self.indexOf(id) === index,
      ); // Remove duplicates

      // Override participantUserIds with auto-detected ones
      dto.participantUserIds = allParticipantIds;

      // Generate title from event name if not provided
      if (!dto.title) {
        dto.title = eventActivity.event.name;
      }
    }

    // Generate title from participants if not provided and not linked to event
    if (!dto.title) {
      const participants = await this.prisma.user.findMany({
        where: {
          userId: {
            in: dto.participantUserIds,
          },
        },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
        },
      });

      // Sort participants by userId to ensure consistent ordering
      participants.sort((a, b) => a.userId - b.userId);

      // Generate title from participant names
      const participantNames = participants
        .map((p) => `${p.firstName} ${p.lastName}`)
        .join(', ');
      dto.title = participantNames || 'Conversation';
    }

    // Create thread
    const thread = await this.prisma.messageThread.create({
      data: {
        title: dto.title,
        eventActivityId: dto.eventActivityId,
        participants: {
          create: dto.participantUserIds.map((userId) => ({
            userId: userId,
          })),
        },
      },
      include: THREAD_INCLUDES,
    });

    return thread;
  }

  async getOrCreateThreadForTraining(
    user: AuthUser,
    eventActivityId: number,
  ): Promise<MessageThread> {
    // Check if thread already exists
    const existingThread = await this.prisma.messageThread.findUnique({
      where: { eventActivityId: eventActivityId },
      include: THREAD_INCLUDES,
    });

    if (existingThread) {
      return existingThread;
    }

    // Create new thread
    const dto: CreateMessageThreadDto = {
      eventActivityId,
      participantUserIds: [], // Will be auto-filled
    };

    return this.createThread(user, dto);
  }

  async getThreadById(
    user: AuthUser,
    threadId: number,
  ): Promise<MessageThread> {
    const thread = await this.prisma.messageThread.findUnique({
      where: { messageThreadId: threadId },
      include: THREAD_INCLUDES,
    });

    if (!thread) {
      throw new NotFoundException(`Thread with ID ${threadId} not found`);
    }

    // Check if user is a participant
    const isParticipant = thread.participants.some(
      (p) => p.userId === user.userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this thread');
    }

    // Don't mark as read automatically - let the frontend control when to mark as read
    // based on window visibility and focus

    return thread;
  }

  async markThreadAsRead(user: AuthUser, threadId: number): Promise<void> {
    // Update participant's last_read_at
    await this.prisma.messageThreadParticipant.updateMany({
      where: {
        messageThreadId: threadId,
        userId: user.userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // Mark all messages in thread as read (except own messages)
    const messages = await this.prisma.message.findMany({
      where: {
        messageThreadId: threadId,
        senderId: { not: user.userId },
      },
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
  }

  async getUserThreads(user: AuthUser): Promise<MessageThread[]> {
    const threads = await this.prisma.messageThread.findMany({
      where: {
        participants: {
          some: {
            userId: user.userId,
          },
        },
      },
      include: THREAD_INCLUDES,
      orderBy: { updatedAt: 'desc' },
    });

    return threads;
  }

  async updateThread(
    user: AuthUser,
    threadId: number,
    dto: UpdateMessageThreadDto,
  ): Promise<MessageThread> {
    await this.getThreadById(user, threadId); // Check authorization

    const thread = await this.prisma.messageThread.update({
      where: { messageThreadId: threadId },
      data: {
        title: dto.title,
      },
      include: THREAD_INCLUDES,
    });

    return thread;
  }

  async deleteThread(user: AuthUser, threadId: number): Promise<void> {
    await this.getThreadById(user, threadId); // Check authorization

    await this.prisma.messageThread.delete({
      where: { messageThreadId: threadId },
    });
  }
}
