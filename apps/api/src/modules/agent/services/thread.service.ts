import { subject } from '@casl/ability';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, agent_thread } from '@openathlete/database';
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
    orderBy: { created_at: 'asc' as const },
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
  ): Promise<agent_thread> {
    const thread = await this.prisma.agent_thread.create({
      data: {
        user_id: user.user_id,
        title: dto.title,
        metadata: (dto.metadata || {}) as Prisma.InputJsonValue,
      },
      include: THREAD_INCLUDES,
    });

    return thread;
  }

  async getThreadById(user: AuthUser, threadId: number): Promise<agent_thread> {
    const ability = await this.abilities.getFor({ user });

    const thread = await this.prisma.agent_thread.findUnique({
      where: { thread_id: threadId },
      include: THREAD_INCLUDES,
    });

    if (!thread) {
      throw new NotFoundException(`Thread with ID ${threadId} not found`);
    }

    if (!ability.can('read', subject('agent_thread', thread))) {
      throw new ForbiddenException('You cannot access this thread');
    }

    return thread;
  }

  async getUserThreads(user: AuthUser): Promise<agent_thread[]> {
    const threads = await this.prisma.agent_thread.findMany({
      where: { user_id: user.user_id },
      include: THREAD_INCLUDES,
      orderBy: { updated_at: 'desc' },
    });

    return threads;
  }

  async updateThread(
    user: AuthUser,
    threadId: number,
    dto: UpdateThreadDto,
  ): Promise<agent_thread> {
    await this.getThreadById(user, threadId);

    const thread = await this.prisma.agent_thread.update({
      where: { thread_id: threadId },
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

    await this.prisma.agent_thread.delete({
      where: { thread_id: threadId },
    });
  }
}
