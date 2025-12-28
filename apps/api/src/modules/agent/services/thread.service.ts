import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AgentThread, Prisma } from '@openathlete/database';
import { CreateThreadDto, UpdateThreadDto } from '@openathlete/shared';

import { CaslAbilityFactory } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

const THREAD_INCLUDES = {
  messages: {
    include: {
      blocks: {
        orderBy: { order: 'asc' as const },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class ThreadService {
  constructor(
    private prisma: PrismaService,
    private readonly abilities: CaslAbilityFactory,
  ) {}

  async createThread(
    user: AuthUser,
    dto: CreateThreadDto,
  ): Promise<AgentThread> {
    const thread = await this.prisma.agentThread.create({
      data: {
        userId: user.userId,
        title: dto.title,
        metadata: (dto.metadata || {}) as Prisma.InputJsonValue,
      },
      include: THREAD_INCLUDES,
    });

    return thread;
  }

  async getThreadById(user: AuthUser, threadId: number): Promise<AgentThread> {
    const ability = await this.abilities.getFor({ user });

    const thread = await this.prisma.agentThread.findUnique({
      where: { threadId: threadId },
      include: THREAD_INCLUDES,
    });

    if (!thread) {
      throw new NotFoundException(`Thread with ID ${threadId} not found`);
    }

    if (!ability.can('read', subject('AgentThread', thread))) {
      throw new ForbiddenException('You cannot access this thread');
    }

    return thread;
  }

  async getUserThreads(user: AuthUser): Promise<AgentThread[]> {
    const threads = await this.prisma.agentThread.findMany({
      where: { userId: user.userId },
      include: THREAD_INCLUDES,
      orderBy: { updatedAt: 'desc' },
    });

    return threads;
  }

  async updateThread(
    user: AuthUser,
    threadId: number,
    dto: UpdateThreadDto,
  ): Promise<AgentThread> {
    await this.getThreadById(user, threadId);

    const thread = await this.prisma.agentThread.update({
      where: { threadId: threadId },
      data: {
        title: dto.title,
        metadata: dto.metadata
          ? (dto.metadata as Prisma.InputJsonValue)
          : undefined,
      },
      include: THREAD_INCLUDES,
    });

    return thread;
  }

  async deleteThread(user: AuthUser, threadId: number): Promise<void> {
    await this.getThreadById(user, threadId);

    await this.prisma.agentThread.delete({
      where: { threadId: threadId },
    });
  }
}
