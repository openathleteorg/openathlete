import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { message_thread } from '@openathlete/database';
import type {
  CreateMessageThreadDto,
  UpdateMessageThreadDto,
} from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const THREAD_INCLUDES = {
  participants: {
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
  messages: {
    include: {
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
    },
    orderBy: { created_at: 'asc' as const },
  },
};

@Injectable()
export class MessageThreadService {
  constructor(
    private prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  async createThread(
    user: AuthUser,
    dto: CreateMessageThreadDto,
  ): Promise<message_thread> {
    // Validate participants
    if (!dto.participantUserIds.includes(user.user_id)) {
      throw new BadRequestException(
        'You must include yourself as a participant',
      );
    }

    // If linked to event_training, verify access
    if (dto.eventActivityId) {
      const eventActivity = await this.prisma.event_activity.findUnique({
        where: { event_activity_id: dto.eventActivityId },
        include: {
          event: {
            include: {
              athlete: {
                include: {
                  coach_athletes: true,
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
      const athleteId = eventActivity.event.athlete_id;
      if (!athleteId) {
        throw new ForbiddenException('Training session has no athlete');
      }

      const athlete = eventActivity.event.athlete;
      if (!athlete) {
        throw new ForbiddenException('Training session has no athlete');
      }

      const isAthlete = athlete.user_id === user.user_id;
      const isCoach = athlete.coach_athletes.some(
        (ca) => ca.user_id === user.user_id,
      );

      if (!isAthlete && !isCoach) {
        throw new ForbiddenException(
          'You do not have access to this training session',
        );
      }

      // Auto-add athlete and coaches as participants
      const athleteUserId = athlete.user_id;
      const coachUserIds = athlete.coach_athletes.map((ca) => ca.user_id);
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
          user_id: {
            in: dto.participantUserIds,
          },
        },
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
        },
      });

      // Sort participants by user_id to ensure consistent ordering
      participants.sort((a, b) => a.user_id - b.user_id);

      // Generate title from participant names
      const participantNames = participants
        .map((p) => `${p.first_name} ${p.last_name}`)
        .join(', ');
      dto.title = participantNames || 'Conversation';
    }

    // Create thread
    const thread = await this.prisma.message_thread.create({
      data: {
        title: dto.title,
        event_activity_id: dto.eventActivityId,
        participants: {
          create: dto.participantUserIds.map((userId) => ({
            user_id: userId,
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
  ): Promise<message_thread> {
    // Check if thread already exists
    const existingThread = await this.prisma.message_thread.findUnique({
      where: { event_activity_id: eventActivityId },
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
  ): Promise<message_thread> {
    const thread = await this.prisma.message_thread.findUnique({
      where: { message_thread_id: threadId },
      include: THREAD_INCLUDES,
    });

    if (!thread) {
      throw new NotFoundException(`Thread with ID ${threadId} not found`);
    }

    // Check if user is a participant
    const isParticipant = thread.participants.some(
      (p) => p.user_id === user.user_id,
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
    await this.prisma.message_thread_participant.updateMany({
      where: {
        message_thread_id: threadId,
        user_id: user.user_id,
      },
      data: {
        last_read_at: new Date(),
      },
    });

    // Mark all messages in thread as read (except own messages)
    const messages = await this.prisma.message.findMany({
      where: {
        message_thread_id: threadId,
        sender_id: { not: user.user_id },
      },
      select: { message_id: true },
    });

    if (messages.length > 0) {
      await this.prisma.message_read_receipt.createMany({
        data: messages.map((m) => ({
          message_id: m.message_id,
          user_id: user.user_id,
        })),
        skipDuplicates: true,
      });
    }
  }

  async getUserThreads(user: AuthUser): Promise<message_thread[]> {
    const threads = await this.prisma.message_thread.findMany({
      where: {
        participants: {
          some: {
            user_id: user.user_id,
          },
        },
      },
      include: THREAD_INCLUDES,
      orderBy: { updated_at: 'desc' },
    });

    return threads;
  }

  async updateThread(
    user: AuthUser,
    threadId: number,
    dto: UpdateMessageThreadDto,
  ): Promise<message_thread> {
    await this.getThreadById(user, threadId); // Check authorization

    const thread = await this.prisma.message_thread.update({
      where: { message_thread_id: threadId },
      data: {
        title: dto.title,
      },
      include: THREAD_INCLUDES,
    });

    return thread;
  }

  async deleteThread(user: AuthUser, threadId: number): Promise<void> {
    await this.getThreadById(user, threadId); // Check authorization

    await this.prisma.message_thread.delete({
      where: { message_thread_id: threadId },
    });
  }
}
